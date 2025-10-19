# Gigsy - Next.js Application

https://gigsy-digitopia2025.vercel.app/app


[![Build and Publish Docker Image](https://github.com/gigsy2025/Gigsy_Digitopia2025/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/gigsy2025/Gigsy_Digitopia2025/actions/workflows/docker-publish.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/mostafayaser/gigsy_digitopia2025)](https://hub.docker.com/r/mostafayaser/gigsy_digitopia2025)

A modern, production-ready Next.js application built with the T3 Stack, featuring automated CI/CD, containerization, and comprehensive security scanning.

## ✨ Features

- **🚀 Next.js 15** with App Router
- **🔷 TypeScript** for type safety
- **🎨 Tailwind CSS** for styling
- **📦 Docker** containerization
- **🔄 Automated CI/CD** with GitHub Actions
- **🔒 Security scanning** and vulnerability assessment
- **📊 Multi-platform** container builds (AMD64 + ARM64)

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Pull and run the production image
docker pull mostafayaser/gigsy_digitopia2025:prod
docker run -p 3000:3000 mostafayaser/gigsy_digitopia2025:prod

# Open in browser
open http://localhost:3000
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/gigsy2025/Gigsy_Digitopia2025.git
cd gigsy

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Open in browser
open http://localhost:3000
```

## ⚙️ Environment Setup

1. **Duplicate `.env.example`** → `cp .env.example .env` (keep secrets out of version control).
2. **Populate required values** using the tables below. Validation lives in `src/env.js`, so missing or invalid values will fail the app start.

### Server-side variables

| Variable | Required | Description | Reference |
| --- | --- | --- | --- |
| `NODE_ENV` | Auto | Runtime environment (`development`, `test`, `production`). Defaults to `development`. | `src/env.js` |
| `CONVEX_DEPLOYMENT` | Optional | Convex deployment slug for production/staging builds. Required when deploying off localhost. | `src/env.js` |
| `CLERK_SECRET_KEY` | Required for server auth flows | Backend Clerk key enabling secure session validation. | `src/env.js` |
| `CLERK_JWKS_Endpoint` | Optional | Override JWKS endpoint when using custom Clerk domains. | `src/env.js` |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Required for release automation | Unlocks source map uploads and release tracking. | `src/env.js`, `sentry.server.config.ts` |
| `BETTER_STACK_SOURCE_TOKEN` / `BETTER_STACK_INGESTING_HOST` | Optional | Enables Logtail/Better Stack pipeline for observability. | `src/env.js`, `@logtail` integration |
| `LOG_LEVEL` | Optional | Sets Pino log verbosity (`trace` → `fatal`). Defaults to `info`. | `src/env.js` |
| `APP_NAME` / `APP_VERSION` | Optional | Overrides metadata returned by health endpoints. | `src/env.js`, `debug-api.ts` |

### Client-side variables

| Variable | Required | Description | Reference |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Required for browser auth | Public Clerk key consumed by Next.js middleware and client components. | `src/env.js`, `src/app/(auth)/` |
| `NEXT_PUBLIC_CLERK_FRONTEND_API_URL` | Optional | Custom Clerk Frontend API URL for multi-region routing. | `src/env.js` |
| `NEXT_PUBLIC_CONVEX_URL` | Optional (defaults to generated value) | Convex deployment endpoint; required for non-local environments. | `src/env.js`, Convex hooks under `convex/_generated` |
| `NEXT_PUBLIC_GIGS_DATASOURCE` | Optional (`mock` \/ `convex`) | Selects the gig data backend. Defaults to `mock` for local dev; switch to `convex` when seeding Convex data. | `src/env.js`, `shared/profile/profileCreationSchema.ts` |
| `NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN` / `NEXT_PUBLIC_BETTER_STACK_INGESTING_URL` | Optional | Enables client-side telemetry forwarding to Better Stack. | `src/env.js` |

> 🔐 **Tip:** Use environment-specific `.env.local`, `.env.production`, or CI secrets to prevent accidental credential leaks.

## 🛠️ Local Development Workflow

- **Install dependencies**: `pnpm install` after pulling new changes or lockfile updates.
- **Standard frontend loop**: `pnpm dev` starts Next.js on `http://localhost:3000` using the mock data source by default.
- **End-to-end webhook testing**: `pnpm dev:all` runs `pnpm dev` and `pnpm dev:webhook` concurrently, exposing your local server through ngrok (see `package.json`). Use this when validating Clerk webhooks or external integrations.
- **Convex backend**:
  ```bash
  # Authenticate once
  pnpm convex login

  # Start local Convex functions; requires CONVEX_DEPLOYMENT when targeting remote data
  pnpm convex dev
  ```
  Configure `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` when you need to work against a team deployment instead of the mock data source.
- **Switching data sources**: Set `NEXT_PUBLIC_GIGS_DATASOURCE=convex` and ensure Convex seed data exists for features under `shared/profile/profileCreationSchema.ts`.
- **Environment validation**: run with `SKIP_ENV_VALIDATION=false` (default) so invalid configuration fails fast during `pnpm dev`/`pnpm build`.

## 📋 Available Scripts

```bash
# Development
pnpm run dev          # Start development server with Turbo
pnpm run build        # Build for production
pnpm run start        # Start production server
pnpm run preview      # Build and start production server

# Testing
pnpm run test         # Run unit tests with Jest
pnpm run test:watch   # Run tests in watch mode
pnpm run test:coverage # Run tests with coverage report
pnpm run test:ci      # Run tests in CI mode

# Code Quality
pnpm run lint         # Run ESLint
pnpm run lint:fix     # Fix ESLint errors
pnpm run typecheck    # Run TypeScript checks
pnpm run format:check # Check code formatting
pnpm run format:write # Format code with Prettier
pnpm run check        # Run linting and type checking
```

## 🐳 Docker Commands

```bash
# Build locally
docker build -t gigsy .

# Run with Docker Compose (builds from local Dockerfile)
docker compose up --build

# Run in production mode
docker compose -f docker-compose.yml up --build

# Stop containers
docker compose down
```

> 🗒️ **Compose environments**: The bundled `docker-compose.yml` builds the image locally using the Dockerfile. For deployments that should pull the published artifact (`mostafayaser/gigsy_digitopia2025:prod`), add an override file such as `docker-compose.prod.yml` with `image: mostafayaser/gigsy_digitopia2025:prod` and load credentials via an `.env.prod` file (see `deployment/docker-compose/.env.prod.template`).

## 🔄 CI/CD Pipeline

This project features a comprehensive CI/CD pipeline that automatically:

- ✅ **Unit Tests**: Jest testing with React Testing Library and coverage reporting
- ✅ **Type Safety**: Full TypeScript checking and validation
- ✅ **Code Quality**: ESLint linting and Prettier formatting validation
- ✅ **Security Scanning**: Dependency vulnerabilities and container security
- ✅ **Multi-Platform Builds**: AMD64 and ARM64 container images
- ✅ **Automated Publishing**: DockerHub registry with smart tagging
- ✅ **SBOM Generation**: Software Bill of Materials for supply chain security

### Pipeline Triggers

- **Pull Requests**: Testing and validation only
- **Main/Master Push**: Full pipeline with Docker image publishing
- **Manual Dispatch**: Triggered via GitHub Actions UI

### Quick Setup

1. **Configure CI secrets** in repository settings:
   - `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN`
   - `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT`
   - Optional observability keys: `BETTER_STACK_SOURCE_TOKEN`, `BETTER_STACK_INGESTING_HOST`
2. **Push to `main`**: [docker-publish workflow](deployment/docker-publish.yml) builds the multi-arch image, runs tests, security scans, and publishes tags (`prod`, `latest`, `main-<SHA>`).
3. **Review pipeline artifacts**: SBOM, Trivy scan, and build logs are attached to the workflow run for compliance and troubleshooting.

📖 **Detailed Setup**: See [CI/CD Setup Guide](.github/SETUP.md)

## 🏗️ Tech Stack

This project is built with the [T3 Stack](https://create.t3.gg/):

- **[Next.js](https://nextjs.org)** - React framework with App Router
- **[TypeScript](https://typescriptlang.org)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[Radix UI](https://radix-ui.com)** - Unstyled, accessible components
- **[Lucide React](https://lucide.dev)** - Beautiful icons
- **[Zod](https://zod.dev)** - TypeScript-first schema validation

### Development Tools

- **[Jest](https://jestjs.io)** - JavaScript testing framework
- **[Testing Library](https://testing-library.com)** - Simple and complete testing utilities
- **[ESLint](https://eslint.org)** - Code linting
- **[Prettier](https://prettier.io)** - Code formatting
- **[pnpm](https://pnpm.io)** - Fast, disk space efficient package manager

## 📁 Project Structure

```text
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   └── __tests__/      # Page component tests
│   ├── components/          # Reusable UI components
│   │   └── __tests__/      # Component tests
│   ├── lib/                # Utility functions
│   │   └── __tests__/      # Unit tests for utilities
│   ├── styles/             # Global styles
│   └── env.js              # Environment validation
├── public/                 # Static assets
├── .github/
│   ├── workflows/          # GitHub Actions workflows
│   ├── SETUP.md           # CI/CD setup guide
│   └── WORKFLOW-SUMMARY.md # Detailed pipeline docs
├── Dockerfile              # Container image definition
├── docker-compose.yml      # Local development setup
├── jest.config.js          # Jest testing configuration
├── jest.setup.js           # Test environment setup
├── TESTING.md              # Comprehensive testing guide
└── .dockerignore          # Docker build context optimization
```

## 🔒 Security

This project implements comprehensive security practices:

- **Dependency Scanning**: Automated vulnerability detection
- **Container Security**: Image scanning with Trivy
- **SARIF Reports**: Integration with GitHub Security tab
- **Minimal Base Image**: Alpine Linux for reduced attack surface
- **Non-Root Execution**: Containers run as non-privileged user
- **Supply Chain Security**: SBOM generation and verification

## 🚀 Deployment

### Docker Hub

Images are automatically published to Docker Hub with the following tags:

- `prod` – Stable production release build (main branch)
- `latest` – Alias of `prod` for convenience
- `main-<COMMIT_SHA>` – Immutable artifact for traceability
- `pr-<PR_NUMBER>` – Preview image for pull requests

### Production Deployment

```bash
# Pull production image
docker pull mostafayaser/gigsy_digitopia2025:prod

# Deploy with Docker Compose
version: '3.8'
services:
  app:
    image: mostafayaser/gigsy_digitopia2025:prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gigsy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gigsy
  template:
    metadata:
      labels:
        app: gigsy
    spec:
      containers:
      - name: gigsy
        image: mostafayaser/gigsy_digitopia2025:prod
        ports:
        - containerPort: 3000
```

## 📊 Monitoring

### Health Checks

The application includes built-in health monitoring:

- **Container Health**: Docker HEALTHCHECK directive
- **Application Health**: `/api/health` endpoint
- **Runtime Metrics**: Memory usage, uptime, version info

### Accessing Health Status

```bash
# Check application health
curl http://localhost:3000/api/health

# Docker health status
docker ps  # Shows health status in STATUS column
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and ensure tests pass: `pnpm run check`
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Workflow

1. **Local Testing**: Run `pnpm run test` and `pnpm run check` before committing
2. **Pull Request**: Automated testing, linting, and security scanning
3. **Code Review**: Team review and approval
4. **Merge**: Automatic deployment to production

### Testing Guidelines

- Write unit tests for all business logic
- Test React components with Testing Library
- Maintain minimum 70% test coverage
- See **[TESTING.md](TESTING.md)** for detailed testing guide

## 📚 Documentation

- 🧪 **[Testing Guide](TESTING.md)** - Complete testing strategy and examples
- 📖 **[CI/CD Setup Guide](.github/SETUP.md)** - Quick setup instructions
- 📋 **[Workflow Summary](.github/WORKFLOW-SUMMARY.md)** - Comprehensive CI/CD documentation
- 🐳 **[Docker Guide](DOCKER_README.md)** - Container best practices
- 🏗️ **[T3 Stack Docs](https://create.t3.gg/)** - Framework documentation

## 🆘 Support

### Troubleshooting

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Tests failing | Run `pnpm test:coverage` to see detailed results |
| Docker build fails | Check `.dockerignore` and `Dockerfile` |
| CI/CD pipeline fails | Verify DockerHub secrets configuration |
| Type errors | Run `pnpm run typecheck` locally |
| Linting errors | Run `pnpm run lint:fix` |

### Getting Help

1. **Check the documentation** in `.github/` directory
2. **Review GitHub Issues** for similar problems
3. **Create a new issue** with detailed information
4. **Join the community** discussions

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **[T3 Stack](https://create.t3.gg/)** - Amazing Next.js starter template
- **[Vercel](https://vercel.com)** - Deployment platform
- **[Docker](https://docker.com)** - Containerization platform
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD automation

---

**Ready to deploy?** Follow the [setup guide](.github/SETUP.md) to get your CI/CD pipeline running in 5 minutes!
