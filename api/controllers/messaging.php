<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$user = $auth->requireAuth();

switch($method) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? '';
        
        switch($action) {
            case 'send':
                $query = "INSERT INTO messages (sender_id, receiver_id, product_id, message, message_type) 
                         VALUES (:sender, :receiver, :product, :message, :type)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':sender', $user['id']);
                $stmt->bindParam(':receiver', $data['receiver_id']);
                $stmt->bindParam(':product', $data['product_id']);
                $stmt->bindParam(':message', $data['message']);
                $type = $data['message_type'] ?? 'text';
                $stmt->bindParam(':type', $type);
                
                if ($stmt->execute()) {
                    $messageId = $db->lastInsertId();
                    
                    // Get message with details
                    $query = "SELECT m.*, u.full_name as sender_name, u.avatar as sender_avatar,
                             p.title as product_title, p.images as product_images
                             FROM messages m
                             JOIN users u ON m.sender_id = u.id
                             LEFT JOIN products p ON m.product_id = p.id
                             WHERE m.id = :id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':id', $messageId);
                    $stmt->execute();
                    $message = $stmt->fetch(PDO::FETCH_ASSOC);
                    $message['product_images'] = json_decode($message['product_images']);
                    
                    echo json_encode(['success' => true, 'data' => $message]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to send']);
                }
                break;
                
            case 'mark_read':
                $query = "UPDATE messages SET is_read = TRUE, read_at = NOW() 
                         WHERE id = :id AND receiver_id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $data['message_id']);
                $stmt->bindParam(':user_id', $user['id']);
                $stmt->execute();
                echo json_encode(['success' => true]);
                break;
                
            case 'delete':
                $query = "UPDATE messages SET is_deleted = TRUE WHERE id = :id AND sender_id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $data['message_id']);
                $stmt->bindParam(':user_id', $user['id']);
                $stmt->execute();
                echo json_encode(['success' => true]);
                break;
        }
        break;
        
    case 'GET':
        if (isset($_GET['conversation'])) {
            // Get conversation with specific user about product
            $query = "SELECT m.*, 
                     CASE WHEN m.sender_id = :user_id THEN u2.full_name ELSE u1.full_name END as other_name,
                     CASE WHEN m.sender_id = :user_id THEN u2.avatar ELSE u1.avatar END as other_avatar,
                     p.title as product_title, p.images as product_images
                     FROM messages m
                     JOIN users u1 ON m.sender_id = u1.id
                     JOIN users u2 ON m.receiver_id = u2.id
                     LEFT JOIN products p ON m.product_id = p.id
                     WHERE ((m.sender_id = :user_id AND m.receiver_id = :other_id) 
                        OR (m.sender_id = :other_id AND m.receiver_id = :user_id))
                     AND (:product_id IS NULL OR m.product_id = :product_id)
                     AND m.is_deleted = FALSE
                     ORDER BY m.created_at ASC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->bindParam(':other_id', $_GET['other_user_id']);
            $productId = $_GET['product_id'] ?? null;
            $stmt->bindParam(':product_id', $productId);
            $stmt->execute();
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($messages as &$msg) {
                $msg['product_images'] = json_decode($msg['product_images']);
            }
            
            // Mark as read
            $query = "UPDATE messages SET is_read = TRUE, read_at = NOW() 
                     WHERE receiver_id = :user_id AND sender_id = :other_id AND is_read = FALSE";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->bindParam(':other_id', $_GET['other_user_id']);
            $stmt->execute();
            
            echo json_encode(['success' => true, 'data' => $messages]);
            
        } elseif (isset($_GET['conversations'])) {
            // Get all conversations
            $query = "SELECT DISTINCT
                     CASE WHEN m.sender_id = :user_id THEN m.receiver_id ELSE m.sender_id END as other_user_id,
                     CASE WHEN m.sender_id = :user_id THEN u2.full_name ELSE u1.full_name END as other_name,
                     CASE WHEN m.sender_id = :user_id THEN u2.avatar ELSE u1.avatar END as other_avatar,
                     m.product_id, p.title as product_title, p.images as product_images,
                     (SELECT message FROM messages m2 
                      WHERE ((m2.sender_id = :user_id AND m2.receiver_id = other_user_id) 
                         OR (m2.sender_id = other_user_id AND m2.receiver_id = :user_id))
                      AND m2.product_id = m.product_id
                      ORDER BY m2.created_at DESC LIMIT 1) as last_message,
                     (SELECT created_at FROM messages m2 
                      WHERE ((m2.sender_id = :user_id AND m2.receiver_id = other_user_id) 
                         OR (m2.sender_id = other_user_id AND m2.receiver_id = :user_id))
                      AND m2.product_id = m.product_id
                      ORDER BY m2.created_at DESC LIMIT 1) as last_message_time,
                     (SELECT COUNT(*) FROM messages m2 
                      WHERE m2.receiver_id = :user_id AND m2.sender_id = other_user_id 
                      AND m2.product_id = m.product_id AND m2.is_read = FALSE) as unread_count
                     FROM messages m
                     JOIN users u1 ON m.sender_id = u1.id
                     JOIN users u2 ON m.receiver_id = u2.id
                     LEFT JOIN products p ON m.product_id = p.id
                     WHERE (m.sender_id = :user_id OR m.receiver_id = :user_id)
                     AND m.is_deleted = FALSE
                     ORDER BY last_message_time DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->execute();
            $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($conversations as &$conv) {
                $conv['product_images'] = json_decode($conv['product_images']);
            }
            
            echo json_encode(['success' => true, 'data' => $conversations]);
            
        } elseif (isset($_GET['unread_count'])) {
            $query = "SELECT COUNT(*) as count FROM messages 
                     WHERE receiver_id = :user_id AND is_read = FALSE AND is_deleted = FALSE";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'count' => (int)$result['count']]);
        }
        break;
}
