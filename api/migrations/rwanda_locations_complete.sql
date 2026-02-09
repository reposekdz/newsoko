-- Complete Rwanda Locations Migration
-- This SQL file adds all Rwanda administrative division support to the database

-- Use the database
USE rental_marketplace;

-- ============================================
-- USERS TABLE - Add Rwanda location fields
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS province_id INT NULL AFTER location;
ALTER TABLE users ADD COLUMN IF NOT EXISTS district_id INT NULL AFTER province_id;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sector_id INT NULL AFTER district_id;

-- Add indexes for faster location queries
CREATE INDEX IF NOT EXISTS idx_users_province ON users(province_id);
CREATE INDEX IF NOT EXISTS idx_users_district ON users(district_id);
CREATE INDEX IF NOT EXISTS idx_users_sector ON users(sector_id);

-- Add missing columns for completeness
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1 AFTER is_verified;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason VARCHAR(500) NULL AFTER is_active;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login DATETIME NULL AFTER created_at;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status ENUM('active','suspended','banned') DEFAULT 'active' AFTER ban_reason;

-- ============================================
-- PRODUCTS TABLE - Add Rwanda location fields
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS province_id INT NULL AFTER seo_description;
ALTER TABLE products ADD COLUMN IF NOT EXISTS district_id INT NULL AFTER province_id;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sector_id INT NULL AFTER district_id;
ALTER TABLE products ADD COLUMN IF NOT EXISTS location_string VARCHAR(255) NULL AFTER sector_id;

-- Add indexes for faster location queries
CREATE INDEX IF NOT EXISTS idx_products_province ON products(province_id);
CREATE INDEX IF NOT EXISTS idx_products_district ON products(district_id);
CREATE INDEX IF NOT EXISTS idx_products_sector ON products(sector_id);

-- Add missing columns for completeness
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INT NULL AFTER title;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status ENUM('pending','approved','rejected','sold') DEFAULT 'pending' AFTER is_available;
ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL AFTER status;
ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_by INT NULL AFTER approved_at;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500) NULL AFTER approved_by;
ALTER TABLE products ADD COLUMN IF NOT EXISTS views INT DEFAULT 0 AFTER review_count;
ALTER TABLE products ADD COLUMN IF NOT EXISTS favorites INT DEFAULT 0 AFTER views;
ALTER TABLE products ADD COLUMN IF NOT EXISTS listing_type ENUM('rent','sale','both') DEFAULT 'both' AFTER condition_status;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) DEFAULT 0 AFTER listing_type;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0.00 AFTER is_featured;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100) NULL AFTER condition_status;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0 AFTER sku;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3) NULL AFTER stock_quantity;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions VARCHAR(50) NULL AFTER weight;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100) NULL AFTER dimensions;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model VARCHAR(100) NULL AFTER brand;
ALTER TABLE products ADD COLUMN IF NOT EXISTS year_manufactured YEAR NULL AFTER model;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_period VARCHAR(50) NULL AFTER year_manufactured;

-- ============================================
-- BOOKINGS TABLE - Add missing fields
-- ============================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) NULL AFTER end_date;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) NULL AFTER total_amount;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) NULL AFTER refund_status;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_reason VARCHAR(500) NULL AFTER refund_amount;

-- ============================================
-- REVIEWS TABLE - Add missing fields
-- ============================================
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS product_id INT NOT NULL AFTER user_id;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id INT NULL AFTER product_id;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response TEXT NULL AFTER comment;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_at DATETIME NULL AFTER response;

-- ============================================
-- CREATE MISSING TABLES
-- ============================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT NULL,
    icon VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default categories if empty
INSERT IGNORE INTO categories (id, name, slug, description, icon) VALUES
(1, 'Vehicles', 'vehicles', 'Cars, motorcycles, bicycles, and other vehicles', '🚗'),
(2, 'Electronics', 'electronics', 'Phones, laptops, cameras, and gadgets', '📱'),
(3, 'Clothing', 'clothing', 'Clothes, shoes, and accessories', '👕'),
(4, 'Houses', 'houses', 'Houses, apartments, and rooms for rent', '🏠'),
(5, 'Furniture', 'furniture', 'Beds, sofas, tables, and home furniture', '🪑'),
(6, 'Tools', 'tools', 'Power tools and construction equipment', '🔧'),
(7, 'Others', 'others', 'Miscellaneous items', '📦');

-- Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_logs_admin (admin_id),
    INDEX idx_admin_logs_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('platform_fee_percentage', '5', 'Platform fee percentage for transactions'),
('min_booking_days', '1', 'Minimum booking duration in days'),
('max_booking_days', '30', 'Maximum booking duration in days'),
(' escrow_enabled', '1', 'Enable escrow payment system');

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    permissions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default roles
INSERT IGNORE INTO roles (id, name, display_name, description) VALUES
(1, 'admin', 'Administrator', 'Full system access'),
(2, 'seller', 'Seller', 'Can list and sell products'),
(3, 'buyer', 'Buyer', 'Can purchase products'),
(4, 'moderator', 'Moderator', 'Can moderate content');

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Assign admin role to first user (if exists)
INSERT IGNORE INTO user_roles (user_id, role_id) SELECT id, 1 FROM users LIMIT 1;

-- ============================================
-- UPDATE EXISTING DATA
-- ============================================

-- Update products to use category_id from category name
UPDATE products p 
LEFT JOIN categories c ON p.category = c.slug 
SET p.category_id = c.id 
WHERE p.category IS NOT NULL;

-- Update status for existing products
UPDATE products SET status = 'approved' WHERE status IS NULL OR status = '';

echo "Migration completed successfully!\n";
