<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

// Get user from token
$user = $auth->requireAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// GET - Fetch notifications
if ($method === 'GET') {
    $unreadOnly = isset($_GET['unread_only']) && $_GET['unread_only'] === 'true';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    
    $query = "SELECT * FROM notifications WHERE user_id = :user_id";
    if ($unreadOnly) {
        $query .= " AND is_read = FALSE";
    }
    $query .= " ORDER BY created_at DESC LIMIT :limit";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get unread count
    $countStmt = $db->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = :user_id AND is_read = FALSE");
    $countStmt->bindParam(':user_id', $user['id']);
    $countStmt->execute();
    $unreadCount = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo json_encode([
        'success' => true,
        'notifications' => $notifications,
        'unread_count' => $unreadCount
    ]);
    exit();
}

// POST - Create or mark as read
if ($method === 'POST') {
    $action = $input['action'] ?? '';
    
    if ($action === 'mark_read') {
        $notificationId = $input['notification_id'] ?? null;
        
        if ($notificationId) {
            // Mark single notification as read
            $stmt = $db->prepare("UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = :id AND user_id = :user_id");
            $stmt->bindParam(':id', $notificationId);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->execute();
        } else {
            // Mark all as read
            $stmt = $db->prepare("UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = :user_id AND is_read = FALSE");
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->execute();
        }
        
        echo json_encode(['success' => true, 'message' => 'Notifications marked as read']);
        exit();
    }
    
    if ($action === 'create') {
        $type = $input['type'] ?? 'system';
        $title = $input['title'] ?? '';
        $message = $input['message'] ?? '';
        $data = isset($input['data']) ? json_encode($input['data']) : null;
        $priority = $input['priority'] ?? 'medium';
        
        $stmt = $db->prepare("INSERT INTO notifications (user_id, type, title, message, data, priority) VALUES (:user_id, :type, :title, :message, :data, :priority)");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':message', $message);
        $stmt->bindParam(':data', $data);
        $stmt->bindParam(':priority', $priority);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'notification_id' => $db->lastInsertId()]);
        exit();
    }
}

// DELETE - Delete notification
if ($method === 'DELETE') {
    $notificationId = $input['notification_id'] ?? null;
    
    if ($notificationId) {
        $stmt = $db->prepare("DELETE FROM notifications WHERE id = :id AND user_id = :user_id");
        $stmt->bindParam(':id', $notificationId);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Notification deleted']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Notification ID required']);
    }
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
