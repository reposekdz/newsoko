<?php
/**
 * Production Database Setup Script
 * Run this to set up the complete database with all Rwanda location support
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "===========================================\n";
echo "Newsoko Marketplace - Production Setup\n";
echo "===========================================\n\n";

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo "ERROR: Could not connect to database. Check your .env configuration.\n";
    exit(1);
}

echo "✓ Connected to database\n\n";

$queries = [];

// ============================================
// USERS TABLE
// ============================================
echo "Setting up users table...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active TINYINT(1) DEFAULT 1,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    location VARCHAR(255),
    province_id INT NULL,
    district_id INT NULL,
    sector_id INT NULL,
    account_status ENUM('active','suspended','banned') DEFAULT 'active',
    ban_reason VARCHAR(500) NULL,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// Indexes
$queries[] = "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)";
$queries[] = "CREATE INDEX IF NOT EXISTS idx_users_province ON users(province_id)";
$queries[] = "CREATE INDEX IF NOT EXISTS idx_users_district ON users(district_id)";
$queries[] = "CREATE INDEX IF NOT EXISTS idx_users_sector ON users(sector_id)";

// ============================================
// PRODUCTS TABLE
// ============================================
echo "Setting up products table...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT NULL,
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
    status ENUM('pending','approved','rejected','sold') DEFAULT 'pending',
    approved_at DATETIME NULL,
    approved_by INT NULL,
    rejection_reason VARCHAR(500) NULL,
    deposit DECIMAL(10,2),
    features TEXT,
    condition_status ENUM('new','like-new','good','fair') DEFAULT 'good',
    sku VARCHAR(100),
    stock_quantity INT DEFAULT 0,
    weight DECIMAL(10,3),
    dimensions VARCHAR(50),
    brand VARCHAR(100),
    model VARCHAR(100),
    year_manufactured YEAR,
    warranty_period VARCHAR(50),
    tags TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    views INT DEFAULT 0,
    favorites INT DEFAULT 0,
    listing_type ENUM('rent','sale','both') DEFAULT 'both',
    is_featured TINYINT(1) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    province_id INT NULL,
    district_id INT NULL,
    sector_id INT NULL,
    location_string VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

$queries[] = "CREATE INDEX IF NOT EXISTS idx_products_owner ON products(owner_id)";
$queries[] = "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)";
$queries[] = "CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)";
$queries[] = "CREATE INDEX IF NOT EXISTS idx_products_province ON products(province_id)";
$queries[] = "CREATE INDEX IF NOT EXISTS idx_products_district ON products(district_id)";
$queries[] = "CREATE INDEX IF NOT EXISTS idx_products_sector ON products(sector_id)";

// ============================================
// CATEGORIES TABLE
// ============================================
echo "Setting up categories table...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT NULL,
    icon VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// BOOKINGS TABLE
// ============================================
echo "Setting up bookings table...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    renter_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2),
    platform_fee DECIMAL(10,2),
    status ENUM('pending','confirmed','active','completed','cancelled','refunded') DEFAULT 'pending',
    payment_status ENUM('pending','paid','refunded') DEFAULT 'pending',
    escrow_status ENUM('locked','released','refunded') DEFAULT 'locked',
    refund_amount DECIMAL(10,2),
    refund_reason VARCHAR(500),
    delivery_address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// REVIEWS TABLE
// ============================================
echo "Setting up reviews table...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    booking_id INT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    response TEXT,
    response_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// SESSIONS TABLE
// ============================================
echo "Setting up sessions table...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sessions_token (token),
    INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// NOTIFICATIONS TABLE
// ============================================
echo "Setting up notifications table...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// ROLES & ADMIN TABLES
// ============================================
echo "Setting up roles and admin tables...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    permissions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

$queries[] = "CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

$queries[] = "CREATE TABLE IF NOT EXISTS admin_logs (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// RWANDA LOCATIONS TABLES
// ============================================
echo "Setting up Rwanda locations tables...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS rwanda_provinces (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

$queries[] = "CREATE TABLE IF NOT EXISTS rwanda_districts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    province_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES rwanda_provinces(id) ON DELETE CASCADE,
    UNIQUE KEY unique_district (province_id, name),
    INDEX idx_district_province (province_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

$queries[] = "CREATE TABLE IF NOT EXISTS rwanda_sectors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    district_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES rwanda_districts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_sector (district_id, name),
    INDEX idx_sector_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// SYSTEM SETTINGS TABLE
// ============================================
echo "Setting up system settings table...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// PRODUCT ATTRIBUTES & VARIANTS TABLES
// ============================================
echo "Setting up product attributes tables...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS product_attributes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value VARCHAR(255) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_attrs_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

$queries[] = "CREATE TABLE IF NOT EXISTS product_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    variant_value VARCHAR(255) NOT NULL,
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100),
    is_available TINYINT(1) DEFAULT TRUE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_variants_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// MESSAGES TABLE
// ============================================
echo "Setting up messages table...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    product_id INT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_messages_from (from_user_id),
    INDEX idx_messages_to (to_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// DISPUTES TABLE
// ============================================
echo "Setting up disputes table...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS disputes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NULL,
    raised_by INT NOT NULL,
    against_user INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('open','resolved','closed') DEFAULT 'open',
    resolution TEXT NULL,
    resolved_by INT NULL,
    resolved_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (raised_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (against_user) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_disputes_raised (raised_by),
    INDEX idx_disputes_against (against_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// WALLET TABLES
// ============================================
echo "Setting up wallet tables...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS wallets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    balance DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'RWF',
    is_locked TINYINT(1) DEFAULT FALSE,
    lock_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

$queries[] = "CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('deposit','withdrawal','payment','refund','escrow','release') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    reference_id VARCHAR(255),
    status ENUM('pending','completed','failed','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_wallet_trans_user (user_id),
    INDEX idx_wallet_trans_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// ESCROW TABLE
// ============================================
echo "Setting up escrow table...\n";
$queries[] = "CREATE TABLE IF NOT EXISTS escrow (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    status ENUM('pending','funded','released','refunded','disputed') DEFAULT 'pending',
    funded_at DATETIME NULL,
    released_at DATETIME NULL,
    released_to VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_escrow_booking (booking_id),
    INDEX idx_escrow_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// ============================================
// EXECUTE ALL QUERIES
// ============================================
echo "\n";
$successCount = 0;
$errorCount = 0;

foreach ($queries as $i => $query) {
    try {
        $db->exec($query);
        $successCount++;
        if ($successCount % 20 == 0) {
            echo ".";
        }
    } catch (PDOException $e) {
        $errorCount++;
        echo "\nERROR on query " . ($i + 1) . ": " . $e->getMessage() . "\n";
    }
}

echo "\n\n";
echo "Tables created: $successCount\n";
if ($errorCount > 0) {
    echo "Errors: $errorCount\n";
}

// ============================================
// INSERT DEFAULT DATA
// ============================================
echo "\nInserting default data...\n\n";

// Insert categories
$categories = [
    ['Vehicles', 'vehicles', 'Cars, motorcycles, bicycles, and other vehicles', '🚗'],
    ['Electronics', 'electronics', 'Phones, laptops, cameras, and gadgets', '📱'],
    ['Clothing', 'clothing', 'Clothes, shoes, and accessories', '👕'],
    ['Houses', 'houses', 'Houses, apartments, and rooms for rent', '🏠'],
    ['Furniture', 'furniture', 'Beds, sofas, tables, and home furniture', '🪑'],
    ['Tools', 'tools', 'Power tools and construction equipment', '🔧'],
    ['Others', 'others', 'Miscellaneous items', '📦']
];

foreach ($categories as $cat) {
    try {
        $stmt = $db->prepare("INSERT IGNORE INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)");
        $stmt->execute($cat);
    } catch (PDOException $e) {
        // Ignore duplicate entries
    }
}
echo "✓ Categories inserted\n";

// Insert Rwanda provinces
$provinces = [
    ['Kigali City', 'KGL'],
    ['Eastern Province', 'EST'],
    ['Northern Province', 'NTH'],
    ['Southern Province', 'STH'],
    ['Western Province', 'WST']
];

foreach ($provinces as $prov) {
    try {
        $stmt = $db->prepare("INSERT IGNORE INTO rwanda_provinces (name, code) VALUES (?, ?)");
        $stmt->execute($prov);
    } catch (PDOException $e) {}
}
echo "✓ Provinces inserted\n";

// Insert Rwanda districts
$districts = [
    [1, 'Gasabo', 'GSB'], [1, 'Kicukiro', 'KCK'], [1, 'Nyarugenge', 'NYR'],
    [2, 'Bugesera', 'BGS'], [2, 'Gatsibo', 'GTS'], [2, 'Kayonza', 'KYZ'],
    [2, 'Kirehe', 'KRH'], [2, 'Ngoma', 'NGM'], [2, 'Nyagatare', 'NYG'], [2, 'Rwamagana', 'RWM'],
    [3, 'Burera', 'BRR'], [3, 'Gakenke', 'GKK'], [3, 'Gicumbi', 'GCM'],
    [3, 'Musanze', 'MSZ'], [3, 'Rulindo', 'RLD'],
    [4, 'Gisagara', 'GSG'], [4, 'Huye', 'HYE'], [4, 'Kamonyi', 'KMN'],
    [4, 'Muhanga', 'MHG'], [4, 'Nyamagabe', 'NYM'], [4, 'Nyanza', 'NYZ'],
    [4, 'Nyaruguru', 'NYU'], [4, 'Ruhango', 'RHG'],
    [5, 'Karongi', 'KRG'], [5, 'Ngororero', 'NGR'], [5, 'Nyabihu', 'NYB'],
    [5, 'Nyamasheke', 'NYS'], [5, 'Rubavu', 'RBV'], [5, 'Rusizi', 'RSZ'], [5, 'Rutsiro', 'RTS']
];

foreach ($districts as $dist) {
    try {
        $stmt = $db->prepare("INSERT IGNORE INTO rwanda_districts (province_id, name, code) VALUES (?, ?, ?)");
        $stmt->execute($dist);
    } catch (PDOException $e) {}
}
echo "✓ Districts inserted\n";

// Insert roles
$roles = [
    ['admin', 'Administrator', 'Full system access'],
    ['seller', 'Seller', 'Can list and sell products'],
    ['buyer', 'Buyer', 'Can purchase products'],
    ['moderator', 'Moderator', 'Can moderate content']
];

foreach ($roles as $role) {
    try {
        $stmt = $db->prepare("INSERT IGNORE INTO roles (name, display_name, description) VALUES (?, ?, ?)");
        $stmt->execute($role);
    } catch (PDOException $e) {}
}
echo "✓ Roles inserted\n";

// Insert system settings
$settings = [
    ['platform_fee_percentage', '5', 'Platform fee percentage for transactions'],
    ['min_booking_days', '1', 'Minimum booking duration in days'],
    ['max_booking_days', '30', 'Maximum booking duration in days'],
    ['escrow_enabled', '1', 'Enable escrow payment system'],
    ['commission_rate', '2.5', 'Seller commission rate percentage']
];

foreach ($settings as $setting) {
    try {
        $stmt = $db->prepare("INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)");
        $stmt->execute($setting);
    } catch (PDOException $e) {}
}
echo "✓ System settings inserted\n";

// ============================================
// CREATE TEST USERS
// ============================================
echo "\nCreating test users...\n";

$testUsers = [
    ['Jean Baptiste Mugabo', 'jb.mugabo@example.rw', '+250788123456', 'password123', 'Kigali, Gasabo', 1, 1, 1],
    ['Marie Claire Uwase', 'mc.uwase@example.rw', '+250788234567', 'password123', 'Kigali, Kicukiro', 1, 2, 1],
    ['Patrick Nshimiyimana', 'p.nshimiyimana@example.rw', '+250788345678', 'password123', 'Kigali, Nyarugenge', 1, 3, 1]
];

foreach ($testUsers as $user) {
    try {
        $password = password_hash($user[3], PASSWORD_BCRYPT);
        $stmt = $db->prepare("INSERT IGNORE INTO users (name, email, phone, password, location, province_id, district_id, sector_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$user[0], $user[1], $user[2], $password, $user[4], $user[5], $user[6], $user[7]]);
    } catch (PDOException $e) {}
}
echo "✓ Test users created (password: password123)\n";

echo "\n===========================================\n";
echo "Production Setup Complete!\n";
echo "===========================================\n";
echo "\nTo login with test user:\n";
echo "  Email: jb.mugabo@example.rw\n";
echo "  Password: password123\n";
echo "\nRwanda Locations API:\n";
echo "  GET /api/controllers/rwanda_locations.php?action=provinces\n";
echo "\n";
