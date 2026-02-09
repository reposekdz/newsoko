<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['personalized'])) {
                // Get personalized recommendations
                $user = \$auth->requireAuth();
                $user_id = $user ? $user['user_id'] : null;
                $limit = $_GET['limit'] ?? 10;
                
                if ($user_id) {
                    // Get user preferences
                    $query = "SELECT * FROM user_preferences WHERE user_id = :user_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user_id', $user_id);
                    $stmt->execute();
                    $preferences = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Get browsing history
                    $query = "SELECT DISTINCT product_id FROM product_views 
                             WHERE user_id = :user_id 
                             ORDER BY created_at DESC LIMIT 20";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user_id', $user_id);
                    $stmt->execute();
                    $viewed_products = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    
                    // Get recommendations based on viewed products
                    if (!empty($viewed_products)) {
                        $placeholders = implode(',', array_fill(0, count($viewed_products), '?'));
                        $query = "SELECT DISTINCT p.*, u.name as owner_name, u.avatar as owner_avatar,
                                 (SELECT AVG(rating) FROM ratings_reviews WHERE target_id = p.id AND target_type = 'product') as avg_rating
                                 FROM products p
                                 JOIN users u ON p.owner_id = u.id
                                 WHERE p.id NOT IN ($placeholders)
                                 AND p.is_available = TRUE
                                 AND (p.category IN (SELECT category FROM products WHERE id IN ($placeholders))
                                      OR p.owner_id IN (SELECT owner_id FROM products WHERE id IN ($placeholders)))
                                 ORDER BY p.view_count DESC, p.created_at DESC
                                 LIMIT :limit";
                        $stmt = $db->prepare($query);
                        foreach ($viewed_products as $index => $product_id) {
                            $stmt->bindValue($index + 1, $product_id, PDO::PARAM_INT);
                            $stmt->bindValue(count($viewed_products) + $index + 1, $product_id, PDO::PARAM_INT);
                            $stmt->bindValue(2 * count($viewed_products) + $index + 1, $product_id, PDO::PARAM_INT);
                        }
                        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
                        $stmt->execute();
                        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    } else {
                        // Fallback to trending products
                        $query = "SELECT p.*, u.name as owner_name, u.avatar as owner_avatar,
                                 (SELECT AVG(rating) FROM ratings_reviews WHERE target_id = p.id AND target_type = 'product') as avg_rating
                                 FROM products p
                                 JOIN users u ON p.owner_id = u.id
                                 WHERE p.is_available = TRUE
                                 ORDER BY p.view_count DESC, p.created_at DESC
                                 LIMIT :limit";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                        $stmt->execute();
                        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    }
                } else {
                    // Guest user - show trending
                    $query = "SELECT p.*, u.name as owner_name, u.avatar as owner_avatar,
                             (SELECT AVG(rating) FROM ratings_reviews WHERE target_id = p.id AND target_type = 'product') as avg_rating
                             FROM products p
                             JOIN users u ON p.owner_id = u.id
                             WHERE p.is_available = TRUE
                             ORDER BY p.view_count DESC, p.created_at DESC
                             LIMIT :limit";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                    $stmt->execute();
                    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
                }
                
                foreach ($products as &$product) {
                    $product['images'] = json_decode($product['images'], true);
                }
                
                echo json_encode(['success' => true, 'data' => $products]);
                
            } elseif (isset($_GET['similar'])) {
                // Get similar products
                $product_id = $_GET['product_id'];
                $limit = $_GET['limit'] ?? 8;
                
                // Get product details
                $query = "SELECT * FROM products WHERE id = :product_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->execute();
                $product = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$product) {
                    throw new Exception('Product not found');
                }
                
                // Find similar products
                $query = "SELECT p.*, u.name as owner_name, u.avatar as owner_avatar,
                         (SELECT AVG(rating) FROM ratings_reviews WHERE target_id = p.id AND target_type = 'product') as avg_rating,
                         CASE 
                            WHEN p.category = :category THEN 3
                            ELSE 0
                         END +
                         CASE 
                            WHEN ABS(COALESCE(p.rent_price, p.buy_price) - :price) < :price * 0.3 THEN 2
                            ELSE 0
                         END as similarity_score
                         FROM products p
                         JOIN users u ON p.owner_id = u.id
                         WHERE p.id != :product_id
                         AND p.is_available = TRUE
                         ORDER BY similarity_score DESC, p.view_count DESC
                         LIMIT :limit";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->bindParam(':category', $product['category']);
                $price = $product['rent_price'] ?? $product['buy_price'];
                $stmt->bindParam(':price', $price);
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->execute();
                $similar_products = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($similar_products as &$p) {
                    $p['images'] = json_decode($p['images'], true);
                }
                
                echo json_encode(['success' => true, 'data' => $similar_products]);
                
            } elseif (isset($_GET['trending'])) {
                // Get trending products
                $limit = $_GET['limit'] ?? 10;
                $days = $_GET['days'] ?? 7;
                
                $query = "SELECT p.*, u.name as owner_name, u.avatar as owner_avatar,
                         (SELECT AVG(rating) FROM ratings_reviews WHERE target_id = p.id AND target_type = 'product') as avg_rating,
                         (SELECT COUNT(*) FROM product_views WHERE product_id = p.id AND created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)) as recent_views,
                         (SELECT COUNT(*) FROM wishlist WHERE product_id = p.id AND created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)) as recent_wishlist
                         FROM products p
                         JOIN users u ON p.owner_id = u.id
                         WHERE p.is_available = TRUE
                         ORDER BY recent_views DESC, recent_wishlist DESC, p.created_at DESC
                         LIMIT :limit";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':days', $days, PDO::PARAM_INT);
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->execute();
                $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($products as &$product) {
                    $product['images'] = json_decode($product['images'], true);
                }
                
                echo json_encode(['success' => true, 'data' => $products]);
                
            } elseif (isset($_GET['frequently_bought_together'])) {
                // Products frequently bought/rented together
                $product_id = $_GET['product_id'];
                $limit = $_GET['limit'] ?? 5;
                
                $query = "SELECT p.*, u.name as owner_name, u.avatar as owner_avatar,
                         COUNT(DISTINCT b2.id) as co_booking_count
                         FROM products p
                         JOIN users u ON p.owner_id = u.id
                         JOIN bookings b1 ON p.id = b1.product_id
                         JOIN bookings b2 ON b1.renter_id = b2.renter_id AND b1.id != b2.id
                         WHERE b2.product_id = :product_id
                         AND p.id != :product_id
                         AND p.is_available = TRUE
                         GROUP BY p.id
                         ORDER BY co_booking_count DESC
                         LIMIT :limit";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->execute();
                $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($products as &$product) {
                    $product['images'] = json_decode($product['images'], true);
                }
                
                echo json_encode(['success' => true, 'data' => $products]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            $user = \$auth->requireAuth();
            
            if (!$user) {
                throw new Exception('Authentication required');
            }
            
            $user_id = $user['user_id'];
            
            if (isset($data['action']) && $data['action'] === 'update_preferences') {
                // Update user preferences
                $preferred_categories = isset($data['preferred_categories']) ? json_encode($data['preferred_categories']) : null;
                $price_range_min = $data['price_range_min'] ?? 0;
                $price_range_max = $data['price_range_max'] ?? 999999999;
                $preferred_locations = isset($data['preferred_locations']) ? json_encode($data['preferred_locations']) : null;
                
                $query = "INSERT INTO user_preferences 
                         (user_id, preferred_categories, price_range_min, price_range_max, preferred_locations)
                         VALUES (:user_id, :categories, :min, :max, :locations)
                         ON DUPLICATE KEY UPDATE
                         preferred_categories = :categories,
                         price_range_min = :min,
                         price_range_max = :max,
                         preferred_locations = :locations";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->bindParam(':categories', $preferred_categories);
                $stmt->bindParam(':min', $price_range_min);
                $stmt->bindParam(':max', $price_range_max);
                $stmt->bindParam(':locations', $preferred_locations);
                $stmt->execute();
                
                echo json_encode(['success' => true, 'message' => 'Preferences updated']);
                
            } elseif (isset($data['action']) && $data['action'] === 'track_view') {
                // Track product view for recommendations
                $product_id = $data['product_id'];
                $ip_address = $_SERVER['REMOTE_ADDR'];
                $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? null;
                
                $query = "INSERT INTO product_views (product_id, user_id, ip_address, user_agent)
                         VALUES (:product_id, :user_id, :ip, :agent)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->bindParam(':ip', $ip_address);
                $stmt->bindParam(':agent', $user_agent);
                $stmt->execute();
                
                // Update product view count
                $query = "UPDATE products SET view_count = view_count + 1 WHERE id = :product_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->execute();
                
                echo json_encode(['success' => true]);
            }
            break;
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
