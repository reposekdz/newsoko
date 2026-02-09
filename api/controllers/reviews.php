<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            if (isset($_GET['product_id'])) {
                $stmt = $db->prepare("SELECT r.*, u.name as user_name, u.avatar as user_avatar 
                                     FROM reviews r 
                                     JOIN users u ON r.user_id = u.id 
                                     WHERE r.product_id = ? 
                                     ORDER BY r.created_at DESC");
                $stmt->execute([$_GET['product_id']]);
                $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $reviews]);
            }
            break;
            
        case 'POST':
            $auth = new Auth($db);
            $user = $auth->requireAuth();
            
            $data = json_decode(file_get_contents("php://input"), true);
            
            $db->beginTransaction();
            
            $stmt = $db->prepare("INSERT INTO reviews (product_id, user_id, rating, comment) 
                                 VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $data['product_id'],
                $user['id'],
                $data['rating'],
                $data['comment']
            ]);
            
            // Update product rating
            $stmt = $db->prepare("UPDATE products SET 
                                 rating = (SELECT AVG(rating) FROM reviews WHERE product_id = ?),
                                 review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
                                 WHERE id = ?");
            $stmt->execute([$data['product_id'], $data['product_id'], $data['product_id']]);
            
            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Review added']);
            break;
    }
} catch(Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
