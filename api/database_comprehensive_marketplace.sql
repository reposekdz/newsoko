-- ============================================================
-- RENTAL & SALES MARKETPLACE - COMPREHENSIVE DATABASE SCHEMA
-- All features from Gemini AI conversation implementation
-- ============================================================

-- ============================================================
-- USERS TABLE - Extended for marketplace
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    profile_image VARCHAR(500) DEFAULT NULL,
    role ENUM('buyer', 'seller', 'admin', 'super_admin') DEFAULT 'buyer',
    status ENUM('active', 'inactive', 'suspended', 'pending_verification') DEFAULT 'pending_verification',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SELLER VERIFICATION TABLE
-- Based on Gemini AI recommendations for identity verification
-- ============================================================
CREATE TABLE IF NOT EXISTS seller_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    verification_type ENUM('individual', 'business', 'enterprise') NOT NULL,
    id_card_number VARCHAR(50) NOT NULL,
    id_card_front VARCHAR(500) NOT NULL,
    id_card_back VARCHAR(500) NOT NULL,
    id_card_expiry DATE DEFAULT NULL,
    business_name VARCHAR(255) DEFAULT NULL,
    business_registration_number VARCHAR(100) DEFAULT NULL,
    business_certificate VARCHAR(500) DEFAULT NULL,
    tax_id VARCHAR(100) DEFAULT NULL,
    tax_certificate VARCHAR(500) DEFAULT NULL,
    address_proof VARCHAR(500) DEFAULT NULL,
    gps_latitude DECIMAL(10, 8) DEFAULT NULL,
    gps_longitude DECIMAL(11, 8) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    province VARCHAR(100) DEFAULT NULL,
    district VARCHAR(100) DEFAULT NULL,
    sector VARCHAR(100) DEFAULT NULL,
    cell VARCHAR(100) DEFAULT NULL,
    village VARCHAR(100) DEFAULT NULL,
    selfie_photo VARCHAR(500) NOT NULL,
    verification_status ENUM('pending', 'under_review', 'approved', 'rejected', 'expired') DEFAULT 'pending',
    rejection_reason TEXT DEFAULT NULL,
    admin_notes TEXT DEFAULT NULL,
    admin_reviewed_by INT DEFAULT NULL,
    admin_reviewed_at TIMESTAMP NULL,
    deposit_amount DECIMAL(15, 2) DEFAULT 0.00,
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_paid_at TIMESTAMP NULL,
    verification_level INT DEFAULT 1,
    risk_score DECIMAL(5, 2) DEFAULT 0.00,
    fraud_indicators JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_verification_status (verification_status),
    INDEX idx_verification_type (verification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SELLER DEPOSIT TABLE - Security deposits for sellers
-- ============================================================
CREATE TABLE IF NOT EXISTS seller_deposits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RWF',
    deposit_type ENUM('refundable', 'non_refundable') DEFAULT 'refundable',
    status ENUM('pending', 'paid', 'frozen', 'released', 'forfeited') DEFAULT 'pending',
    payment_method ENUM('mobile_money', 'bank_transfer', 'card') DEFAULT NULL,
    transaction_id VARCHAR(100) DEFAULT NULL,
    reference_number VARCHAR(100) DEFAULT NULL,
    reason TEXT DEFAULT NULL,
    frozen_reason TEXT DEFAULT NULL,
    released_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_seller_id (seller_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_kiny VARCHAR(255) DEFAULT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    image VARCHAR(500) DEFAULT NULL,
    parent_id INT DEFAULT NULL,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_rental_allowed BOOLEAN DEFAULT TRUE,
    is_sale_allowed BOOLEAN DEFAULT TRUE,
    deposit_percentage DECIMAL(5, 2) DEFAULT 10.00,
    commission_percentage DECIMAL(5, 2) DEFAULT 10.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent_id (parent_id),
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRODUCTS TABLE - Extended for rentals and sales
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_kiny VARCHAR(255) DEFAULT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    description_kiny TEXT DEFAULT NULL,
    condition ENUM('new', 'like_new', 'good', 'fair', 'poor') DEFAULT 'good',
    brand VARCHAR(100) DEFAULT NULL,
    model VARCHAR(100) DEFAULT NULL,
    year_manufactured YEAR DEFAULT NULL,
    price DECIMAL(15, 2) NOT NULL,
    price_type ENUM('fixed', 'negotiable', 'auction') DEFAULT 'fixed',
    rental_price_hourly DECIMAL(15, 2) DEFAULT NULL,
    rental_price_daily DECIMAL(15, 2) DEFAULT NULL,
    rental_price_weekly DECIMAL(15, 2) DEFAULT NULL,
    rental_price_monthly DECIMAL(15, 2) DEFAULT NULL,
    rental_price_hourly_whole DECIMAL(15, 2) DEFAULT NULL,
    rental_price_daily_whole DECIMAL(15, 2) DEFAULT NULL,
    rental_min_hours INT DEFAULT 1,
    rental_available BOOLEAN DEFAULT TRUE,
    sale_available BOOLEAN DEFAULT TRUE,
    currency VARCHAR(10) DEFAULT 'RWF',
    security_deposit DECIMAL(15, 2) DEFAULT 0.00,
    quantity INT DEFAULT 1,
    sku VARCHAR(100) DEFAULT NULL,
    weight DECIMAL(10, 3) DEFAULT NULL,
    dimensions LENGTH DEFAULT NULL,
    location_province VARCHAR(100) DEFAULT NULL,
    location_district VARCHAR(100) DEFAULT NULL,
    location_sector VARCHAR(100) DEFAULT NULL,
    location_address TEXT DEFAULT NULL,
    gps_latitude DECIMAL(10, 8) DEFAULT NULL,
    gps_longitude DECIMAL(11, 8) DEFAULT NULL,
    images JSON DEFAULT NULL,
    videos JSON DEFAULT NULL,
    specifications JSON DEFAULT NULL,
    features JSON DEFAULT NULL,
    status ENUM('draft', 'pending', 'under_review', 'approved', 'rejected', 'sold', 'inactive') DEFAULT 'draft',
    approval_status ENUM('pending', 'approved', 'rejected', 'needs_revision') DEFAULT 'pending',
    rejection_reason TEXT DEFAULT NULL,
    admin_notes TEXT DEFAULT NULL,
    reviewed_by INT DEFAULT NULL,
    reviewed_at TIMESTAMP NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_boosted BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    inquiry_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    rating_avg DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    watermark_applied BOOLEAN DEFAULT FALSE,
    live_photo_verified BOOLEAN DEFAULT FALSE,
    live_photo_hash VARCHAR(255) DEFAULT NULL,
    ai_fraud_score DECIMAL(5, 2) DEFAULT 0.00,
    ai_fraud_indicators JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_seller_id (seller_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_approval_status (approval_status),
    INDEX idx_is_featured (is_featured),
    INDEX idx_is_rental_available (rental_available),
    INDEX idx_is_sale_available (sale_available),
    INDEX idx_slug (slug),
    FULLTEXT INDEX idx_fulltext_search (title, description, brand, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRODUCT APPROVAL LOG - Audit trail for product reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS product_approval_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    admin_id INT NOT NULL,
    action ENUM('submitted', 'approved', 'rejected', 'revision_requested', 'featured_added', 'featured_removed', 'boosted', 'unboosted') NOT NULL,
    previous_status VARCHAR(50) DEFAULT NULL,
    new_status VARCHAR(50) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    screenshots JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRODUCT IMAGES WITH WATERMARK TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_url_watermarked VARCHAR(500) DEFAULT NULL,
    thumbnail_url VARCHAR(500) DEFAULT NULL,
    image_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    watermark_applied BOOLEAN DEFAULT FALSE,
    original_hash VARCHAR(255) DEFAULT NULL,
    ai_analysis JSON DEFAULT NULL,
    is_fake_detected BOOLEAN DEFAULT FALSE,
    fake_detection_confidence DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BOOKINGS/RENTALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_number VARCHAR(50) NOT NULL UNIQUE,
    product_id INT NOT NULL,
    renter_id INT NOT NULL,
    seller_id INT NOT NULL,
    booking_type ENUM('hourly', 'daily', 'weekly', 'monthly', 'sale') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    total_hours DECIMAL(10, 2) DEFAULT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(15, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    service_fee DECIMAL(15, 2) DEFAULT 0.00,
    delivery_fee DECIMAL(15, 2) DEFAULT 0.00,
    insurance_fee DECIMAL(15, 2) DEFAULT 0.00,
    security_deposit DECIMAL(15, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RWF',
    status ENUM('pending', 'confirmed', 'pending_deposit', 'deposit_paid', 'in_progress', 'completed', 'cancelled', 'disputed', 'refunded') DEFAULT 'pending',
    payment_status ENUM('pending', 'partial', 'paid', 'refunded', 'failed') DEFAULT 'pending',
    payment_method ENUM('mobile_money', 'bank_transfer', 'card', 'cash') DEFAULT NULL,
    transaction_id VARCHAR(100) DEFAULT NULL,
    customer_notes TEXT DEFAULT NULL,
    seller_notes TEXT DEFAULT NULL,
    cancellation_reason TEXT DEFAULT NULL,
    cancelled_by INT DEFAULT NULL,
    cancelled_at TIMESTAMP NULL,
    confirmed_by INT DEFAULT NULL,
    confirmed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product_id (product_id),
    INDEX idx_renter_id (renter_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_booking_number (booking_number),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_booking_type (booking_type),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AVAILABILITY CALENDAR - Track product availability
-- ============================================================
CREATE TABLE IF NOT EXISTS product_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    booking_id INT DEFAULT NULL,
    date DATE NOT NULL,
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    status ENUM('available', 'booked', 'blocked', 'maintenance', 'unavailable') DEFAULT 'available',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_product_id (product_id),
    INDEX idx_date (date),
    INDEX idx_status (status),
    UNIQUE KEY uk_product_date_time (product_id, date, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ESCROW TRANSACTIONS - Secure payment holding
-- Based on Gemini AI Escrow System recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    booking_id INT DEFAULT NULL,
    product_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    platform_commission DECIMAL(15, 2) DEFAULT 0.00,
    commission_percentage DECIMAL(5, 2) DEFAULT 10.00,
    net_amount DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'RWF',
    type ENUM('sale', 'rental_deposit', 'security_deposit', 'refund') NOT NULL,
    status ENUM('pending', 'received', 'held', 'released', 'refunded', 'disputed', 'cancelled', 'expired') DEFAULT 'pending',
    payment_method ENUM('mobile_money', 'bank_transfer', 'card') DEFAULT NULL,
    payment_reference VARCHAR(100) DEFAULT NULL,
    payer_phone VARCHAR(20) DEFAULT NULL,
    payer_name VARCHAR(255) DEFAULT NULL,
    payout_method ENUM('mobile_money', 'bank_transfer', 'card') DEFAULT NULL,
    payout_reference VARCHAR(100) DEFAULT NULL,
    payout_phone VARCHAR(20) DEFAULT NULL,
    payout_bank_account VARCHAR(50) DEFAULT NULL,
    payout_bank_name VARCHAR(100) DEFAULT NULL,
    release_conditions JSON DEFAULT NULL,
    released_at TIMESTAMP NULL,
    released_by INT DEFAULT NULL,
    release_reason TEXT DEFAULT NULL,
    auto_release_date TIMESTAMP NULL,
    dispute_id INT DEFAULT NULL,
    buyer_confirmed BOOLEAN DEFAULT FALSE,
    buyer_confirmed_at TIMESTAMP NULL,
    seller_confirmed BOOLEAN DEFAULT FALSE,
    seller_confirmed_at TIMESTAMP NULL,
    admin_notes TEXT DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (released_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE SET NULL,
    INDEX idx_booking_id (booking_id),
    INDEX idx_product_id (product_id),
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_transaction_number (transaction_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DISPUTES TABLE - Conflict resolution system
-- ============================================================
CREATE TABLE IF NOT EXISTS disputes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispute_number VARCHAR(50) NOT NULL UNIQUE,
    booking_id INT DEFAULT NULL,
    escrow_transaction_id INT DEFAULT NULL,
    product_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    dispute_type ENUM('product_not_received', 'product_damaged', 'product_not_as_described', 'late_delivery', 'refund_request', 'payment_issue', 'other') NOT NULL,
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence JSON DEFAULT NULL,
    status ENUM('open', 'under_review', 'pending_evidence', 'mediation', 'resolved', 'closed', 'escalated') DEFAULT 'open',
    resolution ENUM('refund_buyer', 'release_seller', 'partial_refund', 'buyer_returns_product', 'seller_replacement', 'mutual_agreement', 'no_action') DEFAULT NULL,
    resolution_amount DECIMAL(15, 2) DEFAULT NULL,
    resolution_notes TEXT DEFAULT NULL,
    buyer_decision ENUM('accept', 'reject', 'pending') DEFAULT 'pending',
    buyer_decision_at TIMESTAMP NULL,
    seller_decision ENUM('accept', 'reject', 'pending') DEFAULT 'pending',
    seller_decision_at TIMESTAMP NULL,
    mediator_id INT DEFAULT NULL,
    mediator_notes TEXT DEFAULT NULL,
    escalated_at TIMESTAMP NULL,
    escalated_to VARCHAR(100) DEFAULT NULL,
    resolved_at TIMESTAMP NULL,
    resolved_by INT DEFAULT NULL,
    feedback_rating INT DEFAULT NULL,
    feedback_comment TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    deadline_at TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (escrow_transaction_id) REFERENCES escrow_transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mediator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_booking_id (booking_id),
    INDEX idx_escrow_transaction_id (escrow_transaction_id),
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_status (status),
    INDEX idx_dispute_type (dispute_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DISPUTE EVIDENCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS dispute_evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispute_id INT NOT NULL,
    uploaded_by INT NOT NULL,
    evidence_type ENUM('photo', 'video', 'document', 'screenshot', 'chat_log', 'other') NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_dispute_id (dispute_id),
    INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REVIEWS & RATINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    product_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    review_type ENUM('buyer_to_seller', 'seller_to_buyer', 'product_review') NOT NULL,
    rating_product INT NOT NULL CHECK (rating_product BETWEEN 1 AND 5),
    rating_communication INT CHECK (rating_communication BETWEEN 1 AND 5),
    rating_delivery INT CHECK (rating_delivery BETWEEN 1 AND 5),
    rating_overall INT NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
    title VARCHAR(255) DEFAULT NULL,
    review_text TEXT NOT NULL,
    response TEXT DEFAULT NULL,
    response_at TIMESTAMP NULL,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    status ENUM('pending', 'published', 'hidden', 'flagged', 'deleted') DEFAULT 'pending',
    flagged_reason TEXT DEFAULT NULL,
    helpful_count INT DEFAULT 0,
    report_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_product_id (product_id),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_reviewee_id (reviewee_id),
    INDEX idx_review_type (review_type),
    INDEX idx_status (status),
    UNIQUE KEY uk_booking_review (booking_id, reviewer_id, review_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REVIEWS HELPFUL VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    user_id INT NOT NULL,
    is_helpful BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_review_user (review_id, user_id),
    INDEX idx_review_id (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WALLETS TABLE - User wallet for platform transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    pending_balance DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'RWF',
    status ENUM('active', 'frozen', 'closed') DEFAULT 'active',
    mobile_money_number VARCHAR(20) DEFAULT NULL,
    bank_account_number VARCHAR(50) DEFAULT NULL,
    bank_name VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_wallet (user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WALLET TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('deposit', 'withdrawal', 'payment', 'refund', 'commission', 'bonus', 'adjustment', 'escrow_hold', 'escrow_release') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fee DECIMAL(15, 2) DEFAULT 0.00,
    net_amount DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'RWF',
    status ENUM('pending', 'completed', 'failed', 'cancelled', 'reversed') DEFAULT 'pending',
    payment_method ENUM('mobile_money', 'bank_transfer', 'card', 'internal') DEFAULT NULL,
    reference_id VARCHAR(100) DEFAULT NULL,
    reference_type VARCHAR(50) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    INDEX idx_wallet_id (wallet_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_reference (reference_id, reference_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PAYMENTS TABLE - Payment gateway integration
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    booking_id INT DEFAULT NULL,
    escrow_transaction_id INT DEFAULT NULL,
    wallet_transaction_id INT DEFAULT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RWF',
    payment_method ENUM('mobile_money', 'bank_transfer', 'card', 'wallet', 'cash') NOT NULL,
    provider ENUM('mtn_momo', 'airtel_money', 'visa', 'mastercard', 'bank_transfer', 'internal') DEFAULT NULL,
    provider_reference VARCHAR(255) DEFAULT NULL,
    provider_transaction_id VARCHAR(255) DEFAULT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed') DEFAULT 'pending',
    phone_number VARCHAR(20) DEFAULT NULL,
    payer_name VARCHAR(255) DEFAULT NULL,
    payer_email VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    webhook_data JSON DEFAULT NULL,
    callback_data JSON DEFAULT NULL,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    failure_reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (escrow_transaction_id) REFERENCES escrow_transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_escrow_transaction_id (escrow_transaction_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_provider_reference (provider_reference),
    INDEX idx_payment_number (payment_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FAVORITES/WISHLIST TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    notes TEXT DEFAULT NULL,
    price_alert BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_product (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    product_id INT DEFAULT NULL,
    booking_id INT DEFAULT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'offer', 'system') DEFAULT 'text',
    offer_amount DECIMAL(15, 2) DEFAULT NULL,
    offer_type ENUM('sale', 'rental') DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_product_id (product_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('booking', 'payment', 'message', 'review', 'dispute', 'verification', 'product', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON DEFAULT NULL,
    link VARCHAR(500) DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    channel ENUM('app', 'email', 'sms', 'push') DEFAULT 'app',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SUBSCRIPTIONS TABLE - Vendor subscription plans
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_type ENUM('free', 'basic', 'professional', 'enterprise') NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RWF',
    billing_cycle ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    status ENUM('active', 'cancelled', 'expired', 'past_due', 'paused') DEFAULT 'active',
    max_products INT DEFAULT 10,
    max_images_per_product INT DEFAULT 5,
    featured_listings_included INT DEFAULT 0,
    commission_discount DECIMAL(5, 2) DEFAULT 0.00,
    priority_support BOOLEAN DEFAULT FALSE,
    analytics_access BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    payment_method ENUM('mobile_money', 'bank_transfer', 'card') DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_plan_type (plan_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FEATURED LISTINGS TABLE - Paid promotions
-- ============================================================
CREATE TABLE IF NOT EXISTS featured_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    package_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RWF',
    position ENUM('homepage', 'category_top', 'search_results', 'all') DEFAULT 'all',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status ENUM('active', 'expired', 'cancelled', 'refunded') DEFAULT 'active',
    payment_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    INDEX idx_product_id (product_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ANALYTICS TRACKING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM('page_view', 'product_view', 'search', 'add_to_favorites', 'contact_seller', 'booking_started', 'booking_completed', 'payment_initiated', 'payment_completed') NOT NULL,
    user_id INT DEFAULT NULL,
    product_id INT DEFAULT NULL,
    session_id VARCHAR(100) DEFAULT NULL,
    device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT NULL,
    browser VARCHAR(100) DEFAULT NULL,
    os VARCHAR(100) DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    referrer VARCHAR(500) DEFAULT NULL,
    event_data JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FRAUD DETECTION LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS fraud_detection_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('user', 'product', 'payment', 'review', 'dispute') NOT NULL,
    entity_id INT NOT NULL,
    detection_type ENUM('fake_listing', 'suspicious_payment', 'fake_review', 'account_takeover', 'pattern_anomaly', 'location_mismatch') NOT NULL,
    risk_score DECIMAL(5, 2) NOT NULL,
    indicators JSON NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('detected', 'investigated', 'resolved', 'false_positive') DEFAULT 'detected',
    action_taken TEXT DEFAULT NULL,
    reviewed_by INT DEFAULT NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_detection_type (detection_type),
    INDEX idx_risk_score (risk_score),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AI FRAUD DETECTION ANALYSIS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_fraud_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('image', 'text', 'behavior', 'document') NOT NULL,
    entity_id INT NOT NULL,
    analysis_type ENUM('fake_image', 'duplicate_detection', 'sentiment_analysis', 'pattern_matching', 'face_recognition') NOT NULL,
    model_version VARCHAR(50) DEFAULT NULL,
    confidence_score DECIMAL(5, 2) DEFAULT 0.00,
    result JSON NOT NULL,
    recommendations JSON DEFAULT NULL,
    processing_time_ms INT DEFAULT NULL,
    cost DECIMAL(10, 4) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_analysis_type (analysis_type),
    INDEX idx_confidence_score (confidence_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CONVERSATIONS TABLE - For chat system
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL UNIQUE,
    participant_ids JSON NOT NULL,
    product_id INT DEFAULT NULL,
    last_message TEXT DEFAULT NULL,
    last_message_at TIMESTAMP NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_participant_ids (participant_ids(100)),
    INDEX idx_product_id (product_id),
    INDEX idx_last_message_at (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DEVICE TOKENS - For push notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS device_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_token VARCHAR(500) NOT NULL,
    device_type ENUM('ios', 'android', 'web') NOT NULL,
    app_version VARCHAR(20) DEFAULT NULL,
    os_version VARCHAR(50) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_device (user_id, device_token),
    INDEX idx_user_id (user_id),
    INDEX idx_device_token (device_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EMAIL VERIFICATION TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SYSTEM SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'integer', 'boolean', 'json', 'array') DEFAULT 'string',
    description TEXT DEFAULT NULL,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('platform_name', 'RentalSalesMarketplace', 'string', 'Platform name'),
('platform_email', 'info@rentalsalesmarketplace.rw', 'string', 'Platform contact email'),
('platform_phone', '+250788123456', 'string', 'Platform contact phone'),
('default_currency', 'RWF', 'string', 'Default currency code'),
('default_commission_percentage', '10.00', 'string', 'Default commission percentage for sales'),
('rental_commission_percentage', '8.00', 'string', 'Default commission percentage for rentals'),
('min_deposit_percentage', '10.00', 'string', 'Minimum security deposit percentage'),
('max_deposit_percentage', '50.00', 'string', 'Maximum security deposit percentage'),
('escrow_hold_period_days', '3', 'string', 'Days to hold escrow after delivery confirmation'),
('auto_release_enabled', 'true', 'boolean', 'Enable automatic escrow release'),
('verification_required_for_sales', 'true', 'boolean', 'Require seller verification for sales'),
('verification_required_for_rentals', 'true', 'boolean', 'Require seller verification for rentals'),
('ai_fraud_detection_enabled', 'true', 'boolean', 'Enable AI-powered fraud detection'),
('auto_approve_products', 'false', 'boolean', 'Auto-approve products without manual review'),
('max_images_per_product', '10', 'string', 'Maximum images per product listing'),
('max_listing_title_length', '150', 'string', 'Maximum characters for listing title'),
('max_listing_description_length', '5000', 'string', 'Maximum characters for listing description'),
('booking_cancellation_window_hours', '24', 'string', 'Hours before booking to allow free cancellation'),
('late_return_fee_percentage', '5.00', 'string', 'Percentage of rental rate for late returns'),
('mtn_momo_enabled', 'true', 'boolean', 'Enable MTN Mobile Money'),
('airtel_money_enabled', 'true', 'boolean', 'Enable Airtel Money'),
('bank_transfer_enabled', 'true', 'boolean', 'Enable bank transfer payments');

-- ============================================================
-- RWANDA LOCATIONS DATA
-- ============================================================
CREATE TABLE IF NOT EXISTS rwanda_provinces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_kiny VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    gps_latitude DECIMAL(10, 8) DEFAULT NULL,
    gps_longitude DECIMAL(11, 8) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rwanda_districts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    province_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_kiny VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    gps_latitude DECIMAL(10, 8) DEFAULT NULL,
    gps_longitude DECIMAL(11, 8) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES rwanda_provinces(id) ON DELETE CASCADE,
    INDEX idx_province_id (province_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rwanda_sectors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    district_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_kiny VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES rwanda_districts(id) ON DELETE CASCADE,
    INDEX idx_district_id (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Rwanda provinces
INSERT INTO rwanda_provinces (name, name_kiny, code, gps_latitude, gps_longitude) VALUES
('Kigali City', 'Umujyi wa Kigali', 'KIG', -1.9705786, 30.0587086),
('Southern Province', 'Intara y'Amajyepfo', 'SOUTH', -2.1533924, 29.7444214),
('Northern Province', 'Intara y'Amajyaruguru', 'NORTH', -1.6160112, 29.9017291),
('Eastern Province', 'Intara y'uburasirazuba', 'EAST', -2.0000000, 30.5000000),
('Western Province', 'Intara y'ibiyere', 'WEST', -2.0638600, 29.5333300),
('Southern Province', 'Intara y'Amajyepfo', 'SOUTH', -2.7500000, 29.5000000);

-- Insert Rwanda districts
INSERT INTO rwanda_districts (province_id, name, name_kiny, code, gps_latitude, gps_longitude) VALUES
(1, 'Gasabo', 'Gasabo', 'KIG-GAS', -1.9742823, 30.1234567),
(1, 'Kicukiro', 'Kicukiro', 'KIG-KIC', -1.9556325, 30.1391458),
(1, 'Nyarugenge', 'Nyarugenge', 'KIG-NYA', -1.9443388, 30.0441392);

-- ============================================================
-- SAMPLE CATEGORIES
-- ============================================================
INSERT INTO categories (name, name_kiny, slug, description, is_rental_allowed, is_sale_allowed, deposit_percentage, commission_percentage) VALUES
('Automotive Parts', 'ibikoresho by\'imodoka', 'automotive-parts', 'Spare parts and accessories for all vehicle types', TRUE, TRUE, 15.00, 10.00),
('Heavy Machinery', 'imashini nziza', 'heavy-machinery', 'Construction and industrial equipment', TRUE, TRUE, 25.00, 8.00),
('Agricultural Equipment', 'ibikoresho by\'ubuhinzi', 'agricultural-equipment', 'Farm machinery and tools', TRUE, TRUE, 20.00, 8.00),
('Electronics', 'ibikoresho by\'ikoranabuhanga', 'electronics', 'Electronic devices and gadgets', TRUE, TRUE, 10.00, 12.00),
('Tools & Hardware', 'ibikoresho n\'ibindi', 'tools-hardware', 'Hand and power tools', TRUE, TRUE, 10.00, 10.00),
('Office Equipment', 'ibikoresho by\'akazi', 'office-equipment', 'Office machinery and furniture', TRUE, TRUE, 15.00, 10.00),
('Medical Equipment', 'ibikoresho by\'ubuvuzi', 'medical-equipment', 'Healthcare and medical devices', TRUE, TRUE, 30.00, 8.00),
('Home & Garden', 'inzu n\'umuhaka', 'home-garden', 'Home appliances and garden equipment', TRUE, TRUE, 10.00, 12.00),
('Sports & Recreation', 'imereranya n\'ibyo gukina', 'sports-recreation', 'Sports equipment and recreational gear', TRUE, TRUE, 10.00, 12.00),
('Industrial Machinery', 'imashini foromo', 'industrial-machinery', 'Heavy industrial equipment', TRUE, TRUE, 30.00, 6.00);