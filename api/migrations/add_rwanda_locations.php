<?php
/**
 * Migration to add Rwanda location fields to users and products tables
 */

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Starting migration: Add Rwanda location fields\n";

try {
    // Add Rwanda location fields to users table
    echo "Adding Rwanda location fields to users table...\n";
    $queries = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS province_id INT NULL AFTER location",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS district_id INT NULL AFTER province_id",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS sector_id INT NULL AFTER district_id",
        "ALTER TABLE users ADD INDEX idx_province (province_id)",
        "ALTER TABLE users ADD INDEX idx_district (district_id)",
        "ALTER TABLE users ADD INDEX idx_sector (sector_id)"
    ];
    
    foreach ($queries as $query) {
        try {
            $db->exec($query);
            echo "  ✓ {$query}\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate key name') !== false || 
                strpos($e->getMessage(), 'already exists') !== false ||
                strpos($e->getMessage(), 'Duplicate column') !== false) {
                echo "  ⊘ Already exists: " . substr($query, 0, 60) . "...\n";
            } else {
                throw $e;
            }
        }
    }
    
    // Add Rwanda location fields to products table
    echo "\nAdding Rwanda location fields to products table...\n";
    $queries = [
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS province_id INT NULL AFTER seo_description",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS district_id INT NULL AFTER province_id",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS sector_id INT NULL AFTER district_id",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS location_string VARCHAR(255) NULL AFTER sector_id",
        "ALTER TABLE products ADD INDEX idx_products_province (province_id)",
        "ALTER TABLE products ADD INDEX idx_products_district (district_id)",
        "ALTER TABLE products ADD INDEX idx_products_sector (sector_id)"
    ];
    
    foreach ($queries as $query) {
        try {
            $db->exec($query);
            echo "  ✓ {$query}\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate key name') !== false || 
                strpos($e->getMessage(), 'already exists') !== false ||
                strpos($e->getMessage(), 'Duplicate column') !== false) {
                echo "  ⊘ Already exists: " . substr($query, 0, 60) . "...\n";
            } else {
                throw $e;
            }
        }
    }
    
    echo "\nMigration completed successfully!\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
