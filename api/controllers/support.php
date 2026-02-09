<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT');
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

// GET - Fetch tickets
if ($method === 'GET') {
    if (isset($_GET['ticket_id'])) {
        $ticketId = intval($_GET['ticket_id']);
        
        $stmt = $db->prepare("SELECT t.*, u.full_name as user_name, a.full_name as assigned_name FROM support_tickets t JOIN users u ON t.user_id = u.id LEFT JOIN users a ON t.assigned_to = a.id WHERE t.id = :id AND (t.user_id = :user_id OR :is_admin = TRUE)");
        $stmt->bindParam(':id', $ticketId);
        $stmt->bindParam(':user_id', $user['id']);
        $isAdmin = $user['role'] === 'admin';
        $stmt->bindParam(':is_admin', $isAdmin, PDO::PARAM_BOOL);
        $stmt->execute();
        
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$ticket) {
            echo json_encode(['success' => false, 'message' => 'Ticket not found']);
            exit();
        }
        
        // Get messages
        $msgStmt = $db->prepare("SELECT m.*, u.full_name as user_name FROM support_ticket_messages m JOIN users u ON m.user_id = u.id WHERE m.ticket_id = :ticket_id ORDER BY m.created_at ASC");
        $msgStmt->bindParam(':ticket_id', $ticketId);
        $msgStmt->execute();
        
        $messages = $msgStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'ticket' => $ticket, 'messages' => $messages]);
        exit();
    }
    
    // List tickets
    $status = $_GET['status'] ?? null;
    $category = $_GET['category'] ?? null;
    
    $query = "SELECT t.*, u.full_name as user_name FROM support_tickets t JOIN users u ON t.user_id = u.id WHERE ";
    
    if ($user['role'] === 'admin') {
        $query .= "1=1";
    } else {
        $query .= "t.user_id = :user_id";
    }
    
    if ($status) {
        $query .= " AND t.status = :status";
    }
    if ($category) {
        $query .= " AND t.category = :category";
    }
    
    $query .= " ORDER BY t.created_at DESC LIMIT 100";
    
    $stmt = $db->prepare($query);
    if ($user['role'] !== 'admin') {
        $stmt->bindParam(':user_id', $user['id']);
    }
    if ($status) {
        $stmt->bindParam(':status', $status);
    }
    if ($category) {
        $stmt->bindParam(':category', $category);
    }
    $stmt->execute();
    
    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'tickets' => $tickets]);
    exit();
}

// POST - Create ticket or add message
if ($method === 'POST') {
    $action = $input['action'] ?? '';
    
    if ($action === 'create_ticket') {
        $subject = $input['subject'] ?? '';
        $category = $input['category'] ?? 'other';
        $priority = $input['priority'] ?? 'medium';
        $description = $input['description'] ?? '';
        $attachments = isset($input['attachments']) ? json_encode($input['attachments']) : null;
        
        $stmt = $db->prepare("INSERT INTO support_tickets (user_id, subject, category, priority, description, attachments) VALUES (:user_id, :subject, :category, :priority, :description, :attachments)");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->bindParam(':subject', $subject);
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':priority', $priority);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':attachments', $attachments);
        $stmt->execute();
        
        $ticketId = $db->lastInsertId();
        
        // Create initial message
        $msgStmt = $db->prepare("INSERT INTO support_ticket_messages (ticket_id, user_id, message) VALUES (:ticket_id, :user_id, :message)");
        $msgStmt->bindParam(':ticket_id', $ticketId);
        $msgStmt->bindParam(':user_id', $user['id']);
        $msgStmt->bindParam(':message', $description);
        $msgStmt->execute();
        
        echo json_encode(['success' => true, 'ticket_id' => $ticketId]);
        exit();
    }
    
    if ($action === 'add_message') {
        $ticketId = $input['ticket_id'] ?? null;
        $message = $input['message'] ?? '';
        $attachments = isset($input['attachments']) ? json_encode($input['attachments']) : null;
        
        // Verify access
        $checkStmt = $db->prepare("SELECT id FROM support_tickets WHERE id = :id AND (user_id = :user_id OR :is_admin = TRUE)");
        $checkStmt->bindParam(':id', $ticketId);
        $checkStmt->bindParam(':user_id', $user['id']);
        $isAdmin = $user['role'] === 'admin';
        $checkStmt->bindParam(':is_admin', $isAdmin, PDO::PARAM_BOOL);
        $checkStmt->execute();
        
        if (!$checkStmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Access denied']);
            exit();
        }
        
        $stmt = $db->prepare("INSERT INTO support_ticket_messages (ticket_id, user_id, message, attachments) VALUES (:ticket_id, :user_id, :message, :attachments)");
        $stmt->bindParam(':ticket_id', $ticketId);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->bindParam(':message', $message);
        $stmt->bindParam(':attachments', $attachments);
        $stmt->execute();
        
        // Update ticket status
        $updateStmt = $db->prepare("UPDATE support_tickets SET status = 'in_progress', updated_at = NOW() WHERE id = :id");
        $updateStmt->bindParam(':id', $ticketId);
        $updateStmt->execute();
        
        echo json_encode(['success' => true, 'message_id' => $db->lastInsertId()]);
        exit();
    }
}

// PUT - Update ticket
if ($method === 'PUT') {
    $ticketId = $input['ticket_id'] ?? null;
    $status = $input['status'] ?? null;
    $assignedTo = $input['assigned_to'] ?? null;
    
    if ($user['role'] !== 'admin') {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $updates = [];
    $params = [':id' => $ticketId];
    
    if ($status) {
        $updates[] = "status = :status";
        $params[':status'] = $status;
        
        if ($status === 'resolved' || $status === 'closed') {
            $updates[] = "resolved_at = NOW()";
        }
    }
    
    if ($assignedTo !== null) {
        $updates[] = "assigned_to = :assigned_to";
        $params[':assigned_to'] = $assignedTo;
    }
    
    if (empty($updates)) {
        echo json_encode(['success' => false, 'message' => 'No updates provided']);
        exit();
    }
    
    $query = "UPDATE support_tickets SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = :id";
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();
    
    echo json_encode(['success' => true, 'message' => 'Ticket updated']);
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
