# QUICK REFERENCE GUIDE - 2026 Features
## Developer Cheat Sheet

---

## 🚀 QUICK START

### 1. Run Database Migration
```bash
cd api/migrations
mysql -u root -p marketplace < advanced_payment_features.sql
```

### 2. Configure API Keys
```php
// config/payment_providers.php
define('MTN_MOMO_API_KEY', 'your_key_here');
define('MTN_MOMO_API_SECRET', 'your_secret_here');
define('STRIPE_SECRET_KEY', 'sk_test_...');
```

### 3. Test Endpoints
```bash
# Test wallet checkout
curl -X POST http://localhost/api/controllers/advanced_payments.php \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action":"wallet_checkout","booking_id":1,"payment_method":"mtn_momo","phone_number":"+250788123456","biometric_token":"test123"}'
```

---

## 📋 COMMON API CALLS

### Seller Verification
```javascript
// Submit verification
POST /api/controllers/seller_verification.php
{
  "action": "submit_verification",
  "document_type": "national_id",
  "document_number": "1234567890123456",
  "document_image": "base64_image",
  "selfie_image": "base64_image",
  "gps_latitude": -1.9705786,
  "gps_longitude": 30.0587086
}
```

### Product Approval
```javascript
// Create product with fraud check
POST /api/controllers/product_approval.php
{
  "action": "create_product",
  "title": "Toyota Spare Parts",
  "description": "Original spare parts...",
  "category": "automotive-parts",
  "images": ["image1.jpg", "image2.jpg"],
  "rent_price": 50000,
  "buy_price": 500000,
  "live_photo_verified": true
}
```

### Wallet Checkout
```javascript
// Process payment
POST /api/controllers/advanced_payments.php
{
  "action": "wallet_checkout",
  "booking_id": 123,
  "payment_method": "mtn_momo",
  "phone_number": "+250788123456",
  "biometric_token": "fingerprint_abc123"
}
```

### Escrow Progress
```javascript
// Get status
GET /api/controllers/advanced_payments.php?escrow_progress&booking_id=123

// Response
{
  "progress": {
    "payment_received": true,
    "in_escrow": true,
    "order_shipped": true,
    "item_received": false,
    "funds_released": false,
    "progress_percentage": 60
  }
}
```

### Instant Payout
```javascript
// Setup payout method
POST /api/controllers/advanced_payments.php
{
  "action": "setup_payout",
  "payout_method": "mobile_money",
  "payout_phone": "+250788123456"
}

// Request payout
POST /api/controllers/advanced_payments.php
{
  "action": "request_payout",
  "escrow_id": 789
}
```

---

## 🔍 FRAUD DETECTION

### Check Transaction
```javascript
POST /api/controllers/advanced_payments.php
{
  "action": "fraud_check_transaction",
  "amount": 500000,
  "payment_data": {
    "user_id": 123,
    "phone_number": "+250788123456"
  }
}

// Response
{
  "fraud_check": {
    "overall_risk_score": 25,
    "risk_level": "low",
    "recommendation": "auto_approve"
  }
}
```

### Risk Levels
- **0-39**: Low (Auto-approve)
- **40-69**: Medium (Manual review)
- **70+**: High (Block)

---

## 💾 DATABASE QUERIES

### Get Pending Verifications
```sql
SELECT * FROM seller_verifications 
WHERE verification_status = 'pending' 
ORDER BY created_at DESC;
```

### Get Escrow Transactions
```sql
SELECT * FROM escrow_transactions 
WHERE status = 'held' 
AND auto_release_date <= NOW();
```

### Get Fraud Logs
```sql
SELECT * FROM fraud_detection_logs 
WHERE severity = 'high' 
AND status = 'detected' 
ORDER BY created_at DESC;
```

### Get Payment Analytics
```sql
SELECT 
  SUM(net_amount) as total_earnings,
  COUNT(*) as transaction_count,
  AVG(net_amount) as avg_transaction
FROM escrow_transactions 
WHERE seller_id = 123 
AND status = 'released';
```

---

## 🎨 FRONTEND COMPONENTS

### Biometric Auth
```typescript
import BiometricAuth from '@/utils/biometric';

const handlePayment = async () => {
  try {
    const token = await BiometricAuth.authenticate();
    const response = await api.post('/advanced_payments.php', {
      action: 'wallet_checkout',
      biometric_token: token,
      // ... other data
    });
  } catch (error) {
    console.error('Biometric auth failed:', error);
  }
};
```

### Escrow Progress Bar
```typescript
const EscrowProgress = ({ bookingId }) => {
  const [progress, setProgress] = useState(null);
  
  useEffect(() => {
    const fetchProgress = async () => {
      const res = await api.get(
        `/advanced_payments.php?escrow_progress&booking_id=${bookingId}`
      );
      setProgress(res.data.progress);
    };
    fetchProgress();
  }, [bookingId]);
  
  return (
    <div className="progress-bar">
      <div style={{ width: `${progress?.progress_percentage}%` }} />
    </div>
  );
};
```

---

## 🔧 CONFIGURATION

### System Settings
```sql
-- Enable features
UPDATE system_settings SET setting_value = 'true' 
WHERE setting_key IN (
  'wallet_first_enabled',
  'biometric_auth_required',
  'instant_payout_enabled',
  'ai_fraud_detection_enabled'
);

-- Set thresholds
UPDATE system_settings SET setting_value = '3' 
WHERE setting_key = 'auto_escrow_release_days';

UPDATE system_settings SET setting_value = '50' 
WHERE setting_key = 'synthetic_identity_threshold';
```

---

## 🐛 DEBUGGING

### Enable Debug Mode
```php
// config/database.php
define('DEBUG_MODE', true);
define('LOG_FRAUD_CHECKS', true);
```

### Check Logs
```bash
# Fraud detection logs
tail -f logs/fraud_detection.log

# Payment logs
tail -f logs/payments.log

# Error logs
tail -f logs/error.log
```

---

## 📊 MONITORING

### Key Metrics to Track
```sql
-- Payment success rate
SELECT 
  COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM payments 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Fraud detection rate
SELECT 
  COUNT(*) as flagged_count,
  AVG(risk_score) as avg_risk_score
FROM fraud_detection_logs 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Payout speed
SELECT 
  AVG(TIMESTAMPDIFF(SECOND, created_at, completed_at)) as avg_seconds
FROM instant_payouts 
WHERE status = 'completed';
```

---

## 🚨 COMMON ISSUES

### Issue: Payment Fails
```
Solution: Check provider status
SELECT * FROM payment_provider_performance 
WHERE provider_name = 'mtn_momo';
```

### Issue: High Fraud Score
```
Solution: Review fraud flags
SELECT indicators FROM fraud_detection_logs 
WHERE entity_id = 123 
ORDER BY created_at DESC LIMIT 1;
```

### Issue: Escrow Not Releasing
```
Solution: Check auto-release date
SELECT auto_release_date, buyer_confirmed 
FROM escrow_transactions 
WHERE id = 789;
```

---

## 📞 QUICK CONTACTS

- **Tech Support**: tech@rentalsalesmarketplace.rw
- **Payment Issues**: payments@rentalsalesmarketplace.rw
- **Security**: security@rentalsalesmarketplace.rw
- **Emergency**: +250 788 123 456

---

## 🔗 USEFUL LINKS

- [Full Documentation](./ADVANCED_PAYMENT_FEATURES.md)
- [Security Features](./SECURITY_FEATURES.md)
- [Implementation Summary](./2026_IMPLEMENTATION_SUMMARY.md)
- [MTN MoMo API Docs](https://momodeveloper.mtn.com/)
- [Stripe Connect Docs](https://stripe.com/docs/connect)

---

**Happy Coding! 🚀**
