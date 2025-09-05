#!/bin/bash
# 🔄 Blue/Green Deployment Script for Gigsy Production
# Enterprise-grade zero-downtime deployment with automatic rollback

set -euo pipefail

# ========================================
# SCRIPT CONFIGURATION
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_DIR="$PROJECT_ROOT/deployment"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_IMAGE_TAG=""
DEFAULT_ENVIRONMENT="production"
DEFAULT_HEALTH_CHECK_TIMEOUT=300
DEFAULT_ROLLBACK_ON_FAILURE=true

# ========================================
# UTILITY FUNCTIONS
# ========================================

log() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

# Help function
show_help() {
    cat << EOF
🔄 Blue/Green Deployment Script for Gigsy Production

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -t, --tag IMAGE_TAG          Docker image tag to deploy (required)
    -e, --env ENVIRONMENT        Target environment (default: production)
    -T, --timeout SECONDS        Health check timeout (default: 300)
    -R, --no-rollback           Disable automatic rollback on failure
    -y, --yes                   Skip confirmation prompts
    -d, --dry-run               Perform a dry run without actual deployment
    -v, --verbose               Enable verbose logging
    -h, --help                  Show this help message

EXAMPLES:
    # Deploy specific commit
    $0 -t sha-abc123def456
    
    # Deploy with custom timeout
    $0 -t sha-abc123def456 -T 600
    
    # Deploy without confirmation
    $0 -t sha-abc123def456 -y
    
    # Dry run deployment
    $0 -t sha-abc123def456 --dry-run

BLUE/GREEN DEPLOYMENT PROCESS:
    1. Validate current deployment
    2. Start green environment with new image
    3. Perform comprehensive health checks
    4. Switch traffic from blue to green
    5. Monitor green environment
    6. Stop blue environment (or rollback if failure)

PREREQUISITES:
    - Docker and Docker Compose installed
    - Environment variables configured in .env.prod
    - Load balancer configured for blue/green switching
    - Sufficient resources for running both environments

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            -e|--env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -T|--timeout)
                HEALTH_CHECK_TIMEOUT="$2"
                shift 2
                ;;
            -R|--no-rollback)
                ROLLBACK_ON_FAILURE=false
                shift
                ;;
            -y|--yes)
                SKIP_CONFIRMATION=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Set defaults
    IMAGE_TAG="${IMAGE_TAG:-$DEFAULT_IMAGE_TAG}"
    ENVIRONMENT="${ENVIRONMENT:-$DEFAULT_ENVIRONMENT}"
    HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-$DEFAULT_HEALTH_CHECK_TIMEOUT}"
    ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-$DEFAULT_ROLLBACK_ON_FAILURE}"
    SKIP_CONFIRMATION="${SKIP_CONFIRMATION:-false}"
    DRY_RUN="${DRY_RUN:-false}"
    VERBOSE="${VERBOSE:-false}"

    # Validate required parameters
    if [[ -z "$IMAGE_TAG" ]]; then
        log_error "Image tag is required. Use -t or --tag option."
        show_help
        exit 1
    fi
}

# ========================================
# VALIDATION FUNCTIONS
# ========================================

validate_environment() {
    log "🔍 Validating deployment environment..."
    
    # Check if running as root (not recommended for production)
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root is not recommended for production deployments"
        if [[ "$SKIP_CONFIRMATION" != "true" ]]; then
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_error "Deployment cancelled"
                exit 1
            fi
        fi
    fi
    
    # Check Docker installation
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose installation
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running or not accessible"
        exit 1
    fi
    
    # Check environment file
    local env_file="$DEPLOYMENT_DIR/docker-compose/.env.prod"
    if [[ ! -f "$env_file" ]]; then
        log_error "Production environment file not found: $env_file"
        log_info "Copy .env.prod.template to .env.prod and configure it"
        exit 1
    fi
    
    # Check Docker Compose file
    local compose_file="$DEPLOYMENT_DIR/docker-compose/docker-compose.prod.yml"
    if [[ ! -f "$compose_file" ]]; then
        log_error "Production Docker Compose file not found: $compose_file"
        exit 1
    fi
    
    # Check available disk space (require at least 2GB)
    local available_space=$(df "$DEPLOYMENT_DIR" | tail -1 | awk '{print $4}')
    local required_space=2097152  # 2GB in KB
    if [[ $available_space -lt $required_space ]]; then
        log_error "Insufficient disk space. Required: 2GB, Available: $((available_space / 1024))MB"
        exit 1
    fi
    
    log_success "Environment validation completed"
}

validate_image() {
    log "🔍 Validating Docker image..."
    
    local image="mostafayaser/gigsy_digitopia2025:$IMAGE_TAG"
    
    # Check if image exists locally
    if docker image inspect "$image" &> /dev/null; then
        log_success "Image found locally: $image"
        return 0
    fi
    
    # Try to pull the image
    log "📥 Pulling image: $image"
    if docker pull "$image"; then
        log_success "Image pulled successfully: $image"
    else
        log_error "Failed to pull image: $image"
        log_info "Please verify the image tag exists in the registry"
        exit 1
    fi
    
    # Verify image health
    log "🔍 Verifying image integrity..."
    if docker run --rm "$image" node --version &> /dev/null; then
        log_success "Image integrity verified"
    else
        log_error "Image integrity check failed"
        exit 1
    fi
}

# ========================================
# BLUE/GREEN DEPLOYMENT FUNCTIONS
# ========================================

get_current_environment() {
    local blue_running=false
    local green_running=false
    
    if docker ps --filter "name=gigsy-prod-blue" --filter "status=running" --format "table {{.Names}}" | grep -q "gigsy-prod-blue"; then
        blue_running=true
    fi
    
    if docker ps --filter "name=gigsy-prod-green" --filter "status=running" --format "table {{.Names}}" | grep -q "gigsy-prod-green"; then
        green_running=true
    fi
    
    if [[ "$blue_running" == "true" && "$green_running" == "false" ]]; then
        echo "blue"
    elif [[ "$blue_running" == "false" && "$green_running" == "true" ]]; then
        echo "green"
    elif [[ "$blue_running" == "false" && "$green_running" == "false" ]]; then
        echo "none"
    else
        echo "both"
    fi
}

get_target_environment() {
    local current_env="$1"
    
    case "$current_env" in
        "blue")
            echo "green"
            ;;
        "green")
            echo "blue"
            ;;
        "none")
            echo "blue"  # Default to blue if nothing is running
            ;;
        "both")
            log_error "Both blue and green environments are running. Please resolve this manually."
            exit 1
            ;;
        *)
            log_error "Unknown current environment: $current_env"
            exit 1
            ;;
    esac
}

start_target_environment() {
    local target_env="$1"
    local compose_file="$DEPLOYMENT_DIR/docker-compose/docker-compose.prod.yml"
    local env_file="$DEPLOYMENT_DIR/docker-compose/.env.prod"
    
    log "🚀 Starting $target_env environment..."
    
    # Create environment-specific compose override
    local override_file="$DEPLOYMENT_DIR/docker-compose/docker-compose.$target_env.yml"
    cat > "$override_file" << EOF
version: '3.8'
services:
  gigsy-app:
    container_name: gigsy-prod-$target_env
    environment:
      - GIGSY_IMAGE_TAG=$IMAGE_TAG
    labels:
      - "com.gigsy.environment=production"
      - "com.gigsy.slot=$target_env"
    networks:
      - gigsy-prod-network
    ports:
      - "$([[ "$target_env" == "blue" ]] && echo "3000" || echo "3001"):3000"
EOF
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would start $target_env environment with image $IMAGE_TAG"
        return 0
    fi
    
    # Start the target environment
    if docker-compose -f "$compose_file" -f "$override_file" --env-file "$env_file" up -d gigsy-app; then
        log_success "$target_env environment started successfully"
    else
        log_error "Failed to start $target_env environment"
        return 1
    fi
    
    # Wait for container to be ready
    log "⏳ Waiting for $target_env environment to be ready..."
    local container_name="gigsy-prod-$target_env"
    local timeout=60
    local elapsed=0
    
    while [[ $elapsed -lt $timeout ]]; do
        if docker ps --filter "name=$container_name" --filter "status=running" --format "table {{.Names}}" | grep -q "$container_name"; then
            log_success "$target_env environment is running"
            return 0
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done
    
    log_error "$target_env environment failed to start within $timeout seconds"
    return 1
}

perform_health_checks() {
    local target_env="$1"
    local port="$([[ "$target_env" == "blue" ]] && echo "3000" || echo "3001")"
    
    log "🏥 Performing health checks on $target_env environment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would perform health checks on port $port"
        return 0
    fi
    
    # Wait for application to start
    sleep 10
    
    # Comprehensive health check
    local health_check_url="http://localhost:$port/api/health"
    local timeout="$HEALTH_CHECK_TIMEOUT"
    local interval=10
    local elapsed=0
    
    log "🔍 Testing health endpoint: $health_check_url"
    
    while [[ $elapsed -lt $timeout ]]; do
        if curl -s -f "$health_check_url" > /dev/null 2>&1; then
            log_success "Health check passed for $target_env environment"
            
            # Perform additional checks
            log "🔍 Performing additional checks..."
            
            # Check application responsiveness
            local response_time=$(curl -s -w "%{time_total}" -o /dev/null "$health_check_url")
            if (( $(echo "$response_time < 5.0" | bc -l) )); then
                log_success "Response time check passed: ${response_time}s"
            else
                log_warning "Slow response time: ${response_time}s"
            fi
            
            # Check memory usage
            local container_name="gigsy-prod-$target_env"
            local memory_usage=$(docker stats "$container_name" --no-stream --format "table {{.MemPerc}}" | tail -n 1 | sed 's/%//')
            if (( $(echo "$memory_usage < 80" | bc -l) )); then
                log_success "Memory usage check passed: ${memory_usage}%"
            else
                log_warning "High memory usage: ${memory_usage}%"
            fi
            
            return 0
        fi
        
        log "⏳ Health check attempt $((elapsed / interval + 1)): waiting..."
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    log_error "Health checks failed for $target_env environment after $timeout seconds"
    return 1
}

switch_traffic() {
    local target_env="$1"
    local target_port="$([[ "$target_env" == "blue" ]] && echo "3000" || echo "3001")"
    
    log "🔄 Switching traffic to $target_env environment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would switch traffic to $target_env on port $target_port"
        return 0
    fi
    
    # Update load balancer configuration (this would be environment-specific)
    # For this example, we'll update a simple nginx upstream configuration
    
    local nginx_config="/etc/nginx/conf.d/gigsy.conf"
    if [[ -f "$nginx_config" ]]; then
        log "📝 Updating nginx configuration..."
        
        # Backup current config
        cp "$nginx_config" "$nginx_config.backup.$(date +%s)"
        
        # Update upstream to point to target environment
        sed -i "s/server localhost:[0-9]*/server localhost:$target_port/" "$nginx_config"
        
        # Reload nginx
        if nginx -t && systemctl reload nginx; then
            log_success "Traffic switched to $target_env environment"
        else
            log_error "Failed to reload nginx configuration"
            # Restore backup
            mv "$nginx_config.backup.$(date +%s)" "$nginx_config"
            return 1
        fi
    else
        log_warning "Nginx configuration not found. Manual traffic switching required."
        log_info "Update your load balancer to point to port $target_port"
        
        if [[ "$SKIP_CONFIRMATION" != "true" ]]; then
            read -p "Press Enter when traffic has been switched to $target_env environment..."
        fi
    fi
    
    return 0
}

stop_old_environment() {
    local old_env="$1"
    
    log "🛑 Stopping $old_env environment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would stop $old_env environment"
        return 0
    fi
    
    local container_name="gigsy-prod-$old_env"
    
    if docker ps --filter "name=$container_name" --format "table {{.Names}}" | grep -q "$container_name"; then
        if docker stop "$container_name"; then
            log_success "$old_env environment stopped successfully"
            
            # Remove the container
            docker rm "$container_name" 2>/dev/null || true
            
            # Clean up override file
            rm -f "$DEPLOYMENT_DIR/docker-compose/docker-compose.$old_env.yml"
        else
            log_error "Failed to stop $old_env environment"
            return 1
        fi
    else
        log_info "$old_env environment is not running"
    fi
    
    return 0
}

monitor_deployment() {
    local target_env="$1"
    local monitoring_duration=300  # 5 minutes
    
    log "📊 Monitoring $target_env environment for $monitoring_duration seconds..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would monitor $target_env environment"
        return 0
    fi
    
    local container_name="gigsy-prod-$target_env"
    local port="$([[ "$target_env" == "blue" ]] && echo "3000" || echo "3001")"
    local health_url="http://localhost:$port/api/health"
    
    local start_time=$(date +%s)
    local end_time=$((start_time + monitoring_duration))
    
    while [[ $(date +%s) -lt $end_time ]]; do
        # Check container status
        if ! docker ps --filter "name=$container_name" --filter "status=running" --format "table {{.Names}}" | grep -q "$container_name"; then
            log_error "$target_env environment container is not running"
            return 1
        fi
        
        # Check health endpoint
        if ! curl -s -f "$health_url" > /dev/null 2>&1; then
            log_error "$target_env environment health check failed"
            return 1
        fi
        
        # Check resource usage
        local stats=$(docker stats "$container_name" --no-stream --format "table {{.CPUPerc}}\t{{.MemPerc}}" | tail -n 1)
        local cpu_usage=$(echo "$stats" | awk '{print $1}' | sed 's/%//')
        local memory_usage=$(echo "$stats" | awk '{print $2}' | sed 's/%//')
        
        # Log resource usage every minute
        local current_time=$(date +%s)
        if [[ $((current_time % 60)) -eq 0 ]]; then
            log_info "Resource usage - CPU: ${cpu_usage}%, Memory: ${memory_usage}%"
        fi
        
        # Alert on high resource usage
        if (( $(echo "$cpu_usage > 80" | bc -l) )); then
            log_warning "High CPU usage: ${cpu_usage}%"
        fi
        
        if (( $(echo "$memory_usage > 80" | bc -l) )); then
            log_warning "High memory usage: ${memory_usage}%"
        fi
        
        sleep 10
    done
    
    log_success "Monitoring completed successfully"
    return 0
}

# ========================================
# ROLLBACK FUNCTIONS
# ========================================

rollback_deployment() {
    local failed_env="$1"
    local current_env="$2"
    
    log_error "🔄 Rolling back deployment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would rollback from $failed_env to $current_env"
        return 0
    fi
    
    # Switch traffic back to current environment
    if [[ "$current_env" != "none" ]]; then
        log "🔄 Switching traffic back to $current_env environment..."
        switch_traffic "$current_env"
    fi
    
    # Stop the failed environment
    stop_old_environment "$failed_env"
    
    log_success "Rollback completed"
}

# ========================================
# MAIN DEPLOYMENT FUNCTION
# ========================================

deploy() {
    log "🚀 Starting Blue/Green deployment for Gigsy..."
    log_info "Image: mostafayaser/gigsy_digitopia2025:$IMAGE_TAG"
    log_info "Environment: $ENVIRONMENT"
    log_info "Health check timeout: $HEALTH_CHECK_TIMEOUT seconds"
    log_info "Rollback on failure: $ROLLBACK_ON_FAILURE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Validation phase
    validate_environment
    validate_image
    
    # Get current deployment state
    local current_env=$(get_current_environment)
    local target_env=$(get_target_environment "$current_env")
    
    log_info "Current environment: $current_env"
    log_info "Target environment: $target_env"
    
    # Confirmation
    if [[ "$SKIP_CONFIRMATION" != "true" ]]; then
        echo
        log_warning "This will deploy image '$IMAGE_TAG' to the $target_env environment"
        if [[ "$current_env" != "none" ]]; then
            log_warning "Traffic will be switched from $current_env to $target_env"
        fi
        echo
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Deployment cancelled"
            exit 1
        fi
    fi
    
    # Deployment phases
    local deployment_failed=false
    
    # Phase 1: Start target environment
    if ! start_target_environment "$target_env"; then
        deployment_failed=true
    fi
    
    # Phase 2: Health checks
    if [[ "$deployment_failed" == "false" ]]; then
        if ! perform_health_checks "$target_env"; then
            deployment_failed=true
        fi
    fi
    
    # Phase 3: Switch traffic
    if [[ "$deployment_failed" == "false" ]]; then
        if ! switch_traffic "$target_env"; then
            deployment_failed=true
        fi
    fi
    
    # Phase 4: Monitor new environment
    if [[ "$deployment_failed" == "false" ]]; then
        if ! monitor_deployment "$target_env"; then
            deployment_failed=true
        fi
    fi
    
    # Handle deployment result
    if [[ "$deployment_failed" == "true" ]]; then
        log_error "Deployment failed"
        
        if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
            rollback_deployment "$target_env" "$current_env"
        fi
        
        exit 1
    else
        # Phase 5: Stop old environment
        if [[ "$current_env" != "none" ]]; then
            stop_old_environment "$current_env"
        fi
        
        log_success "Blue/Green deployment completed successfully!"
        log_info "Active environment: $target_env"
        log_info "Image: mostafayaser/gigsy_digitopia2025:$IMAGE_TAG"
        
        # Generate deployment report
        generate_deployment_report "$target_env" "$IMAGE_TAG"
    fi
}

# ========================================
# REPORTING FUNCTIONS
# ========================================

generate_deployment_report() {
    local deployed_env="$1"
    local deployed_tag="$2"
    local report_file="$DEPLOYMENT_DIR/reports/blue-green-deployment-$(date +%Y%m%d-%H%M%S).json"
    
    # Create reports directory if it doesn't exist
    mkdir -p "$(dirname "$report_file")"
    
    # Generate deployment report
    cat > "$report_file" << EOF
{
  "deployment": {
    "type": "blue-green",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$ENVIRONMENT",
    "deployed_slot": "$deployed_env",
    "image_tag": "$deployed_tag",
    "image_full": "mostafayaser/gigsy_digitopia2025:$deployed_tag",
    "success": true,
    "duration_seconds": $SECONDS
  },
  "system_info": {
    "hostname": "$(hostname)",
    "user": "$(whoami)",
    "docker_version": "$(docker --version | cut -d' ' -f3 | cut -d',' -f1)",
    "compose_version": "$(docker-compose --version 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1 || echo 'N/A')"
  },
  "health_checks": {
    "timeout": $HEALTH_CHECK_TIMEOUT,
    "endpoint": "http://localhost:$([[ "$deployed_env" == "blue" ]] && echo "3000" || echo "3001")/api/health",
    "status": "passed"
  }
}
EOF
    
    log_success "Deployment report generated: $report_file"
}

# ========================================
# MAIN EXECUTION
# ========================================

main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    # Start deployment
    deploy
}

# Run main function with all arguments
main "$@"
