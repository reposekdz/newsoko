<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
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

// Verify authentication
$user = $auth->requireAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$user_id = $user['user_id'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['conversations'])) {
                // Get all conversations for user
                $query = "SELECT 
                    c.*,
                    CASE 
                        WHEN c.participant_1 = :user_id THEN u2.id
                        ELSE u1.id
                    END as other_user_id,
                    CASE 
                        WHEN c.participant_1 = :user_id THEN u2.name
                        ELSE u1.name
                    END as other_user_name,
                    CASE 
                        WHEN c.participant_1 = :user_id THEN u2.avatar
                        ELSE u1.avatar
                    END as other_user_avatar,
                    p.title as product_title,
                    p.images as product_images,
                    (SELECT COUNT(*) FROM chat_messages 
                     WHERE conversation_id = c.id 
                     AND sender_id != :user_id 
                     AND is_read = FALSE) as unread_count
                FROM chat_conversations c
                LEFT JOIN users u1 ON c.participant_1 = u1.id
                LEFT JOIN users u2 ON c.participant_2 = u2.id
                LEFT JOIN products p ON c.product_id = p.id
                WHERE (c.participant_1 = :user_id OR c.participant_2 = :user_id)
                AND ((c.participant_1 = :user_id AND c.is_archived_p1 = FALSE) 
                     OR (c.participant_2 = :user_id AND c.is_archived_p2 = FALSE))
                ORDER BY c.last_message_at DESC";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($conversations as &$conv) {
                    if ($conv['product_images']) {
                        $images = json_decode($conv['product_images'], true);
                        $conv['product_image'] = $images[0] ?? null;
                    }
                }
                
                echo json_encode(['success' => true, 'data' => $conversations]);
                
            } elseif (isset($_GET['conversation_id'])) {
                // Get messages for a conversation
                $conversation_id = $_GET['conversation_id'];
                $limit = $_GET['limit'] ?? 50;
                $offset = $_GET['offset'] ?? 0;
                
                // Verify user is part of conversation
                $query = "SELECT * FROM chat_conversations 
                         WHERE id = :conv_id 
                         AND (participant_1 = :user_id OR participant_2 = :user_id)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':conv_id', $conversation_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                
                if ($stmt->rowCount() === 0) {
                    throw new Exception('Conversation not found');
                }
                
                // Get messages
                $query = "SELECT 
                    m.*,
                    u.name as sender_name,
                    u.avatar as sender_avatar
                FROM chat_messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = :conv_id 
                AND m.is_deleted = FALSE
                ORDER BY m.created_at DESC
                LIMIT :limit OFFSET :offset";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':conv_id', $conversation_id);
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
                $stmt->execute();
                $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Mark messages as read
                $query = "UPDATE chat_messages 
                         SET is_read = TRUE, read_at = NOW() 
                         WHERE conversation_id = :conv_id 
                         AND sender_id != :user_id 
                         AND is_read = FALSE";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':conv_id', $conversation_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                
                echo json_encode(['success' => true, 'data' => array_reverse($messages)]);
                
            } elseif (isset($_GET['unread_count'])) {
                // Get total unread messages count
                $query = "SELECT COUNT(*) as count FROM chat_messages m
                         JOIN chat_conversations c ON m.conversation_id = c.id
                         WHERE (c.participant_1 = :user_id OR c.participant_2 = :user_id)
                         AND m.sender_id != :user_id
                         AND m.is_read = FALSE";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'count' => (int)$result['count']]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (isset($data['action']) && $data['action'] === 'start_conversation') {
                // Start new conversation
                $other_user_id = $data['other_user_id'];
                $product_id = $data['product_id'] ?? null;
                
                // Check if conversation already exists
                $query = "SELECT * FROM chat_conversations 
                         WHERE ((participant_1 = :user1 AND participant_2 = :user2) 
                            OR (participant_1 = :user2 AND participant_2 = :user1))
                         AND (product_id = :product_id OR (product_id IS NULL AND :product_id IS NULL))";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user1', $user_id);
                $stmt->bindParam(':user2', $other_user_id);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    $conversation = $stmt->fetch(PDO::FETCH_ASSOC);
                    echo json_encode(['success' => true, 'conversation_id' => $conversation['id']]);
                } else {
                    // Create new conversation
                    $query = "INSERT INTO chat_conversations (participant_1, participant_2, product_id) 
                             VALUES (:user1, :user2, :product_id)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user1', $user_id);
                    $stmt->bindParam(':user2', $other_user_id);
                    $stmt->bindParam(':product_id', $product_id);
                    $stmt->execute();
                    
                    echo json_encode(['success' => true, 'conversation_id' => $db->lastInsertId()]);
                }
                
            } elseif (isset($data['action']) && $data['action'] === 'send_message') {
                // Send message
                $conversation_id = $data['conversation_id'];
                $message = $data['message'];
                $message_type = $data['message_type'] ?? 'text';
                $attachments = isset($data['attachments']) ? json_encode($data['attachments']) : null;
                
                // Verify user is part of conversation
                $query = "SELECT * FROM chat_conversations 
                         WHERE id = :conv_id 
                         AND (participant_1 = :user_id OR participant_2 = :user_id)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':conv_id', $conversation_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                
                if ($stmt->rowCount() === 0) {
                    throw new Exception('Conversation not found');
                }
                
                // Insert message
                $query = "INSERT INTO chat_messages 
                         (conversation_id, sender_id, message, message_type, attachments) 
                         VALUES (:conv_id, :sender_id, :message, :type, :attachments)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':conv_id', $conversation_id);
                $stmt->bindParam(':sender_id', $user_id);
                $stmt->bindParam(':message', $message);
                $stmt->bindParam(':type', $message_type);
                $stmt->bindParam(':attachments', $attachments);
                $stmt->execute();
                
                $message_id = $db->lastInsertId();
                
                // Update conversation last message
                $query = "UPDATE chat_conversations 
                         SET last_message_id = :msg_id, last_message_at = NOW() 
                         WHERE id = :conv_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':msg_id', $message_id);
                $stmt->bindParam(':conv_id', $conversation_id);
                $stmt->execute();
                
                echo json_encode(['success' => true, 'message_id' => $message_id]);
                
            } elseif (isset($data['action']) && $data['action'] === 'mark_read') {
                // Mark conversation as read
                $conversation_id = $data['conversation_id'];
                
                $query = "UPDATE chat_messages 
                         SET is_read = TRUE, read_at = NOW() 
                         WHERE conversation_id = :conv_id 
                         AND sender_id != :user_id 
                         AND is_read = FALSE";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':conv_id', $conversation_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                
                echo json_encode(['success' => true]);
            }
            break;
            
        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (isset($data['message_id'])) {
                // Delete message (soft delete)
                $message_id = $data['message_id'];
                
                $query = "UPDATE chat_messages 
                         SET is_deleted = TRUE, deleted_at = NOW() 
                         WHERE id = :msg_id AND sender_id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':msg_id', $message_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                
                echo json_encode(['success' => true]);
                
            } elseif (isset($data['conversation_id'])) {
                // Archive conversation
                $conversation_id = $data['conversation_id'];
                
                $query = "UPDATE chat_conversations 
                         SET is_archived_p1 = CASE WHEN participant_1 = :user_id THEN TRUE ELSE is_archived_p1 END,
                             is_archived_p2 = CASE WHEN participant_2 = :user_id THEN TRUE ELSE is_archived_p2 END
                         WHERE id = :conv_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':conv_id', $conversation_id);
                $stmt->bindParam(':user_id', $user_id);
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
