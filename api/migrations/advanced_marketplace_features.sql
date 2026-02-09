-- ============================================================
-- ADVANCED MARKETPLACE FEATURES - AI, CHAT, SUBSCRIPTIONS, AUCTIONS
-- ============================================================

-- Real-time Chat System
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_1 INT NOT NULL,
    participant_2 INT NOT NULL,
    product_id INT DEFAULT NULL,
    last_message_id INT DEFAULT NULL,
    last_message_at TIMESTAMP NULL,
    is_archived_p1 BOOLEAN DEFAULT FALSE,
    is_archived_p2 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_1) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_2) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    UNIQUE KEY unique_conversation (participant_1, participant_2, product_id),
    INDEX idx_participants (participant_1, participant_2),
    INDEX idx_last_message (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'location', 'product', 'booking') DEFAULT 'text',
    attachments JSON DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation (conversation_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Recommendations Engine
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    preferred_categories JSON DEFAULT NULL,
    price_range_min DECIMAL(15, 2) DEFAULT 0,
    price_range_max DECIMAL(15, 2) DEFAULT 999999999,
    preferred_locations JSON DEFAULT NULL,
    preferred_conditions JSON DEFAULT NULL,
    browsing_history JSON DEFAULT NULL,
    search_history JSON DEFAULT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    recommendation_type ENUM('viewed_together', 'similar', 'trending', 'personalized', 'ai_suggested') NOT NULL,
    score DECIMAL(5, 2) DEFAULT 0.00,
    reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_user_product (user_id, product_id),
    INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    plan_type ENUM('free', 'basic', 'premium', 'enterprise') NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    billing_cycle ENUM('monthly', 'quarterly', 'yearly') NOT NULL,
    max_listings INT DEFAULT 10,
    featured_listings INT DEFAULT 0,
    priority_support BOOLEAN DEFAULT FALSE,
    analytics_access BOOLEAN DEFAULT FALSE,
    commission_rate DECIMAL(5, 2) DEFAULT 10.00,
    features JSON DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_plan_type (plan_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('active', 'cancelled', 'expired', 'suspended') DEFAULT 'active',
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method VARCHAR(50) DEFAULT NULL,
    last_payment_date TIMESTAMP NULL,
    next_payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auction System
CREATE TABLE IF NOT EXISTS auctions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    seller_id INT NOT NULL,
    starting_price DECIMAL(15, 2) NOT NULL,
    reserve_price DECIMAL(15, 2) DEFAULT NULL,
    current_bid DECIMAL(15, 2) DEFAULT NULL,
    bid_increment DECIMAL(15, 2) DEFAULT 1000.00,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status ENUM('scheduled', 'active', 'ended', 'cancelled') DEFAULT 'scheduled',
    winner_id INT DEFAULT NULL,
    total_bids INT DEFAULT 0,
    auto_extend BOOLEAN DEFAULT TRUE,
    extend_minutes INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_end_time (end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auction_bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auction_id INT NOT NULL,
    bidder_id INT NOT NULL,
    bid_amount DECIMAL(15, 2) NOT NULL,
    is_auto_bid BOOLEAN DEFAULT FALSE,
    max_auto_bid DECIMAL(15, 2) DEFAULT NULL,
    status ENUM('active', 'outbid', 'winning', 'won', 'lost') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_auction (auction_id),
    INDEX idx_bidder (bidder_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insurance & Protection Plans
CREATE TABLE IF NOT EXISTS insurance_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    coverage_type ENUM('damage', 'theft', 'loss', 'comprehensive') NOT NULL,
    coverage_amount DECIMAL(15, 2) NOT NULL,
    premium_rate DECIMAL(5, 2) NOT NULL,
    min_rental_days INT DEFAULT 1,
    terms_conditions TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_insurance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    insurance_plan_id INT NOT NULL,
    premium_paid DECIMAL(15, 2) NOT NULL,
    coverage_start TIMESTAMP NOT NULL,
    coverage_end TIMESTAMP NOT NULL,
    status ENUM('active', 'claimed', 'expired', 'cancelled') DEFAULT 'active',
    claim_amount DECIMAL(15, 2) DEFAULT NULL,
    claim_date TIMESTAMP NULL,
    claim_status ENUM('pending', 'approved', 'rejected') DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (insurance_plan_id) REFERENCES insurance_plans(id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social Features
CREATE TABLE IF NOT EXISTS user_follows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    platform ENUM('facebook', 'twitter', 'whatsapp', 'email', 'link') NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product (product_id),
    INDEX idx_platform (platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_type ENUM('verified_seller', 'top_rated', 'fast_responder', 'trusted_buyer', 'power_seller', 'early_adopter') NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT DEFAULT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_badge_type (badge_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Advanced Reporting System
CREATE TABLE IF NOT EXISTS user_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    reported_user_id INT DEFAULT NULL,
    reported_product_id INT DEFAULT NULL,
    report_type ENUM('spam', 'fraud', 'inappropriate', 'fake', 'harassment', 'other') NOT NULL,
    description TEXT NOT NULL,
    evidence JSON DEFAULT NULL,
    status ENUM('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending',
    admin_notes TEXT DEFAULT NULL,
    resolved_by INT DEFAULT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_type (report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Marketing Automation
CREATE TABLE IF NOT EXISTS email_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_audience JSON DEFAULT NULL,
    status ENUM('draft', 'scheduled', 'sending', 'sent', 'cancelled') DEFAULT 'draft',
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    total_recipients INT DEFAULT 0,
    total_sent INT DEFAULT 0,
    total_opened INT DEFAULT 0,
    total_clicked INT DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_campaign_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed') NOT NULL,
    opened_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_campaign (campaign_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Bundles
CREATE TABLE IF NOT EXISTS product_bundles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bundle_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bundle_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    FOREIGN KEY (bundle_id) REFERENCES product_bundles(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bundle_product (bundle_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flash Sales
CREATE TABLE IF NOT EXISTS flash_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    max_quantity INT DEFAULT NULL,
    sold_quantity INT DEFAULT 0,
    status ENUM('scheduled', 'active', 'ended', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_time (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS flash_sale_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flash_sale_id INT NOT NULL,
    product_id INT NOT NULL,
    original_price DECIMAL(15, 2) NOT NULL,
    sale_price DECIMAL(15, 2) NOT NULL,
    quantity_limit INT DEFAULT NULL,
    quantity_sold INT DEFAULT 0,
    FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_flash_product (flash_sale_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Loyalty Program
CREATE TABLE IF NOT EXISTS loyalty_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT DEFAULT 0,
    lifetime_points INT DEFAULT 0,
    tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL,
    transaction_type ENUM('earned', 'redeemed', 'expired', 'bonus') NOT NULL,
    reference_type VARCHAR(50) DEFAULT NULL,
    reference_id INT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add new fields to existing tables
ALTER TABLE users 
ADD COLUMN followers_count INT DEFAULT 0,
ADD COLUMN following_count INT DEFAULT 0,
ADD COLUMN subscription_plan_id INT DEFAULT NULL,
ADD COLUMN loyalty_points INT DEFAULT 0,
ADD COLUMN is_featured_seller BOOLEAN DEFAULT FALSE,
ADD COLUMN seller_badge VARCHAR(50) DEFAULT NULL,
ADD FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;

ALTER TABLE products
ADD COLUMN is_auction BOOLEAN DEFAULT FALSE,
ADD COLUMN auction_id INT DEFAULT NULL,
ADD COLUMN is_flash_sale BOOLEAN DEFAULT FALSE,
ADD COLUMN share_count INT DEFAULT 0,
ADD COLUMN bundle_id INT DEFAULT NULL,
ADD FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE SET NULL,
ADD FOREIGN KEY (bundle_id) REFERENCES product_bundles(id) ON DELETE SET NULL;

ALTER TABLE bookings
ADD COLUMN insurance_id INT DEFAULT NULL,
ADD COLUMN loyalty_points_earned INT DEFAULT 0,
ADD FOREIGN KEY (insurance_id) REFERENCES booking_insurance(id) ON DELETE SET NULL;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, plan_type, price, billing_cycle, max_listings, featured_listings, priority_support, analytics_access, commission_rate, features) VALUES
('Free Plan', 'Basic features for casual sellers', 'free', 0, 'monthly', 5, 0, FALSE, FALSE, 15.00, '["5 listings", "Basic support", "Standard visibility"]'),
('Basic Plan', 'Perfect for growing sellers', 'basic', 10000, 'monthly', 25, 2, FALSE, TRUE, 12.00, '["25 listings", "2 featured listings", "Analytics dashboard", "Email support"]'),
('Premium Plan', 'For professional sellers', 'premium', 25000, 'monthly', 100, 10, TRUE, TRUE, 8.00, '["100 listings", "10 featured listings", "Priority support", "Advanced analytics", "Lower commission"]'),
('Enterprise Plan', 'Unlimited power for businesses', 'enterprise', 50000, 'monthly', 999999, 50, TRUE, TRUE, 5.00, '["Unlimited listings", "50 featured listings", "Dedicated support", "API access", "Lowest commission", "Custom branding"]');

-- Insert default insurance plans
INSERT INTO insurance_plans (name, description, coverage_type, coverage_amount, premium_rate, min_rental_days, terms_conditions) VALUES
('Basic Protection', 'Covers accidental damage up to 500,000 RWF', 'damage', 500000, 5.00, 1, 'Covers accidental damage during rental period. Excludes intentional damage.'),
('Theft Protection', 'Full coverage for theft or loss', 'theft', 2000000, 8.00, 3, 'Covers theft or loss of rented item. Police report required.'),
('Comprehensive Coverage', 'Complete protection including damage, theft, and loss', 'comprehensive', 5000000, 12.00, 1, 'Full coverage for all incidents. Includes replacement value.');
