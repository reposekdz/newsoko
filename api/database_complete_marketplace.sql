-- Complete Rental & Sales Marketplace Database
-- Features: Escrow System, Seller Verification, Product Approval, Security Deposits, Disputes, AI Fraud Detection

CREATE DATABASE IF NOT EXISTS rental_marketplace;
USE rental_marketplace;

-- Users Table with Enhanced Verification
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    location VARCHAR(255),
    wallet_balance DECIMAL(10,2) DEFAULT 0,
    seller_deposit DECIMAL(10,2) DEFAULT 0,
    total_sales INT DEFAULT 0,
    total_rentals INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_verified (is_verified),
    INDEX idx_banned (is_banned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seller Verification Documents
CREATE TABLE seller_verifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    document_type ENUM('national_id','passport','business_license','rdb_certificate','rra_certificate') NOT NULL,
    document_number VARCHAR(100),
    document_image VARCHAR(500),
    selfie_image VARCHAR(500),
    business_name VARCHAR(255),
    business_address TEXT,
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    verified_by INT,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products Table with Approval System
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('vehicles','electronics','clothing','houses','furniture','tools','spare_parts','machinery','others') NOT NULL,
    subcategory VARCHAR(100),
    images TEXT,
    rent_price DECIMAL(10,2),
    buy_price DECIMAL(10,2),
    address VARCHAR(255),
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    owner_id INT NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    deposit DECIMAL(10,2),
    features TEXT,
    condition_status ENUM('new','like-new','good','fair') DEFAULT 'good',
    approval_status ENUM('pending','approved','rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    watermark_applied BOOLEAN DEFAULT FALSE,
    live_photo_verified BOOLEAN DEFAULT FALSE,
    ai_fraud_score DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_owner (owner_id),
    INDEX idx_category (category),
    INDEX idx_approval (approval_status),
    INDEX idx_available (is_available),
    INDEX idx_featured (is_featured),
    FULLTEXT idx_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Availability Calendar
CREATE TABLE product_availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE,
    booking_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings/Orders Table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    renter_id INT NOT NULL,
    owner_id INT NOT NULL,
    booking_type ENUM('rental','purchase') NOT NULL,
    start_date DATE,
    end_date DATE,
    rental_days INT,
    item_price DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2),
    total_price DECIMAL(10,2) NOT NULL,
    platform_commission DECIMAL(10,2) NOT NULL,
    owner_payout DECIMAL(10,2) NOT NULL,
    status ENUM('pending','confirmed','active','completed','cancelled','disputed') DEFAULT 'pending',
    payment_status ENUM('pending','paid','refunded','partial_refund') DEFAULT 'pending',
    escrow_status ENUM('locked','released','refunded') DEFAULT 'locked',
    delivery_address TEXT,
    delivery_method ENUM('pickup','delivery') DEFAULT 'pickup',
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    item_received BOOLEAN DEFAULT FALSE,
    item_received_at TIMESTAMP NULL,
    item_returned BOOLEAN DEFAULT FALSE,
    item_returned_at TIMESTAMP NULL,
    deposit_returned BOOLEAN DEFAULT FALSE,
    deposit_returned_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    cancelled_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_renter (renter_id),
    INDEX idx_owner (owner_id),
    INDEX idx_status (status),
    INDEX idx_payment (payment_status),
    INDEX idx_escrow (escrow_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Escrow System
CREATE TABLE escrow (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    owner_amount DECIMAL(10,2) NOT NULL,
    status ENUM('locked','released','refunded','partial_refund') DEFAULT 'locked',
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP NULL,
    release_to_owner DECIMAL(10,2),
    refund_to_renter DECIMAL(10,2),
    release_reason TEXT,
    auto_release_date TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id),
    INDEX idx_status (status),
    INDEX idx_auto_release (auto_release_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Transactions
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('mtn_momo','airtel_money','bank_card','wallet') NOT NULL,
    payment_type ENUM('booking','deposit','topup','withdrawal','refund') NOT NULL,
    phone_number VARCHAR(20),
    status ENUM('pending','processing','completed','failed','cancelled') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    reference VARCHAR(100) UNIQUE,
    gateway_response TEXT,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_reference (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wallet Transactions
CREATE TABLE wallet_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type ENUM('credit','debit') NOT NULL,
    transaction_type ENUM('topup','withdrawal','payout','refund','commission','deposit_lock','deposit_return') NOT NULL,
    reference_id INT,
    reference_type ENUM('booking','payment','escrow'),
    description TEXT,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews and Ratings
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    product_id INT,
    review_type ENUM('product','seller','buyer') NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images TEXT,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id),
    INDEX idx_reviewer (reviewer_id),
    INDEX idx_reviewee (reviewee_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Disputes System
CREATE TABLE disputes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    filed_by INT NOT NULL,
    against_user INT NOT NULL,
    reason ENUM('item_not_received','item_damaged','item_fake','wrong_item','not_as_described','payment_issue','other') NOT NULL,
    description TEXT NOT NULL,
    evidence TEXT,
    status ENUM('open','under_review','resolved','closed') DEFAULT 'open',
    resolution TEXT,
    resolved_by INT,
    resolved_at TIMESTAMP NULL,
    refund_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (filed_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (against_user) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_booking (booking_id),
    INDEX idx_filed_by (filed_by),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dispute Messages
CREATE TABLE dispute_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dispute_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    attachments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_dispute (dispute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages/Chat
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    product_id INT,
    booking_id INT,
    content TEXT NOT NULL,
    attachments TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_from (from_user_id),
    INDEX idx_to (to_user_id),
    INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('booking','payment','message','review','dispute','verification','system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_id INT,
    reference_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favorites/Wishlist
CREATE TABLE favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, product_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Views Analytics
CREATE TABLE product_views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product (product_id),
    INDEX idx_viewed (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fraud Detection Logs
CREATE TABLE fraud_detection_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    product_id INT,
    detection_type ENUM('fake_image','duplicate_listing','suspicious_behavior','multiple_accounts') NOT NULL,
    risk_score DECIMAL(3,2) NOT NULL,
    details TEXT,
    action_taken ENUM('none','flagged','blocked','banned') DEFAULT 'none',
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_product (product_id),
    INDEX idx_risk (risk_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Activity Logs
CREATE TABLE admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type ENUM('user','product','booking','dispute','verification') NOT NULL,
    target_id INT NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin (admin_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Platform Settings
CREATE TABLE platform_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string','number','boolean','json') DEFAULT 'string',
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Platform Settings
INSERT INTO platform_settings (setting_key, setting_value, setting_type, description) VALUES
('commission_rate', '0.10', 'number', 'Platform commission rate (10%)'),
('seller_deposit_required', '50000', 'number', 'Required seller deposit in RWF'),
('auto_release_days', '3', 'number', 'Days after delivery to auto-release escrow'),
('min_withdrawal_amount', '5000', 'number', 'Minimum wallet withdrawal amount'),
('featured_listing_price', '10000', 'number', 'Price for featured listing per month'),
('max_images_per_product', '10', 'number', 'Maximum images allowed per product'),
('enable_ai_fraud_detection', 'true', 'boolean', 'Enable AI-based fraud detection'),
('require_seller_verification', 'true', 'boolean', 'Require seller verification before listing');

-- Sample Data
INSERT INTO users (name, email, phone, password, avatar, is_verified, is_admin, rating, review_count, location, wallet_balance) VALUES
('Admin User', 'admin@newsoko.rw', '+250788000000', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=1', TRUE, TRUE, 5.0, 0, 'Kigali, Rwanda', 0),
('Jean Baptiste Mugabo', 'jb.mugabo@example.rw', '+250788123456', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=2', TRUE, FALSE, 4.8, 45, 'Kigali, Kicukiro', 150000),
('Marie Claire Uwase', 'mc.uwase@example.rw', '+250788234567', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=5', TRUE, FALSE, 4.9, 67, 'Kigali, Gasabo', 250000),
('Patrick Nshimiyimana', 'p.nshimiyimana@example.rw', '+250788345678', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=3', FALSE, FALSE, 4.2, 12, 'Kigali, Nyarugenge', 50000);
