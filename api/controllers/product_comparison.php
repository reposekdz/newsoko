<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// GET - Get comparisons or compare products
if ($method === 'GET') {
    if (isset($_GET['compare'])) {
        $ids = $_GET['ids'] ?? '';
        $productIds = explode(',', $ids);
        
        if (count($productIds) < 2) {
            echo json_encode(['success' => false, 'message' => 'At least 2 products required']);
            exit();
        }
        
        $placeholders = implode(',', array_fill(0, count($productIds), '?'));
        $stmt = $db->prepare("SELECT p.*, u.full_name as seller_name, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count FROM products p JOIN users u ON p.seller_id = u.id LEFT JOIN reviews r ON p.id = r.product_id WHERE p.id IN ($placeholders) GROUP BY p.id");
        
        foreach ($productIds as $index => $id) {
            $stmt->bindValue($index + 1, $id, PDO::PARAM_INT);
        }
        
        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'products' => $products]);
        exit();
    }
    
    // Get user's saved comparisons
    $user = \$auth->requireAuth();
    if ($user) {
        $stmt = $db->prepare("SELECT * FROM product_comparisons WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 10");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        $comparisons = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'comparisons' => $comparisons]);
        exit();
    }
}

// POST - Save comparison
if ($method === 'POST') {
    $user = \$auth->requireAuth();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $action = $input['action'] ?? '';
    
    if ($action === 'save') {
        $productIds = $input['product_ids'] ?? [];
        $sessionId = session_id() ?: uniqid();
        
        if (count($productIds) < 2) {
            echo json_encode(['success' => false, 'message' => 'At least 2 products required']);
            exit();
        }
        
        $productIdsJson = json_encode($productIds);
        
        $stmt = $db->prepare("INSERT INTO product_comparisons (user_id, product_ids, session_id) VALUES (:user_id, :product_ids, :session_id)");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->bindParam(':product_ids', $productIdsJson);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'comparison_id' => $db->lastInsertId()]);
        exit();
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
