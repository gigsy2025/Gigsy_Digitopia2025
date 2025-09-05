# 🚀 Quick Setup Guide - CI/CD Pipeline

## Prerequisites

- ✅ GitHub repository
- ✅ DockerHub account
- ✅ Admin access to GitHub repository settings

## Setup Steps (5 minutes)

### 1. Create DockerHub Access Token

1. Go to [DockerHub](https://hub.docker.com/) → Account Settings → Security
2. Click "New Access Token"
3. Name: `github-actions-gigsy`
4. Permissions: **Read, Write, Delete**
5. **Copy the token** (you'll need it in step 2)

### 2. Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

| Secret Name | Value |
|-------------|-------|
| `DOCKERHUB_USERNAME` | Your DockerHub username |
| `DOCKERHUB_TOKEN` | Token from step 1 |

### 3. Verify Workflow Files

Ensure these files exist in your repository:

- ✅ `.github/workflows/docker-publish.yml`
- ✅ `Dockerfile`
- ✅ `docker-compose.yml`
- ✅ `.dockerignore`

### 4. Test the Pipeline

1. Create a pull request with any change
2. Check that tests and linting pass
3. Merge to `main` branch
4. Watch the workflow build and publish your Docker image

## What Happens Next?

### On Pull Request

- ✅ TypeScript type checking
- ✅ ESLint linting
- ✅ Code formatting check
- ✅ Security dependency scan
- ⚠️ No Docker build (testing only)

### On Main/Master Push

- ✅ All PR checks
- ✅ Docker image build (multi-platform)
- ✅ Push to DockerHub
- ✅ Security scan of container
- ✅ Deployment summary

## Your Docker Image

After successful deployment, your image will be available at:

```bash
# Latest version
docker pull YOUR_USERNAME/gigsy:latest

# Specific commit
docker pull YOUR_USERNAME/gigsy:main-COMMIT_SHA
```

## Quick Commands

```bash
# Run your container locally
docker run -p 3000:3000 YOUR_USERNAME/gigsy:latest

# View in browser
open http://localhost:3000
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Workflow fails with auth error | Check DockerHub secrets are correct |
| TypeScript errors | Run `pnpm run typecheck` locally |
| Linting errors | Run `pnpm run lint:fix` locally |
| Security scan fails | Update dependencies with `pnpm update` |

## Next Steps

- 📖 Read the [full documentation](CI-CD-README.md)
- 🔧 Customize the workflow for your needs
- 🚀 Set up production deployment
- 📊 Monitor your pipeline performance

---

**Need help?** Check the [detailed documentation](CI-CD-README.md) or create an issue in the repository.
