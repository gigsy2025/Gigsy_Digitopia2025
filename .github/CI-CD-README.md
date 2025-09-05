# CI/CD Pipeline Documentation

## Overview

This GitHub Actions workflow provides a comprehensive CI/CD pipeline for the Gigsy Next.js application, including testing, linting, security scanning, Docker image building, and publishing to DockerHub.

## Required Setup

### DockerHub Secrets Configuration

Before the workflow can run, you need to configure the following secrets in your GitHub repository:

1. Go to GitHub Repository → Settings → Secrets and variables → Actions
2. Add the following repository secrets:

| Secret Name | Description | Where to get it |
|-------------|-------------|-----------------|
| `DOCKERHUB_USERNAME` | Your DockerHub username | Your DockerHub account |
| `DOCKERHUB_TOKEN` | DockerHub access token | Create in DockerHub Security settings |

### Creating DockerHub Access Token

1. Log in to [DockerHub](https://hub.docker.com/)
2. Go to Account Settings → Security
3. Click "New Access Token"
4. Name: `github-actions-gigsy`
5. Permissions: `Read, Write, Delete`
6. Copy the generated token and add it as `DOCKERHUB_TOKEN` secret

## Workflow Triggers

The workflow runs on:

- **Push to main/master**: Full pipeline with Docker image build and publish
- **Pull Requests**: Testing and validation only (no image publishing)
- **Manual Dispatch**: Can be triggered manually via GitHub UI

## Pipeline Stages

### Stage 1: Test and Lint

**Duration**: ~2-3 minutes  
**Dependencies**: None  
**Runs on**: ubuntu-latest

This stage performs:

- Install dependencies with pnpm
- TypeScript type checking
- ESLint code linting
- Prettier code formatting validation
- Next.js application build verification
- Upload build artifacts for deployment

### Stage 2: Security Scan

**Duration**: ~1-2 minutes  
**Dependencies**: test-and-lint  
**Runs on**: ubuntu-latest

This stage performs:

- Dependency review (pull requests only)
- Vulnerability audit of dependencies
- Security compliance checks

### Stage 3: Docker Build and Push

**Duration**: ~5-8 minutes  
**Dependencies**: test-and-lint, security-scan  
**Condition**: main/master push only  
**Runs on**: ubuntu-latest

This stage performs:

- Multi-platform Docker build (linux/amd64, linux/arm64)
- Image metadata extraction and labeling
- Push to DockerHub with multiple tags
- Generate Software Bill of Materials (SBOM)
- Optimize builds with layer caching

### Stage 4: Image Security Scan

**Duration**: ~3-5 minutes  
**Dependencies**: docker-build-and-push  
**Condition**: main/master push only  
**Runs on**: ubuntu-latest

This stage performs:

- Trivy vulnerability scanning of Docker image
- SARIF report generation for GitHub Security tab
- Fail build on Critical/High severity vulnerabilities

### Stage 5: Deployment Notification

**Duration**: ~30 seconds  
**Dependencies**: docker-build-and-push, security-scan-image  
**Condition**: Always runs (success or failure)  
**Runs on**: ubuntu-latest

This stage performs:

- Generate deployment status summary
- Provide deployment instructions
- Create quick start commands

## Image Tagging Strategy

The workflow creates multiple tags for each successful build:

| Tag Type | Example | Description |
|----------|---------|-------------|
| Branch | `main` | Latest commit from main branch |
| SHA | `main-a1b2c3d` | Specific commit identifier |
| Latest | `latest` | Always points to latest main branch |

## Performance Optimizations

### Caching Strategy

- **pnpm Cache**: Node.js dependencies cached by lockfile hash
- **Docker Layer Cache**: GitHub Actions cache for Docker layers
- **Dependency Cache**: Shared across workflow runs

### Parallelization

- Test/lint and security scanning run in parallel
- Multi-platform Docker builds use BuildKit parallelization
- Artifacts minimize redundant work between jobs

### Resource Efficiency

- Shallow Git clone (fetch-depth: 1)
- Frozen lockfile installation
- Build artifact reuse
- Optimized Docker multi-stage builds

## Usage Examples

### Testing Locally

```bash
# Run the same commands that execute in CI
pnpm install
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run build
```

### Using Docker Images

```bash
# Pull latest image
docker pull YOUR_DOCKERHUB_USERNAME/gigsy:latest

# Run container
docker run -p 3000:3000 YOUR_DOCKERHUB_USERNAME/gigsy:latest

# Run specific version
docker pull YOUR_DOCKERHUB_USERNAME/gigsy:main-a1b2c3d
docker run -p 3000:3000 YOUR_DOCKERHUB_USERNAME/gigsy:main-a1b2c3d
```

### Docker Compose Integration

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    image: YOUR_DOCKERHUB_USERNAME/gigsy:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## Troubleshooting

### Common Issues

#### DockerHub Authentication Failed

```text
Error: buildx failed with: ERROR: failed to solve: failed to authorize
```

**Solution**: Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets are correctly set

#### Build Fails on Type Errors

```text
Error: Type checking failed
```

**Solution**: Run `pnpm run typecheck` locally and fix TypeScript errors

#### Linting Failures

```text
Error: ESLint found problems
```

**Solution**: Run `pnpm run lint:fix` locally to auto-fix issues

#### Security Scan Failures

```text
Error: Found vulnerabilities with severity: CRITICAL
```

**Solution**: Update dependencies or review security findings in GitHub Security tab

#### Docker Build Out of Space

```text
Error: no space left on device
```

**Solution**: Workflow uses BuildKit cache cleanup, but for large images consider optimizing Dockerfile

### Monitoring and Debugging

#### GitHub Actions Tab

- View workflow run history
- Monitor job execution times
- Review detailed logs for each step
- Download artifacts and reports

#### GitHub Security Tab

- View vulnerability reports
- Track security trends over time
- Review SARIF findings from Trivy scans
- Monitor dependency alerts

#### DockerHub Registry

- Monitor image sizes and layers
- Track pull statistics
- Manage repository settings
- View image vulnerability scans

## Security Features

### Dependency Security

- Automated dependency review on pull requests
- Vulnerability scanning with audit checks
- SARIF report generation for GitHub Security integration
- Automatic alerts for new vulnerabilities

### Container Security

- Multi-platform image scanning with Trivy
- Software Bill of Materials (SBOM) generation
- Minimal base image usage (Alpine Linux)
- Non-root user execution
- Regular security updates

### Access Control

- Least privilege GitHub token permissions
- Secure secret management
- Environment-specific deployment controls
- Manual approval requirements for production

## Advanced Configuration

### Adding New Test Types

```yaml
- name: Run Unit Tests
  run: pnpm run test

- name: Run E2E Tests
  run: pnpm run test:e2e
```

### Customizing Security Thresholds

```yaml
# More strict scanning
severity: 'CRITICAL,HIGH,MEDIUM'
exit-code: '1'

# Less strict scanning (allow medium vulnerabilities)
severity: 'CRITICAL,HIGH'
exit-code: '1'
```

### Custom Docker Tags

```yaml
tags: |
  type=ref,event=branch
  type=semver,pattern={{version}}
  type=raw,value=stable
  type=raw,value={{date 'YYYYMMDD'}}
```

### Environment-Specific Deployments

```yaml
deploy-staging:
  needs: docker-build-and-push
  environment: staging
  if: github.ref == 'refs/heads/develop'
  steps:
    - name: Deploy to Staging
      run: |
        # Add staging deployment commands
        echo "Deploying to staging environment"
```

## Best Practices

### Security

- ✅ Use access tokens instead of passwords
- ✅ Scan images for vulnerabilities before deployment
- ✅ Use least privilege principles for permissions
- ✅ Keep dependencies updated regularly
- ✅ Monitor security alerts and act promptly

### Performance

- ✅ Use caching strategically for dependencies and layers
- ✅ Parallelize independent jobs when possible
- ✅ Optimize Docker layers for faster builds
- ✅ Use multi-stage builds to minimize image size
- ✅ Monitor and optimize build times

### Reliability

- ✅ Test thoroughly before deployment
- ✅ Use explicit versions and tags (avoid latest)
- ✅ Implement proper error handling and retries
- ✅ Monitor deployment health continuously
- ✅ Plan and test rollback strategies

## Workflow Files

The CI/CD pipeline consists of:

- `.github/workflows/docker-publish.yml` - Main workflow definition
- `.github/workflows/README.md` - This documentation
- `Dockerfile` - Container image definition
- `docker-compose.yml` - Local development setup
- `.dockerignore` - Build context optimization

## Support and Resources

### Getting Help

1. Check workflow logs in GitHub Actions tab
2. Review this documentation thoroughly
3. Validate secrets configuration
4. Test commands locally first
5. Create an issue in the repository for complex problems

### Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](../DOCKER_README.md)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [DockerHub Documentation](https://docs.docker.com/docker-hub/)
- [Trivy Security Scanner](https://trivy.dev/)

## Conclusion

This CI/CD pipeline provides a production-ready solution for automated testing, security scanning, and Docker image publishing. It follows industry best practices for security, performance, and reliability while providing comprehensive feedback and monitoring capabilities.

The pipeline is designed to be maintainable, scalable, and secure, ensuring that your deployments are consistent and reliable across different environments.
