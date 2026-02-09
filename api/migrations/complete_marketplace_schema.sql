-- Complete Marketplace Database Schema with All Features
-- Includes: Escrow, Seller Verification, Product Approval, Disputes, Ratings, AI Fraud Detection

-- Seller Verifications Table
CREATE TABLE IF NOT EXISTS seller_verifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    verification_type ENUM('individual', 'business') DEFAULT 'individual',
    id_document_url VARCHAR(500),
    business_license_url VARCHAR(500),
    address_proof_url VARCHAR(500),
    business_name VARCHAR(255),
    business_registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    phone_number VARCHAR(20),
    address TEXT,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    verified_by INT,
    verified_at TIMESTAMP NULL,
    seller_deposit_paid BOOLEAN DEFAULT FALSE,
    seller_deposit_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Product Images with Hash for Duplicate Detection
CREATE TABLE IF NOT EXISTS product_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_hash VARCHAR(64),
    is_primary BOOLEAN DEFAULT FALSE,
    fraud_score INT DEFAULT 0,
    fraud_flags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_image_hash (image_hash)
);

-- Escrow Transactions Table
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    transaction_type ENUM('payment', 'deposit', 'release', 'refund', 'commission') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    from_user INT,
    to_user INT,
    status ENUM('pending', 'held', 'completed', 'cancelled') DEFAULT 'pending',
    description TEXT,
    auto_release_date TIMESTAMP NULL,
    released_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (to_user) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_booking (booking_id),
    INDEX idx_status (status),
    INDEX idx_auto_release (auto_release_date)
);

-- Disputes Table
CREATE TABLE IF NOT EXISTS disputes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    filed_by INT NOT NULL,
    against_user INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence JSON,
    status ENUM('open', 'in_review', 'resolved', 'closed') DEFAULT 'open',
    resolution TEXT,
    resolved_by INT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (filed_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (against_user) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_booking (booking_id)
);

-- Dispute Messages Table
CREATE TABLE IF NOT EXISTS dispute_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dispute_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    attachments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_dispute (dispute_id)
);

-- Ratings and Reviews Table
CREATE TABLE IF NOT EXISTS ratings_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    target_id INT NOT NULL,
    target_type ENUM('product', 'seller') NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    seller_reply TEXT,
    replied_at TIMESTAMP NULL,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (booking_id, target_type),
    INDEX idx_target (target_id, target_type),
    INDEX idx_rating (rating)
);

-- Fraud Detection Logs Table
CREATE TABLE IF NOT EXISTS fraud_detection_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    product_id INT,
    detection_type ENUM('image', 'behavior', 'description', 'transaction') NOT NULL,
    risk_score INT NOT NULL,
    risk_level ENUM('low', 'medium', 'high') NOT NULL,
    flags JSON,
    action_taken ENUM('none', 'flagged', 'blocked', 'manual_review') DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_risk_level (risk_level),
    INDEX idx_user (user_id)
);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    transaction_type ENUM('topup', 'withdrawal', 'payment', 'refund', 'commission', 'deposit_return') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    reference_id INT,
    reference_type VARCHAR(50),
    description TEXT,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_type (transaction_type)
);

-- Product Availability Calendar
CREATE TABLE IF NOT EXISTS product_availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    booking_id INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('available', 'booked', 'blocked') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_product_dates (product_id, start_date, end_date)
);

-- Commission Settings Table
CREATE TABLE IF NOT EXISTS commission_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    transaction_type ENUM('sale', 'rental') NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    min_commission DECIMAL(10,2) DEFAULT 0.00,
    max_commission DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Seller Performance Metrics
CREATE TABLE IF NOT EXISTS seller_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_sales INT DEFAULT 0,
    total_rentals INT DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    average_response_time INT DEFAULT 0,
    cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
    dispute_rate DECIMAL(5,2) DEFAULT 0.00,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 100.00,
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id)
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    booking_updates BOOLEAN DEFAULT TRUE,
    payment_updates BOOLEAN DEFAULT TRUE,
    dispute_updates BOOLEAN DEFAULT TRUE,
    review_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id)
);
