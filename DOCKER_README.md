# Docker Setup Documentation

## Overview

This project uses a production-optimized Docker configuration with multi-stage builds, security best practices, and health monitoring.

## Features

- ✅ **Multi-stage build** for optimized image size
- ✅ **Node.js 18 Alpine** for security and performance
- ✅ **Non-root user** for enhanced security
- ✅ **Health checks** for container monitoring
- ✅ **Resource limits** for production deployment
- ✅ **Comprehensive .dockerignore** for faster builds

## Quick Start

### Development

```bash
# Build and run with docker-compose
docker-compose up --build

# Or build manually
docker build -t gigsy-app .
docker run -p 3000:3000 gigsy-app
```

### Production

```bash
# Build with production optimizations
docker build --target runner -t gigsy-app:production .

# Run with resource limits
docker run -d \
  --name gigsy-app \
  --memory="1g" \
  --cpus="1.0" \
  -p 3000:3000 \
  gigsy-app:production
```

## Health Monitoring

The application includes a health check endpoint at `/api/health` that returns:

```json
{
  "status": "healthy",
  "timestamp": "2025-09-05T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production"
}
```

### Docker Health Checks

- **Interval**: 30 seconds
- **Timeout**: 3 seconds  
- **Retries**: 3 attempts
- **Start Period**: 5 seconds

## Security Features

1. **Non-root execution**: Runs as `nextjs` user (UID 1001)
2. **Minimal base image**: Alpine Linux with only essential packages
3. **No secrets in layers**: All sensitive data via environment variables
4. **Resource limits**: CPU and memory constraints
5. **Health monitoring**: Automatic restart on failure

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Application port | `3000` |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | `1` |
| `DATABASE_URL` | Database connection string | - |
| `NEXT_PUBLIC_CLIENTVAR` | Public client variable | `clientvar` |

## Build Arguments

| Argument | Description | Usage |
|----------|-------------|-------|
| `DATABASE_URL` | Build-time database URL | Optional |
| `NEXT_PUBLIC_CLIENTVAR` | Public environment variable | Required |

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs gigsy-app

# Check health status
docker inspect gigsy-app --format='{{.State.Health.Status}}'
```

### Performance issues

```bash
# Monitor resource usage
docker stats gigsy-app

# Check health endpoint
curl http://localhost:3000/api/health
```

### Build issues

```bash
# Build without cache
docker build --no-cache -t gigsy-app .

# Check build context size
docker system df
```

## Best Practices Implemented

1. **Layer optimization**: Dependencies cached separately from source code
2. **Multi-stage builds**: Separate build and runtime environments
3. **Security scanning**: Regular base image updates
4. **Resource management**: Defined CPU and memory limits
5. **Health monitoring**: Comprehensive health checks
6. **Clean builds**: Comprehensive .dockerignore file

## Monitoring in Production

1. **Health endpoint**: `/api/health` for load balancer checks
2. **Docker health checks**: Built-in container monitoring
3. **Resource limits**: Prevent resource exhaustion
4. **Restart policies**: Automatic recovery from failures

For more information, see the [Docker Best Practices Guide](.github/instructions/containerization-docker-best-practices.instructions.md).
