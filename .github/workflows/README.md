# CI/CD Pipeline Documentation

## Overview

This GitHub Actions workflow provides a comprehensive CI/CD pipeline for the Gigsy Next.js application, including testing, linting, security scanning, Docker image building, and publishing to DockerHub.

## Workflow Features

### 🔄 **Triggers**

- **Push to main/master**: Full pipeline with Docker image build and publish
- **Pull Requests**: Testing and validation only (no image publishing)
- **Manual Dispatch**: Can be triggered manually via GitHub UI

### 🧪 **Testing & Quality Assurance**

- TypeScript type checking
- ESLint code linting
- Prettier code formatting validation
- Next.js application build verification
- Dependency vulnerability scanning
- Security audit checks

### 🐳 **Docker Image Management**

- Multi-stage Docker builds optimized for production
- Multi-platform support (linux/amd64, linux/arm64)
- Automated image tagging strategy
- Docker layer caching for faster builds
- Software Bill of Materials (SBOM) generation
- Container security scanning with Trivy

### 🔒 **Security Features**

- Dependency review for pull requests
- Vulnerability scanning of dependencies
- Container image security scanning
- SARIF report generation for GitHub Security tab
- Automated security alerts

## Required Secrets

You need to configure the following secrets in your GitHub repository:

### DockerHub Configuration

1. Go to GitHub Repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKERHUB_USERNAME` | Your DockerHub username | `myusername` |
| `DOCKERHUB_TOKEN` | DockerHub access token | `dckr_pat_abc123...` |

### Creating DockerHub Access Token

1. Log in to [DockerHub](https://hub.docker.com/)
2. Go to Account Settings → Security
3. Click "New Access Token"
4. Name: `github-actions-gigsy`
5. Permissions: `Read, Write, Delete`
6. Copy the generated token and add it as `DOCKERHUB_TOKEN` secret

## Image Tagging Strategy

The workflow creates multiple tags for each successful build:

| Tag Type | Example | Description |
|----------|---------|-------------|
| Branch | `main` | Latest commit from main branch |
| SHA | `main-a1b2c3d` | Specific commit identifier |
| Latest | `latest` | Always points to latest main branch |

## Pipeline Stages

### 1. **Test and Lint**

```yaml
Runs on: ubuntu-latest
Dependencies: none
Duration: ~2-3 minutes
```

- Install dependencies with pnpm
- TypeScript type checking
- ESLint linting
- Prettier formatting check
- Next.js build verification
- Upload build artifacts for deployment

### 2. **Security Scan**

```yaml
Runs on: ubuntu-latest
Dependencies: test-and-lint
Duration: ~1-2 minutes
```

- Dependency review (PR only)
- Vulnerability audit
- Security compliance checks

### 3. **Docker Build and Push**

```yaml
Runs on: ubuntu-latest
Dependencies: test-and-lint, security-scan
Condition: main/master push only
Duration: ~5-8 minutes
```

- Multi-platform Docker build
- Image metadata extraction
- Push to DockerHub
- Generate SBOM
- Layer caching optimization

### 4. **Image Security Scan**

```yaml
Runs on: ubuntu-latest
Dependencies: docker-build-and-push
Condition: main/master push only
Duration: ~3-5 minutes
```

- Trivy vulnerability scanning
- SARIF report generation
- Critical/High severity failure threshold

### 5. **Deployment Notification**

```yaml
Runs on: ubuntu-latest
Dependencies: docker-build-and-push, security-scan-image
Condition: Always (success or failure)
Duration: ~30 seconds
```

- Status summary generation
- Deployment instructions
- Quick start commands

## Performance Optimizations

### Caching Strategy

- **pnpm Cache**: Node.js dependencies cached by commit hash
- **Docker Layer Cache**: GitHub Actions cache for Docker layers
- **Dependency Cache**: Shared across workflow runs

### Parallelization

- Test/lint and security scanning run in parallel after dependency install
- Multi-platform Docker builds leverage BuildKit parallelization
- Artifacts minimize redundant work between jobs

### Resource Efficiency

- Shallow Git clone (`fetch-depth: 1`)
- Frozen lockfile installation
- Build artifact reuse
- Optimized Docker multi-stage builds

## Usage Examples

### Running Locally
```bash
# Test the same commands that run in CI
pnpm install
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run build
```

### Docker Image Usage
```bash
# Pull latest image
docker pull $DOCKERHUB_USERNAME/gigsy:latest

# Run container
docker run -p 3000:3000 $DOCKERHUB_USERNAME/gigsy:latest

# Run specific version
docker pull $DOCKERHUB_USERNAME/gigsy:main-a1b2c3d
docker run -p 3000:3000 $DOCKERHUB_USERNAME/gigsy:main-a1b2c3d
```

### Docker Compose Integration
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    image: $DOCKERHUB_USERNAME/gigsy:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## Troubleshooting

### Common Issues

#### 1. **DockerHub Authentication Failed**
```
Error: buildx failed with: ERROR: failed to solve: failed to authorize
```
**Solution**: Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets are correctly set

#### 2. **Build Fails on Type Errors**
```
Error: Type checking failed
```
**Solution**: Run `pnpm run typecheck` locally and fix TypeScript errors

#### 3. **Linting Failures**
```
Error: ESLint found problems
```
**Solution**: Run `pnpm run lint:fix` locally to auto-fix issues

#### 4. **Security Scan Failures**
```
Error: Found vulnerabilities with severity: CRITICAL
```
**Solution**: Update dependencies or review security findings in GitHub Security tab

#### 5. **Docker Build Out of Space**
```
Error: no space left on device
```
**Solution**: Workflow uses BuildKit cache cleanup, but for large images consider optimizing Dockerfile

### Monitoring and Alerts

#### GitHub Security Tab
- View vulnerability reports
- Track security trends
- Review SARIF findings

#### Workflow Status
- Monitor via GitHub Actions tab
- Set up notification preferences
- Review job logs for debugging

#### DockerHub Registry
- Monitor image sizes
- Track pull statistics
- Manage repository settings

## Customization

### Modifying the Pipeline

#### Adding New Test Stages
```yaml
- name: Run Unit Tests
  run: pnpm run test

- name: Run E2E Tests
  run: pnpm run test:e2e
```

#### Changing Security Thresholds
```yaml
# More strict scanning
severity: 'CRITICAL,HIGH,MEDIUM'
exit-code: '1'

# Less strict scanning
severity: 'CRITICAL'
exit-code: '0'
```

#### Custom Docker Tags
```yaml
tags: |
  type=ref,event=branch
  type=semver,pattern={{version}}
  type=raw,value=stable
```

### Environment-Specific Deployments

#### Adding Staging Environment
```yaml
deploy-staging:
  needs: docker-build-and-push
  environment: staging
  if: github.ref == 'refs/heads/develop'
  steps:
    - name: Deploy to Staging
      run: |
        # Add staging deployment commands
```

#### Production Deployment with Approval
```yaml
deploy-production:
  needs: [docker-build-and-push, security-scan-image]
  environment: 
    name: production
    url: https://gigsy.com
  if: github.ref == 'refs/heads/main'
  steps:
    - name: Deploy to Production
      run: |
        # Add production deployment commands
```

## Best Practices

### Security
- ✅ Use access tokens instead of passwords
- ✅ Scan images for vulnerabilities
- ✅ Use least privilege principles
- ✅ Keep dependencies updated
- ✅ Monitor security alerts

### Performance
- ✅ Use caching strategically
- ✅ Parallelize independent jobs
- ✅ Optimize Docker layers
- ✅ Use multi-stage builds
- ✅ Monitor build times

### Reliability
- ✅ Test thoroughly before deployment
- ✅ Use explicit versions/tags
- ✅ Implement proper error handling
- ✅ Monitor deployment health
- ✅ Plan rollback strategies

## Support

For issues with this CI/CD pipeline:

1. Check workflow logs in GitHub Actions tab
2. Review this documentation
3. Validate secrets configuration
4. Test commands locally
5. Create an issue in the repository

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](../DOCKER_README.md)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [DockerHub Documentation](https://docs.docker.com/docker-hub/)
