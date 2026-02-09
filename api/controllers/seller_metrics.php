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

$user = \$auth->requireAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$sellerId = $_GET['seller_id'] ?? $user['id'];

// Get or create seller metrics
$stmt = $db->prepare("SELECT * FROM seller_metrics WHERE seller_id = :seller_id");
$stmt->bindParam(':seller_id', $sellerId);
$stmt->execute();
$metrics = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$metrics) {
    // Create initial metrics
    $createStmt = $db->prepare("INSERT INTO seller_metrics (seller_id) VALUES (:seller_id)");
    $createStmt->bindParam(':seller_id', $sellerId);
    $createStmt->execute();
    
    $stmt->execute();
    $metrics = $stmt->fetch(PDO::FETCH_ASSOC);
}

// Calculate real-time metrics
$statsStmt = $db->prepare("
    SELECT 
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100 as completion_rate,
        AVG(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) * 100 as cancellation_rate
    FROM bookings 
    WHERE seller_id = :seller_id
");
$statsStmt->bindParam(':seller_id', $sellerId);
$statsStmt->execute();
$stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

// Get average rating
$ratingStmt = $db->prepare("
    SELECT AVG(r.rating) as avg_rating 
    FROM reviews r 
    JOIN products p ON r.product_id = p.id 
    WHERE p.seller_id = :seller_id
");
$ratingStmt->bindParam(':seller_id', $sellerId);
$ratingStmt->execute();
$rating = $ratingStmt->fetch(PDO::FETCH_ASSOC);

// Get dispute rate
$disputeStmt = $db->prepare("
    SELECT COUNT(*) as dispute_count 
    FROM disputes d 
    JOIN bookings b ON d.booking_id = b.id 
    WHERE b.seller_id = :seller_id
");
$disputeStmt->bindParam(':seller_id', $sellerId);
$disputeStmt->execute();
$disputes = $disputeStmt->fetch(PDO::FETCH_ASSOC);

$disputeRate = $stats['total_sales'] > 0 ? ($disputes['dispute_count'] / $stats['total_sales']) * 100 : 0;

// Get repeat customer rate
$repeatStmt = $db->prepare("
    SELECT COUNT(DISTINCT buyer_id) as unique_buyers,
           COUNT(*) as total_orders,
           (COUNT(*) - COUNT(DISTINCT buyer_id)) as repeat_orders
    FROM bookings 
    WHERE seller_id = :seller_id AND status = 'completed'
");
$repeatStmt->bindParam(':seller_id', $sellerId);
$repeatStmt->execute();
$repeat = $repeatStmt->fetch(PDO::FETCH_ASSOC);

$repeatRate = $repeat['unique_buyers'] > 0 ? ($repeat['repeat_orders'] / $repeat['unique_buyers']) * 100 : 0;

// Update metrics
$updateStmt = $db->prepare("
    UPDATE seller_metrics 
    SET total_sales = :total_sales,
        total_revenue = :total_revenue,
        avg_rating = :avg_rating,
        completion_rate = :completion_rate,
        cancellation_rate = :cancellation_rate,
        dispute_rate = :dispute_rate,
        repeat_customer_rate = :repeat_rate,
        last_updated = NOW()
    WHERE seller_id = :seller_id
");

$updateStmt->bindParam(':total_sales', $stats['total_sales']);
$updateStmt->bindParam(':total_revenue', $stats['total_revenue']);
$updateStmt->bindParam(':avg_rating', $rating['avg_rating']);
$updateStmt->bindParam(':completion_rate', $stats['completion_rate']);
$updateStmt->bindParam(':cancellation_rate', $stats['cancellation_rate']);
$updateStmt->bindParam(':dispute_rate', $disputeRate);
$updateStmt->bindParam(':repeat_rate', $repeatRate);
$updateStmt->bindParam(':seller_id', $sellerId);
$updateStmt->execute();

// Get updated metrics
$stmt->execute();
$metrics = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'metrics' => $metrics]);
