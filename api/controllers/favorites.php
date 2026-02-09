<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $user = $auth->requireAuth();
        
        $query = "SELECT p.*, u.name as owner_name, u.avatar as owner_avatar, u.is_verified as owner_verified
                  FROM favorites f
                  JOIN products p ON f.product_id = p.id
                  JOIN users u ON p.owner_id = u.id
                  WHERE f.user_id = :user_id
                  ORDER BY f.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($favorites as &$item) {
            $item['images'] = json_decode($item['images']);
            $item['features'] = json_decode($item['features']);
        }
        
        echo json_encode(['success' => true, 'data' => $favorites]);
        break;
        
    case 'POST':
        $user = $auth->requireAuth();
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data['action']) && $data['action'] === 'add') {
            $query = "INSERT INTO favorites (user_id, product_id) VALUES (:user_id, :product_id)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->bindParam(':product_id', $data['product_id']);
            
            try {
                $stmt->execute();
                
                $updateProduct = "UPDATE products SET favorites = favorites + 1 WHERE id = :id";
                $stmt = $db->prepare($updateProduct);
                $stmt->bindParam(':id', $data['product_id']);
                $stmt->execute();
                
                echo json_encode(['success' => true, 'message' => 'Added to favorites']);
            } catch (PDOException $e) {
                echo json_encode(['success' => false, 'message' => 'Already in favorites']);
            }
        } elseif (isset($data['action']) && $data['action'] === 'remove') {
            $query = "DELETE FROM favorites WHERE user_id = :user_id AND product_id = :product_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->bindParam(':product_id', $data['product_id']);
            $stmt->execute();
            
            $updateProduct = "UPDATE products SET favorites = GREATEST(favorites - 1, 0) WHERE id = :id";
            $stmt = $db->prepare($updateProduct);
            $stmt->bindParam(':id', $data['product_id']);
            $stmt->execute();
            
            echo json_encode(['success' => true, 'message' => 'Removed from favorites']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>
