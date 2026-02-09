-- Admin Advanced Features Database Schema

-- Add admin flag to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT NULL;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles mapping
CREATE TABLE IF NOT EXISTS user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_role (user_id, role_id)
);

-- Admin activity logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_created_at (created_at),
    INDEX idx_action (action)
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default roles
INSERT INTO roles (name, display_name, description, permissions) VALUES
('super_admin', 'Super Administrator', 'Full system access', '["all"]'),
('admin', 'Administrator', 'Manage users and content', '["manage_users", "manage_products", "manage_bookings"]'),
('moderator', 'Moderator', 'Moderate content and reviews', '["moderate_content", "manage_reviews"]'),
('support', 'Support Agent', 'Handle customer support', '["view_users", "view_bookings", "manage_disputes"]')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('platform_fee_percentage', '10', 'number', 'Platform fee percentage on transactions'),
('min_booking_amount', '1000', 'number', 'Minimum booking amount in RWF'),
('max_booking_days', '365', 'number', 'Maximum booking duration in days'),
('auto_approve_products', 'false', 'boolean', 'Automatically approve new products'),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
('max_product_images', '10', 'number', 'Maximum images per product'),
('require_phone_verification', 'true', 'boolean', 'Require phone verification for users'),
('enable_wallet', 'true', 'boolean', 'Enable wallet functionality'),
('min_withdrawal_amount', '5000', 'number', 'Minimum withdrawal amount in RWF'),
('support_email', 'support@newsoko.rw', 'string', 'Support email address'),
('support_phone', '+250788000000', 'string', 'Support phone number')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
