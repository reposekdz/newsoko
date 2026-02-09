# 🚀 API USAGE GUIDE - Use Everywhere

## 📦 Import APIs

```typescript
// Single import for everything
import { api, completeApi } from '@/services';

// Or import specific modules
import { api } from '@/services/api';
import { securityApi, messagingApi, biometricApi } from '@/services/completeApi';
```

---

## 👤 USER MANAGEMENT

```typescript
// Register
const result = await api.register({
  full_name: 'John Doe',
  email: 'john@email.com',
  password: 'password123',
  phone: '+250788123456',
  province_id: 1,
  district_id: 1,
  sector_id: 1
});

// Login
const user = await api.login('john@email.com', 'password123');

// Verify token
const userData = await api.verifyToken();

// Logout
await api.logout();
```

---

## 🛍️ PRODUCTS

```typescript
// Get all products
const products = await api.getProducts({ category: 1, search: 'phone' });

// Get single product (with related products)
const product = await api.getProduct(123);

// Create product
const newProduct = await api.createProduct({
  title: 'iPhone 15',
  description: 'Brand new',
  category_id: 1,
  images: ['url1', 'url2'],
  buy_price: 500000,
  stock_quantity: 5
});

// Update product
await api.updateProduct({
  id: 123,
  title: 'Updated Title',
  stock_quantity: 10
});

// Delete product
await api.deleteProduct(123);

// Add to favorites
await api.addFavorite(123);

// Add to wishlist
await api.addToWishlist(123);

// Compare products
await api.compareProducts([1, 2, 3]);

// Ask question
await api.askProductQuestion(123, 'Is this original?');

// Get reviews
const reviews = await api.getReviews(123);

// Add review
await api.addReview(123, 5, 'Great product!');
```

---

## 📅 BOOKINGS

```typescript
// Create booking
const booking = await api.createBooking({
  product_id: 123,
  start_date: '2025-02-01',
  end_date: '2025-02-05',
  total_price: 50000
});

// Get booking details
const details = await api.getBookingDetails(456);

// Confirm payment
await api.confirmPayment(456);

// Complete booking
await api.completeBooking(456);

// Cancel booking
await api.cancelBooking(456);

// Get user bookings
const myBookings = await api.getUserBookings(userId);
```

---

## 💰 PAYMENTS & WALLET

```typescript
// Initiate payment
const payment = await api.initiatePayment(bookingId, 50000, '+250788123456', 'momo');

// Get wallet balance
const balance = await api.getWalletBalance();

// Topup wallet
await api.topupWallet(100000, 'momo');

// Withdraw (requires MFA)
await api.withdrawWallet(50000, '+250788123456');

// Get transactions
const transactions = await api.getWalletTransactions();
```

---

## 🔒 SECURITY FEATURES

### MFA (Multi-Factor Authentication)
```typescript
import { completeApi } from '@/services';

// Enable MFA
await completeApi.security.enableMFA(userId, 'sms', '+250788123456');

// Send verification code
await completeApi.security.sendMFACode(userId, 'sms');

// Verify code
const verified = await completeApi.security.verifyMFACode(userId, '123456');

// Disable MFA
await completeApi.security.disableMFA(userId, '123456');
```

### KYC Verification
```typescript
// Submit KYC
const result = await completeApi.security.submitKYC({
  user_id: userId,
  id_type: 'national_id',
  id_number: '1199780012345678',
  id_front_image: '/uploads/id_front.jpg',
  id_back_image: '/uploads/id_back.jpg',
  selfie_image: '/uploads/selfie.jpg'
});

// Check KYC status
const status = await completeApi.security.getKYCStatus(userId);
```

### Biometric Authentication
```typescript
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

const { registerBiometric, authenticateBiometric, checkSupport } = useBiometricAuth();

// Check if supported
if (checkSupport()) {
  // Register biometric
  await registerBiometric(userId, 'My iPhone 15');
  
  // Authenticate
  const result = await authenticateBiometric(userId);
}
```

### Escrow
```typescript
// Create escrow
const escrow = await completeApi.security.createEscrow(bookingId, 50000);

// Customer approve
await completeApi.security.customerApproveEscrow(escrowId, customerId);

// Get status
const status = await completeApi.security.getEscrowStatus(bookingId);
```

### Fraud Detection
```typescript
// Check payment before processing
const check = await completeApi.security.checkPayment({
  user_id: userId,
  ip_address: '192.168.1.1',
  card_fingerprint: 'card_hash',
  amount: 50000
});

if (!check.allowed) {
  alert('Payment blocked: ' + check.risks.join(', '));
}

// Get fraud stats (admin)
const stats = await completeApi.security.getFraudStats(7);
```

---

## 💬 MESSAGING

```typescript
import { completeApi } from '@/services';

// Send message to seller
await completeApi.messaging.sendMessage(sellerId, productId, 'Is this available?');

// Get all conversations
const conversations = await completeApi.messaging.getConversations();

// Get messages for specific conversation
const messages = await completeApi.messaging.getMessages(otherUserId, productId);

// Get unread count
const { count } = await completeApi.messaging.getUnreadCount();

// Mark as read
await completeApi.messaging.markAsRead(messageId);
```

---

## 📍 LOCATIONS

```typescript
// Get provinces
const provinces = await api.getProvinces();

// Get districts
const districts = await api.getDistricts(provinceId);

// Get sectors
const sectors = await api.getSectors(districtId);

// Get full hierarchy
const hierarchy = await api.getLocationHierarchy();
```

---

## 🔔 NOTIFICATIONS

```typescript
// Get notifications
const notifications = await api.getNotifications();

// Mark as read
await api.markNotificationRead(notificationId);

// Delete notification
await api.deleteNotification(notificationId);
```

---

## ⭐ REVIEWS & RATINGS

```typescript
// Submit review
await api.submitReview({
  product_id: 123,
  rating: 5,
  comment: 'Excellent!',
  booking_id: 456
});

// Get product reviews
const reviews = await api.getProductReviews(123);

// Get seller reviews
const sellerReviews = await api.getSellerReviews(sellerId);

// Reply to review
await api.replyToReview(reviewId, 'Thank you!');
```

---

## 🎯 AUCTIONS

```typescript
// Get active auctions
const auctions = await api.getActiveAuctions();

// Get auction details
const auction = await api.getAuctionDetails(auctionId);

// Place bid
await api.placeBid(auctionId, 60000);

// Get my bids
const myBids = await api.getMyBids();
```

---

## 🚚 SHIPPING

```typescript
// Get tracking
const tracking = await api.getShippingTracking(bookingId);

// Track by number
const shipment = await api.getShippingByTrackingNumber('SHIP123');

// Update tracking
await api.updateShippingTracking(trackingId, 'in_transit', 'Kigali');
```

---

## 🛡️ DISPUTES

```typescript
// File dispute
await api.fileDispute({
  booking_id: 123,
  reason: 'not_as_described',
  description: 'Product is damaged',
  evidence: ['image1.jpg']
});

// Get disputes
const disputes = await api.getUserDisputes();

// Add message
await api.addDisputeMessage(disputeId, 'Here is more evidence', ['image2.jpg']);

// Resolve (admin)
await api.resolveDispute(disputeId, 'refund_buyer', 50000, 'buyer');
```

---

## 💳 PROMO CODES & REFERRALS

```typescript
// Validate promo code
const promo = await api.validatePromoCode('SAVE20', 50000);

// Apply promo code
await api.applyPromoCode('SAVE20', bookingId);

// Get referral code
const referral = await api.getReferralCode();

// Apply referral
await api.applyReferralCode('REF123');

// Get referral stats
const stats = await api.getReferralStats();
```

---

## 📊 ANALYTICS

```typescript
// Dashboard stats
const stats = await api.getDashboardStats();

// Marketplace stats
const marketplace = await api.getMarketplaceStats();

// Trending products
const trending = await api.getTrendingProducts();

// Track product view
await api.trackProductView(productId);

// User activity
const activity = await api.getUserActivity();

// Seller metrics
const metrics = await api.getSellerMetrics(sellerId);
```

---

## 👨‍💼 ADMIN FEATURES

```typescript
// Dashboard
const dashboard = await api.getAdminDashboard();

// Users
const users = await api.getAdminUsers('active', 'search', 50, 0);

// Pending products
const pending = await api.getPendingProducts();

// Approve product
await api.approveProductAdmin(productId);

// Reject product
await api.rejectProductAdmin(productId, 'Poor quality images');

// Ban user
await api.banUserAdmin(userId, 'Fraud detected');

// Unban user
await api.unbanUserAdmin(userId);

// Get disputes
const disputes = await api.getAdminDisputes('pending');

// Resolve dispute
await api.resolveDisputeAdmin(disputeId, 'Refund processed');

// Get fraud logs
const fraudLogs = await api.getAdminFraudLogs();

// Revenue analytics
const revenue = await api.getRevenueAnalytics(30);
```

---

## 🎨 REACT COMPONENT EXAMPLES

### Product List
```typescript
import { api } from '@/services';
import { useEffect, useState } from 'react';

export const ProductList = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.getProducts({ category: 1 }).then(res => {
      if (res.success) setProducts(res.data);
    });
  }, []);

  return (
    <div>
      {products.map(p => (
        <div key={p.id}>{p.title}</div>
      ))}
    </div>
  );
};
```

### Login with MFA
```typescript
import { api, completeApi } from '@/services';
import { useState } from 'react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMFA, setShowMFA] = useState(false);
  const [userId, setUserId] = useState(null);

  const handleLogin = async () => {
    const result = await api.login(email, password);
    if (result.success) {
      if (result.data.mfa_enabled) {
        setUserId(result.data.id);
        await completeApi.security.sendMFACode(result.data.id, 'sms');
        setShowMFA(true);
      } else {
        // Login successful
      }
    }
  };

  const handleMFAVerify = async () => {
    const verified = await completeApi.security.verifyMFACode(userId, mfaCode);
    if (verified.success) {
      // Login successful
    }
  };

  return (
    <div>
      {!showMFA ? (
        <>
          <input value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button onClick={handleLogin}>Login</button>
        </>
      ) : (
        <>
          <input value={mfaCode} onChange={e => setMfaCode(e.target.value)} placeholder="Enter code" />
          <button onClick={handleMFAVerify}>Verify</button>
        </>
      )}
    </div>
  );
};
```

### Messaging
```typescript
import { completeApi } from '@/services';
import { MessagingSystem } from '@/components/MessagingSystem';

export const MessagesPage = () => {
  return <MessagingSystem />;
};
```

### Product View
```typescript
import { ProductView } from '@/components/ProductView';

export const ProductPage = () => {
  return <ProductView />;
};
```

---

## ✅ BEST PRACTICES

1. **Always handle errors:**
```typescript
try {
  const result = await api.getProducts();
  if (result.success) {
    // Handle success
  } else {
    // Handle error
    console.error(result.message);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

2. **Use loading states:**
```typescript
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    const result = await api.getProducts();
    setProducts(result.data);
  } finally {
    setLoading(false);
  }
};
```

3. **Check authentication:**
```typescript
useEffect(() => {
  api.verifyToken().then(result => {
    if (!result.success) {
      // Redirect to login
    }
  });
}, []);
```

---

## 🚀 QUICK REFERENCE

| Feature | Import | Usage |
|---------|--------|-------|
| Products | `api` | `api.getProducts()` |
| Bookings | `api` | `api.createBooking()` |
| Payments | `api` | `api.initiatePayment()` |
| MFA | `completeApi.security` | `completeApi.security.enableMFA()` |
| KYC | `completeApi.security` | `completeApi.security.submitKYC()` |
| Escrow | `completeApi.security` | `completeApi.security.createEscrow()` |
| Fraud | `completeApi.security` | `completeApi.security.checkPayment()` |
| Messaging | `completeApi.messaging` | `completeApi.messaging.sendMessage()` |
| Biometric | `useBiometricAuth` | `registerBiometric()` |

---

**Use these APIs everywhere in your React components! All backend features are ready! 🚀**
