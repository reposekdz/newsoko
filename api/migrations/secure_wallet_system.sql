-- ============================================================
-- ADVANCED SECURE WALLET SYSTEM WITH PIN & COMMISSION
-- ============================================================

-- Enhanced User Wallets with Security
CREATE TABLE IF NOT EXISTS secure_wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    pending_balance DECIMAL(15, 2) DEFAULT 0.00,
    escrow_balance DECIMAL(15, 2) DEFAULT 0.00,
    total_earned DECIMAL(15, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(15, 2) DEFAULT 0.00,
    commission_paid DECIMAL(15, 2) DEFAULT 0.00,
    pin_hash VARCHAR(255) NOT NULL,
    pin_attempts INT DEFAULT 0,
    pin_locked_until TIMESTAMP NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255) DEFAULT NULL,
    withdrawal_limit_daily DECIMAL(15, 2) DEFAULT 1000000.00,
    withdrawal_limit_monthly DECIMAL(15, 2) DEFAULT 5000000.00,
    kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_level ENUM('basic', 'intermediate', 'advanced') DEFAULT 'basic',
    bank_account_number VARCHAR(50) DEFAULT NULL,
    bank_name VARCHAR(100) DEFAULT NULL,
    mobile_money_number VARCHAR(20) DEFAULT NULL,
    mobile_money_provider ENUM('mtn', 'airtel') DEFAULT NULL,
    auto_withdrawal_enabled BOOLEAN DEFAULT FALSE,
    auto_withdrawal_threshold DECIMAL(15, 2) DEFAULT 100000.00,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_balance (balance)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Secure Wallet Transactions with Commission Tracking
CREATE TABLE IF NOT EXISTS secure_wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    transaction_type ENUM('credit', 'debit', 'commission', 'payout', 'refund', 'escrow_hold', 'escrow_release') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    commission_amount DECIMAL(15, 2) DEFAULT 0.00,
    commission_rate DECIMAL(5, 2) DEFAULT 0.00,
    net_amount DECIMAL(15, 2) NOT NULL,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    reference_type ENUM('booking', 'sale', 'withdrawal', 'deposit', 'refund', 'commission') NOT NULL,
    reference_id INT DEFAULT NULL,
    booking_id INT DEFAULT NULL,
    product_id INT DEFAULT NULL,
    description TEXT NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT NULL,
    payment_reference VARCHAR(100) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    security_verified BOOLEAN DEFAULT FALSE,
    pin_verified BOOLEAN DEFAULT FALSE,
    otp_verified BOOLEAN DEFAULT FALSE,
    admin_approved BOOLEAN DEFAULT FALSE,
    approved_by INT DEFAULT NULL,
    approved_at TIMESTAMP NULL,
    processed_at TIMESTAMP NULL,
    failed_reason TEXT DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES secure_wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_wallet (wallet_id),
    INDEX idx_type (transaction_type),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_reference (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commission Rules
CREATE TABLE IF NOT EXISTS commission_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    transaction_type ENUM('rental', 'sale', 'auction') NOT NULL,
    category_id INT DEFAULT NULL,
    min_amount DECIMAL(15, 2) DEFAULT 0.00,
    max_amount DECIMAL(15, 2) DEFAULT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    flat_fee DECIMAL(15, 2) DEFAULT 0.00,
    user_tier ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_type (transaction_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Automated Payout Schedule
CREATE TABLE IF NOT EXISTS payout_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    schedule_type ENUM('instant', 'daily', 'weekly', 'monthly') DEFAULT 'weekly',
    payout_day INT DEFAULT 1,
    payout_time TIME DEFAULT '09:00:00',
    min_payout_amount DECIMAL(15, 2) DEFAULT 10000.00,
    auto_payout_enabled BOOLEAN DEFAULT TRUE,
    last_payout_at TIMESTAMP NULL,
    next_payout_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES secure_wallets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_wallet (wallet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payout Requests
CREATE TABLE IF NOT EXISTS payout_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payout_method ENUM('bank', 'mobile_money') NOT NULL,
    bank_account VARCHAR(50) DEFAULT NULL,
    bank_name VARCHAR(100) DEFAULT NULL,
    mobile_number VARCHAR(20) DEFAULT NULL,
    mobile_provider ENUM('mtn', 'airtel') DEFAULT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    request_type ENUM('manual', 'automatic', 'scheduled') DEFAULT 'manual',
    pin_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(10) DEFAULT NULL,
    otp_verified BOOLEAN DEFAULT FALSE,
    otp_expires_at TIMESTAMP NULL,
    admin_review_required BOOLEAN DEFAULT FALSE,
    reviewed_by INT DEFAULT NULL,
    reviewed_at TIMESTAMP NULL,
    processed_at TIMESTAMP NULL,
    transaction_reference VARCHAR(100) DEFAULT NULL,
    failure_reason TEXT DEFAULT NULL,
    retry_count INT DEFAULT 0,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES secure_wallets(id) ON DELETE CASCADE,
    INDEX idx_wallet (wallet_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security Logs
CREATE TABLE IF NOT EXISTS wallet_security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    event_type ENUM('pin_change', 'pin_failed', 'pin_locked', 'withdrawal', 'large_transaction', 'suspicious_activity', 'login', 'settings_change') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    description TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    action_taken VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES secure_wallets(id) ON DELETE CASCADE,
    INDEX idx_wallet (wallet_id),
    INDEX idx_severity (severity),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP Verification
CREATE TABLE IF NOT EXISTS wallet_otp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    otp_type ENUM('withdrawal', 'pin_change', 'settings', 'large_transaction') NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES secure_wallets(id) ON DELETE CASCADE,
    INDEX idx_wallet (wallet_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default commission rules
INSERT INTO commission_rules (rule_name, transaction_type, commission_rate, flat_fee, user_tier, priority) VALUES
('Free Tier - Rental', 'rental', 15.00, 0, 'free', 1),
('Free Tier - Sale', 'sale', 10.00, 0, 'free', 1),
('Basic Tier - Rental', 'rental', 12.00, 0, 'basic', 2),
('Basic Tier - Sale', 'sale', 8.00, 0, 'basic', 2),
('Premium Tier - Rental', 'rental', 8.00, 0, 'premium', 3),
('Premium Tier - Sale', 'sale', 5.00, 0, 'premium', 3),
('Enterprise Tier - Rental', 'rental', 5.00, 0, 'enterprise', 4),
('Enterprise Tier - Sale', 'sale', 3.00, 0, 'enterprise', 4);

-- Update bookings table for commission tracking
ALTER TABLE bookings 
ADD COLUMN commission_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN commission_rate DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN seller_payout_amount DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN seller_payout_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
ADD COLUMN seller_payout_date TIMESTAMP NULL,
ADD COLUMN auto_payout_enabled BOOLEAN DEFAULT TRUE;
