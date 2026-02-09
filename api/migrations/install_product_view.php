<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Installing Product View Features...\n\n";

try {
    $db->exec("CREATE TABLE IF NOT EXISTS product_views (id INT PRIMARY KEY AUTO_INCREMENT, product_id INT NOT NULL, user_id INT, ip_address VARCHAR(45), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL)");
    echo "✓ product_views\n";
    
    $db->exec("CREATE TABLE IF NOT EXISTS product_features (id INT PRIMARY KEY AUTO_INCREMENT, product_id INT NOT NULL, feature_name VARCHAR(100) NOT NULL, feature_value TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE)");
    echo "✓ product_features\n";
    
    $db->exec("CREATE TABLE IF NOT EXISTS product_questions (id INT PRIMARY KEY AUTO_INCREMENT, product_id INT NOT NULL, user_id INT NOT NULL, question TEXT NOT NULL, answer TEXT, answered_by INT, answered_at TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (answered_by) REFERENCES users(id) ON DELETE SET NULL)");
    echo "✓ product_questions\n";
    
    $db->exec("CREATE TABLE IF NOT EXISTS product_reports (id INT PRIMARY KEY AUTO_INCREMENT, product_id INT NOT NULL, reporter_id INT NOT NULL, reason VARCHAR(100) NOT NULL, description TEXT, status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending', reviewed_by INT, reviewed_at TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE, FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL)");
    echo "✓ product_reports\n";
    
    $db->exec("CREATE TABLE IF NOT EXISTS messages (id INT PRIMARY KEY AUTO_INCREMENT, sender_id INT NOT NULL, receiver_id INT NOT NULL, product_id INT, message TEXT NOT NULL, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL)");
    echo "✓ messages\n";
    
    echo "✓ Indexes created\n\n";
    
    echo "============================================================\n";
    echo "✓ Product view features installed successfully!\n";
    echo "============================================================\n";
    
} catch (Exception $e) {
    echo "\n✗ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>
