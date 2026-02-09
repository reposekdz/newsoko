-- Add Missing Foreign Keys with Protection
-- This ensures data integrity and prevents accidental deletions

USE rental_marketplace;

-- Add is_active column to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add service_fee to bookings if not exists
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

-- Update total_amount for existing bookings
UPDATE bookings SET total_amount = total_price WHERE total_amount IS NULL;

-- Add user_id to bookings (rename renter_id to user_id for consistency)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id INT;
UPDATE bookings SET user_id = renter_id WHERE user_id IS NULL;

-- Add foreign key for bookings.user_id with RESTRICT to prevent deletion
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'bookings' 
    AND CONSTRAINT_NAME = 'fk_bookings_user_id');

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE', 
    'SELECT "Foreign key fk_bookings_user_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for products.category_id with RESTRICT
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'products' 
    AND CONSTRAINT_NAME = 'fk_products_category_id');

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE products ADD CONSTRAINT fk_products_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE', 
    'SELECT "Foreign key fk_products_category_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for products.approved_by with SET NULL
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'products' 
    AND CONSTRAINT_NAME = 'fk_products_approved_by');

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE products ADD CONSTRAINT fk_products_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE', 
    'SELECT "Foreign key fk_products_approved_by already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure products.owner_id has proper constraint (RESTRICT to prevent owner deletion)
SET @fk_name = (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'products' 
    AND COLUMN_NAME = 'owner_id' 
    AND REFERENCED_TABLE_NAME = 'users' LIMIT 1);

SET @sql = IF(@fk_name IS NOT NULL, 
    CONCAT('ALTER TABLE products DROP FOREIGN KEY ', @fk_name), 
    'SELECT "No existing foreign key to drop"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add proper owner_id foreign key with RESTRICT
ALTER TABLE products ADD CONSTRAINT fk_products_owner_id 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create disputes table if not exists
CREATE TABLE IF NOT EXISTS disputes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    raised_by INT NOT NULL,
    against_user_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    evidence TEXT,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    resolution TEXT,
    resolved_by INT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
    FOREIGN KEY (raised_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (against_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_disputes_status (status),
    INDEX idx_disputes_booking (booking_id)
);

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id, is_read),
    INDEX idx_notifications_created (created_at)
);

-- Create wallet_transactions table if not exists
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('credit', 'debit', 'topup', 'withdrawal', 'refund', 'payment') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_wallet_user (user_id),
    INDEX idx_wallet_created (created_at)
);

-- Add wallet_balance to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0;

-- Create payments table if not exists
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('momo', 'airtel', 'card', 'wallet') NOT NULL,
    phone_number VARCHAR(20),
    transaction_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_payments_booking (booking_id),
    INDEX idx_payments_user (user_id),
    INDEX idx_payments_status (status)
);

-- Create conversations table for messaging
CREATE TABLE IF NOT EXISTS conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    product_id INT,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    UNIQUE KEY unique_conversation (user1_id, user2_id, product_id),
    INDEX idx_conversations_users (user1_id, user2_id)
);

-- Update messages table to use conversation_id
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id INT;

-- Add foreign key for messages.conversation_id
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'messages' 
    AND CONSTRAINT_NAME = 'fk_messages_conversation_id');

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE messages ADD CONSTRAINT fk_messages_conversation_id FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE', 
    'SELECT "Foreign key fk_messages_conversation_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create favorites table if not exists
CREATE TABLE IF NOT EXISTS favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, product_id),
    INDEX idx_favorites_user (user_id)
);

-- Create product_views table for analytics
CREATE TABLE IF NOT EXISTS product_views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_views_product (product_id),
    INDEX idx_views_date (viewed_at)
);

SELECT 'Foreign keys and missing tables created successfully!' as message;
