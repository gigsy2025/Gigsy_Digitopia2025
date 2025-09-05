# Gigsy - Next.js Application

[![Build and Publish Docker Image](https://github.com/YOUR_USERNAME/gigsy/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/YOUR_USERNAME/gigsy/actions/workflows/docker-publish.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/YOUR_DOCKERHUB_USERNAME/gigsy)](https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/gigsy)

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
# Pull and run the latest image
docker pull YOUR_DOCKERHUB_USERNAME/gigsy:latest
docker run -p 3000:3000 YOUR_DOCKERHUB_USERNAME/gigsy:latest

# Open in browser
open http://localhost:3000
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/gigsy.git
cd gigsy

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Open in browser
open http://localhost:3000
```

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

# Run with Docker Compose
docker compose up

# Run in production mode
docker compose -f docker-compose.yml up

# Stop containers
docker compose down
```

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

1. **Set DockerHub Secrets**: Add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` to repository secrets
2. **Push to Main**: Workflow automatically builds and publishes Docker images
3. **Monitor**: Check GitHub Actions tab for build status

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

Images are automatically published to Docker Hub with multiple tags:

- `latest` - Latest main branch build
- `main` - Latest main branch (same as latest)
- `main-COMMIT_SHA` - Specific commit version

### Production Deployment

```bash
# Pull specific version
docker pull YOUR_DOCKERHUB_USERNAME/gigsy:main-abc123

# Deploy with Docker Compose
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
        image: YOUR_DOCKERHUB_USERNAME/gigsy:latest
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
