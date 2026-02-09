<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
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

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// GET - Fetch wishlist or saved searches
if ($method === 'GET') {
    if (isset($_GET['wishlist'])) {
        $query = "SELECT w.*, p.title, p.price, p.images, p.status, u.full_name as seller_name 
                  FROM wishlist w 
                  JOIN products p ON w.product_id = p.id 
                  JOIN users u ON p.seller_id = u.id 
                  WHERE w.user_id = :user_id 
                  ORDER BY w.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        
        $wishlist = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'wishlist' => $wishlist]);
        exit();
    }
    
    if (isset($_GET['saved_searches'])) {
        $stmt = $db->prepare("SELECT * FROM saved_searches WHERE user_id = :user_id ORDER BY created_at DESC");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        
        $searches = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'saved_searches' => $searches]);
        exit();
    }
}

// POST - Add to wishlist or save search
if ($method === 'POST') {
    $action = $input['action'] ?? '';
    
    if ($action === 'add_to_wishlist') {
        $productId = $input['product_id'] ?? null;
        $notes = $input['notes'] ?? null;
        $priceAlertEnabled = $input['price_alert_enabled'] ?? false;
        $targetPrice = $input['target_price'] ?? null;
        
        if (!$productId) {
            echo json_encode(['success' => false, 'message' => 'Product ID required']);
            exit();
        }
        
        // Check if already in wishlist
        $checkStmt = $db->prepare("SELECT id FROM wishlist WHERE user_id = :user_id AND product_id = :product_id");
        $checkStmt->bindParam(':user_id', $user['id']);
        $checkStmt->bindParam(':product_id', $productId);
        $checkStmt->execute();
        
        if ($checkStmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Already in wishlist']);
            exit();
        }
        
        $stmt = $db->prepare("INSERT INTO wishlist (user_id, product_id, notes, price_alert_enabled, target_price) VALUES (:user_id, :product_id, :notes, :price_alert_enabled, :target_price)");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->bindParam(':product_id', $productId);
        $stmt->bindParam(':notes', $notes);
        $stmt->bindParam(':price_alert_enabled', $priceAlertEnabled, PDO::PARAM_BOOL);
        $stmt->bindParam(':target_price', $targetPrice);
        $stmt->execute();
        
        // Update product wishlist count
        $updateStmt = $db->prepare("UPDATE products SET wishlist_count = wishlist_count + 1 WHERE id = :id");
        $updateStmt->bindParam(':id', $productId);
        $updateStmt->execute();
        
        echo json_encode(['success' => true, 'wishlist_id' => $db->lastInsertId()]);
        exit();
    }
    
    if ($action === 'save_search') {
        $name = $input['name'] ?? '';
        $searchParams = json_encode($input['search_params'] ?? []);
        $alertEnabled = $input['alert_enabled'] ?? false;
        $alertFrequency = $input['alert_frequency'] ?? 'daily';
        
        $stmt = $db->prepare("INSERT INTO saved_searches (user_id, name, search_params, alert_enabled, alert_frequency) VALUES (:user_id, :name, :search_params, :alert_enabled, :alert_frequency)");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':search_params', $searchParams);
        $stmt->bindParam(':alert_enabled', $alertEnabled, PDO::PARAM_BOOL);
        $stmt->bindParam(':alert_frequency', $alertFrequency);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'search_id' => $db->lastInsertId()]);
        exit();
    }
}

// DELETE - Remove from wishlist or delete saved search
if ($method === 'DELETE') {
    if (isset($input['wishlist_id'])) {
        $wishlistId = $input['wishlist_id'];
        
        // Get product ID before deleting
        $getStmt = $db->prepare("SELECT product_id FROM wishlist WHERE id = :id AND user_id = :user_id");
        $getStmt->bindParam(':id', $wishlistId);
        $getStmt->bindParam(':user_id', $user['id']);
        $getStmt->execute();
        $wishlistItem = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($wishlistItem) {
            $stmt = $db->prepare("DELETE FROM wishlist WHERE id = :id AND user_id = :user_id");
            $stmt->bindParam(':id', $wishlistId);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->execute();
            
            // Update product wishlist count
            $updateStmt = $db->prepare("UPDATE products SET wishlist_count = GREATEST(wishlist_count - 1, 0) WHERE id = :id");
            $updateStmt->bindParam(':id', $wishlistItem['product_id']);
            $updateStmt->execute();
            
            echo json_encode(['success' => true, 'message' => 'Removed from wishlist']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Wishlist item not found']);
        }
        exit();
    }
    
    if (isset($input['search_id'])) {
        $searchId = $input['search_id'];
        
        $stmt = $db->prepare("DELETE FROM saved_searches WHERE id = :id AND user_id = :user_id");
        $stmt->bindParam(':id', $searchId);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Saved search deleted']);
        exit();
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
