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
    $auth = new Auth($db);
    $user = $auth->requireAuth();
    
    switch($method) {
        case 'GET':
            if (isset($_GET['conversation_id'])) {
                $stmt = $db->prepare("SELECT m.*, u.name as sender_name, u.avatar as sender_avatar 
                                     FROM messages m 
                                     JOIN users u ON m.sender_id = u.id 
                                     WHERE m.conversation_id = ? 
                                     ORDER BY m.created_at ASC");
                $stmt->execute([$_GET['conversation_id']]);
                $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Mark as read
                $stmt = $db->prepare("UPDATE messages SET is_read = 1 
                                     WHERE conversation_id = ? AND receiver_id = ?");
                $stmt->execute([$_GET['conversation_id'], $user['id']]);
                
                echo json_encode(['success' => true, 'data' => $messages]);
            } else {
                // Get conversations
                $stmt = $db->prepare("SELECT DISTINCT c.*, 
                                     CASE WHEN c.user1_id = ? THEN u2.name ELSE u1.name END as other_name,
                                     CASE WHEN c.user1_id = ? THEN u2.avatar ELSE u1.avatar END as other_avatar,
                                     CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as other_id,
                                     (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND receiver_id = ? AND is_read = 0) as unread_count,
                                     (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
                                     FROM conversations c
                                     JOIN users u1 ON c.user1_id = u1.id
                                     JOIN users u2 ON c.user2_id = u2.id
                                     WHERE c.user1_id = ? OR c.user2_id = ?
                                     ORDER BY c.updated_at DESC");
                $stmt->execute([$user['id'], $user['id'], $user['id'], $user['id'], $user['id'], $user['id']]);
                $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $conversations]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            $db->beginTransaction();
            
            // Get or create conversation
            $stmt = $db->prepare("SELECT id FROM conversations 
                                 WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)");
            $stmt->execute([$user['id'], $data['receiver_id'], $data['receiver_id'], $user['id']]);
            $conversation = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$conversation) {
                $stmt = $db->prepare("INSERT INTO conversations (user1_id, user2_id, product_id) VALUES (?, ?, ?)");
                $stmt->execute([$user['id'], $data['receiver_id'], $data['product_id'] ?? null]);
                $conversationId = $db->lastInsertId();
            } else {
                $conversationId = $conversation['id'];
            }
            
            // Insert message
            $stmt = $db->prepare("INSERT INTO messages (conversation_id, sender_id, receiver_id, message) 
                                 VALUES (?, ?, ?, ?)");
            $stmt->execute([$conversationId, $user['id'], $data['receiver_id'], $data['message']]);
            
            // Update conversation timestamp
            $stmt = $db->prepare("UPDATE conversations SET updated_at = NOW() WHERE id = ?");
            $stmt->execute([$conversationId]);
            
            // Create notification
            $stmt = $db->prepare("INSERT INTO notifications (user_id, type, title, message, related_id) 
                                 VALUES (?, 'message', 'New Message', ?, ?)");
            $stmt->execute([$data['receiver_id'], $data['message'], $conversationId]);
            
            $db->commit();
            echo json_encode(['success' => true, 'conversation_id' => $conversationId]);
            break;
    }
} catch(Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
