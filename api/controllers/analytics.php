<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            if (isset($_GET['type']) && $_GET['type'] === 'dashboard') {
                $user = $auth->requireAuth();
                
                // User statistics
                $userStats = "SELECT 
                    (SELECT COUNT(*) FROM products WHERE owner_id = :user_id) as total_listings,
                    (SELECT COUNT(*) FROM bookings WHERE renter_id = :user_id) as total_rentals,
                    (SELECT COUNT(*) FROM bookings WHERE owner_id = :user_id) as total_bookings_received,
                    (SELECT SUM(total_price) FROM bookings WHERE owner_id = :user_id AND status = 'completed') as total_earnings,
                    (SELECT COUNT(*) FROM favorites WHERE user_id = :user_id) as total_favorites,
                    (SELECT COUNT(*) FROM messages WHERE to_user_id = :user_id AND is_read = 0) as unread_messages,
                    (SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND is_read = 0) as unread_notifications";
                
                $stmt = $db->prepare($userStats);
                $stmt->bindParam(':user_id', $user['id']);
                $stmt->execute();
                $stats = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $stats]);
                
            } elseif (isset($_GET['type']) && $_GET['type'] === 'marketplace') {
                // Marketplace statistics
                $marketStats = "SELECT 
                    (SELECT COUNT(*) FROM products WHERE is_available = 1) as total_products,
                    (SELECT COUNT(*) FROM users WHERE account_status = 'active') as total_users,
                    (SELECT COUNT(*) FROM bookings WHERE status = 'active') as active_bookings,
                    (SELECT AVG(rating) FROM products) as avg_rating,
                    (SELECT COUNT(*) FROM products WHERE category = 'spare_parts') as spare_parts_count,
                    (SELECT COUNT(*) FROM products WHERE category IN ('construction', 'building_materials')) as construction_count,
                    (SELECT COUNT(*) FROM products WHERE category = 'machinery') as machinery_count,
                    (SELECT SUM(views) FROM products) as total_views,
                    (SELECT SUM(favorites) FROM products) as total_favorites";
                
                $stmt = $db->prepare($marketStats);
                $stmt->execute();
                $stats = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $stats]);
                
            } elseif (isset($_GET['type']) && $_GET['type'] === 'trending') {
                // Trending products
                $query = "SELECT p.*, u.name as owner_name, u.avatar as owner_avatar,
                          (p.views + p.favorites * 2) as popularity_score
                          FROM products p
                          JOIN users u ON p.owner_id = u.id
                          WHERE p.is_available = 1
                          ORDER BY popularity_score DESC
                          LIMIT 10";
                
                $stmt = $db->prepare($query);
                $stmt->execute();
                $trending = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($trending as &$item) {
                    $item['images'] = json_decode($item['images']);
                    $item['features'] = json_decode($item['features']);
                }
                
                echo json_encode(['success' => true, 'data' => $trending]);
                
            } elseif (isset($_GET['type']) && $_GET['type'] === 'categories_stats') {
                // Category statistics
                $query = "SELECT 
                    category,
                    COUNT(*) as count,
                    AVG(rating) as avg_rating,
                    SUM(views) as total_views
                    FROM products
                    WHERE is_available = 1
                    GROUP BY category
                    ORDER BY count DESC";
                
                $stmt = $db->prepare($query);
                $stmt->execute();
                $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $categories]);
                
            } elseif (isset($_GET['type']) && $_GET['type'] === 'recent_activity') {
                $user = $auth->requireAuth();
                
                // Recent activity
                $query = "SELECT 'booking' as type, b.id, b.created_at, p.title, b.status
                          FROM bookings b
                          JOIN products p ON b.product_id = p.id
                          WHERE b.renter_id = :user_id OR b.owner_id = :user_id
                          UNION ALL
                          SELECT 'message' as type, m.id, m.created_at, CONCAT('Message from ', u.name) as title, 
                                 CASE WHEN m.is_read THEN 'read' ELSE 'unread' END as status
                          FROM messages m
                          JOIN users u ON m.from_user_id = u.id
                          WHERE m.to_user_id = :user_id
                          ORDER BY created_at DESC
                          LIMIT 20";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user['id']);
                $stmt->execute();
                $activity = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $activity]);
            }
            break;
            
        case 'POST':
            $user = $auth->requireAuth();
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (isset($data['action']) && $data['action'] === 'track_view') {
                // Track product view
                $query = "UPDATE products SET views = views + 1 WHERE id = :product_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':product_id', $data['product_id']);
                $stmt->execute();
                
                echo json_encode(['success' => true]);
                
            } elseif (isset($data['action']) && $data['action'] === 'track_search') {
                // Track search query for analytics
                $query = "INSERT INTO search_logs (user_id, query, category, results_count, created_at)
                          VALUES (:user_id, :query, :category, :results_count, NOW())";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user['id']);
                $stmt->bindParam(':query', $data['query']);
                $stmt->bindParam(':category', $data['category']);
                $stmt->bindParam(':results_count', $data['results_count']);
                $stmt->execute();
                
                echo json_encode(['success' => true]);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
