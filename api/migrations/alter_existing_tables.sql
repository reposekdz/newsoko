-- Alter existing tables to add new columns for marketplace features

-- Enhanced Products Table with Approval System
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_by INT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS is_live_photo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS photo_verification_score INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS availability_calendar JSON;

-- Enhanced Users Table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS seller_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_seller_reviews INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_status ENUM('active', 'flagged', 'suspended', 'banned') DEFAULT 'active',
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS seller_deposit_balance DECIMAL(10,2) DEFAULT 0.00;

-- Enhanced Bookings Table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS escrow_status ENUM('none', 'held', 'released', 'refunded') DEFAULT 'none',
ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS deposit_returned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS item_received_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS item_received_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS item_condition ENUM('excellent', 'good', 'fair', 'poor', 'damaged') NULL,
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0.00;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_approval ON products(approval_status, created_at);
CREATE INDEX IF NOT EXISTS idx_products_owner ON products(owner_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_bookings_escrow ON bookings(escrow_status, created_at);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(seller_rating);

-- Insert Default Commission Settings
INSERT INTO commission_settings (category_id, transaction_type, commission_rate) 
VALUES (NULL, 'sale', 10.00), (NULL, 'rental', 15.00)
ON DUPLICATE KEY UPDATE commission_rate = commission_rate;
