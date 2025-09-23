# Finance System Operations Guide

## Overview

This document provides operational procedures for the Gigsy production-grade balance system. The system implements a ledger-first architecture with materialized projections for optimal performance and data integrity.

## Architecture Summary

- **Source of Truth**: `transactions` table (append-only ledger)
- **Read Optimization**: `walletBalances` table (materialized projection)
- **Cache Layer**: `users.balances` array (read-only UI cache)
- **Concurrency**: All money transitions in single Convex mutation (atomic)
- **Integrity**: Scheduled reconciliation jobs ensure consistency

## Core Components

### 1. Database Tables

```typescript
// Source of truth - immutable transaction ledger
transactions: {
  walletId: Id<"wallets">,
  amount: number, // integer smallest unit
  currency: "EGP" | "USD" | "EUR",
  type: TransactionType,
  idempotencyKey?: string,
  createdAt: number,
  createdBy: string
}

// Fast read projections
walletBalances: {
  walletId: Id<"wallets">,
  currency: Currency,
  balance: number, // integer smallest unit
  lastUpdated: number
}

// Wallet metadata
wallets: {
  userId: Id<"users">,
  currency: Currency,
  createdAt: number
}
```

### 2. Key Functions

- `createTransaction`: Atomic transaction creation with balance update
- `transferBetweenWallets`: Atomic inter-wallet transfers
- `getBalancesForUser`: Fast balance queries via projections
- `reconcileWalletBalances`: Scheduled integrity verification

## Operational Procedures

### Daily Operations

#### 1. Morning Health Check

```bash
# Check system health
curl -X POST /api/reconcile/health-check

# Expected response:
{
  "healthy": true,
  "checks": {
    "databaseConnectivity": true,
    "walletCount": 1234,
    "transactionCount": 56789,
    "balanceProjectionCount": 1234
  }
}
```

#### 2. Balance Reconciliation

**Automated (Recommended)**
- Scheduled hourly via Convex scheduler
- Monitors drift and alerts on discrepancies
- Automatically fixes minor inconsistencies

**Manual Trigger**
```bash
# Run full reconciliation
curl -X POST /api/reconcile/run \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"dryRun": false}'

# Run dry-run to check for issues
curl -X POST /api/reconcile/run \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"dryRun": true}'
```

#### 3. Transaction Monitoring

```bash
# Check recent transaction volume
curl -X GET "/api/finance/stats?period=24h"

# Monitor error rates
curl -X GET "/api/finance/errors?period=1h"
```

### Weekly Operations

#### 1. Comprehensive Reconciliation

```bash
# Full system reconciliation (run during low-traffic hours)
curl -X POST /api/reconcile/full \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "batchSize": 50,
    "includeHistoricalCheck": true
  }'
```

#### 2. Performance Review

- Review transaction processing times
- Check balance query performance
- Analyze reconciliation drift patterns
- Review error logs and failed transactions

#### 3. Backup Verification

```bash
# Verify transaction ledger backup integrity
curl -X POST /api/admin/verify-backup \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Monthly Operations

#### 1. Data Retention

```bash
# Archive old transaction data (keep 7+ years for compliance)
curl -X POST /api/admin/archive-transactions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "olderThan": "2022-01-01",
    "dryRun": true
  }'
```

#### 2. Audit Report Generation

```bash
# Generate monthly financial audit report
curl -X POST /api/admin/generate-audit-report \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "month": "2025-01",
    "includeReconciliationHistory": true
  }'
```

## Emergency Procedures

### 1. Balance Discrepancy Alert

**Symptoms**: Reconciliation alerts showing significant drift

**Immediate Actions**:
1. Stop all non-essential financial operations
2. Run emergency reconciliation on affected wallets
3. Investigate root cause

```bash
# Emergency wallet reconciliation
curl -X POST /api/reconcile/emergency \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "walletId": "wallet_123",
    "reason": "Balance discrepancy alert - Ticket #456"
  }'
```

### 2. Transaction Processing Failure

**Symptoms**: High error rates in transaction creation

**Immediate Actions**:
1. Check database connectivity
2. Verify Convex service status
3. Review recent deployments
4. Check for deadlocks or performance issues

```bash
# Check system status
curl -X GET /api/health/detailed

# Review recent failed transactions
curl -X GET "/api/finance/failed-transactions?limit=50"
```

### 3. Reconciliation System Failure

**Symptoms**: Reconciliation jobs failing consistently

**Immediate Actions**:
1. Check reconciliation service logs
2. Verify database permissions
3. Test reconciliation on single wallet
4. Escalate to engineering team

```bash
# Test single wallet reconciliation
curl -X POST /api/reconcile/test-single \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "walletId": "wallet_test_123"
  }'
```

## Manual Balance Adjustments

### When to Use
- Correcting system errors
- Processing refunds
- Handling disputed transactions
- Compliance adjustments

### Procedure

```bash
# Manual balance adjustment (requires admin role + audit reason)
curl -X POST /api/finance/admin-adjust \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "userId": "user_123",
    "currency": "EGP",
    "amount": 5000,
    "auditReason": "Refund for cancelled gig #456 - Support ticket #789",
    "relatedEntityType": "gig",
    "relatedEntityId": "gig_456"
  }'
```

**Important**: All manual adjustments:
- Create transaction records for audit trail
- Require detailed audit reasons
- Are logged with admin user ID
- Must be documented in operations log

## Monitoring and Alerting

### Critical Alerts

1. **Balance Drift > Threshold**
   - Trigger: Reconciliation finds drift > 1 cent/piastre
   - Action: Immediate investigation required
   - Escalation: 15 minutes

2. **Reconciliation Failure**
   - Trigger: Reconciliation job fails 3 consecutive times
   - Action: Emergency response
   - Escalation: Immediate

3. **Negative Balance**
   - Trigger: Any wallet balance goes negative (if not allowed)
   - Action: Immediate freeze and investigation
   - Escalation: Immediate

4. **High Transaction Error Rate**
   - Trigger: >5% transaction failure rate over 5 minutes
   - Action: System health check
   - Escalation: 10 minutes

### Warning Alerts

1. **Reconciliation Drift Trend**
   - Trigger: Increasing drift over time
   - Action: Schedule maintenance review

2. **Performance Degradation**
   - Trigger: Transaction processing time > 2x baseline
   - Action: Performance investigation

3. **Unusual Transaction Patterns**
   - Trigger: Transaction volume > 3x normal
   - Action: Fraud investigation

## Security Considerations

### Access Control
- All financial mutations require authentication
- Admin functions require `admin` role
- Manual adjustments require audit reasons
- All operations logged with user context

### Data Protection
- All amounts stored as integers (smallest unit)
- No floating-point arithmetic
- Immutable transaction ledger
- Encrypted sensitive data at rest

### Compliance
- Transaction history retained per legal requirements
- Audit trails for all balance changes
- Regular compliance reports
- KYC integration for withdrawals

## Performance Optimization

### Query Optimization
- Use `walletBalances` for real-time balance queries
- Batch reconciliation operations
- Index optimization for common queries
- Connection pooling for high throughput

### Scaling Considerations
- Horizontal scaling via Convex
- Read replicas for balance queries
- Async processing for non-critical operations
- Caching for frequently accessed data

## Troubleshooting Guide

### Common Issues

#### 1. "Insufficient Balance" Errors
**Cause**: User attempting transaction exceeding available balance
**Solution**: Verify balance calculation, check for pending transactions

#### 2. "Idempotency Key Already Used"
**Cause**: Duplicate transaction attempt
**Solution**: Return existing transaction result, verify client retry logic

#### 3. "Wallet Not Found"
**Cause**: Invalid wallet reference or deleted wallet
**Solution**: Verify wallet exists, check user permissions

#### 4. "Currency Mismatch"
**Cause**: Transaction currency doesn't match wallet currency
**Solution**: Verify currency parameters, check wallet configuration

### Diagnostic Commands

```bash
# Check wallet status
curl -X GET "/api/finance/wallet/$WALLET_ID/status"

# Verify transaction history
curl -X GET "/api/finance/user/$USER_ID/transactions?limit=10"

# Check balance calculation
curl -X GET "/api/finance/wallet/$WALLET_ID/balance-check"

# Review reconciliation history
curl -X GET "/api/reconcile/history?walletId=$WALLET_ID"
```

## Contact Information

### Escalation Contacts
- **Level 1**: Operations Team (operations@gigsy.com)
- **Level 2**: Engineering Team (engineering@gigsy.com)
- **Level 3**: Principal Engineer (principal@gigsy.com)

### Emergency Contacts
- **24/7 On-call**: +1-XXX-XXX-XXXX
- **Slack**: #finance-alerts
- **PagerDuty**: Finance System Service

## Change Management

### Deployment Procedures
1. All financial system changes require peer review
2. Staging environment testing mandatory
3. Gradual rollout with monitoring
4. Rollback plan documented
5. Post-deployment verification

### Maintenance Windows
- **Scheduled**: Sundays 2-4 AM UTC
- **Emergency**: As needed with stakeholder notification
- **Reconciliation**: Can run during business hours (non-disruptive)

## Appendix

### A. Currency Configuration

```typescript
const CURRENCY_CONFIGS = {
  EGP: { symbol: "£", decimals: 2, smallestUnit: "piastres" },
  USD: { symbol: "$", decimals: 2, smallestUnit: "cents" },
  EUR: { symbol: "€", decimals: 2, smallestUnit: "cents" }
};
```

### B. Transaction Types

- `DEPOSIT`: Money added to wallet
- `WITHDRAWAL`: Money removed from wallet
- `ESCROW_HOLD`: Funds held in escrow
- `ESCROW_RELEASE`: Escrow funds released
- `PAYOUT`: Payment to user
- `FEE`: Platform fee deduction
- `REFUND`: Money returned to user
- `TRANSFER`: Internal wallet-to-wallet transfer
- `ADJUSTMENT`: Manual admin adjustment

### C. Error Codes

- `INSUFFICIENT_BALANCE`: Not enough funds
- `WALLET_NOT_FOUND`: Invalid wallet reference
- `CURRENCY_MISMATCH`: Wrong currency for wallet
- `INVALID_AMOUNT`: Amount validation failed
- `DUPLICATE_TRANSACTION`: Idempotency key reused
- `AUTHENTICATION_REQUIRED`: Missing or invalid auth
- `AUTHORIZATION_FAILED`: Insufficient permissions

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-22  
**Next Review**: 2025-04-22
