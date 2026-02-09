# Complete Marketplace Features Documentation

## Overview
This is a comprehensive rental and sales marketplace platform for equipment, spare parts, and other items. The platform implements all features discussed in the Gemini AI conversation, including escrow payments, seller verification, product approval, disputes, ratings, and AI-based fraud detection.

## Core Features Implemented

### 1. Dual Transaction Model (Kugura & Gukodesha)

#### Sales (Kugura)
- Direct purchase of items
- One-time payment
- Immediate ownership transfer
- 10% platform commission (configurable)

#### Rentals (Gukodesha)
- Time-based rental (hours, days, weeks, months)
- Security deposit system
- Availability calendar
- Automatic deposit return on successful completion
- 15% platform commission (configurable)

### 2. Escrow Payment System (Amafaranga aguma muri Platform)

**How it works:**
1. Customer pays → Money held in platform escrow
2. Seller ships item → Customer confirms receipt
3. Platform releases payment to seller (minus commission)
4. If dispute → Money stays in escrow until resolved

**Benefits:**
- Protects buyers from fraud
- Protects sellers from non-payment
- Automatic commission deduction
- Refund capability for disputes

**API Endpoints:**
- `POST /escrow_management.php?action=create_booking_with_escrow`
- `POST /escrow_management.php?action=confirm_item_received`
- `POST /escrow_management.php?action=complete_rental`
- `POST /escrow_management.php?action=auto_release_escrow`

### 3. Seller Verification System (Kugenzura Umwirondoro)

**Verification Requirements:**
- National ID or Passport scan
- Business license (for businesses)
- Address proof
- Phone number verification
- Seller deposit payment (refundable security)

**Verification Process:**
1. Seller submits documents
2. Admin reviews and verifies identity
3. Seller pays security deposit
4. Account marked as "Verified"
5. Can start listing products

**API Endpoints:**
- `POST /seller_verification.php?action=submit_verification`
- `GET /seller_verification.php?user_verification=1`
- `POST /seller_verification.php?action=approve_verification`
- `POST /seller_verification.php?action=reject_verification`
- `POST /seller_verification.php?action=pay_seller_deposit`

### 4. Product Approval System (Kugenzura Ibicuruzwa)

**Approval Workflow:**
1. Seller creates product listing → Status: "Pending"
2. Admin reviews product details, photos, pricing
3. Admin approves or rejects with reason
4. Approved products go live on marketplace

**Features:**
- Live photo verification (camera capture required)
- Image watermarking with platform logo
- Duplicate image detection (hash-based)
- Price comparison with category average
- AI fraud detection scoring

**API Endpoints:**
- `POST /product_approval.php?action=create_product`
- `GET /product_approval.php?pending_products=1`
- `POST /product_approval.php?action=approve_product`
- `POST /product_approval.php?action=reject_product`
- `GET /product_approval.php?check_availability=1`

### 5. AI Fraud Detection (Kwirinda Ubujura)

**Detection Methods:**

#### Image Verification
- EXIF data analysis
- Stock photo watermark detection
- Duplicate image detection
- Perfect dimension flagging

#### Seller Behavior Analysis
- New account flagging (< 7 days)
- Bulk listing detection
- Suspiciously low pricing
- Verification status check

#### Description Analysis
- Spam keyword detection
- Excessive capitalization
- Contact information in description
- Very short descriptions

#### Transaction Monitoring
- Rapid cancellations
- Multiple disputes
- Pattern analysis

**Risk Scoring:**
- Low Risk: 0-39 points
- Medium Risk: 40-69 points
- High Risk: 70+ points

**Automatic Actions:**
- High risk → Manual review required
- Multiple violations → Account flagged
- Severe fraud → Account suspended

### 6. Dispute Management System (Gukemura Amakimbirane)

**Dispute Process:**
1. User files dispute with reason and evidence
2. Booking status → "Disputed"
3. Escrow payment held
4. Both parties can add messages/evidence
5. Admin reviews and resolves
6. Refund issued if applicable
7. Booking marked complete

**Dispute Reasons:**
- Item not as described
- Item damaged or defective
- Item not received
- Late delivery
- Seller unresponsive
- Quality issues
- Safety concerns

**API Endpoints:**
- `POST /dispute_management.php?action=file_dispute`
- `GET /dispute_management.php?user_disputes=1`
- `GET /dispute_management.php?all_disputes=1`
- `POST /dispute_management.php?action=add_dispute_message`
- `GET /dispute_management.php?dispute_messages=1`
- `POST /dispute_management.php?action=resolve_dispute`

### 7. Ratings & Reviews System

**Two-Tier Rating System:**
1. **Product Rating** - Quality, condition, accuracy
2. **Seller Rating** - Communication, delivery, service

**Features:**
- 5-star rating system
- Written reviews
- Seller reply capability
- Verified purchase badge
- Automatic seller flagging (3+ low ratings)
- Average rating calculation

**Automatic Actions:**
- Seller with 3+ ratings ≤ 2 stars → Account flagged
- Low-rated products → Lower search ranking
- High-rated sellers → "Top Seller" badge

**API Endpoints:**
- `POST /ratings_reviews.php?action=submit_review`
- `GET /ratings_reviews.php?product_reviews=1`
- `GET /ratings_reviews.php?seller_reviews=1`
- `POST /ratings_reviews.php?action=reply_review`

### 8. Security Deposit System (Kwitangira)

**For Rentals:**
- Deposit amount set by owner
- Held in escrow during rental period
- Returned if item returned in good condition
- Deducted for damages

**Deposit Flow:**
1. Renter pays: Rental fee + Security deposit
2. Rental period ends
3. Owner inspects item condition
4. If good → Deposit returned
5. If damaged → Deposit deducted (partial/full)

### 9. Availability Calendar (Kureba igihe kirahari)

**Features:**
- Real-time availability checking
- Date range blocking
- Automatic booking conflicts prevention
- Visual calendar display

**API Endpoints:**
- `GET /product_approval.php?availability_calendar=1`
- `GET /product_approval.php?check_availability=1`

### 10. Commission System (Ijanisha)

**Commission Structure:**
- Sales: 10% default (configurable per category)
- Rentals: 15% default (configurable per category)
- Automatic deduction from escrow
- Transparent calculation shown to users

**Commission Settings:**
- Global default rates
- Category-specific rates
- Minimum/maximum commission caps
- Admin configurable

### 11. Wallet System

**Features:**
- Top-up via Mobile Money (MTN, Airtel)
- Withdrawal to Mobile Money
- Transaction history
- Balance tracking
- Automatic refunds to wallet

**Transaction Types:**
- Topup
- Withdrawal
- Payment
- Refund
- Commission
- Deposit return

### 12. Notification System

**Notification Types:**
- Booking updates
- Payment confirmations
- Dispute notifications
- Review notifications
- Verification status
- Admin messages

**Channels:**
- In-app notifications
- Email notifications
- SMS notifications (optional)
- Push notifications

### 13. Seller Performance Metrics

**Tracked Metrics:**
- Total sales/rentals
- Total revenue
- Average response time
- Cancellation rate
- Dispute rate
- On-time delivery rate
- Average rating

**Used For:**
- Seller ranking
- Trust badges
- Search ranking
- Performance insights

## Database Schema

### New Tables Created:
1. `seller_verifications` - Seller identity verification
2. `product_images` - Image storage with fraud detection
3. `escrow_transactions` - Payment escrow management
4. `disputes` - Dispute cases
5. `dispute_messages` - Dispute communication
6. `ratings_reviews` - Product and seller reviews
7. `fraud_detection_logs` - AI fraud detection logs
8. `wallet_transactions` - Wallet operations
9. `product_availability` - Rental calendar
10. `commission_settings` - Commission configuration
11. `seller_metrics` - Performance tracking
12. `notification_preferences` - User notification settings

### Enhanced Existing Tables:
- `products` - Added approval, ratings, security deposit
- `users` - Added seller rating, wallet, account status
- `bookings` - Added escrow, deposits, item condition

## API Controllers Created

1. **seller_verification.php** - Seller verification management
2. **product_approval.php** - Product approval workflow
3. **escrow_management.php** - Escrow payment handling
4. **dispute_management.php** - Dispute resolution
5. **ratings_reviews.php** - Review system
6. **AIFraudDetection.php** - Fraud detection service

## Frontend Components Created

1. **DisputeForm.tsx** - File dispute interface
2. **ReviewForm.tsx** - Submit reviews interface
3. **SellerVerification.tsx** - Seller verification form
4. **EscrowBooking.tsx** - Booking with escrow
5. **AdminVerificationPanel.tsx** - Admin verification review
6. **AdminProductApproval.tsx** - Admin product approval

## Payment Integration

**Supported Methods:**
- MTN Mobile Money
- Airtel Money
- Bank Cards (via payment gateway)

**Payment Flow:**
1. User initiates payment
2. Payment gateway processes
3. Confirmation received
4. Funds held in escrow
5. Released after confirmation/auto-release

## Security Features

1. **Authentication** - JWT token-based
2. **Authorization** - Role-based access control
3. **Data Validation** - Input sanitization
4. **SQL Injection Prevention** - Prepared statements
5. **XSS Protection** - Output escaping
6. **CSRF Protection** - Token validation
7. **Rate Limiting** - API throttling
8. **Fraud Detection** - AI-based monitoring

## Admin Features

1. **User Management** - Ban, verify, manage users
2. **Product Approval** - Review and approve listings
3. **Dispute Resolution** - Resolve conflicts
4. **Verification Review** - Approve seller verifications
5. **Commission Settings** - Configure rates
6. **Analytics Dashboard** - Platform metrics
7. **Fraud Monitoring** - Review flagged activities

## Mobile Money Integration (Rwanda)

**Providers:**
- MTN Mobile Money
- Airtel Money

**Operations:**
- Payment collection
- Disbursements to sellers
- Wallet top-ups
- Withdrawals

## Installation & Setup

### 1. Database Setup
```bash
# Import main schema
mysql -u root -p newsoko < api/migrations/complete_marketplace_schema.sql

# Alter existing tables
mysql -u root -p newsoko < api/migrations/alter_existing_tables.sql
```

### 2. Configure Payment Gateway
Edit `api/config/payment_config.php`:
```php
define('MTN_API_KEY', 'your_mtn_api_key');
define('AIRTEL_API_KEY', 'your_airtel_api_key');
define('COMMISSION_RATE_SALE', 10.00);
define('COMMISSION_RATE_RENTAL', 15.00);
```

### 3. Start Development Server
```bash
npm install
npm run dev
```

## API Documentation

All API endpoints follow REST conventions:
- Base URL: `http://localhost/Rentalsalesmarketplace/api/controllers/`
- Authentication: Bearer token in Authorization header
- Content-Type: application/json

## Testing

### Test Accounts
- Admin: admin@newsoko.rw / admin123
- Seller: seller@newsoko.rw / seller123
- Buyer: buyer@newsoko.rw / buyer123

### Test Scenarios
1. Complete seller verification
2. Create and approve product
3. Make booking with escrow
4. Confirm item received
5. Leave review
6. File and resolve dispute

## Future Enhancements

1. Real-time chat between buyers/sellers
2. Advanced AI image recognition
3. Blockchain-based escrow
4. Multi-currency support
5. Mobile app (iOS/Android)
6. Delivery tracking integration
7. Insurance options
8. Subscription plans for sellers

## Support

For issues or questions:
- Email: support@newsoko.rw
- Phone: +250 XXX XXX XXX
- Documentation: https://docs.newsoko.rw

## License

Proprietary - All rights reserved
