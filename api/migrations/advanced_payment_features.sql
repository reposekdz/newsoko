-- ============================================================
-- ADVANCED PAYMENT FEATURES - 2026 ENHANCEMENTS
-- ============================================================

-- Add payout fields to users table
ALTER TABLE users 
ADD COLUMN payout_method ENUM('mobile_money', 'bank_transfer', 'stablecoin') DEFAULT 'mobile_money',
ADD COLUMN payout_phone VARCHAR(20) DEFAULT NULL,
ADD COLUMN payout_bank_account VARCHAR(50) DEFAULT NULL,
ADD COLUMN payout_bank_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN payout_stablecoin_address VARCHAR(255) DEFAULT NULL,
ADD COLUMN biometric_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN biometric_token VARCHAR(255) DEFAULT NULL;

-- Add velocity tracking fields
ALTER TABLE payments
ADD COLUMN velocity_check_score DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN fraud_check_passed BOOLEAN DEFAULT TRUE,
ADD COLUMN fraud_flags JSON DEFAULT NULL;

-- Add buyer confirmation to escrow
ALTER TABLE escrow_transactions
ADD COLUMN buyer_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN buyer_confirmed_at TIMESTAMP NULL,
ADD COLUMN seller_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN seller_confirmed_at TIMESTAMP NULL,
ADD COLUMN payout_phone VARCHAR(20) DEFAULT NULL,
ADD COLUMN payout_bank_account VARCHAR(50) DEFAULT NULL,
ADD COLUMN payout_bank_name VARCHAR(100) DEFAULT NULL;

-- Create payment provider performance tracking
CREATE TABLE IF NOT EXISTS payment_provider_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_name VARCHAR(50) NOT NULL,
    success_rate DECIMAL(5, 2) DEFAULT 0.00,
    average_processing_time INT DEFAULT 0,
    uptime_percentage DECIMAL(5, 2) DEFAULT 0.00,
    fee_percentage DECIMAL(5, 2) DEFAULT 0.00,
    total_transactions INT DEFAULT 0,
    total_volume DECIMAL(15, 2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_provider (provider_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default provider data
INSERT INTO payment_provider_performance (provider_name, success_rate, average_processing_time, uptime_percentage, fee_percentage) VALUES
('mtn_momo', 99.00, 5, 99.50, 2.00),
('airtel_money', 98.50, 6, 98.00, 2.50),
('stripe', 99.90, 3, 99.90, 2.90),
('bank_transfer', 95.00, 3600, 95.00, 1.00);

-- Create velocity tracking table
CREATE TABLE IF NOT EXISTS velocity_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    time_window INT NOT NULL,
    transaction_count INT DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    risk_score DECIMAL(5, 2) DEFAULT 0.00,
    flags JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create synthetic identity detection log
CREATE TABLE IF NOT EXISTS synthetic_identity_checks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    risk_score DECIMAL(5, 2) NOT NULL,
    flags JSON NOT NULL,
    recommendation ENUM('allow', 'manual_review', 'block') NOT NULL,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_risk_score (risk_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create instant payout log
CREATE TABLE IF NOT EXISTS instant_payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    escrow_transaction_id INT NOT NULL,
    seller_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payout_method ENUM('mobile_money', 'bank_transfer', 'stablecoin') NOT NULL,
    payout_reference VARCHAR(100) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    provider VARCHAR(50) DEFAULT NULL,
    processing_time_seconds INT DEFAULT NULL,
    failure_reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (escrow_transaction_id) REFERENCES escrow_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_escrow_transaction_id (escrow_transaction_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create biometric authentication log
CREATE TABLE IF NOT EXISTS biometric_auth_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    auth_type ENUM('fingerprint', 'face_id', 'iris') NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    success BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_device_id (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update system settings for 2026 features
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('wallet_first_enabled', 'true', 'boolean', 'Enable wallet-first checkout experience'),
('biometric_auth_required', 'true', 'boolean', 'Require biometric authentication for payments'),
('instant_payout_enabled', 'true', 'boolean', 'Enable instant payouts to sellers'),
('auto_escrow_release_days', '3', 'string', 'Days before auto-releasing escrow'),
('velocity_spike_threshold', '5', 'string', 'Number of transactions to trigger velocity alert'),
('synthetic_identity_threshold', '50', 'string', 'Risk score threshold for synthetic identity'),
('payment_orchestration_enabled', 'true', 'boolean', 'Enable automatic payment provider selection'),
('stablecoin_payout_enabled', 'false', 'boolean', 'Enable stablecoin payouts (USDC)');
