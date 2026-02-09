-- Advanced Product Management Schema

-- Product Variants (sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    variant_value VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory Tracking
CREATE TABLE IF NOT EXISTS inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    variant_id INT DEFAULT NULL,
    change_type ENUM('add', 'remove', 'adjust', 'sold', 'returned') NOT NULL,
    quantity_before INT NOT NULL,
    quantity_change INT NOT NULL,
    quantity_after INT NOT NULL,
    reason TEXT,
    performed_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    FOREIGN KEY (performed_by) REFERENCES users(id),
    INDEX idx_product (product_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bulk Upload History
CREATE TABLE IF NOT EXISTS bulk_uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_products INT NOT NULL,
    successful INT DEFAULT 0,
    failed INT DEFAULT 0,
    file_name VARCHAR(255),
    status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
    error_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Product Analytics
CREATE TABLE IF NOT EXISTS product_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    date DATE NOT NULL,
    views INT DEFAULT 0,
    clicks INT DEFAULT 0,
    bookings INT DEFAULT 0,
    revenue DECIMAL(15, 2) DEFAULT 0.00,
    conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_date (product_id, date),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rental Calendar
CREATE TABLE IF NOT EXISTS rental_calendar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    booking_id INT DEFAULT NULL,
    date DATE NOT NULL,
    status ENUM('available', 'booked', 'blocked', 'maintenance') DEFAULT 'available',
    price_override DECIMAL(10, 2) DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    UNIQUE KEY unique_product_date (product_id, date),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Product Pricing Rules
CREATE TABLE IF NOT EXISTS pricing_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    rule_type ENUM('seasonal', 'bulk_discount', 'early_bird', 'last_minute') NOT NULL,
    start_date DATE,
    end_date DATE,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    min_days INT DEFAULT NULL,
    max_days INT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Product Tags
CREATE TABLE IF NOT EXISTS product_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_tag (tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Saved Filters
CREATE TABLE IF NOT EXISTS saved_filters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filter_name VARCHAR(100) NOT NULL,
    filter_params JSON NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Update products table
ALTER TABLE products 
ADD COLUMN stock_quantity INT DEFAULT 1,
ADD COLUMN min_rental_days INT DEFAULT 1,
ADD COLUMN max_rental_days INT DEFAULT 365,
ADD COLUMN auto_approve BOOLEAN DEFAULT FALSE,
ADD COLUMN featured_until TIMESTAMP NULL,
ADD COLUMN boost_score INT DEFAULT 0,
ADD COLUMN last_boosted_at TIMESTAMP NULL;
