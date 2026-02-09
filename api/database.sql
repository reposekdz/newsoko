CREATE DATABASE IF NOT EXISTS rental_marketplace;
USE rental_marketplace;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    renter_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2),
    status ENUM('pending','confirmed','active','completed','cancelled') DEFAULT 'pending',
    payment_status ENUM('pending','paid','refunded') DEFAULT 'pending',
    escrow_status ENUM('locked','released','refunded') DEFAULT 'locked',
    delivery_address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    product_id INT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

INSERT INTO users (name, email, phone, password, avatar, is_verified, rating, review_count, location) VALUES
('Jean Baptiste Mugabo', 'jb.mugabo@example.rw', '+250788123456', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=1', TRUE, 4.8, 45, 'Kigali, Kicukiro'),
('Marie Claire Uwase', 'mc.uwase@example.rw', '+250788234567', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=5', TRUE, 4.9, 67, 'Kigali, Gasabo'),
('Patrick Nshimiyimana', 'p.nshimiyimana@example.rw', '+250788345678', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=3', FALSE, 4.2, 12, 'Kigali, Nyarugenge');

INSERT INTO products (title, description, category, images, rent_price, buy_price, address, lat, lng, owner_id, rating, review_count, deposit, features, condition_status) VALUES
('Toyota RAV4 2023 - Imodoka igezweho', 'Imodoka nziza cyane ya Toyota RAV4 2023, ikoresha amavuta make, ifite aircon, na GPS.', 'vehicles', '["https://images.unsplash.com/photo-1762291098621-f3ccfefdcfba?w=1080"]', 50000, 25000000, 'KG 9 Ave, Kigali', -1.9441, 30.0619, 1, 4.9, 23, 100000, '["GPS","Air Conditioning","Automatic","4WD","Bluetooth"]', 'like-new'),
('MacBook Pro M3 - Laptop igezweho', 'MacBook Pro 16-inch na M3 chip, 16GB RAM, 512GB SSD.', 'electronics', '["https://images.unsplash.com/flagged/photo-1576697010739-6373b63f3204?w=1080"]', 15000, 2500000, 'KN 3 Rd, Kigali', -1.9511, 30.0919, 2, 5.0, 18, 50000, '["M3 Chip","16GB RAM","512GB SSD","Retina Display"]', 'like-new'),
('Canon EOS R5 - Camera ya Pro', 'Camera nziza ya professional photography, ifite 45MP, 8K video.', 'electronics', '["https://images.unsplash.com/photo-1764557359097-f15dd0c0a17b?w=1080"]', 25000, 4500000, 'KG 5 Ave, Kigali', -1.9536, 30.0987, 1, 4.8, 31, 100000, '["45MP","8K Video","RF Mount","IBIS"]', 'like-new'),
('Inzu nziza i Kicukiro - 3 Bedrooms', 'Inzu nziza ifite ibyumba 3, kitchen igezweho, compound nini.', 'houses', '["https://images.unsplash.com/photo-1717960331841-a36791e8d2f5?w=1080"]', 300000, 45000000, 'Kicukiro, KK 15 St', -1.9667, 30.1044, 2, 4.7, 8, 600000, '["3 Bedrooms","2 Bathrooms","Kitchen","Parking","Garden"]', 'good'),
('Umwenda w''Ubukwe - Wedding Dress', 'Umwenda w''ubukwe mwiza cyane, white na beads nyinshi.', 'clothing', '["https://images.unsplash.com/photo-1676132068619-f015a54cee3d?w=1080"]', 80000, 500000, 'Kimironko, Kigali', -1.9412, 30.1267, 2, 4.9, 42, 50000, '["Size Medium","White Color","Hand Beaded"]', 'like-new'),
('Ibikoresho byo Kubaka - Power Tools', 'Set y''ibikoresho byo kubaka: drill, saw, hammer drill.', 'tools', '["https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=1080"]', 10000, 250000, 'Nyabugogo, Kigali', -1.9378, 30.0545, 3, 4.5, 15, 30000, '["Cordless Drill","Circular Saw","Tool Box"]', 'good');
