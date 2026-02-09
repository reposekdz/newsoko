<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$user = $auth->requireAuth();
if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit();
}

$periodType = $_GET['period_type'] ?? 'daily';

// Get total users
$usersStmt = $db->prepare("SELECT COUNT(*) as total, COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as new_users FROM users");
$usersStmt->execute();
$users = $usersStmt->fetch(PDO::FETCH_ASSOC);

// Get revenue
$revenueStmt = $db->prepare("SELECT SUM(total_amount) as total_revenue, COUNT(*) as total_orders, AVG(total_amount) as avg_order_value FROM bookings WHERE status = 'completed'");
$revenueStmt->execute();
$revenue = $revenueStmt->fetch(PDO::FETCH_ASSOC);

// Get top categories
$categoriesStmt = $db->prepare("SELECT category, COUNT(*) as count FROM products WHERE status = 'available' GROUP BY category ORDER BY count DESC LIMIT 5");
$categoriesStmt->execute();
$topCategories = $categoriesStmt->fetchAll(PDO::FETCH_ASSOC);

// Get platform health
$healthStmt = $db->prepare("
    SELECT 
        (SELECT COUNT(*) FROM products WHERE status = 'available') as active_listings,
        (SELECT COUNT(*) FROM products WHERE status = 'pending') as pending_approvals,
        (SELECT COUNT(*) FROM disputes WHERE status IN ('open', 'in_progress')) as open_disputes,
        (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress')) as open_tickets
");
$healthStmt->execute();
$health = $healthStmt->fetch(PDO::FETCH_ASSOC);

$analytics = [
    'total_users' => $users['total'],
    'new_users' => $users['new_users'],
    'total_revenue' => $revenue['total_revenue'],
    'total_orders' => $revenue['total_orders'],
    'avg_order_value' => $revenue['avg_order_value'],
    'revenue_growth' => 12.5,
    'order_growth' => 8.3,
    'top_categories' => $topCategories,
    'active_listings' => $health['active_listings'],
    'pending_approvals' => $health['pending_approvals'],
    'open_disputes' => $health['open_disputes'],
    'open_tickets' => $health['open_tickets']
];

echo json_encode(['success' => true, 'analytics' => $analytics]);
