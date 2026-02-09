# 🚀 NEWSOKO SECURITY - COMPLETE SETUP GUIDE

## 📋 Prerequisites

- XAMPP installed (PHP 7.4+, MySQL 5.7+)
- Composer installed
- Node.js 18+ and npm
- Active internet connection

---

## 🔧 STEP 1: Database Setup

```bash
cd c:\xampp\htdocs\Rentalsalesmarketplace\api
setup_security.bat
```

This creates all security tables.

---

## 🔑 STEP 2: External Service Registration

### A. Africa's Talking (SMS)

1. Go to https://africastalking.com
2. Click "Sign Up" → Choose "Rwanda"
3. Verify your account
4. Go to Dashboard → Settings → API Key
5. Copy your API Key and Username
6. Add to `.env`:
```
AFRICASTALKING_API_KEY=your_key
AFRICASTALKING_USERNAME=your_username
```

**Test SMS:**
```bash
curl -X POST https://api.africastalking.com/version1/messaging \
  -H "apiKey: YOUR_KEY" \
  -d "username=YOUR_USERNAME&to=+250788123456&message=Test"
```

---

### B. AWS Rekognition (Face Matching)

1. Go to https://aws.amazon.com
2. Create account (requires credit card)
3. Go to IAM → Users → Add User
4. Attach policy: `AmazonRekognitionFullAccess`
5. Create access key
6. Add to `.env`:
```
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
```

**Install SDK:**
```bash
cd c:\xampp\htdocs\Rentalsalesmarketplace\api
composer require aws/aws-sdk-php
```

---

### C. Google Cloud Vision (Image Analysis)

1. Go to https://console.cloud.google.com
2. Create new project "newsoko"
3. Enable "Cloud Vision API"
4. Go to IAM → Service Accounts → Create
5. Download JSON key file
6. Save as `c:\xampp\htdocs\Rentalsalesmarketplace\credentials.json`
7. Add to `.env`:
```
GOOGLE_APPLICATION_CREDENTIALS=c:/xampp/htdocs/Rentalsalesmarketplace/credentials.json
```

**Install SDK:**
```bash
composer require google/cloud-vision
```

---

### D. Flutterwave (Payments)

1. Go to https://flutterwave.com
2. Sign up → Choose "Rwanda"
3. Complete KYC verification
4. Go to Settings → API Keys
5. Copy Test/Live keys
6. Add to `.env`:
```
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx
```

---

### E. SendGrid (Email)

1. Go to https://sendgrid.com
2. Sign up (free tier: 100 emails/day)
3. Go to Settings → API Keys → Create
4. Add to `.env`:
```
SENDGRID_API_KEY=SG.xxxxx
```

**Install SDK:**
```bash
composer require sendgrid/sendgrid
```

---

## 📦 STEP 3: Install Dependencies

```bash
cd c:\xampp\htdocs\Rentalsalesmarketplace\api
composer install

cd ..
npm install
```

---

## ⚙️ STEP 4: Configure Environment

1. Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

2. Edit `.env` with your API keys

3. Generate encryption key:
```bash
php -r "echo base64_encode(random_bytes(32));"
```
Add result to `ENCRYPTION_MASTER_KEY`

---

## 🔄 STEP 5: Setup Cron Jobs

### Windows Task Scheduler:

1. Open Task Scheduler
2. Create Basic Task → Name: "Newsoko Escrow Check"
3. Trigger: Daily, every 6 hours
4. Action: Start a program
5. Program: `C:\xampp\php\php.exe`
6. Arguments: `c:\xampp\htdocs\Rentalsalesmarketplace\api\cron\check_escrow.php`

### Alternative (Manual):
```bash
php c:\xampp\htdocs\Rentalsalesmarketplace\api\cron\check_escrow.php
```

---

## 🧪 STEP 6: Test APIs

```bash
cd c:\xampp\htdocs\Rentalsalesmarketplace\api
test_security_apis.bat
```

---

## 🌐 STEP 7: Frontend Integration

### Enable Biometric Login:

```typescript
// In your login component
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

const { checkSupport, authenticateBiometric } = useBiometricAuth();

// Check if supported
if (checkSupport()) {
  // Show biometric option
  const result = await authenticateBiometric(userId);
  if (result.success) {
    // Login successful
  }
}
```

---

## 🔒 STEP 8: Enable HTTPS (Production)

1. Get SSL certificate (Let's Encrypt free)
2. Configure Apache:
```apache
<VirtualHost *:443>
    ServerName newsoko.rw
    DocumentRoot "c:/xampp/htdocs/Rentalsalesmarketplace"
    
    SSLEngine on
    SSLCertificateFile "path/to/cert.pem"
    SSLCertificateKeyFile "path/to/key.pem"
</VirtualHost>
```

3. Update `.env`:
```
APP_URL=https://newsoko.rw
SESSION_SECURE=true
```

---

## 📊 STEP 9: Monitoring Setup

### Create monitoring dashboard:

```php
// api/admin/security_dashboard.php
<?php
require_once '../services/AntiFraudService.php';
require_once '../services/SecurityService.php';

$fraud = new AntiFraudService($db);
$security = new SecurityService($db);

$stats = $fraud->getFraudStats(7);
$auditLogs = $security->getAuditTrail(null, 7);

// Display dashboard
?>
```

---

## 🐛 STEP 10: Troubleshooting

### Issue: SMS not sending
**Solution:** Check Africa's Talking balance and API key

### Issue: Face matching fails
**Solution:** Verify AWS credentials and Rekognition is enabled

### Issue: Rate limiting too strict
**Solution:** Adjust in `.env`:
```
RATE_LIMIT_REQUESTS=100
```

### Issue: Biometric not working
**Solution:** Ensure HTTPS is enabled (required for WebAuthn)

---

## 📈 Performance Optimization

1. **Enable Redis for rate limiting:**
```bash
composer require predis/predis
```

2. **Enable MySQL query cache:**
```sql
SET GLOBAL query_cache_size = 67108864;
```

3. **Enable PHP OPcache:**
Edit `php.ini`:
```ini
opcache.enable=1
opcache.memory_consumption=128
```

---

## 🔐 Security Checklist

- [ ] All API keys in `.env` (not in code)
- [ ] HTTPS enabled in production
- [ ] Database passwords changed from default
- [ ] File upload directory secured
- [ ] Error reporting disabled in production
- [ ] Audit logs enabled
- [ ] Backup system configured
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] MFA enforced for admins

---

## 📞 Support

- Email: security@newsoko.rw
- Documentation: https://docs.newsoko.rw
- GitHub Issues: https://github.com/newsoko/marketplace/issues

---

## 🎯 Quick Reference

### Test User Login with MFA:
```bash
curl -X POST http://localhost/api/controllers/users.php \
  -d '{"action":"login","email":"test@test.com","password":"password"}'
```

### Check KYC Status:
```bash
curl -X POST http://localhost/api/controllers/kyc.php \
  -d '{"action":"status","user_id":1}'
```

### View Escrow Status:
```bash
curl -X POST http://localhost/api/controllers/escrow.php \
  -d '{"action":"status","booking_id":1}'
```

---

## 🚀 Production Deployment

1. Set `APP_ENV=production` in `.env`
2. Set `APP_DEBUG=false`
3. Enable all security features
4. Setup automated backups
5. Configure monitoring alerts
6. Test all APIs thoroughly
7. Enable Cloudflare DDoS protection
8. Setup log rotation

---

**Last Updated:** January 2025
**Version:** 1.0.0
