-- Super Admin Management Database Schema
-- Run this after database_admin.sql

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key)
);

-- Add refund fields to bookings if not exists
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS refunded_by INT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add foreign key for refunded_by
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'bookings' 
    AND CONSTRAINT_NAME = 'bookings_ibfk_refunded_by');

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE bookings ADD CONSTRAINT bookings_ibfk_refunded_by FOREIGN KEY (refunded_by) REFERENCES users(id) ON DELETE SET NULL', 
    'SELECT "Foreign key already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add product count to categories if not exists
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS product_count INT DEFAULT 0;

-- Add admin notes to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);

-- Insert default system settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('platform_fee_percentage', '10', 'number', 'Platform fee percentage on transactions'),
('min_withdrawal_amount', '1000', 'number', 'Minimum withdrawal amount in RWF'),
('max_withdrawal_amount', '1000000', 'number', 'Maximum withdrawal amount in RWF'),
('auto_approve_products', 'false', 'boolean', 'Automatically approve new products'),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
('max_product_images', '10', 'number', 'Maximum number of images per product'),
('booking_cancellation_hours', '24', 'number', 'Hours before booking start to allow cancellation'),
('dispute_resolution_days', '7', 'number', 'Days to resolve disputes'),
('user_verification_required', 'true', 'boolean', 'Require user verification for bookings'),
('email_notifications_enabled', 'true', 'boolean', 'Enable email notifications'),
('sms_notifications_enabled', 'true', 'boolean', 'Enable SMS notifications'),
('default_currency', 'RWF', 'string', 'Default currency'),
('support_email', 'support@marketplace.com', 'string', 'Support email address'),
('support_phone', '+250788000000', 'string', 'Support phone number'),
('terms_url', '/terms', 'string', 'Terms and conditions URL'),
('privacy_url', '/privacy', 'string', 'Privacy policy URL');

-- Add more granular permissions
INSERT IGNORE INTO permissions (name, display_name, description, category) VALUES
('bookings.view', 'View Bookings', 'Can view all bookings', 'bookings'),
('bookings.manage', 'Manage Bookings', 'Can cancel and modify bookings', 'bookings'),
('payments.view', 'View Payments', 'Can view payment transactions', 'payments'),
('payments.refund', 'Process Refunds', 'Can process refunds', 'payments'),
('disputes.view', 'View Disputes', 'Can view disputes', 'disputes'),
('disputes.manage', 'Manage Disputes', 'Can resolve disputes', 'disputes'),
('reviews.view', 'View Reviews', 'Can view all reviews', 'reviews'),
('reviews.delete', 'Delete Reviews', 'Can delete reviews', 'reviews'),
('notifications.send', 'Send Notifications', 'Can send notifications to users', 'notifications'),
('system.settings', 'System Settings', 'Can modify system settings', 'system'),
('system.maintenance', 'Maintenance Mode', 'Can enable/disable maintenance mode', 'system');

-- Assign all permissions to Super Admin role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE id NOT IN (SELECT permission_id FROM role_permissions WHERE role_id = 1);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_products_approved_by ON products(approved_by);

-- Update existing category counts
UPDATE categories c 
SET product_count = (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id);

-- Create admin activity summary view
CREATE OR REPLACE VIEW admin_activity_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(al.id) as total_actions,
    MAX(al.created_at) as last_action_at
FROM users u
JOIN admin_logs al ON u.id = al.admin_id
WHERE u.is_admin = 1
GROUP BY u.id, u.name, u.email;

SELECT 'Super Admin Management Database Schema Created Successfully!' as message;
