CREATE DATABASE IF NOT EXISTS rental_marketplace;
USE rental_marketplace;

-- Users table with authentication
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    location VARCHAR(255),
    address TEXT,
    id_number VARCHAR(50),
    id_verified BOOLEAN DEFAULT FALSE,
    account_status ENUM('active','suspended','banned') DEFAULT 'active',
    wallet_balance DECIMAL(10,2) DEFAULT 0,
    total_rentals INT DEFAULT 0,
    total_sales INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);

-- Sessions table for authentication
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user (user_id)
);

-- Products table enhanced
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('vehicles','electronics','clothing','houses','furniture','tools','others') NOT NULL,
    images TEXT,
    rent_price DECIMAL(10,2),
    buy_price DECIMAL(10,2),
    address VARCHAR(255),
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    owner_id INT NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    deposit DECIMAL(10,2),
    features TEXT,
    condition_status ENUM('new','like-new','good','fair') DEFAULT 'good',
    views INT DEFAULT 0,
    favorites INT DEFAULT 0,
    status ENUM('active','pending','sold','rented','inactive') DEFAULT 'active',
    min_rental_days INT DEFAULT 1,
    max_rental_days INT DEFAULT 365,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_owner (owner_id),
    INDEX idx_status (status)
);

-- Bookings table enhanced
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    renter_id INT NOT NULL,
    owner_id INT NOT NULL,
    booking_type ENUM('rental','purchase') NOT NULL,
    start_date DATE,
    end_date DATE,
    days INT,
    total_price DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2),
    service_fee DECIMAL(10,2) DEFAULT 0,
    status ENUM('pending','confirmed','active','completed','cancelled','disputed') DEFAULT 'pending',
    payment_status ENUM('pending','partial','paid','refunded') DEFAULT 'pending',
    escrow_status ENUM('pending','locked','released','refunded','disputed') DEFAULT 'pending',
    delivery_method ENUM('pickup','delivery','shipping') DEFAULT 'pickup',
    delivery_address TEXT,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_renter (renter_id),
    INDEX idx_owner (owner_id),
    INDEX idx_status (status)
);

-- Payments table
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('momo_mtn','momo_airtel','bank_transfer','card','wallet') NOT NULL,
    payment_type ENUM('booking','deposit','refund','withdrawal') NOT NULL,
    transaction_id VARCHAR(255),
    phone_number VARCHAR(20),
    status ENUM('pending','processing','completed','failed','cancelled') DEFAULT 'pending',
    reference VARCHAR(255),
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);

-- Escrow transactions
CREATE TABLE escrow (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending','locked','released','refunded','disputed') DEFAULT 'pending',
    locked_at TIMESTAMP NULL,
    released_at TIMESTAMP NULL,
    release_to_owner DECIMAL(10,2) DEFAULT 0,
    refund_to_renter DECIMAL(10,2) DEFAULT 0,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id),
    INDEX idx_status (status)
);

-- Reviews table enhanced
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images TEXT,
    response TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_reviewee (reviewee_id)
);

-- Messages table enhanced
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id VARCHAR(100) NOT NULL,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    product_id INT,
    booking_id INT,
    content TEXT NOT NULL,
    message_type ENUM('text','image','offer','system') DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_conversation (conversation_id),
    INDEX idx_to_user (to_user_id)
);

-- Notifications table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('booking','payment','message','review','reminder','dispute','system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read)
);

-- Favorites/Wishlist
CREATE TABLE favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, product_id),
    INDEX idx_user (user_id)
);

-- Verification documents
CREATE TABLE verifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    document_type ENUM('id_card','passport','driving_license','proof_of_address') NOT NULL,
    document_number VARCHAR(100),
    document_image VARCHAR(500),
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    verified_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);

-- Disputes
CREATE TABLE disputes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    raised_by INT NOT NULL,
    against_user INT NOT NULL,
    reason TEXT NOT NULL,
    evidence TEXT,
    status ENUM('open','investigating','resolved','closed') DEFAULT 'open',
    resolution TEXT,
    resolved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (raised_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (against_user) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id),
    INDEX idx_status (status)
);

-- Insert sample users
INSERT INTO users (name, email, phone, password, avatar, is_verified, email_verified, phone_verified, rating, review_count, location, wallet_balance) VALUES
('Jean Baptiste Mugabo', 'jb.mugabo@example.rw', '+250788123456', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=1', TRUE, TRUE, TRUE, 4.8, 45, 'Kigali, Kicukiro', 150000),
('Marie Claire Uwase', 'mc.uwase@example.rw', '+250788234567', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=5', TRUE, TRUE, TRUE, 4.9, 67, 'Kigali, Gasabo', 250000),
('Patrick Nshimiyimana', 'p.nshimiyimana@example.rw', '+250788345678', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=3', FALSE, FALSE, FALSE, 4.2, 12, 'Kigali, Nyarugenge', 50000);

-- Insert sample products
INSERT INTO products (title, description, category, images, rent_price, buy_price, address, lat, lng, owner_id, rating, review_count, deposit, features, condition_status, views, favorites) VALUES
('Toyota RAV4 2023 - Imodoka igezweho', 'Imodoka nziza cyane ya Toyota RAV4 2023, ikoresha amavuta make, ifite aircon, na GPS.', 'vehicles', '["https://images.unsplash.com/photo-1762291098621-f3ccfefdcfba?w=1080"]', 50000, 25000000, 'KG 9 Ave, Kigali', -1.9441, 30.0619, 1, 4.9, 23, 100000, '["GPS","Air Conditioning","Automatic","4WD","Bluetooth"]', 'like-new', 245, 18),
('MacBook Pro M3 - Laptop igezweho', 'MacBook Pro 16-inch na M3 chip, 16GB RAM, 512GB SSD.', 'electronics', '["https://images.unsplash.com/flagged/photo-1576697010739-6373b63f3204?w=1080"]', 15000, 2500000, 'KN 3 Rd, Kigali', -1.9511, 30.0919, 2, 5.0, 18, 50000, '["M3 Chip","16GB RAM","512GB SSD","Retina Display"]', 'like-new', 189, 25),
('Canon EOS R5 - Camera ya Pro', 'Camera nziza ya professional photography, ifite 45MP, 8K video.', 'electronics', '["https://images.unsplash.com/photo-1764557359097-f15dd0c0a17b?w=1080"]', 25000, 4500000, 'KG 5 Ave, Kigali', -1.9536, 30.0987, 1, 4.8, 31, 100000, '["45MP","8K Video","RF Mount","IBIS"]', 'like-new', 312, 42),
('Inzu nziza i Kicukiro - 3 Bedrooms', 'Inzu nziza ifite ibyumba 3, kitchen igezweho, compound nini.', 'houses', '["https://images.unsplash.com/photo-1717960331841-a36791e8d2f5?w=1080"]', 300000, 45000000, 'Kicukiro, KK 15 St', -1.9667, 30.1044, 2, 4.7, 8, 600000, '["3 Bedrooms","2 Bathrooms","Kitchen","Parking","Garden"]', 'good', 567, 89),
('Umwenda w''Ubukwe - Wedding Dress', 'Umwenda w''ubukwe mwiza cyane, white na beads nyinshi.', 'clothing', '["https://images.unsplash.com/photo-1676132068619-f015a54cee3d?w=1080"]', 80000, 500000, 'Kimironko, Kigali', -1.9412, 30.1267, 2, 4.9, 42, 50000, '["Size Medium","White Color","Hand Beaded"]', 'like-new', 423, 67),
('Ibikoresho byo Kubaka - Power Tools', 'Set y''ibikoresho byo kubaka: drill, saw, hammer drill.', 'tools', '["https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=1080"]', 10000, 250000, 'Nyabugogo, Kigali', -1.9378, 30.0545, 3, 4.5, 15, 30000, '["Cordless Drill","Circular Saw","Tool Box"]', 'good', 156, 23);
