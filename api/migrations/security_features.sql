-- COMPREHENSIVE SECURITY FEATURES FOR NEWSOKO MARKETPLACE

-- 1. Multi-Factor Authentication Tables
CREATE TABLE IF NOT EXISTS mfa_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    method ENUM('sms', 'email', 'totp') NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    secret_key VARCHAR(255),
    backup_codes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mfa_verification_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    code VARCHAR(10) NOT NULL,
    method ENUM('sms', 'email') NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_code_expiry (code, expires_at)
);

-- 2. Biometric Authentication
CREATE TABLE IF NOT EXISTS biometric_credentials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    credential_id VARCHAR(255) NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    device_name VARCHAR(100),
    device_type ENUM('fingerprint', 'face_id', 'windows_hello') NOT NULL,
    last_used DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. KYC/Identity Verification
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    id_type ENUM('national_id', 'passport', 'driving_license') NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    id_front_image VARCHAR(255),
    id_back_image VARCHAR(255),
    selfie_image VARCHAR(255),
    face_match_score DECIMAL(5,2),
    verification_status ENUM('pending', 'verified', 'rejected', 'expired') DEFAULT 'pending',
    verified_by INT,
    verified_at DATETIME,
    rejection_reason TEXT,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Escrow System with Triple Approval
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('held', 'customer_approved', 'refund_period_passed', 'admin_approved', 'released', 'refunded') DEFAULT 'held',
    customer_approval_at DATETIME,
    refund_deadline DATETIME,
    admin_approval_at DATETIME,
    admin_approved_by INT,
    release_date DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Anti-Fraud Card Testing Detection
CREATE TABLE IF NOT EXISTS payment_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    ip_address VARCHAR(45) NOT NULL,
    card_fingerprint VARCHAR(64),
    amount DECIMAL(10,2),
    status ENUM('success', 'failed', 'blocked') NOT NULL,
    failure_reason VARCHAR(255),
    device_fingerprint VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip_time (ip_address, created_at),
    INDEX idx_user_time (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS blocked_entities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_type ENUM('ip', 'user', 'card', 'device') NOT NULL,
    entity_value VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    blocked_until DATETIME,
    is_permanent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_entity (entity_type, entity_value)
);

-- 6. Data Encryption Keys (for AES-256)
CREATE TABLE IF NOT EXISTS encryption_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(50) NOT NULL UNIQUE,
    encrypted_key TEXT NOT NULL,
    algorithm VARCHAR(20) DEFAULT 'AES-256-CBC',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rotated_at DATETIME
);

-- 7. Audit Logs for Critical Actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_action (user_id, action_type, created_at),
    INDEX idx_severity (severity, created_at)
);

-- 8. IP Tracking and Geolocation
CREATE TABLE IF NOT EXISTS login_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    country VARCHAR(50),
    city VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    device_type VARCHAR(50),
    browser VARCHAR(50),
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_score INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_ip (user_id, ip_address, created_at)
);

-- 9. Rate Limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    identifier VARCHAR(255) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    request_count INT DEFAULT 1,
    window_start DATETIME NOT NULL,
    blocked_until DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_limit (identifier, endpoint, window_start)
);

-- 10. Image Verification
CREATE TABLE IF NOT EXISTS image_verifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    image_hash VARCHAR(64) NOT NULL,
    is_duplicate BOOLEAN DEFAULT FALSE,
    is_stock_photo BOOLEAN DEFAULT FALSE,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    google_vision_labels TEXT,
    confidence_score DECIMAL(5,2),
    verified_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_hash (image_hash)
);

-- Add security columns to existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kyc_verified_at DATETIME,
ADD COLUMN IF NOT EXISTS risk_level ENUM('low', 'medium', 'high') DEFAULT 'low',
ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_reason TEXT,
ADD COLUMN IF NOT EXISTS locked_until DATETIME;

-- Add escrow columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS escrow_status ENUM('none', 'held', 'released', 'refunded') DEFAULT 'none',
ADD COLUMN IF NOT EXISTS escrow_release_date DATETIME;

-- Indexes for performance
CREATE INDEX idx_mfa_user ON mfa_settings(user_id, is_enabled);
CREATE INDEX idx_kyc_status ON kyc_verifications(user_id, verification_status);
CREATE INDEX idx_escrow_status ON escrow_transactions(status, refund_deadline);
CREATE INDEX idx_audit_critical ON audit_logs(severity, created_at) WHERE severity IN ('high', 'critical');
