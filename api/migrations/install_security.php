<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Installing Security Tables...\n\n";

try {
    $db->exec("CREATE TABLE IF NOT EXISTS encryption_keys (id INT PRIMARY KEY AUTO_INCREMENT, key_name VARCHAR(100) NOT NULL UNIQUE, key_value TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, expires_at TIMESTAMP NULL)");
    echo "✓ encryption_keys\n";
    
    $db->exec("CREATE TABLE IF NOT EXISTS login_attempts (id INT PRIMARY KEY AUTO_INCREMENT, user_id INT, ip_address VARCHAR(45), user_agent TEXT, success BOOLEAN DEFAULT FALSE, failure_reason VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)");
    echo "✓ login_attempts\n";
    
    $db->exec("CREATE TABLE IF NOT EXISTS device_fingerprints (id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL, fingerprint_hash VARCHAR(255) NOT NULL, device_info JSON, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, is_trusted BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE KEY unique_fingerprint (user_id, fingerprint_hash))");
    echo "✓ device_fingerprints\n";
    
    $db->exec("CREATE TABLE IF NOT EXISTS ip_blacklist (id INT PRIMARY KEY AUTO_INCREMENT, ip_address VARCHAR(45) NOT NULL UNIQUE, reason TEXT, blocked_until TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    echo "✓ ip_blacklist\n";
    
    $db->exec("CREATE TABLE IF NOT EXISTS rate_limits (id INT PRIMARY KEY AUTO_INCREMENT, identifier VARCHAR(255) NOT NULL, endpoint VARCHAR(255) NOT NULL, request_count INT DEFAULT 1, window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY unique_limit (identifier, endpoint))");
    echo "✓ rate_limits\n";
    
    // Insert default encryption key
    $key = base64_encode(random_bytes(32));
    $db->exec("INSERT IGNORE INTO encryption_keys (key_name, key_value) VALUES ('default', 'base64:$key')");
    echo "✓ Default encryption key\n";
    
    $db->exec("CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON login_attempts(user_id, created_at)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user ON device_fingerprints(user_id)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, endpoint, window_start)");
    echo "✓ Indexes created\n\n";
    
    echo "============================================================\n";
    echo "✓ Security tables installed successfully!\n";
    echo "============================================================\n";
    
} catch (Exception $e) {
    echo "\n✗ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>
