#!/bin/bash

# 🔍 Gigsy Health Check Script
# This script performs comprehensive health checks on Gigsy deployments

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly DEFAULT_BASE_URL="http://localhost:3000"
readonly HEALTH_ENDPOINT="/api/health"

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

# Check if required tools are available
check_prerequisites() {
    local tools=("curl" "docker" "jq")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install missing tools and try again"
        return 1
    fi
    
    return 0
}

# Test basic connectivity
test_connectivity() {
    local base_url="$1"
    local timeout="${2:-5}"
    
    log_info "Testing connectivity to: $base_url"
    
    if curl -s --connect-timeout "$timeout" --max-time "$timeout" "$base_url" > /dev/null; then
        log_success "✓ Connectivity test passed"
        return 0
    else
        log_error "✗ Connectivity test failed"
        return 1
    fi
}

# Test health endpoint
test_health_endpoint() {
    local base_url="$1"
    local health_url="${base_url}${HEALTH_ENDPOINT}"
    local timeout="${2:-10}"
    
    log_info "Testing health endpoint: $health_url"
    
    local response
    local http_code
    
    # Get response and HTTP status code
    response=$(curl -s --connect-timeout "$timeout" --max-time "$timeout" -w "HTTPSTATUS:%{http_code}" "$health_url" 2>/dev/null) || {
        log_error "✗ Health endpoint request failed"
        return 1
    }
    
    # Extract HTTP status code
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    response=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    # Check HTTP status
    if [[ "$http_code" != "200" ]]; then
        log_error "✗ Health endpoint returned HTTP $http_code"
        return 1
    fi
    
    log_success "✓ Health endpoint responding (HTTP $http_code)"
    
    # Parse JSON response if available
    if echo "$response" | jq . > /dev/null 2>&1; then
        local status=$(echo "$response" | jq -r '.status // "unknown"')
        local uptime=$(echo "$response" | jq -r '.uptime // "unknown"')
        local version=$(echo "$response" | jq -r '.version // "unknown"')
        local environment=$(echo "$response" | jq -r '.environment // "unknown"')
        
        echo "    Status: $status"
        echo "    Uptime: ${uptime}s"
        echo "    Version: $version"
        echo "    Environment: $environment"
        
        if [[ "$status" == "healthy" ]]; then
            log_success "✓ Application reports healthy status"
            return 0
        else
            log_warning "⚠ Application reports status: $status"
            return 1
        fi
    else
        log_warning "⚠ Health endpoint response is not valid JSON"
        echo "    Response: $response"
        return 1
    fi
}

# Test response time
test_response_time() {
    local base_url="$1"
    local health_url="${base_url}${HEALTH_ENDPOINT}"
    local max_response_time="${2:-2.0}"
    
    log_info "Testing response time (max: ${max_response_time}s)"
    
    local response_time
    response_time=$(curl -o /dev/null -s -w '%{time_total}' "$health_url" 2>/dev/null) || {
        log_error "✗ Response time test failed"
        return 1
    }
    
    echo "    Response time: ${response_time}s"
    
    # Compare response time (using bc for floating point comparison)
    if command -v bc &> /dev/null; then
        if (( $(echo "$response_time <= $max_response_time" | bc -l) )); then
            log_success "✓ Response time acceptable"
            return 0
        else
            log_warning "⚠ Response time exceeds threshold"
            return 1
        fi
    else
        # Fallback for systems without bc
        if (( $(echo "$response_time < $max_response_time" | awk '{print ($1 < $2)}') )); then
            log_success "✓ Response time acceptable"
            return 0
        else
            log_warning "⚠ Response time exceeds threshold"
            return 1
        fi
    fi
}

# Check Docker container health
check_docker_health() {
    local container_pattern="${1:-gigsy}"
    
    log_info "Checking Docker container health for pattern: $container_pattern"
    
    local containers
    containers=$(docker ps --filter "name=$container_pattern" --format "{{.Names}}\t{{.Status}}\t{{.Image}}" 2>/dev/null)
    
    if [[ -z "$containers" ]]; then
        log_error "✗ No running containers found matching: $container_pattern"
        return 1
    fi
    
    log_success "✓ Found running containers:"
    echo "$containers" | while IFS=$'\t' read -r name status image; do
        echo "    $name: $status (image: $image)"
        
        # Check container health status if available
        local health_status
        health_status=$(docker inspect "$name" --format '{{.State.Health.Status}}' 2>/dev/null || echo "no-healthcheck")
        
        if [[ "$health_status" != "no-healthcheck" ]]; then
            if [[ "$health_status" == "healthy" ]]; then
                echo "      Health: $health_status ✓"
            else
                echo "      Health: $health_status ✗"
            fi
        fi
    done
    
    return 0
}

# Check system resources
check_system_resources() {
    log_info "Checking system resources"
    
    # Check Docker stats for Gigsy containers
    local gigsy_containers
    gigsy_containers=$(docker ps --filter "name=gigsy" --format "{{.Names}}" 2>/dev/null)
    
    if [[ -n "$gigsy_containers" ]]; then
        echo "Docker container resources:"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $gigsy_containers 2>/dev/null || {
            log_warning "Unable to get Docker stats"
        }
    fi
    
    # Check disk space
    local disk_usage
    disk_usage=$(df -h / 2>/dev/null | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ -n "$disk_usage" ]] && [[ "$disk_usage" -gt 80 ]]; then
        log_warning "⚠ Disk usage is high: ${disk_usage}%"
    else
        log_success "✓ Disk usage acceptable: ${disk_usage}%"
    fi
}

# Run load test
run_load_test() {
    local base_url="$1"
    local health_url="${base_url}${HEALTH_ENDPOINT}"
    local concurrent_requests="${2:-5}"
    local total_requests="${3:-50}"
    
    log_info "Running load test: $total_requests requests with $concurrent_requests concurrent"
    
    if ! command -v ab &> /dev/null; then
        log_warning "Apache Bench (ab) not available, skipping load test"
        return 0
    fi
    
    local ab_output
    ab_output=$(ab -n "$total_requests" -c "$concurrent_requests" "$health_url" 2>/dev/null) || {
        log_error "✗ Load test failed"
        return 1
    }
    
    # Extract key metrics
    local requests_per_second
    local mean_response_time
    local failed_requests
    
    requests_per_second=$(echo "$ab_output" | grep "Requests per second" | awk '{print $4}')
    mean_response_time=$(echo "$ab_output" | grep "Time per request" | head -1 | awk '{print $4}')
    failed_requests=$(echo "$ab_output" | grep "Failed requests" | awk '{print $3}')
    
    echo "    Requests per second: $requests_per_second"
    echo "    Mean response time: ${mean_response_time}ms"
    echo "    Failed requests: $failed_requests"
    
    if [[ "$failed_requests" == "0" ]]; then
        log_success "✓ Load test passed (no failed requests)"
        return 0
    else
        log_warning "⚠ Load test had $failed_requests failed requests"
        return 1
    fi
}

# Generate health report
generate_report() {
    local base_url="$1"
    local report_file="${2:-health-report-$(date +%Y%m%d-%H%M%S).txt}"
    
    log_info "Generating health report: $report_file"
    
    {
        echo "=== Gigsy Health Check Report ==="
        echo "Generated: $(date)"
        echo "Base URL: $base_url"
        echo
        
        echo "=== Environment Info ==="
        echo "Script: $0"
        echo "Working Directory: $(pwd)"
        echo "User: $(whoami)"
        echo
        
        echo "=== Docker Containers ==="
        docker ps --filter "name=gigsy" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}" 2>/dev/null || echo "No containers found"
        echo
        
        echo "=== Health Check Results ==="
        # This would contain the results from previous checks
        echo "See console output for detailed results"
        echo
        
        echo "=== System Resources ==="
        echo "Disk Usage:"
        df -h / 2>/dev/null || echo "Unable to get disk usage"
        echo
        echo "Memory Usage:"
        free -h 2>/dev/null || echo "Unable to get memory usage"
        echo
        
    } > "$report_file"
    
    log_success "Report saved to: $report_file"
}

# Main health check function
main() {
    local base_url="${1:-$DEFAULT_BASE_URL}"
    local environment="${2:-auto}"
    local mode="${3:-standard}"
    
    log_info "🔍 Starting Gigsy health check"
    log_info "Base URL: $base_url"
    log_info "Mode: $mode"
    echo
    
    local exit_code=0
    
    # Check prerequisites
    if ! check_prerequisites; then
        exit 1
    fi
    
    echo "=== 🔧 Basic Connectivity ==="
    test_connectivity "$base_url" || exit_code=1
    echo
    
    echo "=== 🏥 Health Endpoint ==="
    test_health_endpoint "$base_url" || exit_code=1
    echo
    
    echo "=== ⚡ Response Time ==="
    test_response_time "$base_url" 2.0 || exit_code=1
    echo
    
    echo "=== 🐳 Docker Health ==="
    check_docker_health "gigsy" || exit_code=1
    echo
    
    echo "=== 📊 System Resources ==="
    check_system_resources
    echo
    
    if [[ "$mode" == "comprehensive" ]]; then
        echo "=== 🚀 Load Test ==="
        run_load_test "$base_url" 5 50 || exit_code=1
        echo
    fi
    
    # Generate report if requested
    if [[ "$mode" == "report" ]] || [[ "$mode" == "comprehensive" ]]; then
        generate_report "$base_url"
        echo
    fi
    
    # Summary
    if [[ $exit_code -eq 0 ]]; then
        log_success "🎉 All health checks passed!"
    else
        log_warning "⚠ Some health checks failed or had warnings"
    fi
    
    return $exit_code
}

# Script usage information
usage() {
    echo "Usage: $0 [BASE_URL] [ENVIRONMENT] [MODE]"
    echo
    echo "Perform health checks on Gigsy deployment"
    echo
    echo "Arguments:"
    echo "  BASE_URL      Application base URL (default: $DEFAULT_BASE_URL)"
    echo "  ENVIRONMENT   Target environment (auto|development|production, default: auto)"
    echo "  MODE          Check mode (standard|comprehensive|report, default: standard)"
    echo
    echo "Modes:"
    echo "  standard      Basic health checks (connectivity, health endpoint, response time)"
    echo "  comprehensive Include load testing and detailed analysis"
    echo "  report        Generate a health report file"
    echo
    echo "Examples:"
    echo "  $0                                           # Standard checks on localhost"
    echo "  $0 https://gigsy.com                         # Check production deployment"
    echo "  $0 http://localhost:3000 development         # Check dev environment"
    echo "  $0 http://localhost:3000 auto comprehensive  # Comprehensive checks"
    echo
    echo "Environment variables:"
    echo "  HEALTH_CHECK_TIMEOUT    Timeout for health checks (default: 10s)"
    echo "  MAX_RESPONSE_TIME       Maximum acceptable response time (default: 2.0s)"
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
