#!/bin/bash

# 🚀 Gigsy Production Deployment Script
# This script deploys a specific commit SHA to the production environment

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly IMAGE_REGISTRY="mostafayaser/gigsy_digitopia2025"
readonly ENVIRONMENT="production"
readonly NAMESPACE="gigsy-prod"

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

# Validate commit SHA format
validate_commit_sha() {
    local commit_sha="$1"
    
    if [[ -z "$commit_sha" ]]; then
        log_error "Commit SHA is required for production deployment"
        echo
        usage
        exit 1
    fi
    
    # Check if it's a valid git commit SHA format (7-40 hex characters)
    if [[ ! "$commit_sha" =~ ^[a-f0-9]{7,40}$ ]]; then
        log_error "Invalid commit SHA format: $commit_sha"
        log_info "Expected format: 7-40 hexadecimal characters (e.g., a1b2c3d or a1b2c3d4e5f6...)"
        exit 1
    fi
    
    log_success "Commit SHA validation passed: $commit_sha"
}

# Check if image exists in registry
verify_image_exists() {
    local image_tag="$1"
    local full_image="$IMAGE_REGISTRY:$image_tag"
    
    log_info "Verifying image exists: $full_image"
    
    # Try to pull the image manifest (without downloading layers)
    if docker manifest inspect "$full_image" > /dev/null 2>&1; then
        log_success "Image verified: $full_image"
    else
        log_error "Image not found in registry: $full_image"
        log_info "Available tags can be checked at: https://hub.docker.com/r/$IMAGE_REGISTRY/tags"
        exit 1
    fi
}

# Create backup of current deployment
backup_current_deployment() {
    local backup_dir="$PROJECT_ROOT/backups"
    local backup_file="$backup_dir/production-backup-$(date +%Y%m%d-%H%M%S).json"
    
    log_info "Creating backup of current deployment..."
    
    mkdir -p "$backup_dir"
    
    # Get current container info
    local current_container=$(docker ps --filter "name=gigsy-prod" --format "{{.ID}}")
    if [[ -n "$current_container" ]]; then
        docker inspect "$current_container" > "$backup_file"
        log_success "Backup created: $backup_file"
    else
        log_warning "No current production container found to backup"
    fi
}

# Pull the production image
pull_image() {
    local image_tag="$1"
    local full_image="$IMAGE_REGISTRY:$image_tag"
    
    log_info "Pulling Docker image: $full_image"
    
    if docker pull "$full_image"; then
        log_success "Successfully pulled image: $full_image"
    else
        log_error "Failed to pull image: $full_image"
        exit 1
    fi
}

# Deploy using Docker Compose
deploy_docker_compose() {
    local image_tag="$1"
    local compose_file="$PROJECT_ROOT/docker-compose/docker-compose.prod.yml"
    
    log_info "Deploying using Docker Compose..."
    
    # Export environment variables for docker-compose
    export GIGSY_IMAGE_TAG="$image_tag"
    export NODE_ENV="production"
    export PORT="3000"
    
    # Check if compose file exists
    if [[ ! -f "$compose_file" ]]; then
        log_warning "Docker Compose file not found at $compose_file"
        log_info "Using docker run command instead..."
        deploy_docker_run "$image_tag"
        return
    fi
    
    # Deploy with zero-downtime strategy
    log_info "Performing zero-downtime deployment..."
    
    # Pull the new image first
    docker-compose -f "$compose_file" pull
    
    # Start new containers alongside old ones
    log_info "Starting new containers with image tag: $image_tag"
    if docker-compose -f "$compose_file" up -d; then
        log_success "Docker Compose deployment successful"
    else
        log_error "Docker Compose deployment failed"
        exit 1
    fi
}

# Deploy using docker run (fallback)
deploy_docker_run() {
    local image_tag="$1"
    local full_image="$IMAGE_REGISTRY:$image_tag"
    local container_name="gigsy-prod"
    local old_container_name="gigsy-prod-old"
    
    log_info "Deploying using docker run with zero-downtime strategy..."
    
    # Rename current container to backup name
    local current_container=$(docker ps --filter "name=$container_name" --format "{{.ID}}")
    if [[ -n "$current_container" ]]; then
        log_info "Backing up current container as $old_container_name"
        docker rename "$container_name" "$old_container_name" || true
    fi
    
    # Run new container
    log_info "Starting new container: $container_name"
    docker run -d \
        --name "$container_name" \
        --restart unless-stopped \
        -p 3000:3000 \
        -e NODE_ENV=production \
        -e PORT=3000 \
        "$full_image"
    
    if [[ $? -eq 0 ]]; then
        log_success "Container deployment successful"
        
        # Wait for health check before removing old container
        if wait_for_health; then
            log_info "Removing old container: $old_container_name"
            docker stop "$old_container_name" 2>/dev/null || true
            docker rm "$old_container_name" 2>/dev/null || true
        else
            log_error "New container health check failed, rolling back..."
            rollback_deployment "$old_container_name" "$container_name"
            exit 1
        fi
    else
        log_error "Container deployment failed"
        # Restore old container if it exists
        if docker ps -a --filter "name=$old_container_name" --format "{{.ID}}" | grep -q .; then
            docker rename "$old_container_name" "$container_name"
        fi
        exit 1
    fi
}

# Rollback deployment
rollback_deployment() {
    local old_container="$1"
    local failed_container="$2"
    
    log_warning "Rolling back deployment..."
    
    # Stop failed container
    docker stop "$failed_container" 2>/dev/null || true
    docker rm "$failed_container" 2>/dev/null || true
    
    # Restore old container
    if docker ps -a --filter "name=$old_container" --format "{{.ID}}" | grep -q .; then
        docker rename "$old_container" "gigsy-prod"
        docker start "gigsy-prod"
        log_success "Rollback completed"
    else
        log_error "Unable to rollback - old container not found"
    fi
}

# Wait for application to be ready
wait_for_health() {
    local max_attempts=60  # More attempts for production
    local wait_seconds=5
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
    docker logs gigsy-prod --tail=20 || true
    return 1
}

# Run smoke tests
run_smoke_tests() {
    local base_url="http://localhost:3000"
    
    log_info "Running smoke tests..."
    
    # Test health endpoint
    if curl -sf "$base_url/api/health" > /dev/null; then
        log_success "✓ Health endpoint responding"
    else
        log_error "✗ Health endpoint failed"
        return 1
    fi
    
    # Test main page
    if curl -sf "$base_url" > /dev/null; then
        log_success "✓ Main page responding"
    else
        log_error "✗ Main page failed"
        return 1
    fi
    
    # Test response time
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$base_url/api/health")
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        log_success "✓ Response time acceptable: ${response_time}s"
    else
        log_warning "⚠ Response time slow: ${response_time}s"
    fi
    
    log_success "Smoke tests completed"
}

# Verify deployment
verify_deployment() {
    local image_tag="$1"
    
    log_info "Verifying production deployment..."
    
    # Check if container is running
    if docker ps | grep -q "gigsy-prod"; then
        log_success "Container is running"
    else
        log_error "No Gigsy production containers are running"
        return 1
    fi
    
    # Check application health
    if wait_for_health; then
        log_success "Application health check passed"
    else
        log_error "Application health check failed"
        return 1
    fi
    
    # Run smoke tests
    if run_smoke_tests; then
        log_success "Smoke tests passed"
    else
        log_error "Smoke tests failed"
        return 1
    fi
    
    # Display deployment info
    log_info "Production deployment information:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Image: $IMAGE_REGISTRY:$image_tag"
    echo "  URL: http://localhost:3000"
    echo "  Health: http://localhost:3000/api/health"
    echo "  Deployed at: $(date)"
}

# Show deployment status
show_status() {
    log_info "Current production status:"
    
    echo
    echo "=== Docker Containers ==="
    docker ps --filter "name=gigsy" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
    
    echo
    echo "=== Container Logs (last 10 lines) ==="
    docker logs gigsy-prod --tail=10 2>/dev/null || log_warning "No logs available"
    
    echo
    echo "=== Health Check ==="
    if curl -sf http://localhost:3000/api/health; then
        echo
        log_success "Application is healthy"
    else
        log_warning "Application health check failed"
    fi
}

# Send deployment notification
send_notification() {
    local status="$1"
    local image_tag="$2"
    
    # This would integrate with your notification system
    # Examples: Slack, email, PagerDuty, etc.
    
    local message="Production deployment $status: $IMAGE_REGISTRY:$image_tag"
    log_info "Notification: $message"
    
    # Example Slack webhook (uncomment and configure)
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"$message\"}" \
    #     "$SLACK_WEBHOOK_URL"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Any cleanup tasks would go here
}

# Main deployment function
main() {
    local commit_sha="$1"
    
    log_info "Starting Gigsy production deployment..."
    log_warning "This will deploy to PRODUCTION environment!"
    
    # Set up cleanup on exit
    trap cleanup EXIT
    
    # Validate inputs
    validate_commit_sha "$commit_sha"
    
    # Check prerequisites
    check_prerequisites
    
    # Verify image exists
    verify_image_exists "$commit_sha"
    
    # Create backup
    backup_current_deployment
    
    # Confirmation prompt
    echo
    read -p "Deploy commit $commit_sha to PRODUCTION? (yes/no): " -r
    if [[ ! $REPLY =~ ^(yes|y|Y)$ ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
    
    log_info "Deploying commit: $commit_sha"
    
    # Pull image
    pull_image "$commit_sha"
    
    # Deploy application
    deploy_docker_compose "$commit_sha"
    
    # Verify deployment
    if verify_deployment "$commit_sha"; then
        log_success "🎉 Production deployment completed successfully!"
        send_notification "SUCCESS" "$commit_sha"
        echo
        show_status
        echo
        log_info "Production application is live at: http://localhost:3000"
    else
        log_error "❌ Production deployment failed!"
        send_notification "FAILED" "$commit_sha"
        show_status
        exit 1
    fi
}

# Script usage information
usage() {
    echo "Usage: $0 <COMMIT_SHA>"
    echo
    echo "Deploy a specific commit to production environment"
    echo
    echo "Arguments:"
    echo "  COMMIT_SHA   Git commit SHA to deploy (required, 7-40 hex characters)"
    echo
    echo "Examples:"
    echo "  $0 a1b2c3d              # Deploy short commit SHA"
    echo "  $0 a1b2c3d4e5f6789      # Deploy full commit SHA"
    echo
    echo "Environment variables:"
    echo "  NODE_ENV                Override NODE_ENV (default: production)"
    echo "  SLACK_WEBHOOK_URL       Slack webhook for notifications"
    echo
    echo "IMPORTANT:"
    echo "  - Only immutable commit SHAs are allowed for production"
    echo "  - The image must exist in the registry before deployment"
    echo "  - This script includes confirmation prompts for safety"
}

# Handle script arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    "")
        log_error "Missing required argument: COMMIT_SHA"
        echo
        usage
        exit 1
        ;;
    *)
        main "$1"
        ;;
esac
