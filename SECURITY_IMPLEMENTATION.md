# UMUTEKANO W'ABAKORESHA - COMPREHENSIVE SECURITY IMPLEMENTATION

## 📋 Table of Contents
1. [Multi-Factor Authentication (MFA/2FA)](#1-mfa)
2. [Biometric Login (WebAuthn)](#2-biometric)
3. [KYC Verification](#3-kyc)
4. [Escrow Triple Approval](#4-escrow)
5. [Anti-Fraud Detection](#5-fraud)
6. [Data Encryption](#6-encryption)
7. [Rate Limiting](#7-rate-limit)
8. [IP Tracking](#8-ip-tracking)
9. [Audit Logs](#9-audit)
10. [Image Verification](#10-image)
11. [Complete API Reference](#api-reference)
12. [External Integrations](#external-integrations)
13. [Environment Configuration](#environment)

---

## Ibyashyizweho (Implemented Features)

### 1. Multi-Factor Authentication (MFA/2FA) ✅

**Aho bikoreshwa:**
- Seller ntashobora gukura amafaranga atashyizeho MFA
- SMS cyangwa Email verification code

**Files:**
- `api/services/MFAService.php` - MFA logic
- `api/migrations/security_features.sql` - Database tables

**Gukoresha:**
```php
$mfa = new MFAService($db);

// Enable MFA
$mfa->enableMFA($userId, 'sms', '+250788123456');

// Send code
$mfa->sendVerificationCode($userId, 'sms');

// Verify code
if ($mfa->verifyCode($userId, '123456')) {
    // Allow withdrawal
}
```

**Integration na Africa's Talking:**
```bash
# .env file
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_USERNAME=your_username
```

---

### 2. Biometric Login (WebAuthn) ✅

**Aho bikoreshwa:**
- Fingerprint, FaceID, Windows Hello
- Platform authenticators

**Files:**
- `src/hooks/useBiometricAuth.ts` - React hook
- `api/controllers/biometric.php` - Backend API

**Gukoresha muri React:**
```typescript
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

const { registerBiometric, authenticateBiometric } = useBiometricAuth();

// Register
await registerBiometric(userId, 'My iPhone');

// Login
const result = await authenticateBiometric(userId);
```

---

### 3. KYC Verification (Identity) ✅

**Aho bikoreshwa:**
- Indangamuntu verification
- AI Face Match
- Irembo Gov API integration ready

**Files:**
- `api/services/KYCService.php` - KYC logic

**Gukoresha:**
```php
$kyc = new KYCService($db);

// Submit KYC
$result = $kyc->submitKYC($userId, [
    'id_type' => 'national_id',
    'id_number' => '1199780012345678',
    'id_front_image' => '/uploads/id_front.jpg',
    'id_back_image' => '/uploads/id_back.jpg',
    'selfie_image' => '/uploads/selfie.jpg'
]);

// Face match score: 0-100
echo $result['face_match_score'];

// Approve/Reject
$kyc->approveKYC($kycId, $adminId);
$kyc->rejectKYC($kycId, $adminId, 'Ifoto ntabwo ari nziza');
```

**AWS Rekognition Integration:**
```bash
composer require aws/aws-sdk-php

# .env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

---

### 4. Escrow Smart Logic (Triple Approval) ✅

**Inzira 3 zo kwemeza:**
1. **Customer Approval** - Umukiriya yakiriye ibicuruzwa
2. **Refund Period** - Iminsi 7 yo gusubiza yarangiye
3. **Admin Approval** - Admin yemeje

**Files:**
- `api/services/EscrowService.php` - Escrow logic

**Gukoresha:**
```php
$escrow = new EscrowService($db);

// Create escrow when payment is made
$escrowId = $escrow->createEscrow($bookingId, 50000);

// Step 1: Customer confirms receipt
$escrow->customerApproval($escrowId, $customerId);

// Step 2: Auto-check refund periods (cron job)
$escrow->checkRefundPeriods();

// Step 3: Admin approves
$escrow->adminApproval($escrowId, $adminId);

// Refund if dispute
$escrow->refundEscrow($escrowId, 'Ibicuruzwa byanze', $adminId);
```

**Cron Job (iminsi yose):**
```bash
# crontab -e
0 */6 * * * php /path/to/api/cron/check_escrow.php
```

---

### 5. Anti-Fraud Card Testing ✅

**Aho bikoreshwa:**
- Detect multiple card attempts
- Block suspicious IPs
- Velocity checks

**Files:**
- `api/services/AntiFraudService.php` - Fraud detection

**Gukoresha:**
```php
$fraud = new AntiFraudService($db);

// Check before payment
$check = $fraud->checkPaymentAttempt($userId, $ipAddress, $cardFingerprint, $amount);

if (!$check['allowed']) {
    die('Payment blocked: ' . implode(', ', $check['risks']));
}

// Log attempt
$fraud->logPaymentAttempt($userId, $ipAddress, $cardFingerprint, $amount, 'success');

// Block entity
$fraud->blockEntity('ip', '192.168.1.1', 'Card testing', 24); // 24 hours
```

---

### 6. Data Encryption (AES-256) ✅

**Files:**
- `api/services/SecurityService.php` - Encryption logic

**Gukoresha:**
```php
$security = new SecurityService($db);

// Encrypt sensitive data
$encrypted = $security->encrypt('250788123456');

// Decrypt
$decrypted = $security->decrypt($encrypted);

// One-way hash
$hash = $security->hash('sensitive_data');
```

**IMPORTANT:** Ntukabike amakarita ya banki muri database. Koresha Flutterwave/Paystack tokens.

---

### 7. Rate Limiting ✅

**Gukoresha:**
```php
$security = new SecurityService($db);

$check = $security->checkRateLimit($ipAddress, '/api/login', 5, 1); // 5 requests per minute

if (!$check['allowed']) {
    http_response_code(429);
    die(json_encode(['error' => 'Too many requests', 'retry_after' => $check['retry_after']]));
}
```

---

### 8. IP Tracking & Geolocation ✅

**Gukoresha:**
```php
$security = new SecurityService($db);

$result = $security->trackLogin($userId, $ipAddress);

if ($result['is_suspicious']) {
    // Send alert email
    // Require MFA
    // Block login
}
```

**Impossible Travel Detection:**
- Niba umuntu yinjiriye i Kigali, agahita yinjirira mu Bushinwa nyuma y'iminota 5
- System iramufunga

---

### 9. Audit Logs ✅

**Gukoresha:**
```php
$security = new SecurityService($db);

$security->logAudit(
    $userId,
    'wallet_withdrawal',
    'wallet',
    $walletId,
    '100000', // old balance
    '50000',  // new balance
    'critical'
);

// Get audit trail
$logs = $security->getAuditTrail($userId, 30); // Last 30 days
```

---

### 10. AI Image Verification ✅

**Files:**
- `api/services/AIFraudDetection.php` - Already exists

**Gukoresha:**
```php
$ai = new AIFraudDetection($db);

// Check image authenticity
$result = $ai->verifyImageAuthenticity('/uploads/product.jpg');

if (!$result['is_authentic']) {
    echo "Stock photo detected!";
}

// Detect AI-generated images
$aiCheck = $ai->detectAIGeneratedImage('/uploads/product.jpg');

// Live photo verification
$liveCheck = $ai->verifyLivePhoto('/uploads/live.jpg', $userId);
```

**Google Vision API Integration:**
```bash
composer require google/cloud-vision

# .env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

---

## Database Setup

```bash
cd c:\xampp\htdocs\Rentalsalesmarketplace\api
mysql -u root -p newsoko < migrations/security_features.sql
```

---

## Cron Jobs (Automated Tasks)

**1. Check Escrow Refund Periods:**
```php
// api/cron/check_escrow.php
<?php
require_once '../config/database.php';
require_once '../services/EscrowService.php';

$db = new Database();
$escrow = new EscrowService($db->getConnection());
$count = $escrow->checkRefundPeriods();
echo "Processed $count escrows\n";
```

**2. Clean Expired MFA Codes:**
```sql
DELETE FROM mfa_verification_codes WHERE expires_at < NOW() AND is_used = FALSE;
```

**3. Unblock Temporary Blocks:**
```sql
DELETE FROM blocked_entities WHERE is_permanent = FALSE AND blocked_until < NOW();
```

---

---

## <a name="api-reference"></a>📡 COMPLETE API REFERENCE

### MFA APIs

**POST /api/controllers/mfa.php**

#### Enable MFA
```json
{
  "action": "enable",
  "user_id": 123,
  "method": "sms",
  "phone_number": "+250788123456"
}
```
Response:
```json
{
  "success": true,
  "message": "MFA enabled"
}
```

#### Send Verification Code
```json
{
  "action": "send_code",
  "user_id": 123,
  "method": "sms"
}
```
Response:
```json
{
  "success": true,
  "message": "Code sent",
  "expires_in": 600
}
```

#### Verify Code
```json
{
  "action": "verify",
  "user_id": 123,
  "code": "123456"
}
```
Response:
```json
{
  "success": true,
  "verified": true
}
```

#### Disable MFA
```json
{
  "action": "disable",
  "user_id": 123,
  "code": "123456"
}
```

---

### Biometric APIs

**POST /api/controllers/biometric.php**

#### Register Challenge
```json
{
  "action": "register-challenge",
  "user_id": 123
}
```
Response:
```json
{
  "success": true,
  "challenge": "base64_encoded_challenge",
  "userId": [1,2,3...]
}
```

#### Register Credential
```json
{
  "action": "register",
  "user_id": 123,
  "credential_id": "base64_credential",
  "public_key": "base64_public_key",
  "device_name": "My iPhone 15"
}
```

#### Auth Challenge
```json
{
  "action": "auth-challenge",
  "user_id": 123
}
```

#### Verify Authentication
```json
{
  "action": "verify",
  "user_id": 123,
  "credential_id": "base64_credential",
  "signature": "base64_signature"
}
```
Response:
```json
{
  "success": true,
  "token": "session_token"
}
```

---

### KYC APIs

**POST /api/controllers/kyc.php**

#### Submit KYC
```json
{
  "action": "submit",
  "user_id": 123,
  "id_type": "national_id",
  "id_number": "1199780012345678",
  "id_front_image": "/uploads/id_front.jpg",
  "id_back_image": "/uploads/id_back.jpg",
  "selfie_image": "/uploads/selfie.jpg"
}
```
Response:
```json
{
  "success": true,
  "kyc_id": 456,
  "face_match_score": 92.5,
  "status": "pending"
}
```

#### Get KYC Status
```json
{
  "action": "status",
  "user_id": 123
}
```

#### Approve KYC (Admin)
```json
{
  "action": "approve",
  "kyc_id": 456,
  "admin_id": 1
}
```

#### Reject KYC (Admin)
```json
{
  "action": "reject",
  "kyc_id": 456,
  "admin_id": 1,
  "reason": "Ifoto ntabwo ari nziza"
}
```

---

### Escrow APIs

**POST /api/controllers/escrow.php**

#### Create Escrow
```json
{
  "action": "create",
  "booking_id": 789,
  "amount": 50000
}
```
Response:
```json
{
  "success": true,
  "escrow_id": 101,
  "status": "held",
  "refund_deadline": "2025-02-07 10:30:00"
}
```

#### Customer Approval
```json
{
  "action": "customer_approve",
  "escrow_id": 101,
  "customer_id": 123
}
```

#### Admin Approval
```json
{
  "action": "admin_approve",
  "escrow_id": 101,
  "admin_id": 1
}
```

#### Refund Escrow
```json
{
  "action": "refund",
  "escrow_id": 101,
  "admin_id": 1,
  "reason": "Ibicuruzwa byanze"
}
```

#### Get Escrow Status
```json
{
  "action": "status",
  "booking_id": 789
}
```

#### Get Pending Approvals (Admin)
```json
{
  "action": "pending_approvals"
}
```

---

### Fraud Detection APIs

**POST /api/controllers/fraud.php**

#### Check Payment
```json
{
  "action": "check_payment",
  "user_id": 123,
  "ip_address": "192.168.1.1",
  "card_fingerprint": "card_hash_123",
  "amount": 50000
}
```
Response:
```json
{
  "success": true,
  "allowed": true,
  "risk_score": 15,
  "risks": [],
  "action": "allow"
}
```

#### Log Payment Attempt
```json
{
  "action": "log_attempt",
  "user_id": 123,
  "ip_address": "192.168.1.1",
  "card_fingerprint": "card_hash_123",
  "amount": 50000,
  "status": "success"
}
```

#### Block Entity
```json
{
  "action": "block",
  "entity_type": "ip",
  "entity_value": "192.168.1.1",
  "reason": "Card testing detected",
  "hours": 24
}
```

#### Unblock Entity
```json
{
  "action": "unblock",
  "entity_type": "ip",
  "entity_value": "192.168.1.1"
}
```

#### Get Fraud Stats
```json
{
  "action": "stats",
  "days": 7
}
```

---

### Security APIs

**POST /api/controllers/security.php**

#### Encrypt Data
```json
{
  "action": "encrypt",
  "data": "250788123456"
}
```

#### Decrypt Data
```json
{
  "action": "decrypt",
  "encrypted_data": "base64_encrypted"
}
```

#### Track Login
```json
{
  "action": "track_login",
  "user_id": 123,
  "ip_address": "192.168.1.1"
}
```
Response:
```json
{
  "success": true,
  "is_suspicious": false,
  "risk_score": 10,
  "reasons": []
}
```

#### Get Audit Trail
```json
{
  "action": "audit_trail",
  "user_id": 123,
  "days": 30
}
```

---

### Image Verification APIs

**POST /api/controllers/image_verification.php**

#### Verify Image Authenticity
```json
{
  "action": "verify_authenticity",
  "image_path": "/uploads/product.jpg"
}
```
Response:
```json
{
  "success": true,
  "is_authentic": true,
  "confidence": 15,
  "flags": []
}
```

#### Detect AI Generated
```json
{
  "action": "detect_ai",
  "image_path": "/uploads/product.jpg"
}
```

#### Verify Live Photo
```json
{
  "action": "verify_live",
  "image_path": "/uploads/live.jpg",
  "user_id": 123
}
```

#### Google Vision Analysis
```json
{
  "action": "google_vision",
  "image_path": "/uploads/product.jpg"
}
```

---

## <a name="external-integrations"></a>🔌 EXTERNAL INTEGRATIONS

### 1. Africa's Talking (SMS Provider)

**Purpose:** Send MFA codes via SMS

**Setup:**
1. Create account: https://africastalking.com
2. Get API Key and Username
3. Add to .env:
```bash
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_SENDER_ID=NEWSOKO
```

**API Endpoint:** `https://api.africastalking.com/version1/messaging`

**Test:**
```bash
curl -X POST https://api.africastalking.com/version1/messaging \
  -H "apiKey: YOUR_API_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=YOUR_USERNAME&to=+250788123456&message=Test"
```

**Pricing:** ~$0.01 per SMS in Rwanda

---

### 2. AWS Rekognition (Face Matching)

**Purpose:** KYC face verification

**Setup:**
1. Create AWS account: https://aws.amazon.com
2. Enable Rekognition service
3. Create IAM user with Rekognition permissions
4. Add to .env:
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_REKOGNITION_THRESHOLD=85
```

**Install SDK:**
```bash
composer require aws/aws-sdk-php
```

**API Call:**
```php
$client = new Aws\Rekognition\RekognitionClient([
    'version' => 'latest',
    'region' => getenv('AWS_REGION'),
    'credentials' => [
        'key' => getenv('AWS_ACCESS_KEY_ID'),
        'secret' => getenv('AWS_SECRET_ACCESS_KEY')
    ]
]);

$result = $client->compareFaces([
    'SourceImage' => ['Bytes' => file_get_contents($idImage)],
    'TargetImage' => ['Bytes' => file_get_contents($selfie)],
    'SimilarityThreshold' => 85
]);
```

**Pricing:** $0.001 per image (first 1M images/month)

---

### 3. Google Cloud Vision API (Image Analysis)

**Purpose:** Detect stock photos, inappropriate content

**Setup:**
1. Create project: https://console.cloud.google.com
2. Enable Vision API
3. Create service account and download JSON key
4. Add to .env:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
GOOGLE_VISION_PROJECT_ID=your-project-id
```

**Install SDK:**
```bash
composer require google/cloud-vision
```

**API Call:**
```php
use Google\Cloud\Vision\V1\ImageAnnotatorClient;

$client = new ImageAnnotatorClient();
$image = file_get_contents($imagePath);
$response = $client->labelDetection($image);
$labels = $response->getLabelAnnotations();
```

**Pricing:** $1.50 per 1000 images

---

### 4. Flutterwave (Payment Gateway)

**Purpose:** Process payments, card tokenization

**Setup:**
1. Create account: https://flutterwave.com
2. Get API keys
3. Add to .env:
```bash
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxxxx
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret
```

**API Endpoint:** `https://api.flutterwave.com/v3`

**Initialize Payment:**
```php
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.flutterwave.com/v3/payments",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode([
        'tx_ref' => 'TXN-' . time(),
        'amount' => 50000,
        'currency' => 'RWF',
        'customer' => [
            'email' => 'customer@email.com',
            'phone_number' => '+250788123456'
        ]
    ]),
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . getenv('FLUTTERWAVE_SECRET_KEY'),
        'Content-Type: application/json'
    ]
]);
```

**Pricing:** 3.8% per transaction

---

### 5. Paystack (Alternative Payment)

**Purpose:** Backup payment processor

**Setup:**
```bash
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx
```

**API Endpoint:** `https://api.paystack.co`

---

### 6. IP Geolocation API

**Purpose:** Track login locations

**Free Option:** http://ip-api.com (no key needed)

**Premium Option:** https://ipgeolocation.io
```bash
IPGEOLOCATION_API_KEY=your_api_key
```

**API Call:**
```php
$url = "http://ip-api.com/json/{$ipAddress}";
$response = file_get_contents($url);
$data = json_decode($response, true);
```

---

### 7. Twilio (Alternative SMS)

**Purpose:** Backup SMS provider

**Setup:**
```bash
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Install SDK:**
```bash
composer require twilio/sdk
```

---

### 8. SendGrid (Email Service)

**Purpose:** Send MFA codes, security alerts

**Setup:**
```bash
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@newsoko.rw
SENDGRID_FROM_NAME=Newsoko Security
```

**Install SDK:**
```bash
composer require sendgrid/sendgrid
```

---

### 9. Irembo Gov API (Rwanda ID Verification)

**Purpose:** Verify national IDs with government database

**Setup:**
```bash
IREMBO_API_KEY=your_api_key
IREMBO_API_SECRET=your_secret
IREMBO_ENDPOINT=https://api.irembo.gov.rw
```

**Note:** Requires government partnership

---

### 10. Cloudflare (DDoS Protection)

**Purpose:** Rate limiting, DDoS protection

**Setup:**
```bash
CLOUDFLARE_API_KEY=your_api_key
CLOUDFLARE_ZONE_ID=your_zone_id
```

---

## <a name="environment"></a>🔐 COMPLETE ENVIRONMENT CONFIGURATION

Create `.env` file:
```bash
# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_HOST=localhost
DB_NAME=newsoko
DB_USER=root
DB_PASS=
DB_PORT=3306

# ============================================
# SMS PROVIDERS
# ============================================
# Africa's Talking (Primary)
AFRICASTALKING_API_KEY=your_api_key_here
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_SENDER_ID=NEWSOKO

# Twilio (Backup)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# ============================================
# EMAIL SERVICES
# ============================================
# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@newsoko.rw
SENDGRID_FROM_NAME=Newsoko

# SMTP (Fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@newsoko.rw
SMTP_PASS=your_email_password
SMTP_ENCRYPTION=tls

# ============================================
# AWS SERVICES
# ============================================
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_REKOGNITION_THRESHOLD=85
AWS_S3_BUCKET=newsoko-uploads

# ============================================
# GOOGLE CLOUD SERVICES
# ============================================
GOOGLE_APPLICATION_CREDENTIALS=c:/path/to/credentials.json
GOOGLE_VISION_PROJECT_ID=newsoko-project
GOOGLE_CLOUD_STORAGE_BUCKET=newsoko-images

# ============================================
# PAYMENT GATEWAYS
# ============================================
# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxxxx
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret
FLUTTERWAVE_ENVIRONMENT=test

# Paystack
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx

# ============================================
# SECURITY SETTINGS
# ============================================
ENCRYPTION_MASTER_KEY=generate_random_32_bytes_base64_encoded
SESSION_LIFETIME=30
SESSION_SECURE=true
SESSION_HTTPONLY=true

# MFA Settings
MFA_CODE_LENGTH=6
MFA_CODE_EXPIRY=10
MFA_MAX_ATTEMPTS=3

# Rate Limiting
RATE_LIMIT_REQUESTS=60
RATE_LIMIT_WINDOW=1
RATE_LIMIT_BLOCK_DURATION=15

# ============================================
# ESCROW SETTINGS
# ============================================
ESCROW_REFUND_DAYS=7
ESCROW_MIN_AMOUNT=1000
ESCROW_MAX_AMOUNT=10000000
ESCROW_AUTO_RELEASE=true

# ============================================
# FRAUD DETECTION
# ============================================
MAX_PAYMENT_ATTEMPTS=5
CARD_TESTING_THRESHOLD=3
BLOCK_DURATION_HOURS=24
FRAUD_RISK_THRESHOLD=70
VELOCITY_CHECK_WINDOW=10

# ============================================
# KYC SETTINGS
# ============================================
KYC_FACE_MATCH_THRESHOLD=85
KYC_AUTO_APPROVE_THRESHOLD=95
KYC_REQUIRED_FOR_WITHDRAWAL=true
KYC_MAX_ATTEMPTS=3

# ============================================
# IP GEOLOCATION
# ============================================
IPGEOLOCATION_API_KEY=your_api_key
IPGEOLOCATION_PROVIDER=ip-api

# ============================================
# IREMBO GOV API (Rwanda)
# ============================================
IREMBO_API_KEY=your_api_key
IREMBO_API_SECRET=your_secret
IREMBO_ENDPOINT=https://api.irembo.gov.rw
IREMBO_ENABLED=false

# ============================================
# CLOUDFLARE
# ============================================
CLOUDFLARE_API_KEY=your_api_key
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_ENABLED=false

# ============================================
# FILE UPLOAD SETTINGS
# ============================================
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,pdf
UPLOAD_PATH=c:/xampp/htdocs/Rentalsalesmarketplace/uploads

# ============================================
# LOGGING & MONITORING
# ============================================
LOG_LEVEL=info
LOG_PATH=c:/xampp/htdocs/Rentalsalesmarketplace/logs
AUDIT_LOG_RETENTION_DAYS=90

# ============================================
# APPLICATION SETTINGS
# ============================================
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:5173
API_URL=http://localhost/api
APP_TIMEZONE=Africa/Kigali
```

---

## Testing

**Test MFA:**
```bash
curl -X POST http://localhost/api/controllers/mfa.php \
  -H "Content-Type: application/json" \
  -d '{"action":"send_code","user_id":1,"method":"sms"}'
```

**Test Rate Limiting:**
```bash
for i in {1..10}; do
  curl http://localhost/api/controllers/users.php
done
```

---

## Security Checklist

- [x] MFA for withdrawals
- [x] Biometric login
- [x] KYC verification
- [x] Escrow triple approval
- [x] Anti-fraud detection
- [x] Data encryption
- [x] Rate limiting
- [x] IP tracking
- [x] Audit logging
- [x] Image verification

---

## Production Deployment

1. **Enable HTTPS** - SSL certificate required for WebAuthn
2. **Set strong encryption keys**
3. **Configure SMS provider** (Africa's Talking)
4. **Setup cron jobs**
5. **Enable AWS/Google APIs**
6. **Configure firewall rules**
7. **Setup monitoring alerts**

---

## Support

Niba hari ikibazo, contact: security@newsoko.rw
