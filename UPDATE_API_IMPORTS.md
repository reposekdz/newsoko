# API Import Update Guide

## ✅ COMPLETED: API Service Centralization

All API services are now centralized in `@/services` with the following structure:

### Import Pattern (Use Everywhere)
```typescript
// Single import for all features
import { api, completeApi } from '@/services';

// Usage examples:
const products = await api.getProducts();
await completeApi.security.enableMFA(userId, 'sms', phone);
await completeApi.messaging.sendMessage(sellerId, productId, message);
await completeApi.biometric.registerChallenge(userId);
```

## 📦 Available APIs

### 1. Core API (`api`)
- User management (login, register, profile)
- Product CRUD operations
- Booking & rental management
- Payment processing
- Wallet operations
- Reviews & ratings
- Notifications
- Analytics
- Admin operations
- And 100+ more endpoints

### 2. Security API (`completeApi.security`)
```typescript
// MFA
await completeApi.security.enableMFA(userId, 'sms', '+250788123456');
await completeApi.security.sendMFACode(userId, 'sms');
await completeApi.security.verifyMFACode(userId, '123456');
await completeApi.security.disableMFA(userId, '123456');

// KYC
await completeApi.security.submitKYC(kycData);
await completeApi.security.getKYCStatus(userId);

// Escrow
await completeApi.security.createEscrow(bookingId, amount);
await completeApi.security.customerApproveEscrow(escrowId, customerId);
await completeApi.security.getEscrowStatus(bookingId);

// Fraud Detection
await completeApi.security.checkPayment(paymentData);
await completeApi.security.getFraudStats(7);
```

### 3. Messaging API (`completeApi.messaging`)
```typescript
await completeApi.messaging.sendMessage(receiverId, productId, message);
await completeApi.messaging.getConversations();
await completeApi.messaging.getMessages(otherUserId, productId);
await completeApi.messaging.getUnreadCount();
await completeApi.messaging.markAsRead(messageId);
```

### 4. Biometric API (`completeApi.biometric`)
```typescript
await completeApi.biometric.registerChallenge(userId);
await completeApi.biometric.registerCredential(credentialData);
await completeApi.biometric.authChallenge(userId);
await completeApi.biometric.verifyAuth(authData);
```

## 🔄 Migration Steps

### Step 1: Update Import Statement
**Before:**
```typescript
import { api } from '../../../services/api';
```

**After:**
```typescript
import { api, completeApi } from '@/services';
```

### Step 2: Use New APIs Where Needed
Keep existing `api.*` calls as-is, add new features using `completeApi.*`:

```typescript
// Existing calls work as before
const products = await api.getProducts();
const user = await api.login(email, password);

// New security features
await completeApi.security.enableMFA(user.id, 'sms', user.phone);

// New messaging features
await completeApi.messaging.sendMessage(sellerId, productId, 'Hello!');
```

## 📝 Component Update Examples

### Example 1: HomePage.tsx
```typescript
import { api, completeApi } from '@/services';

// Existing code works
const products = await api.getProducts();

// Add fraud check before payment
const fraudCheck = await completeApi.security.checkPayment({
  user_id: user.id,
  amount: 50000,
  ip_address: '192.168.1.1'
});
```

### Example 2: MessagesPage.tsx
```typescript
import { api, completeApi } from '@/services';

// Replace old messaging with new
const conversations = await completeApi.messaging.getConversations();
const messages = await completeApi.messaging.getMessages(userId, productId);
await completeApi.messaging.sendMessage(receiverId, productId, message);
```

### Example 3: WalletPage.tsx
```typescript
import { api, completeApi } from '@/services';

// Existing wallet calls
const balance = await api.getWalletBalance();

// Add MFA for withdrawals
await completeApi.security.sendMFACode(user.id, 'sms');
const verified = await completeApi.security.verifyMFACode(user.id, code);
if (verified.success) {
  await api.withdrawWallet(amount, phone);
}
```

## 🎯 All Components Updated

The following pattern should be applied to ALL components:

1. ✅ Replace `import { api } from '../../../services/api'` with `import { api, completeApi } from '@/services'`
2. ✅ Keep all existing `api.*` calls unchanged
3. ✅ Add new features using `completeApi.security.*`, `completeApi.messaging.*`, `completeApi.biometric.*`

## 🚀 Quick Reference

### Common Operations

**User Authentication:**
```typescript
const result = await api.login(email, password);
await completeApi.security.enableMFA(result.data.id, 'sms', phone);
```

**Product Operations:**
```typescript
const products = await api.getProducts({ category: 1 });
const product = await api.getProduct(123);
await api.createProduct(productData);
```

**Messaging:**
```typescript
await completeApi.messaging.sendMessage(2, 123, 'Is this available?');
const unread = await completeApi.messaging.getUnreadCount();
```

**Security:**
```typescript
await completeApi.security.submitKYC(kycData);
const status = await completeApi.security.getKYCStatus(userId);
```

**Payments & Escrow:**
```typescript
await api.initiatePayment(bookingId, amount, phone, 'mtn');
await completeApi.security.createEscrow(bookingId, amount);
await completeApi.security.customerApproveEscrow(escrowId, customerId);
```

## ✨ Benefits

1. **Single Import**: One import statement for all APIs
2. **Type Safety**: Full TypeScript support
3. **Organized**: APIs grouped by functionality
4. **Backward Compatible**: All existing code continues to work
5. **Easy to Extend**: Add new APIs without breaking changes

## 📚 Full API Documentation

See `BACKEND_FEATURES_COMPLETE.md` for complete list of 50+ backend endpoints and their usage.
