# 🐳 Docker Deployment Scripts & Configuration

## 📁 Directory Structure

This directory contains deployment scripts and configurations for the Gigsy platform's Docker-based CI/CD pipeline.

```
deployment/
├── scripts/
│   ├── deploy-dev.sh           # Development deployment script
│   ├── deploy-prod.sh          # Production deployment script
│   ├── rollback.sh             # Emergency rollback script
│   └── health-check.sh         # Health verification script
├── kubernetes/
│   ├── namespace.yaml          # Kubernetes namespace
│   ├── deployment-dev.yaml     # Development deployment
│   ├── deployment-prod.yaml    # Production deployment
│   ├── service.yaml            # Kubernetes service
│   ├── ingress.yaml            # Ingress configuration
│   └── configmap.yaml          # Application configuration
├── helm/
│   └── gigsy/                  # Helm chart for Gigsy
└── docker-compose/
    ├── docker-compose.dev.yml  # Development environment
    ├── docker-compose.prod.yml # Production environment
    └── .env.example            # Environment variables template
```

## 🚀 Quick Deployment Commands

### Using Docker Compose

#### Development Environment

```bash
# Pull latest development image
docker-compose -f deployment/docker-compose/docker-compose.dev.yml pull

# Start development environment
docker-compose -f deployment/docker-compose/docker-compose.dev.yml up -d

# View logs
docker-compose -f deployment/docker-compose/docker-compose.dev.yml logs -f
```

#### Production Environment

```bash
# Pull specific commit image for production
export GIGSY_IMAGE_TAG=a1b2c3d  # Replace with actual commit SHA
docker-compose -f deployment/docker-compose/docker-compose.prod.yml pull

# Start production environment
docker-compose -f deployment/docker-compose/docker-compose.prod.yml up -d

# Health check
curl -f http://localhost:3000/api/health || echo "Health check failed"
```

### Using Kubernetes

#### Development Deployment

```bash
# Apply development configuration
kubectl apply -f deployment/kubernetes/namespace.yaml
kubectl apply -f deployment/kubernetes/deployment-dev.yaml
kubectl apply -f deployment/kubernetes/service.yaml

# Check deployment status
kubectl get pods -n gigsy-dev
kubectl logs -f deployment/gigsy-dev -n gigsy-dev
```

#### Production Deployment

```bash
# Apply production configuration
kubectl apply -f deployment/kubernetes/namespace.yaml
kubectl apply -f deployment/kubernetes/deployment-prod.yaml
kubectl apply -f deployment/kubernetes/service.yaml
kubectl apply -f deployment/kubernetes/ingress.yaml

# Verify deployment
kubectl rollout status deployment/gigsy-prod -n gigsy-prod
```

### Using Helm Charts

```bash
# Install development release
helm install gigsy-dev ./deployment/helm/gigsy \
  --namespace gigsy-dev \
  --set image.tag=dev \
  --set environment=development

# Install production release
helm install gigsy-prod ./deployment/helm/gigsy \
  --namespace gigsy-prod \
  --set image.tag=a1b2c3d \
  --set environment=production \
  --wait --timeout=600s
```

## 🔧 Environment Variables

### Required Environment Variables

| Variable          | Description                | Development             | Production            |
| ----------------- | -------------------------- | ----------------------- | --------------------- |
| `NODE_ENV`        | Application environment    | `development`           | `production`          |
| `PORT`            | Application port           | `3000`                  | `3000`                |
| `DATABASE_URL`    | Database connection string | Local PostgreSQL        | Production DB         |
| `NEXTAUTH_URL`    | Authentication base URL    | `http://localhost:3000` | `https://gigsy.com`   |
| `NEXTAUTH_SECRET` | JWT secret                 | Development key         | Secure production key |

### Optional Environment Variables

| Variable               | Description               | Default |
| ---------------------- | ------------------------- | ------- |
| `LOG_LEVEL`            | Logging level             | `info`  |
| `HEALTH_CHECK_TIMEOUT` | Health check timeout (ms) | `2000`  |
| `MAX_UPLOAD_SIZE`      | Maximum file upload size  | `10MB`  |

## 📊 Monitoring & Health Checks

### Health Check Endpoints

#### Application Health

```bash
# Basic health check
curl -f http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-09-05T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production"
}
```

#### Docker Container Health

```bash
# Check container health status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# View health check logs
docker inspect --format='{{json .State.Health}}' gigsy-app
```

#### Kubernetes Health

```bash
# Check pod health
kubectl get pods -l app=gigsy -o wide

# Check readiness and liveness probes
kubectl describe pod <pod-name>
```

### Performance Monitoring

#### Resource Usage

```bash
# Docker container stats
docker stats gigsy-app

# Kubernetes resource usage
kubectl top pods -l app=gigsy
kubectl top nodes
```

#### Application Metrics

```bash
# Response time check
time curl -s http://localhost:3000/api/health

# Load testing (using Apache Bench)
ab -n 1000 -c 10 http://localhost:3000/
```

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### Container Won't Start

```bash
# Check container logs
docker logs gigsy-app --tail=50

# Check container configuration
docker inspect gigsy-app

# Verify image exists
docker images | grep gigsy
```

#### Port Binding Issues

```bash
# Check port usage
netstat -tlnp | grep :3000
lsof -i :3000

# Find and kill process using port
kill -9 $(lsof -t -i:3000)
```

#### Database Connection Issues

```bash
# Test database connectivity
docker exec -it gigsy-app node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows[0]);
  pool.end();
});
"
```

#### Image Pull Issues

```bash
# Login to Docker registry
docker login docker.io

# Pull image manually
docker pull mostafayaser/gigsy_digitopia2025:latest

# Check registry credentials
docker config list
```

### Emergency Procedures

#### Quick Rollback

```bash
# Using provided rollback script
./deployment/scripts/rollback.sh <previous-commit-sha>

# Manual Kubernetes rollback
kubectl rollout undo deployment/gigsy-prod

# Manual Docker Compose rollback
export GIGSY_IMAGE_TAG=<previous-working-sha>
docker-compose -f docker-compose.prod.yml up -d
```

#### Health Check Failures

```bash
# Check application logs
kubectl logs -f deployment/gigsy-prod --tail=100

# Check node health
kubectl get nodes
kubectl describe node <node-name>

# Restart unhealthy pods
kubectl delete pod -l app=gigsy
```

#### Resource Exhaustion

```bash
# Check resource usage
kubectl top pods --all-namespaces
kubectl top nodes

# Scale down non-essential services
kubectl scale deployment/gigsy-dev --replicas=0

# Clear Docker cache
docker system prune -a
```

## 🔄 Deployment Workflows

### Automated CI/CD Deployment

The deployment process is fully automated through GitHub Actions:

1. **Code Push**: Developer pushes to `master` or `main`
2. **Image Build**: Docker image built with commit SHA tag
3. **Security Scan**: Image scanned for vulnerabilities
4. **Environment Deploy**: Image deployed to appropriate environment
5. **Health Verification**: Automated health checks verify deployment
6. **Notification**: Teams notified of deployment status

### Manual Deployment Process

For manual deployments or emergency fixes:

1. **Verify Image**: Ensure target image exists and is secure
2. **Backup Current**: Create backup of current deployment state
3. **Deploy New Version**: Use deployment scripts or Kubernetes
4. **Health Check**: Verify application health and functionality
5. **Monitor**: Watch for any issues or errors
6. **Rollback if Needed**: Quick rollback if problems detected

## 📚 Additional Resources

### Documentation Links

- [Docker Best Practices](../DOCKER_README.md)
- [CI/CD Pipeline Documentation](../.github/workflows/README.md)
- [Kubernetes Configuration](./kubernetes/README.md)
- [Helm Chart Documentation](./helm/gigsy/README.md)

### Monitoring Dashboards

- **Application Health**: `http://localhost:3000/api/health`
- **Docker Stats**: `docker stats --no-stream`
- **Kubernetes Dashboard**: `kubectl proxy` → http://localhost:8001/ui

### Support Contacts

- **DevOps Team**: devops@gigsy.com
- **Development Team**: dev@gigsy.com
- **Emergency Hotline**: +1-555-GIGSY-911

---

**Note**: Always use immutable commit SHA tags for production deployments to ensure reproducibility and enable easy rollbacks.
