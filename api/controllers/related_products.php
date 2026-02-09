<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

try {
    if ($method === 'GET' && strpos($request_uri, '/related/') !== false) {
        // Get related products with advanced algorithm
        $product_id = isset($_GET['product_id']) ? intval($_GET['product_id']) : 0;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 8;
        
        if (!$product_id) {
            echo json_encode(['success' => false, 'message' => 'Product ID required']);
            exit;
        }
        
        // Get current product details
        $query = "SELECT category, subcategory, tags, price_range, owner_id FROM products WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $product_id);
        $stmt->execute();
        $current_product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$current_product) {
            echo json_encode(['success' => false, 'message' => 'Product not found']);
            exit;
        }
        
        // Advanced related products algorithm with scoring
        $query = "SELECT p.*, 
                  u.name as owner_name, u.avatar as owner_avatar, u.is_verified as owner_verified,
                  l.address, l.city, l.district,
                  (
                    -- Category match (highest priority)
                    CASE WHEN p.category = :category THEN 50 ELSE 0 END +
                    -- Subcategory match
                    CASE WHEN p.subcategory = :subcategory THEN 30 ELSE 0 END +
                    -- Price range similarity
                    CASE WHEN p.price_range = :price_range THEN 20 ELSE 0 END +
                    -- Same owner (lower priority)
                    CASE WHEN p.owner_id = :owner_id THEN 10 ELSE 0 END +
                    -- High rating boost
                    CASE WHEN p.rating >= 4.5 THEN 15 ELSE 0 END +
                    -- Popular items boost
                    CASE WHEN p.views > 100 THEN 10 ELSE 0 END +
                    -- Recently added boost
                    CASE WHEN p.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 5 ELSE 0 END
                  ) as relevance_score,
                  (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count,
                  (SELECT COUNT(*) FROM favorites WHERE product_id = p.id) as favorites_count
                  FROM products p
                  LEFT JOIN users u ON p.owner_id = u.id
                  LEFT JOIN locations l ON p.location_id = l.id
                  WHERE p.id != :product_id 
                  AND p.is_available = 1
                  AND p.status = 'approved'
                  HAVING relevance_score > 0
                  ORDER BY relevance_score DESC, p.rating DESC, p.views DESC
                  LIMIT :limit";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':product_id', $product_id);
        $stmt->bindParam(':category', $current_product['category']);
        $stmt->bindParam(':subcategory', $current_product['subcategory']);
        $stmt->bindParam(':price_range', $current_product['price_range']);
        $stmt->bindParam(':owner_id', $current_product['owner_id']);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $products = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Get images
            $img_query = "SELECT image_url FROM product_images WHERE product_id = :id ORDER BY display_order";
            $img_stmt = $db->prepare($img_query);
            $img_stmt->bindParam(':id', $row['id']);
            $img_stmt->execute();
            $images = $img_stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $products[] = [
                'id' => (int)$row['id'],
                'title' => $row['title'],
                'description' => $row['description'],
                'category' => $row['category'],
                'subcategory' => $row['subcategory'],
                'condition' => $row['condition'],
                'rentPrice' => $row['rent_price'] ? (float)$row['rent_price'] : null,
                'buyPrice' => $row['buy_price'] ? (float)$row['buy_price'] : null,
                'deposit' => $row['deposit'] ? (float)$row['deposit'] : null,
                'isAvailable' => (bool)$row['is_available'],
                'rating' => $row['rating'] ? (float)$row['rating'] : 0,
                'reviewCount' => (int)$row['review_count'],
                'views' => (int)$row['views'],
                'favoritesCount' => (int)$row['favorites_count'],
                'relevanceScore' => (int)$row['relevance_score'],
                'images' => $images ?: ['/placeholder.jpg'],
                'location' => [
                    'address' => $row['address'] ?? 'Kigali',
                    'city' => $row['city'] ?? 'Kigali',
                    'district' => $row['district'] ?? 'Gasabo'
                ],
                'owner' => [
                    'id' => (int)$row['owner_id'],
                    'name' => $row['owner_name'],
                    'avatar' => $row['owner_avatar'],
                    'isVerified' => (bool)$row['owner_verified']
                ]
            ];
        }
        
        // Log related product view for analytics
        if (!empty($products)) {
            $log_query = "INSERT INTO related_product_views (product_id, related_product_ids, viewed_at) 
                         VALUES (:product_id, :related_ids, NOW())
                         ON DUPLICATE KEY UPDATE view_count = view_count + 1, viewed_at = NOW()";
            $log_stmt = $db->prepare($log_query);
            $related_ids = json_encode(array_column($products, 'id'));
            $log_stmt->bindParam(':product_id', $product_id);
            $log_stmt->bindParam(':related_ids', $related_ids);
            $log_stmt->execute();
        }
        
        echo json_encode([
            'success' => true,
            'data' => $products,
            'count' => count($products),
            'algorithm' => 'advanced_relevance_scoring'
        ]);
        
    } elseif ($method === 'GET' && strpos($request_uri, '/similar/') !== false) {
        // Get similar products based on ML-like features
        $product_id = isset($_GET['product_id']) ? intval($_GET['product_id']) : 0;
        
        $query = "SELECT p.*, 
                  (SELECT GROUP_CONCAT(tag) FROM product_tags WHERE product_id = p.id) as tags
                  FROM products p
                  WHERE p.id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $product_id);
        $stmt->execute();
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product) {
            echo json_encode(['success' => false, 'message' => 'Product not found']);
            exit;
        }
        
        $tags = $product['tags'] ? explode(',', $product['tags']) : [];
        
        // Find products with similar tags
        $similar_query = "SELECT DISTINCT p.*, 
                         COUNT(pt.tag) as tag_matches,
                         u.name as owner_name
                         FROM products p
                         LEFT JOIN product_tags pt ON p.id = pt.product_id
                         LEFT JOIN users u ON p.owner_id = u.id
                         WHERE p.id != :product_id 
                         AND p.is_available = 1
                         AND pt.tag IN (" . implode(',', array_fill(0, count($tags), '?')) . ")
                         GROUP BY p.id
                         ORDER BY tag_matches DESC, p.rating DESC
                         LIMIT 6";
        
        $stmt = $db->prepare($similar_query);
        $stmt->bindParam(':product_id', $product_id);
        foreach ($tags as $index => $tag) {
            $stmt->bindValue($index + 2, $tag);
        }
        $stmt->execute();
        
        $similar = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $similar]);
        
    } elseif ($method === 'POST' && strpos($request_uri, '/track-click') !== false) {
        // Track when user clicks on related product
        $data = json_decode(file_get_contents('php://input'), true);
        $source_product_id = $data['source_product_id'] ?? 0;
        $clicked_product_id = $data['clicked_product_id'] ?? 0;
        $user_id = $auth->getUserIdFromToken();
        
        $query = "INSERT INTO related_product_clicks 
                  (source_product_id, clicked_product_id, user_id, clicked_at) 
                  VALUES (:source, :clicked, :user_id, NOW())";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':source', $source_product_id);
        $stmt->bindParam(':clicked', $clicked_product_id);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Click tracked']);
        
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid endpoint']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
