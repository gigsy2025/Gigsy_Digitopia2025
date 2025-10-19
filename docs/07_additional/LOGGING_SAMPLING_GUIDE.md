# Logging Sampling Configuration Guide

## Problem Resolved

**Issue**: Development sends 6 logs, but Vercel production only sends 3 logs.

**Root Cause**: The logging system was configured with **10% sampling rate in production** (`samplingRate: 0.1`), meaning only 1 out of every 10 logs was being sent to Better Stack.

## Solution

The logging system now uses **environment variables** to control sampling behavior, giving you full control over log delivery in different environments.

## Environment Variables

### **ENABLE_LOG_SAMPLING**
- **Purpose**: Controls whether log sampling is enabled
- **Values**: 
  - `false` (default) - Disable sampling, send all logs
  - `true` - Enable sampling, use sampling rate
- **Recommended**: 
  - Development: `false`
  - Production: `false` (unless you have high traffic)

### **LOG_SAMPLING_RATE**
- **Purpose**: Controls what percentage of logs to send when sampling is enabled
- **Values**: 
  - `1.0` (default) - Send 100% of logs
  - `0.5` - Send 50% of logs
  - `0.1` - Send 10% of logs
  - `0.01` - Send 1% of logs
- **Recommended**: 
  - Development: `1.0`
  - Production: `1.0` or `0.5` depending on traffic

## Current Configuration

```properties
# In your .env file:
ENABLE_LOG_SAMPLING=false
LOG_SAMPLING_RATE=1.0
```

This ensures **ALL logs are sent** in both development and production.

## Configuration Scenarios

### Scenario 1: Send All Logs (Recommended for most cases)
```properties
ENABLE_LOG_SAMPLING=false
LOG_SAMPLING_RATE=1.0
```

### Scenario 2: High Traffic Production (Reduce costs)
```properties
ENABLE_LOG_SAMPLING=true
LOG_SAMPLING_RATE=0.5  # Send 50% of logs
```

### Scenario 3: Very High Traffic Production (Minimal logs)
```properties
ENABLE_LOG_SAMPLING=true
LOG_SAMPLING_RATE=0.1  # Send 10% of logs
```

## Vercel Configuration

For production deployment on Vercel, add these environment variables in your Vercel dashboard:

1. Go to **Project Settings** → **Environment Variables**
2. Add:
   ```
   ENABLE_LOG_SAMPLING = false
   LOG_SAMPLING_RATE = 1.0
   ```

Or use the automation script:
```powershell
# Windows PowerShell
.\scripts\setup-vercel-env.ps1
```

```bash
# macOS/Linux
./scripts/setup-vercel-env.sh
```

## Testing

1. **Development**: All logs should appear in console and Better Stack
2. **Production**: Check Better Stack dashboard for all expected logs
3. **Verification**: Compare log count between environments

## Monitoring

Use the environment debug output to verify configuration:
```
🔍 Environment Variables Debug Report
  ✅ [SERVER] ENABLE_LOG_SAMPLING: false...
  ✅ [SERVER] LOG_SAMPLING_RATE: 1.0...
```

## Best Practices

1. **Start with no sampling** (`ENABLE_LOG_SAMPLING=false`) until you understand your log volume
2. **Monitor Better Stack usage** and costs before enabling sampling
3. **Use different sampling rates** for different environments
4. **Keep critical logs** (errors, security events) at 100% sampling
5. **Test thoroughly** after changing sampling configuration

## Troubleshooting

### Problem: Still seeing fewer logs in production
1. Check Vercel environment variables are properly set
2. Verify deployment includes the new configuration
3. Check Better Stack dashboard for delivery errors
4. Use the environment checker: The debug output shows current sampling settings

### Problem: Too many logs in Better Stack
1. Enable sampling: `ENABLE_LOG_SAMPLING=true`
2. Reduce sampling rate: `LOG_SAMPLING_RATE=0.5`
3. Optimize log volume at the source level

## Support

If you need to revert to the old behavior temporarily, you can modify the `createConfig` method in `/src/services/observability/logging.ts` to use hardcoded values instead of environment variables.
