<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET' && isset($_GET['id'])) {
        $productId = $_GET['id'];
        $userId = null;
        
        // Try to get authenticated user
        try {
            $auth = new Auth($db);
            \$user = \$auth->requireAuth();
            $userId = $user['id'];
        } catch (Exception $e) {
            // Guest user
        }
        
        // Get product details with owner info and location
        $stmt = $db->prepare("
            SELECT p.*, 
                   u.id as owner_id, u.name as owner_name, u.email as owner_email, 
                   u.phone as owner_phone, u.rating as owner_rating, u.is_verified as owner_verified,
                   c.name as category_name,
                   prov.name as province_name, dist.name as district_name, sect.name as sector_name,
                   (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count,
                   (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
                   (SELECT COUNT(*) FROM favorites WHERE product_id = p.id) as favorite_count,
                   (SELECT COUNT(*) FROM bookings WHERE product_id = p.id AND status = 'completed') as booking_count
            FROM products p
            JOIN users u ON p.owner_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN rwanda_provinces prov ON p.province_id = prov.id
            LEFT JOIN rwanda_districts dist ON p.district_id = dist.id
            LEFT JOIN rwanda_sectors sect ON p.sector_id = sect.id
            WHERE p.id = ? AND p.is_available = TRUE
        ");
        $stmt->execute([$productId]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product) {
            throw new Exception('Product not found');
        }
        
        // Track view
        if ($userId) {
            $stmt = $db->prepare("INSERT INTO product_views (product_id, user_id, ip_address) VALUES (?, ?, ?)");
            $stmt->execute([$productId, $userId, $_SERVER['REMOTE_ADDR']]);
        }
        
        // Get product features
        $stmt = $db->prepare("SELECT feature_name, feature_value FROM product_features WHERE product_id = ?");
        $stmt->execute([$productId]);
        $product['features'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get product variants
        $stmt = $db->prepare("SELECT * FROM product_variants WHERE product_id = ?");
        $stmt->execute([$productId]);
        $product['variants'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get related products
        $stmt = $db->prepare("
            SELECT p.id, p.title, p.images, p.rent_price, p.buy_price, p.condition_status,
                   (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating
            FROM products p
            WHERE p.category_id = ? AND p.id != ? AND p.is_available = TRUE
            ORDER BY RAND()
            LIMIT 6
        ");
        $stmt->execute([$product['category_id'], $productId]);
        $product['related_products'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get reviews with user info
        $stmt = $db->prepare("
            SELECT r.*, u.name as reviewer_name, u.rating as reviewer_rating
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
            LIMIT 10
        ");
        $stmt->execute([$productId]);
        $product['reviews'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get Q&A
        $stmt = $db->prepare("
            SELECT pq.*, 
                   u1.name as asker_name,
                   u2.name as answerer_name
            FROM product_questions pq
            JOIN users u1 ON pq.user_id = u1.id
            LEFT JOIN users u2 ON pq.answered_by = u2.id
            WHERE pq.product_id = ?
            ORDER BY pq.created_at DESC
            LIMIT 10
        ");
        $stmt->execute([$productId]);
        $product['questions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Check if user favorited
        if ($userId) {
            $stmt = $db->prepare("SELECT COUNT(*) FROM favorites WHERE user_id = ? AND product_id = ?");
            $stmt->execute([$userId, $productId]);
            $product['is_favorited'] = $stmt->fetchColumn() > 0;
        } else {
            $product['is_favorited'] = false;
        }
        
        // Get seller other products
        $stmt = $db->prepare("
            SELECT id, title, images, rent_price, buy_price
            FROM products
            WHERE owner_id = ? AND id != ? AND is_available = TRUE
            LIMIT 4
        ");
        $stmt->execute([$product['owner_id'], $productId]);
        $product['seller_products'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $product]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? '';
        
        $auth = new Auth($db);
        \$user = \$auth->requireAuth();
        
        switch($action) {
            case 'message_seller':
                $stmt = $db->prepare("
                    INSERT INTO messages (sender_id, receiver_id, product_id, message, created_at)
                    VALUES (?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $user['id'],
                    $data['seller_id'],
                    $data['product_id'],
                    $data['message']
                ]);
                
                // Create notification
                $stmt = $db->prepare("
                    INSERT INTO notifications (user_id, type, title, message, related_id)
                    VALUES (?, 'message', 'New Message', ?, ?)
                ");
                $stmt->execute([
                    $data['seller_id'],
                    'You have a new message about your product',
                    $data['product_id']
                ]);
                
                echo json_encode(['success' => true, 'message' => 'Message sent']);
                break;
                
            case 'add_favorite':
                $stmt = $db->prepare("
                    INSERT IGNORE INTO favorites (user_id, product_id, created_at)
                    VALUES (?, ?, NOW())
                ");
                $stmt->execute([$user['id'], $data['product_id']]);
                echo json_encode(['success' => true, 'message' => 'Added to favorites']);
                break;
                
            case 'remove_favorite':
                $stmt = $db->prepare("DELETE FROM favorites WHERE user_id = ? AND product_id = ?");
                $stmt->execute([$user['id'], $data['product_id']]);
                echo json_encode(['success' => true, 'message' => 'Removed from favorites']);
                break;
                
            case 'ask_question':
                $stmt = $db->prepare("
                    INSERT INTO product_questions (product_id, user_id, question, created_at)
                    VALUES (?, ?, ?, NOW())
                ");
                $stmt->execute([$data['product_id'], $user['id'], $data['question']]);
                
                // Notify seller
                $stmt = $db->prepare("SELECT owner_id FROM products WHERE id = ?");
                $stmt->execute([$data['product_id']]);
                $ownerId = $stmt->fetchColumn();
                
                $stmt = $db->prepare("
                    INSERT INTO notifications (user_id, type, title, message, related_id)
                    VALUES (?, 'question', 'New Question', 'Someone asked about your product', ?)
                ");
                $stmt->execute([$ownerId, $data['product_id']]);
                
                echo json_encode(['success' => true, 'message' => 'Question posted']);
                break;
                
            case 'submit_review':
                // Check if user has completed booking
                $stmt = $db->prepare("
                    SELECT COUNT(*) FROM bookings 
                    WHERE product_id = ? AND renter_id = ? AND status = 'completed'
                ");
                $stmt->execute([$data['product_id'], $user['id']]);
                
                if ($stmt->fetchColumn() == 0) {
                    throw new Exception('You must complete a booking to review');
                }
                
                $stmt = $db->prepare("
                    INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
                    VALUES (?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE rating = ?, comment = ?
                ");
                $stmt->execute([
                    $data['product_id'],
                    $user['id'],
                    $data['rating'],
                    $data['comment'],
                    $data['rating'],
                    $data['comment']
                ]);
                
                echo json_encode(['success' => true, 'message' => 'Review submitted']);
                break;
                
            case 'report_product':
                $stmt = $db->prepare("
                    INSERT INTO product_reports (product_id, reporter_id, reason, description, created_at)
                    VALUES (?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $data['product_id'],
                    $user['id'],
                    $data['reason'],
                    $data['description']
                ]);
                
                echo json_encode(['success' => true, 'message' => 'Report submitted']);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
    } else {
        throw new Exception('Invalid request');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
