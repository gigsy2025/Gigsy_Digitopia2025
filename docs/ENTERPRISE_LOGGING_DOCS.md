# Enterprise Logging System Documentation

## Overview

This document describes the comprehensive enterprise logging system implemented for the Gigsy application. The system follows SOLID principles and provides structured logging, performance monitoring, error handling, and comprehensive observability.

## Architecture

### Core Components

1. **Type Definitions** (`/src/types/logging.ts`)
   - Comprehensive TypeScript interfaces for structured logging
   - Type-safe log levels, categories, and contexts
   - Support for correlation IDs and distributed tracing

2. **Core Logging Service** (`/src/services/observability/logging.ts`)
   - Main `EnterpriseLogger` class implementing `ILogger` interface
   - Singleton pattern with factory functions
   - Integration with Better Stack (Logtail) and Sentry
   - Performance optimized with buffering and sampling

3. **Utility Functions** (`/src/lib/logging/utils.ts`)
   - Helper functions for common logging scenarios
   - Performance tracking utilities
   - Correlation ID management
   - Structured error logging

4. **React Hooks** (`/src/lib/logging/hooks.ts`)
   - Custom hooks for React component logging
   - User interaction tracking
   - Form and navigation logging
   - Component lifecycle monitoring

## Features

### 🏗️ **SOLID Architecture**
- **Single Responsibility**: Each component handles specific logging concerns
- **Open/Closed**: Extensible through configuration and interfaces
- **Liskov Substitution**: Consistent ILogger interface implementation
- **Interface Segregation**: Clean, focused interfaces
- **Dependency Inversion**: Depends on abstractions, not concretions

### 📊 **Structured Logging**
- Comprehensive context with user, business, technical, and correlation data
- Categorized logs (business, technical, security, performance, etc.)
- Error severity classification
- Custom metadata support

### ⚡ **Performance Optimized**
- Async logging with buffering (configurable buffer size)
- Intelligent sampling for production environments
- Non-blocking error handling
- Memory-efficient structured logging

### 🔗 **Distributed Tracing**
- Correlation ID generation and propagation
- Request/response tracking across services
- Integration with Sentry for error correlation
- Cross-component trace linking

### 🛡️ **Error Handling**
- Automatic error classification by severity
- Fallback logging mechanisms
- Structured error context preservation
- Integration with error boundaries

### 📈 **Monitoring Integration**
- Better Stack (Logtail) for centralized logging
- Sentry for error monitoring and alerting
- Performance metrics collection
- Custom dashboard-ready structured data

## Configuration

### Environment Variables

```env
# Better Stack Configuration
BETTER_STACK_SOURCE_TOKEN=your_source_token
BETTER_STACK_INGESTING_HOST=your_ingesting_host
NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=your_public_token
NEXT_PUBLIC_BETTER_STACK_INGESTING_URL=your_ingesting_url

# Logging Configuration
LOG_LEVEL=info                    # debug, info, warn, error, fatal
APP_NAME=gigsy
APP_VERSION=1.0.0

# Sentry Configuration (for error correlation)
SENTRY_AUTH_TOKEN=your_sentry_token
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
```

### Logger Configuration

```typescript
interface LoggerConfig {
  isEnabled: boolean;           // Master switch
  logLevel: LogLevel;          // Minimum log level
  enableConsole: boolean;      // Console output (dev)
  enableRemote: boolean;       // Better Stack integration
  enableSampling: boolean;     // Production sampling
  samplingRate: number;        // Sample rate (0.0-1.0)
  enableBuffering: boolean;    // Batch processing
  bufferSize: number;          // Buffer size (default: 100)
  flushInterval: number;       // Flush interval in ms (default: 5000)
  environment: string;         // Environment identifier
  serviceName: string;         // Service name
  serviceVersion: string;      // Service version
}
```

## Usage Examples

### Basic Logging

```typescript
import { getLogger } from '@/services/observability/logging';

const logger = getLogger();

// Simple logging
await logger.info('User logged in successfully');
await logger.error('Authentication failed', error);

// With context
await logger.info('Payment processed', {
  business: { feature: 'payment', action: 'process', entityId: 'payment_123' },
  user: { id: 'user_456' },
  custom: { amount: 99.99, currency: 'USD' }
});
```

### Specialized Loggers

```typescript
import { BusinessLogger, SecurityLogger, PerformanceLogger } from '@/services/observability/logging';

// Business operations
const businessLogger = BusinessLogger.userAction('purchase', userId);
await businessLogger.info('Purchase completed successfully');

// Security events
const securityLogger = SecurityLogger.authEvent('login', 'success', userId);
await securityLogger.info('User authenticated successfully');

// Performance tracking
const perfLogger = PerformanceLogger.operationTiming('database-query', 150);
await perfLogger.info('Database query completed');
```

### React Component Integration

```typescript
import { useEnterpriseLogger, useUserActionLogger, usePerformanceTracking } from '@/lib/logging/hooks';

function MyComponent() {
  const logger = useEnterpriseLogger();
  const { logAction } = useUserActionLogger('my-feature');
  const { startTracking, finishTracking } = usePerformanceTracking('my-feature', 'operation');

  const handleClick = async () => {
    await logAction('button-click', { buttonId: 'submit' });
    
    startTracking();
    try {
      // Your logic here
      await finishTracking(true);
    } catch (error) {
      await finishTracking(false, error);
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### API Route Logging

```typescript
import { getLogger } from '@/services/observability/logging';
import { logApiRequest, CorrelationUtils } from '@/lib/logging/utils';

export async function GET(request: NextRequest) {
  const correlationId = CorrelationUtils.generate();
  const logger = getLogger({
    correlation: { requestId: correlationId },
    business: { feature: 'api', action: 'health-check' }
  });

  try {
    await logger.info('API request started');
    
    // Your API logic here
    
    await logApiRequest('GET', '/api/health', userId, duration, 200);
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    await logger.error('API request failed', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Performance Tracking

```typescript
import { createPerformanceTracker } from '@/lib/logging/utils';

async function expensiveOperation() {
  const tracker = createPerformanceTracker('business-logic', 'data-processing');
  
  try {
    // Your expensive operation
    const result = await processData();
    
    await tracker.finish(true, undefined, { 
      recordsProcessed: result.count,
      operationType: 'batch-update'
    });
    
    return result;
  } catch (error) {
    await tracker.finish(false, error, { 
      operationType: 'batch-update',
      failureReason: error.message 
    });
    throw error;
  }
}
```

### Batch Operations

```typescript
import { createBatchLogger } from '@/lib/logging/utils';

async function processBatch(items: Item[]) {
  const batchLogger = createBatchLogger('process-items', 'data-processing');
  
  for (const item of items) {
    batchLogger.addItem(item.id);
    
    try {
      await processItem(item);
      batchLogger.markSuccess(item.id);
    } catch (error) {
      batchLogger.markError(item.id, error);
    }
  }
  
  const summary = await batchLogger.finish();
  console.log('Batch processing completed:', summary);
}
```

## Log Categories and Levels

### Categories
- **business**: Business logic events and user actions
- **technical**: System technical events and operations
- **security**: Authentication, authorization, security events
- **performance**: Performance metrics and monitoring
- **user**: User interaction events
- **api**: API request/response events
- **database**: Database operations
- **external**: Third-party service interactions
- **audit**: Compliance and audit events

### Levels
- **debug**: Detailed information for debugging
- **info**: General information about application flow
- **warn**: Warning conditions that might need attention
- **error**: Error conditions that don't stop the application
- **fatal**: Critical errors that might stop the application

## Best Practices

### 🎯 **Logging Strategy**
1. **Log at appropriate levels**: Use debug for development, info for business events, warn for potential issues, error for failures
2. **Include context**: Always provide relevant business and technical context
3. **Use correlation IDs**: Track requests across service boundaries
4. **Avoid sensitive data**: Never log passwords, tokens, or PII
5. **Performance consideration**: Use async logging and sampling in production

### 📝 **Message Guidelines**
1. **Be descriptive**: Use clear, actionable messages
2. **Include relevant data**: Add context that helps debugging
3. **Use consistent format**: Follow established patterns
4. **Avoid noise**: Don't log every trivial operation
5. **Think about alerts**: Consider what logs might trigger alerts

### 🏗️ **Architecture Patterns**
1. **Dependency injection**: Pass loggers to services rather than creating them
2. **Contextual logging**: Use `withContext()` to add relevant context
3. **Error boundaries**: Implement error boundaries with logging
4. **Centralized config**: Use environment-based configuration
5. **Monitoring integration**: Connect logs to dashboards and alerts

## Monitoring and Alerting

### Better Stack Integration
- Real-time log streaming
- Custom dashboards and queries
- Alert configuration based on log patterns
- Performance metrics visualization

### Sentry Integration
- Automatic error capture and grouping
- Performance monitoring
- Release tracking
- User impact analysis

### Custom Metrics
- Log volume and rate monitoring
- Error rate tracking
- Performance trend analysis
- Business KPI correlation

## Production Considerations

### Performance
- **Sampling**: Reduce log volume in production with intelligent sampling
- **Buffering**: Batch logs for efficient network usage
- **Async processing**: Non-blocking log operations
- **Resource monitoring**: Track memory and CPU usage

### Security
- **Data sanitization**: Remove sensitive information automatically
- **Access control**: Secure log storage and access
- **Compliance**: Meet regulatory requirements (GDPR, SOX, etc.)
- **Audit trails**: Maintain immutable audit logs

### Reliability
- **Fallback mechanisms**: Console logging when remote fails
- **Circuit breakers**: Prevent cascading failures
- **Health checks**: Monitor logging system health
- **Disaster recovery**: Log retention and backup strategies

## Troubleshooting

### Common Issues

1. **Logs not appearing in Better Stack**
   - Check environment variables
   - Verify network connectivity
   - Check buffer flush settings

2. **Performance impact**
   - Enable sampling in production
   - Reduce log verbosity
   - Check buffer size configuration

3. **Memory leaks**
   - Monitor buffer size
   - Check flush intervals
   - Verify logger cleanup

4. **TypeScript errors**
   - Check type imports
   - Verify interface implementations
   - Update dependencies

### Debug Mode

```typescript
const logger = createLogger({
  logLevel: 'debug',
  enableConsole: true,
  enableRemote: false,
  enableSampling: false
});
```

## Future Enhancements

- [ ] Distributed tracing with OpenTelemetry
- [ ] Log-based alerting rules
- [ ] Custom log aggregation pipelines
- [ ] Machine learning for anomaly detection
- [ ] Cost optimization for log storage
- [ ] Enhanced security scanning of logs

## Support and Maintenance

For issues and questions:
1. Check this documentation
2. Review the troubleshooting section
3. Check the logs themselves for error messages
4. Create an issue in the project repository

Remember: Logging is a critical infrastructure component. Changes should be thoroughly tested and deployed with careful monitoring.
