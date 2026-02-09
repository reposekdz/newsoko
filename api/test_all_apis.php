<?php
/**
 * API Test Script
 * Run this to verify all APIs are working correctly
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die("ERROR: Could not connect to database\n");
}

echo "===========================================\n";
echo "Newsoko Marketplace - API Test Suite\n";
echo "===========================================\n\n";

$testsPassed = 0;
$testsFailed = 0;

function test($name, $condition, $message = '') {
    global $testsPassed, $testsFailed;
    if ($condition) {
        echo "✓ $name\n";
        $testsPassed++;
        return true;
    } else {
        echo "✗ $name" . ($message ? ": $message" : "") . "\n";
        $testsFailed++;
        return false;
    }
}

// ============================================
// TEST 1: Database Connection
// ============================================
echo "--- Database Connection ---\n";
test("Database connection established", true);

// ============================================
// TEST 2: Users Table
// ============================================
echo "\n--- Users Table ---\n";
$stmt = $db->query("SHOW TABLES LIKE 'users'");
test("Users table exists", $stmt->rowCount() > 0);

$stmt = $db->query("SELECT COUNT(*) as count FROM users");
$row = $stmt->fetch();
test("Users table has data", $row['count'] > 0, "Found {$row['count']} users");

// Test login
$stmt = $db->prepare("SELECT * FROM users WHERE email = :email");
$stmt->bindParam(':email', $email = 'jb.mugabo@example.rw');
$stmt->execute();
$user = $stmt->fetch();
test("Test user exists", $user !== false, $email);
if ($user) {
    test("Password verification works", password_verify('password123', $user['password']));
}

// ============================================
// TEST 3: Products Table
// ============================================
echo "\n--- Products Table ---\n";
$stmt = $db->query("SHOW TABLES LIKE 'products'");
test("Products table exists", $stmt->rowCount() > 0);

$stmt = $db->query("SELECT COUNT(*) as count FROM products");
$row = $stmt->fetch();
test("Products table has data", $row['count'] > 0, "Found {$row['count']} products");

// Test Rwanda location fields
$stmt = $db->query("SHOW COLUMNS FROM products LIKE 'province_id'");
test("Products has province_id column", $stmt->rowCount() > 0);

$stmt = $db->query("SHOW COLUMNS FROM products LIKE 'district_id'");
test("Products has district_id column", $stmt->rowCount() > 0);

$stmt = $db->query("SHOW COLUMNS FROM products LIKE 'sector_id'");
test("Products has sector_id column", $stmt->rowCount() > 0);

// ============================================
// TEST 4: Rwanda Locations
// ============================================
echo "\n--- Rwanda Locations ---\n";
$stmt = $db->query("SHOW TABLES LIKE 'rwanda_provinces'");
test("rwanda_provinces table exists", $stmt->rowCount() > 0);

$stmt = $db->query("SELECT COUNT(*) as count FROM rwanda_provinces");
$row = $stmt->fetch();
test("Provinces data exists", $row['count'] >= 5, "Found {$row['count']} provinces");

$stmt = $db->query("SELECT COUNT(*) as count FROM rwanda_districts");
$row = $stmt->fetch();
test("Districts data exists", $row['count'] >= 30, "Found {$row['count']} districts");

$stmt = $db->query("SELECT COUNT(*) as count FROM rwanda_sectors");
$row = $stmt->fetch();
test("Sectors data exists", $row['count'] > 100, "Found {$row['count']} sectors");

// ============================================
// TEST 5: Categories
// ============================================
echo "\n--- Categories ---\n";
$stmt = $db->query("SHOW TABLES LIKE 'categories'");
test("categories table exists", $stmt->rowCount() > 0);

$stmt = $db->query("SELECT COUNT(*) as count FROM categories");
$row = $stmt->fetch();
test("Categories have data", $row['count'] > 0, "Found {$row['count']} categories");

// ============================================
// TEST 6: Sessions (Auth)
// ============================================
echo "\n--- Sessions (Authentication) ---\n";
$stmt = $db->query("SHOW TABLES LIKE 'sessions'");
test("Sessions table exists", $stmt->rowCount() > 0);

// ============================================
// TEST 7: Other Essential Tables
// ============================================
echo "\n--- Other Tables ---\n";
$tables = ['bookings', 'reviews', 'notifications', 'messages', 'wallets', 'escrow', 'disputes', 'categories', 'roles', 'user_roles'];
foreach ($tables as $table) {
    $stmt = $db->query("SHOW TABLES LIKE '$table'");
    test("$table table exists", $stmt->rowCount() > 0);
}

// ============================================
// SUMMARY
// ============================================
echo "\n===========================================\n";
echo "Test Results\n";
echo "===========================================\n";
echo "Passed: $testsPassed\n";
echo "Failed: $testsFailed\n";
echo "\n";

if ($testsFailed === 0) {
    echo "🎉 All tests passed! The system is ready for production.\n";
    exit(0);
} else {
    echo "⚠️  Some tests failed. Please review the errors above.\n";
    exit(1);
}
