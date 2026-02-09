# Technical Architecture & Implementation Guide

## 🏗️ SYSTEM ARCHITECTURE

### Technology Stack

#### Frontend
```
Framework: React 18.x + TypeScript
Build Tool: Vite
Styling: Tailwind CSS
UI Library: shadcn/ui
Icons: Lucide React
State Management: React Context API
Routing: React Router v6
Forms: React Hook Form + Zod
HTTP Client: Fetch API
Real-time: WebSocket
Date Handling: date-fns
Charts: Recharts
Notifications: Sonner
Internationalization: react-i18next
```

#### Backend
```
Language: PHP 8.x
Database: MySQL 8.x
Authentication: JWT (JSON Web Tokens)
File Storage: Local + Cloud (optional)
Payment Gateway: Mobile Money API
Email: PHPMailer
SMS: Twilio/Africa's Talking
```

#### Infrastructure
```
Web Server: Apache/Nginx
Development: XAMPP
Version Control: Git
Package Manager: npm/yarn
```

---

## 📁 PROJECT STRUCTURE

```
Rentalsalesmarketplace/
├── api/                          # Backend API
│   ├── config/
│   │   ├── database.php         # DB configuration
│   │   └── jwt.php              # JWT settings
│   ├── controllers/
│   │   ├── auth.php             # Authentication
│   │   ├── products.php         # Product management
│   │   ├── bookings.php         # Booking operations
│   │   ├── payments.php         # Payment processing
│   │   ├── messages.php         # Messaging system
│   │   ├── admin.php            # Admin operations
│   │   └── ...
│   ├── models/
│   │   ├── User.php
│   │   ├── Product.php
│   │   ├── Booking.php
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.php             # Auth middleware
│   │   └── admin.php            # Admin middleware
│   └── utils/
│       ├── jwt.php              # JWT utilities
│       └── helpers.php          # Helper functions
│
├── src/                          # Frontend source
│   ├── app/
│   │   ├── App.tsx              # Main app component
│   │   └── components/
│   │       ├── pages/           # Page components
│   │       │   ├── HomePage.tsx
│   │       │   ├── ProductViewPage.tsx
│   │       │   ├── BookingsPage.tsx
│   │       │   ├── DashboardPage.tsx
│   │       │   ├── ProfilePage.tsx
│   │       │   ├── WalletPage.tsx
│   │       │   ├── MessagesPage.tsx
│   │       │   ├── AddListingPage.tsx
│   │       │   ├── SellerOrderManagement.tsx
│   │       │   ├── AdminDashboard.tsx
│   │       │   └── ...
│   │       ├── ui/              # Base UI components
│   │       │   ├── button.tsx
│   │       │   ├── card.tsx
│   │       │   ├── dialog.tsx
│   │       │   ├── input.tsx
│   │       │   └── ... (46 components)
│   │       ├── product/         # Product components
│   │       │   ├── ProductCard.tsx
│   │       │   ├── ProductDetailModal.tsx
│   │       │   └── ProductQA.tsx
│   │       ├── booking/         # Booking components
│   │       │   ├── BookingCalendar.tsx
│   │       │   ├── BookingModal.tsx
│   │       │   ├── BookingPurchaseFlow.tsx
│   │       │   └── EscrowBooking.tsx
│   │       ├── navigation/      # Navigation components
│   │       │   ├── ModernHeader.tsx
│   │       │   ├── AdvancedHeader.tsx
│   │       │   ├── BottomNav.tsx
│   │       │   └── CategoryFilter.tsx
│   │       ├── search/          # Search components
│   │       │   ├── AdvancedSearchBar.tsx
│   │       │   └── SavedSearches.tsx
│   │       ├── seller/          # Seller components
│   │       │   ├── SellerVerification.tsx
│   │       │   ├── AdvancedSellerVerification.tsx
│   │       │   ├── LivePhotoVerification.tsx
│   │       │   └── SellerPerformanceDashboard.tsx
│   │       ├── payment/         # Payment components
│   │       │   ├── WalletCheckout.tsx
│   │       │   ├── EscrowProgressTracker.tsx
│   │       │   └── InstantPayoutSetup.tsx
│   │       ├── wallet/          # Wallet components
│   │       │   ├── WalletManagement.tsx
│   │       │   └── SecureWalletSystem.tsx
│   │       ├── chat/            # Chat components
│   │       │   └── RealTimeChat.tsx
│   │       ├── auctions/        # Auction components
│   │       │   └── AuctionMarketplace.tsx
│   │       ├── disputes/        # Dispute components
│   │       │   ├── DisputeManagement.tsx
│   │       │   ├── DisputeForm.tsx
│   │       │   └── ReviewForm.tsx
│   │       ├── admin/           # Admin components
│   │       │   └── PlatformAnalyticsDashboard.tsx
│   │       ├── analytics/       # Analytics components
│   │       │   └── PaymentAnalyticsDashboard.tsx
│   │       ├── notifications/   # Notification components
│   │       │   └── NotificationsCenter.tsx
│   │       ├── wishlist/        # Wishlist components
│   │       │   └── WishlistManager.tsx
│   │       ├── reviews/         # Review components
│   │       │   └── ReviewsRatings.tsx
│   │       ├── referrals/       # Referral components
│   │       │   └── ReferralProgram.tsx
│   │       ├── promo/           # Promo components
│   │       │   └── PromoCodeManager.tsx
│   │       ├── comparison/      # Comparison components
│   │       │   └── ProductComparison.tsx
│   │       ├── support/         # Support components
│   │       │   └── SupportTicketSystem.tsx
│   │       ├── shipping/        # Shipping components
│   │       │   └── ShippingTracker.tsx
│   │       ├── subscriptions/   # Subscription components
│   │       │   └── SubscriptionPlans.tsx
│   │       └── categories/      # Category components
│   │           └── CategoriesShowcase.tsx
│   │
│   ├── context/                 # React Context
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── AppContext.tsx       # Global app state
│   │
│   ├── services/                # API services
│   │   ├── api.ts               # Main API service
│   │   ├── completeApi.ts       # Extended API
│   │   ├── advancedApi.ts       # Advanced features
│   │   ├── marketplaceApi.ts    # Marketplace API
│   │   └── index.ts             # Service exports
│   │
│   ├── types/                   # TypeScript types
│   │   └── index.ts             # Type definitions
│   │
│   ├── hooks/                   # Custom hooks
│   │   └── useBiometricAuth.ts  # Biometric auth hook
│   │
│   ├── i18n/                    # Internationalization
│   │   ├── config.ts            # i18n configuration
│   │   └── translations.ts      # Translation files
│   │
│   ├── utils/                   # Utility functions
│   │   └── translations.ts      # Translation helpers
│   │
│   ├── data/                    # Mock data
│   │   └── mockData.ts          # Development data
│   │
│   ├── main.tsx                 # App entry point
│   └── index.css                # Global styles
│
├── public/                       # Static assets
│   ├── images/
│   └── icons/
│
├── .amazonq/                     # Amazon Q rules
│   └── rules/
│
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite config
├── tailwind.config.js            # Tailwind config
├── postcss.config.js             # PostCSS config
└── README.md                     # Main documentation
```

---

## 🗄️ DATABASE SCHEMA

### Core Tables

#### users
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  location VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### products
```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  owner_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  condition ENUM('new', 'like-new', 'good', 'fair'),
  rent_price DECIMAL(10,2),
  buy_price DECIMAL(10,2),
  deposit DECIMAL(10,2),
  address VARCHAR(500),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  images JSON,
  features JSON,
  is_available BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  approved_at TIMESTAMP NULL,
  approved_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);
```

#### bookings
```sql
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  booking_type ENUM('rental', 'purchase'),
  start_date DATE,
  end_date DATE,
  days INT,
  total_price DECIMAL(10,2),
  deposit DECIMAL(10,2),
  delivery_method ENUM('pickup', 'delivery'),
  delivery_address VARCHAR(500),
  delivery_fee DECIMAL(10,2),
  status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled'),
  payment_status ENUM('pending', 'paid', 'refunded'),
  payment_method VARCHAR(50),
  escrow_status ENUM('held', 'released', 'refunded'),
  seller_payout_amount DECIMAL(10,2),
  seller_payout_status ENUM('pending', 'completed'),
  commission_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

#### messages
```sql
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  product_id INT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### reviews
```sql
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  booking_id INT,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  images JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### wallet_transactions
```sql
CREATE TABLE wallet_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('credit', 'debit'),
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(255),
  payment_method VARCHAR(50),
  reference VARCHAR(100),
  status ENUM('pending', 'completed', 'failed'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### disputes
```sql
CREATE TABLE disputes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  filed_by INT NOT NULL,
  dispute_type VARCHAR(100),
  reason VARCHAR(255),
  description TEXT,
  evidence JSON,
  status ENUM('open', 'under_review', 'resolved', 'closed'),
  resolution TEXT,
  resolved_by INT,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (filed_by) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);
```

#### seller_verifications
```sql
CREATE TABLE seller_verifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  document_type VARCHAR(50),
  document_number VARCHAR(100),
  document_image VARCHAR(500),
  selfie_image VARCHAR(500),
  business_name VARCHAR(255),
  business_address TEXT,
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  status ENUM('pending', 'approved', 'rejected'),
  rejection_reason TEXT,
  verified_by INT,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);
```

#### auctions
```sql
CREATE TABLE auctions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  seller_id INT NOT NULL,
  starting_price DECIMAL(10,2) NOT NULL,
  current_bid DECIMAL(10,2),
  bid_increment DECIMAL(10,2) DEFAULT 1000,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status ENUM('scheduled', 'active', 'ended', 'cancelled'),
  winner_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (winner_id) REFERENCES users(id)
);
```

#### auction_bids
```sql
CREATE TABLE auction_bids (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id INT NOT NULL,
  bidder_id INT NOT NULL,
  bid_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id),
  FOREIGN KEY (bidder_id) REFERENCES users(id)
);
```

---

## 🔐 AUTHENTICATION FLOW

### Registration
```
1. User submits registration form
2. Validate input data
3. Check if email/phone exists
4. Hash password (bcrypt)
5. Create user record
6. Send verification SMS/Email
7. Generate JWT token
8. Return token + user data
```

### Login
```
1. User submits credentials
2. Validate input
3. Find user by email/phone
4. Verify password
5. Generate JWT token
6. Update last login
7. Return token + user data
```

### JWT Token Structure
```json
{
  "user_id": 123,
  "email": "user@example.com",
  "role": "buyer",
  "is_verified": true,
  "exp": 1234567890
}
```

---

## 💳 PAYMENT FLOW

### Escrow System
```
1. Buyer initiates booking
2. Payment held in escrow
3. Seller notified of booking
4. Seller confirms availability
5. Product delivered/handed over
6. Buyer confirms receipt
7. Escrow released to seller
8. Platform commission deducted
9. Seller receives payout
```

### Payment Processing
```
1. User selects payment method
2. Generate payment request
3. Call Mobile Money API
4. User receives USSD prompt
5. User enters PIN
6. Payment confirmed
7. Update booking status
8. Send confirmation notifications
```

---

## 📡 API ENDPOINTS

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Products
```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/products/search
GET    /api/products/featured
GET    /api/products/trending
GET    /api/products/:id/related
```

### Bookings
```
GET    /api/bookings
GET    /api/bookings/:id
POST   /api/bookings
PUT    /api/bookings/:id
DELETE /api/bookings/:id
POST   /api/bookings/:id/cancel
POST   /api/bookings/:id/complete
GET    /api/bookings/seller
```

### Payments
```
POST   /api/payments/initiate
POST   /api/payments/verify
GET    /api/payments/history
POST   /api/wallet/topup
POST   /api/wallet/withdraw
GET    /api/wallet/balance
GET    /api/wallet/transactions
```

### Messages
```
GET    /api/messages/conversations
GET    /api/messages/:userId
POST   /api/messages/send
PUT    /api/messages/:id/read
```

### Reviews
```
GET    /api/reviews/product/:id
POST   /api/reviews
PUT    /api/reviews/:id
DELETE /api/reviews/:id
```

### Admin
```
GET    /api/admin/dashboard
GET    /api/admin/users
PUT    /api/admin/users/:id/verify
PUT    /api/admin/users/:id/ban
GET    /api/admin/products/pending
PUT    /api/admin/products/:id/approve
PUT    /api/admin/products/:id/reject
GET    /api/admin/disputes
PUT    /api/admin/disputes/:id/resolve
```

---

## 🔄 REAL-TIME FEATURES

### WebSocket Events
```javascript
// Client → Server
'message:send'
'bid:place'
'notification:read'

// Server → Client
'message:new'
'bid:update'
'notification:new'
'booking:update'
```

---

## 🛡️ SECURITY MEASURES

### Input Validation
- Sanitize all user inputs
- Validate data types
- Check string lengths
- Prevent SQL injection
- Prevent XSS attacks

### Authentication
- JWT tokens with expiration
- Secure password hashing (bcrypt)
- Rate limiting on login attempts
- Session management
- Two-factor authentication

### Authorization
- Role-based access control
- Permission checks on all endpoints
- Owner verification for resources
- Admin-only routes protected

### Data Protection
- HTTPS encryption
- Database encryption
- Secure file uploads
- PII data masking
- GDPR compliance

---

## 📊 PERFORMANCE OPTIMIZATION

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies
- Minification
- Tree shaking

### Backend
- Database indexing
- Query optimization
- Caching (Redis)
- CDN for static assets
- Load balancing

### Database
```sql
-- Indexes for performance
CREATE INDEX idx_products_owner ON products(owner_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_bookings_buyer ON bookings(buyer_id);
CREATE INDEX idx_bookings_seller ON bookings(seller_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
```

---

## 🧪 TESTING STRATEGY

### Unit Tests
- Component testing
- Function testing
- API endpoint testing

### Integration Tests
- User flows
- Payment processing
- Booking workflows

### E2E Tests
- Complete user journeys
- Cross-browser testing
- Mobile responsiveness

---

## 🚀 DEPLOYMENT

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Environment Variables
```
VITE_API_URL=http://localhost/api
VITE_WS_URL=ws://localhost:8080
VITE_PAYMENT_API_KEY=xxx
```

---

## 📈 MONITORING & ANALYTICS

### Metrics to Track
- User registrations
- Product listings
- Booking conversions
- Payment success rate
- Page load times
- API response times
- Error rates
- User engagement

### Tools
- Google Analytics
- Sentry (Error tracking)
- LogRocket (Session replay)
- Custom analytics dashboard

---

## 🔧 MAINTENANCE

### Regular Tasks
- Database backups (daily)
- Log rotation
- Security updates
- Performance monitoring
- User feedback review
- Bug fixes
- Feature updates

---

**Version**: 1.0.0
**Last Updated**: 2024
**Tech Stack**: React + TypeScript + PHP + MySQL
**License**: Proprietary
