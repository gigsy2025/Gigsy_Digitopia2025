#!/bin/bash

# 🔄 Gigsy Emergency Rollback Script
# This script quickly rolls back to a previous deployment in case of issues

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly IMAGE_REGISTRY="mostafayaser/gigsy_digitopia2025"

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

# Get environment from container name or parameter
detect_environment() {
    local target_env="${1:-}"
    
    if [[ -n "$target_env" ]]; then
        echo "$target_env"
        return
    fi
    
    # Auto-detect based on running containers
    if docker ps --filter "name=gigsy-prod" --format "{{.Names}}" | grep -q "gigsy-prod"; then
        echo "production"
    elif docker ps --filter "name=gigsy-dev" --format "{{.Names}}" | grep -q "gigsy-dev"; then
        echo "development"
    else
        log_error "No Gigsy containers detected. Please specify environment: production or development"
        exit 1
    fi
}

# Get current deployment information
get_current_deployment() {
    local environment="$1"
    local container_name="gigsy-${environment#*-}"  # Remove prefix if present
    
    if [[ "$environment" == "production" ]]; then
        container_name="gigsy-prod"
    elif [[ "$environment" == "development" ]]; then
        container_name="gigsy-dev"
    fi
    
    local container_id=$(docker ps --filter "name=$container_name" --format "{{.ID}}")
    
    if [[ -z "$container_id" ]]; then
        log_error "No running container found for environment: $environment"
        return 1
    fi
    
    local current_image=$(docker inspect "$container_id" --format '{{.Config.Image}}')
    local current_tag=$(echo "$current_image" | cut -d':' -f2)
    
    echo "Container: $container_name"
    echo "Image: $current_image"
    echo "Tag: $current_tag"
    echo "Container ID: $container_id"
}

# List available rollback targets
list_rollback_targets() {
    local environment="$1"
    
    log_info "Available rollback targets:"
    echo
    
    # Check backup containers
    log_info "1. Backup containers:"
    local backup_containers=$(docker ps -a --filter "name=gigsy-.*-old" --format "{{.Names}}\t{{.Image}}\t{{.Status}}")
    if [[ -n "$backup_containers" ]]; then
        echo "$backup_containers"
    else
        echo "  No backup containers found"
    fi
    
    echo
    
    # Check recent images in local Docker
    log_info "2. Recent local images:"
    docker images "$IMAGE_REGISTRY" --format "table {{.Tag}}\t{{.CreatedSince}}\t{{.Size}}" | head -10
    
    echo
    
    # Check deployment backups
    log_info "3. Deployment backups:"
    local backup_dir="$PROJECT_ROOT/backups"
    if [[ -d "$backup_dir" ]]; then
        ls -la "$backup_dir"/*.json 2>/dev/null | tail -5 || echo "  No backup files found"
    else
        echo "  No backup directory found"
    fi
}

# Validate rollback target
validate_rollback_target() {
    local target="$1"
    
    # Check if it's a container name (backup container)
    if docker ps -a --filter "name=$target" --format "{{.Names}}" | grep -q "$target"; then
        log_success "Found backup container: $target"
        return 0
    fi
    
    # Check if it's an image tag
    if docker images "$IMAGE_REGISTRY:$target" --format "{{.Repository}}:{{.Tag}}" | grep -q "$IMAGE_REGISTRY:$target"; then
        log_success "Found local image: $IMAGE_REGISTRY:$target"
        return 0
    fi
    
    # Try to pull the image from registry
    log_info "Checking registry for image: $IMAGE_REGISTRY:$target"
    if docker manifest inspect "$IMAGE_REGISTRY:$target" > /dev/null 2>&1; then
        log_success "Found image in registry: $IMAGE_REGISTRY:$target"
        return 0
    fi
    
    log_error "Rollback target not found: $target"
    return 1
}

# Perform rollback using backup container
rollback_to_backup_container() {
    local environment="$1"
    local backup_container="$2"
    local current_container="gigsy-${environment}"
    
    if [[ "$environment" == "production" ]]; then
        current_container="gigsy-prod"
    elif [[ "$environment" == "development" ]]; then
        current_container="gigsy-dev"
    fi
    
    log_info "Rolling back to backup container: $backup_container"
    
    # Stop current container
    log_info "Stopping current container: $current_container"
    docker stop "$current_container" 2>/dev/null || true
    
    # Rename current container for safety
    local timestamp=$(date +%Y%m%d-%H%M%S)
    docker rename "$current_container" "${current_container}-failed-${timestamp}" 2>/dev/null || true
    
    # Restore backup container
    log_info "Restoring backup container as: $current_container"
    docker rename "$backup_container" "$current_container"
    
    # Start the restored container
    log_info "Starting restored container: $current_container"
    docker start "$current_container"
    
    if [[ $? -eq 0 ]]; then
        log_success "Successfully rolled back to backup container"
        return 0
    else
        log_error "Failed to start restored container"
        return 1
    fi
}

# Perform rollback using image tag
rollback_to_image() {
    local environment="$1"
    local image_tag="$2"
    local container_name="gigsy-${environment}"
    local full_image="$IMAGE_REGISTRY:$image_tag"
    
    if [[ "$environment" == "production" ]]; then
        container_name="gigsy-prod"
    elif [[ "$environment" == "development" ]]; then
        container_name="gigsy-dev"
    fi
    
    log_info "Rolling back to image: $full_image"
    
    # Pull image if not available locally
    if ! docker images "$full_image" --format "{{.Repository}}:{{.Tag}}" | grep -q "$full_image"; then
        log_info "Pulling image from registry..."
        docker pull "$full_image"
    fi
    
    # Stop current container
    log_info "Stopping current container: $container_name"
    docker stop "$container_name" 2>/dev/null || true
    
    # Rename current container for safety
    local timestamp=$(date +%Y%m%d-%H%M%S)
    docker rename "$container_name" "${container_name}-failed-${timestamp}" 2>/dev/null || true
    
    # Start new container with rollback image
    log_info "Starting new container with rollback image..."
    
    local node_env="development"
    if [[ "$environment" == "production" ]]; then
        node_env="production"
    fi
    
    docker run -d \
        --name "$container_name" \
        --restart unless-stopped \
        -p 3000:3000 \
        -e NODE_ENV="$node_env" \
        -e PORT=3000 \
        "$full_image"
    
    if [[ $? -eq 0 ]]; then
        log_success "Successfully rolled back to image: $image_tag"
        return 0
    else
        log_error "Failed to start rollback container"
        return 1
    fi
}

# Wait for application to be ready after rollback
wait_for_health() {
    local max_attempts=30
    local wait_seconds=5
    local health_url="http://localhost:3000/api/health"
    
    log_info "Waiting for application to be healthy after rollback..."
    
    for ((i=1; i<=max_attempts; i++)); do
        if curl -sf "$health_url" > /dev/null 2>&1; then
            log_success "Application is healthy after rollback! (attempt $i/$max_attempts)"
            return 0
        fi
        
        log_info "Health check failed, waiting $wait_seconds seconds... (attempt $i/$max_attempts)"
        sleep $wait_seconds
    done
    
    log_error "Application failed to become healthy after rollback"
    return 1
}

# Verify rollback success
verify_rollback() {
    local environment="$1"
    local rollback_target="$2"
    
    log_info "Verifying rollback success..."
    
    # Check container status
    local container_name="gigsy-${environment}"
    if [[ "$environment" == "production" ]]; then
        container_name="gigsy-prod"
    elif [[ "$environment" == "development" ]]; then
        container_name="gigsy-dev"
    fi
    
    if docker ps --filter "name=$container_name" --format "{{.Names}}" | grep -q "$container_name"; then
        log_success "Container is running: $container_name"
    else
        log_error "Container is not running: $container_name"
        return 1
    fi
    
    # Check application health
    if wait_for_health; then
        log_success "Application health check passed"
    else
        log_error "Application health check failed"
        return 1
    fi
    
    # Display rollback info
    log_info "Rollback completed successfully:"
    echo "  Environment: $environment"
    echo "  Rollback target: $rollback_target"
    echo "  Container: $container_name"
    echo "  URL: http://localhost:3000"
    echo "  Rolled back at: $(date)"
    
    return 0
}

# Main rollback function
main() {
    local environment="${1:-}"
    local rollback_target="${2:-}"
    
    log_warning "🔄 EMERGENCY ROLLBACK INITIATED"
    
    # Detect environment if not provided
    environment=$(detect_environment "$environment")
    log_info "Target environment: $environment"
    
    # Show current deployment
    log_info "Current deployment information:"
    get_current_deployment "$environment"
    echo
    
    # If no rollback target specified, show options
    if [[ -z "$rollback_target" ]]; then
        list_rollback_targets "$environment"
        echo
        read -p "Enter rollback target (container name or image tag): " rollback_target
    fi
    
    if [[ -z "$rollback_target" ]]; then
        log_error "No rollback target specified"
        exit 1
    fi
    
    # Validate rollback target
    if ! validate_rollback_target "$rollback_target"; then
        exit 1
    fi
    
    # Confirmation prompt for production
    if [[ "$environment" == "production" ]]; then
        echo
        log_warning "You are about to rollback PRODUCTION!"
        read -p "Are you sure you want to proceed? (yes/no): " -r
        if [[ ! $REPLY =~ ^(yes|y|Y)$ ]]; then
            log_info "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    log_info "Starting rollback to: $rollback_target"
    
    # Determine rollback method and execute
    if docker ps -a --filter "name=$rollback_target" --format "{{.Names}}" | grep -q "$rollback_target"; then
        # Rollback to backup container
        rollback_to_backup_container "$environment" "$rollback_target"
    else
        # Rollback to image tag
        rollback_to_image "$environment" "$rollback_target"
    fi
    
    # Verify rollback
    if verify_rollback "$environment" "$rollback_target"; then
        log_success "🎉 Rollback completed successfully!"
        echo
        log_info "Application is available at: http://localhost:3000"
    else
        log_error "❌ Rollback verification failed!"
        exit 1
    fi
}

# Script usage information
usage() {
    echo "Usage: $0 [ENVIRONMENT] [ROLLBACK_TARGET]"
    echo
    echo "Rollback Gigsy deployment to a previous version"
    echo
    echo "Arguments:"
    echo "  ENVIRONMENT      Target environment (production|development, auto-detected if omitted)"
    echo "  ROLLBACK_TARGET  Container name or image tag to rollback to (interactive if omitted)"
    echo
    echo "Examples:"
    echo "  $0                              # Interactive mode with auto-detection"
    echo "  $0 production                   # Interactive rollback for production"
    echo "  $0 production a1b2c3d           # Rollback production to specific commit"
    echo "  $0 development gigsy-dev-old    # Rollback to backup container"
    echo
    echo "Rollback targets:"
    echo "  - Backup container names (e.g., gigsy-prod-old)"
    echo "  - Image tags (e.g., a1b2c3d, dev, prod)"
    echo "  - Previous commit SHAs"
    echo
    echo "IMPORTANT:"
    echo "  - This script provides emergency rollback capabilities"
    echo "  - Production rollbacks require confirmation"
    echo "  - The target image/container must exist"
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
