-- ============================================================
-- MISSING FEATURES DATABASE TABLES
-- ============================================================

-- Already exists in comprehensive_features.sql but ensuring completeness
-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrer_id INT NOT NULL,
    referred_id INT NOT NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'completed', 'rewarded') DEFAULT 'pending',
    reward_amount DECIMAL(15, 2) DEFAULT 0.00,
    reward_paid BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    rewarded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_referrer_id (referrer_id),
    INDEX idx_referral_code (referral_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Promotional campaigns table
CREATE TABLE IF NOT EXISTS promotional_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    discount_type ENUM('percentage', 'fixed_amount', 'free_shipping') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(15, 2) DEFAULT 0.00,
    max_discount_amount DECIMAL(15, 2) DEFAULT NULL,
    code VARCHAR(50) UNIQUE DEFAULT NULL,
    usage_limit INT DEFAULT NULL,
    usage_count INT DEFAULT 0,
    user_limit INT DEFAULT 1,
    applicable_categories JSON DEFAULT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Promo code usage table
CREATE TABLE IF NOT EXISTS promo_code_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    user_id INT NOT NULL,
    booking_id INT DEFAULT NULL,
    discount_amount DECIMAL(15, 2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product questions table
CREATE TABLE IF NOT EXISTS product_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT DEFAULT NULL,
    answered_by INT DEFAULT NULL,
    answered_at TIMESTAMP NULL,
    is_public BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (answered_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    search_params JSON NOT NULL,
    alert_enabled BOOLEAN DEFAULT FALSE,
    alert_frequency ENUM('instant', 'daily', 'weekly') DEFAULT 'daily',
    last_alert_sent TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product comparison table
CREATE TABLE IF NOT EXISTS product_comparisons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_ids JSON NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add referral code to users if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS referred_by INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_referrals INT DEFAULT 0;

-- Insert sample promo codes
INSERT INTO promotional_campaigns (name, description, discount_type, discount_value, code, usage_limit, start_date, end_date) VALUES
('New Year Sale', '10% off on all products', 'percentage', 10.00, 'NEWYEAR2024', 1000, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY)),
('First Purchase', '5000 RWF off first purchase', 'fixed_amount', 5000.00, 'FIRST5000', NULL, NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY)),
('Free Shipping', 'Free shipping on orders above 50000 RWF', 'free_shipping', 0.00, 'FREESHIP', NULL, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY));
