-- Advanced Admin System with Role-Based Access Control

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- User roles mapping
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_by INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Admin activity logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_date (admin_id, created_at DESC),
    INDEX idx_entity (entity_type, entity_id)
);

-- Product categories with hierarchy
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id INT,
    description TEXT,
    icon VARCHAR(50),
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent (parent_id),
    INDEX idx_active (is_active)
);

-- Product specifications/attributes
CREATE TABLE IF NOT EXISTS product_attributes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
);

-- Product variants (sizes, colors, etc)
CREATE TABLE IF NOT EXISTS product_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    variant_value VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(10, 2) DEFAULT 0,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_sku (sku)
);

-- Product inventory tracking
CREATE TABLE IF NOT EXISTS inventory_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    variant_id INT,
    change_type ENUM('add', 'remove', 'adjust', 'reserve', 'release') NOT NULL,
    quantity INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reason VARCHAR(255),
    admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product_date (product_id, created_at DESC)
);

-- Bulk operations tracking
CREATE TABLE IF NOT EXISTS bulk_operations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    total_items INT NOT NULL,
    processed_items INT DEFAULT 0,
    failed_items INT DEFAULT 0,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    file_path VARCHAR(255),
    error_log TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_status (admin_id, status)
);

-- Insert default roles
INSERT INTO roles (name, display_name, description, level) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', 100),
('admin', 'Administrator', 'Manage products, users, and orders', 80),
('moderator', 'Moderator', 'Moderate content and handle disputes', 60),
('vendor', 'Vendor', 'Manage own products and orders', 40),
('support', 'Support Agent', 'Handle customer support and tickets', 30);

-- Insert comprehensive permissions
INSERT INTO permissions (name, display_name, category) VALUES
-- Product Management
('products.create', 'Create Products', 'products'),
('products.edit', 'Edit Products', 'products'),
('products.delete', 'Delete Products', 'products'),
('products.view', 'View Products', 'products'),
('products.approve', 'Approve Products', 'products'),
('products.bulk_import', 'Bulk Import Products', 'products'),
('products.bulk_export', 'Bulk Export Products', 'products'),
('products.manage_inventory', 'Manage Inventory', 'products'),

-- User Management
('users.create', 'Create Users', 'users'),
('users.edit', 'Edit Users', 'users'),
('users.delete', 'Delete Users', 'users'),
('users.view', 'View Users', 'users'),
('users.ban', 'Ban Users', 'users'),
('users.verify', 'Verify Users', 'users'),

-- Role Management
('roles.create', 'Create Roles', 'roles'),
('roles.edit', 'Edit Roles', 'roles'),
('roles.delete', 'Delete Roles', 'roles'),
('roles.assign', 'Assign Roles', 'roles'),

-- Order Management
('orders.view', 'View Orders', 'orders'),
('orders.edit', 'Edit Orders', 'orders'),
('orders.cancel', 'Cancel Orders', 'orders'),
('orders.refund', 'Process Refunds', 'orders'),

-- Financial Management
('finance.view_reports', 'View Financial Reports', 'finance'),
('finance.manage_payments', 'Manage Payments', 'finance'),
('finance.manage_escrow', 'Manage Escrow', 'finance'),
('finance.withdraw', 'Process Withdrawals', 'finance'),

-- Content Management
('content.manage_categories', 'Manage Categories', 'content'),
('content.manage_reviews', 'Manage Reviews', 'content'),
('content.manage_disputes', 'Manage Disputes', 'content'),

-- System Management
('system.view_logs', 'View System Logs', 'system'),
('system.manage_settings', 'Manage Settings', 'system'),
('system.view_analytics', 'View Analytics', 'system');

-- Assign permissions to super_admin (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Assign permissions to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions 
WHERE category IN ('products', 'users', 'orders', 'content', 'system') 
AND name NOT IN ('roles.delete', 'system.manage_settings');

-- Assign permissions to moderator
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions 
WHERE category IN ('content', 'users') 
AND name IN ('products.view', 'products.approve', 'users.view', 'users.ban', 'content.manage_reviews', 'content.manage_disputes');

-- Assign permissions to vendor
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions 
WHERE name IN ('products.create', 'products.edit', 'products.view', 'products.manage_inventory', 'orders.view');

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
('Vehicles', 'vehicles', 'Cars, motorcycles, and other vehicles', 'Car', 1),
('Electronics', 'electronics', 'Phones, laptops, and electronic devices', 'Smartphone', 2),
('Real Estate', 'real-estate', 'Houses, apartments, and land', 'Home', 3),
('Furniture', 'furniture', 'Home and office furniture', 'Sofa', 4),
('Clothing', 'clothing', 'Fashion and apparel', 'Shirt', 5),
('Construction', 'construction', 'Building materials and equipment', 'HardHat', 6),
('Spare Parts', 'spare-parts', 'Vehicle and machinery parts', 'Wrench', 7),
('Machinery', 'machinery', 'Industrial and agricultural machinery', 'Settings', 8),
('Tools', 'tools', 'Hand tools and power tools', 'Hammer', 9),
('Sports', 'sports', 'Sports equipment and gear', 'Trophy', 10),
('Books', 'books', 'Books, magazines, and educational materials', 'BookOpen', 11),
('Beauty', 'beauty', 'Beauty products and cosmetics', 'Sparkles', 12),
('Jewelry', 'jewelry', 'Jewelry and accessories', 'Gem', 13),
('Toys', 'toys', 'Toys and games for children', 'Gamepad2', 14),
('Garden', 'garden', 'Garden tools and plants', 'Flower2', 15),
('Pets', 'pets', 'Pet supplies and accessories', 'PawPrint', 16),
('Music', 'music', 'Musical instruments and equipment', 'Music', 17),
('Office', 'office', 'Office supplies and equipment', 'Briefcase', 18),
('Health', 'health', 'Health and medical equipment', 'Heart', 19),
('Baby', 'baby', 'Baby products and accessories', 'Baby', 20),
('Food', 'food', 'Food and beverages', 'UtensilsCrossed', 21),
('Art', 'art', 'Art supplies and crafts', 'Palette', 22),
('Photography', 'photography', 'Cameras and photography equipment', 'Camera', 23),
('Gaming', 'gaming', 'Video games and gaming consoles', 'Gamepad', 24),
('Appliances', 'appliances', 'Home appliances', 'Refrigerator', 25);

-- Insert subcategories
INSERT INTO categories (name, slug, parent_id, description, sort_order) VALUES
-- Vehicles subcategories
('Cars', 'cars', 1, 'Passenger vehicles', 1),
('Motorcycles', 'motorcycles', 1, 'Two-wheeled vehicles', 2),
('Trucks', 'trucks', 1, 'Commercial vehicles', 3),
('Buses', 'buses', 1, 'Public transport vehicles', 4),
('Bicycles', 'bicycles', 1, 'Pedal bikes', 5),
-- Electronics subcategories
('Laptops', 'laptops', 2, 'Portable computers', 1),
('Smartphones', 'smartphones', 2, 'Mobile phones', 2),
('Tablets', 'tablets', 2, 'Tablet devices', 3),
('TVs', 'tvs', 2, 'Television sets', 4),
('Audio', 'audio', 2, 'Audio equipment', 5),
-- Real Estate subcategories
('Houses', 'houses', 3, 'Residential houses', 1),
('Apartments', 'apartments', 3, 'Apartment units', 2),
('Land', 'land', 3, 'Land plots', 3),
('Commercial', 'commercial', 3, 'Commercial properties', 4),
('Offices', 'offices', 3, 'Office spaces', 5),
-- Furniture subcategories
('Living Room', 'living-room', 4, 'Living room furniture', 1),
('Bedroom', 'bedroom', 4, 'Bedroom furniture', 2),
('Kitchen', 'kitchen', 4, 'Kitchen furniture', 3),
('Office Furniture', 'office-furniture', 4, 'Office furniture', 4),
-- Clothing subcategories
('Men', 'men', 5, 'Men clothing', 1),
('Women', 'women', 5, 'Women clothing', 2),
('Kids', 'kids', 5, 'Kids clothing', 3),
('Shoes', 'shoes', 5, 'Footwear', 4),
('Accessories', 'accessories', 5, 'Fashion accessories', 5),
-- Construction subcategories
('Cement', 'cement', 6, 'Cement and concrete', 1),
('Bricks', 'bricks', 6, 'Bricks and blocks', 2),
('Roofing', 'roofing', 6, 'Roofing materials', 3),
('Plumbing', 'plumbing', 6, 'Plumbing supplies', 4),
('Electrical', 'electrical', 6, 'Electrical supplies', 5),
-- Spare Parts subcategories
('Car Parts', 'car-parts', 7, 'Automobile parts', 1),
('Motorcycle Parts', 'motorcycle-parts', 7, 'Motorcycle parts', 2),
('Truck Parts', 'truck-parts', 7, 'Truck parts', 3),
('Tires', 'tires', 7, 'Vehicle tires', 4),
('Batteries', 'batteries', 7, 'Vehicle batteries', 5),
-- Machinery subcategories
('Agricultural', 'agricultural', 8, 'Farm machinery', 1),
('Industrial', 'industrial', 8, 'Industrial equipment', 2),
('Generators', 'generators', 8, 'Power generators', 3),
('Welding', 'welding', 8, 'Welding equipment', 4);

-- Add admin-specific columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0;

-- Add advanced product fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_alert INT DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS year_manufactured INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_period INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags JSON;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_by INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add foreign keys
ALTER TABLE products ADD FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create first super admin
UPDATE users SET is_admin = TRUE WHERE id = 1;
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);

-- Trigger to log admin actions on product changes
DELIMITER //
CREATE TRIGGER log_product_create
AFTER INSERT ON products
FOR EACH ROW
BEGIN
    INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
    VALUES (NEW.owner_id, 'create', 'product', NEW.id, JSON_OBJECT('title', NEW.title, 'category_id', NEW.category_id));
END//

CREATE TRIGGER log_product_update
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
    VALUES (NEW.owner_id, 'update', 'product', NEW.id, JSON_OBJECT('title', NEW.title));
END//

CREATE TRIGGER log_product_delete
BEFORE DELETE ON products
FOR EACH ROW
BEGIN
    INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
    VALUES (OLD.owner_id, 'delete', 'product', OLD.id, JSON_OBJECT('title', OLD.title));
END//
DELIMITER ;
