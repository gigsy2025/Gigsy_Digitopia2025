#!/bin/bash

# 🚀 Gigsy Development Deployment Script
# This script deploys the latest development build to the development environment

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly IMAGE_REGISTRY="mostafayaser/gigsy_digitopia2025"
readonly ENVIRONMENT="development"
readonly NAMESPACE="gigsy-dev"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local tools=("docker" "docker-compose" "curl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed or not in PATH"
            exit 1
        fi
    done
    
    log_success "All prerequisites are met"
}

# Get the latest commit SHA from master branch
get_latest_commit() {
    log_info "Fetching latest commit SHA from master branch..."
    
    # Try to get commit SHA from git (if in git repo)
    if git rev-parse --git-dir > /dev/null 2>&1; then
        COMMIT_SHA=$(git rev-parse --short HEAD)
        log_success "Using local commit SHA: $COMMIT_SHA"
    else
        log_warning "Not in a git repository, using 'dev' tag"
        COMMIT_SHA="dev"
    fi
}

# Pull the latest development image
pull_image() {
    local image_tag="${1:-dev}"
    local full_image="$IMAGE_REGISTRY:$image_tag"
    
    log_info "Pulling Docker image: $full_image"
    
    if docker pull "$full_image"; then
        log_success "Successfully pulled image: $full_image"
    else
        log_error "Failed to pull image: $full_image"
        log_info "Available tags:"
        docker search "$IMAGE_REGISTRY" || true
        exit 1
    fi
}

# Deploy using Docker Compose
deploy_docker_compose() {
    local image_tag="${1:-dev}"
    local compose_file="$PROJECT_ROOT/docker-compose/docker-compose.dev.yml"
    
    log_info "Deploying using Docker Compose..."
    
    # Export environment variables for docker-compose
    export GIGSY_IMAGE_TAG="$image_tag"
    export NODE_ENV="development"
    export PORT="3000"
    
    # Check if compose file exists
    if [[ ! -f "$compose_file" ]]; then
        log_warning "Docker Compose file not found at $compose_file"
        log_info "Using simple docker run command instead..."
        deploy_docker_run "$image_tag"
        return
    fi
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f "$compose_file" down --remove-orphans || true
    
    # Start new containers
    log_info "Starting containers with image tag: $image_tag"
    if docker-compose -f "$compose_file" up -d; then
        log_success "Docker Compose deployment successful"
    else
        log_error "Docker Compose deployment failed"
        exit 1
    fi
}

# Deploy using docker run (fallback)
deploy_docker_run() {
    local image_tag="${1:-dev}"
    local full_image="$IMAGE_REGISTRY:$image_tag"
    local container_name="gigsy-dev"
    
    log_info "Deploying using docker run..."
    
    # Stop and remove existing container
    log_info "Stopping existing container: $container_name"
    docker stop "$container_name" 2>/dev/null || true
    docker rm "$container_name" 2>/dev/null || true
    
    # Run new container
    log_info "Starting new container: $container_name"
    docker run -d \
        --name "$container_name" \
        --restart unless-stopped \
        -p 3000:3000 \
        -e NODE_ENV=development \
        -e PORT=3000 \
        "$full_image"
    
    if [[ $? -eq 0 ]]; then
        log_success "Container deployment successful"
    else
        log_error "Container deployment failed"
        exit 1
    fi
}

# Wait for application to be ready
wait_for_health() {
    local max_attempts=30
    local wait_seconds=10
    local health_url="http://localhost:3000/api/health"
    
    log_info "Waiting for application to be healthy..."
    log_info "Health check URL: $health_url"
    
    for ((i=1; i<=max_attempts; i++)); do
        if curl -sf "$health_url" > /dev/null 2>&1; then
            log_success "Application is healthy! (attempt $i/$max_attempts)"
            return 0
        fi
        
        log_info "Health check failed, waiting $wait_seconds seconds... (attempt $i/$max_attempts)"
        sleep $wait_seconds
    done
    
    log_error "Application failed to become healthy within $((max_attempts * wait_seconds)) seconds"
    log_info "Container logs:"
    docker logs gigsy-dev --tail=20 || true
    return 1
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if container is running
    if docker ps | grep -q "gigsy"; then
        log_success "Container is running"
    else
        log_error "No Gigsy containers are running"
        return 1
    fi
    
    # Check application health
    if wait_for_health; then
        log_success "Application health check passed"
    else
        log_error "Application health check failed"
        return 1
    fi
    
    # Display deployment info
    log_info "Deployment information:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Image: $IMAGE_REGISTRY:${COMMIT_SHA:-dev}"
    echo "  URL: http://localhost:3000"
    echo "  Health: http://localhost:3000/api/health"
}

# Show deployment status
show_status() {
    log_info "Current deployment status:"
    
    echo
    echo "=== Docker Containers ==="
    docker ps --filter "name=gigsy" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
    
    echo
    echo "=== Container Logs (last 10 lines) ==="
    docker logs gigsy-dev --tail=10 2>/dev/null || log_warning "No logs available"
    
    echo
    echo "=== Health Check ==="
    if curl -sf http://localhost:3000/api/health; then
        echo
        log_success "Application is healthy"
    else
        log_warning "Application health check failed"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    # Any cleanup tasks would go here
}

# Main deployment function
main() {
    log_info "Starting Gigsy development deployment..."
    
    # Set up cleanup on exit
    trap cleanup EXIT
    
    # Check prerequisites
    check_prerequisites
    
    # Get latest commit or use 'dev'
    get_latest_commit
    
    # Use provided tag or detected commit SHA
    local deploy_tag="${1:-${COMMIT_SHA:-dev}}"
    
    log_info "Deploying with image tag: $deploy_tag"
    
    # Pull image
    pull_image "$deploy_tag"
    
    # Deploy application
    deploy_docker_compose "$deploy_tag"
    
    # Verify deployment
    if verify_deployment; then
        log_success "🎉 Development deployment completed successfully!"
        echo
        show_status
        echo
        log_info "Access your application at: http://localhost:3000"
    else
        log_error "❌ Development deployment failed!"
        show_status
        exit 1
    fi
}

# Script usage information
usage() {
    echo "Usage: $0 [IMAGE_TAG]"
    echo
    echo "Deploy Gigsy to development environment"
    echo
    echo "Arguments:"
    echo "  IMAGE_TAG    Docker image tag to deploy (default: 'dev' or current commit)"
    echo
    echo "Examples:"
    echo "  $0                    # Deploy latest development build"
    echo "  $0 dev                # Deploy dev tag explicitly"
    echo "  $0 a1b2c3d            # Deploy specific commit"
    echo
    echo "Environment variables:"
    echo "  GIGSY_IMAGE_TAG       Override image tag"
    echo "  NODE_ENV              Override NODE_ENV (default: development)"
}

# Handle script arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
