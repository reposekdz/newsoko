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

$user = \$auth->requireAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// GET - Get user activity
if ($method === 'GET') {
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    
    $stmt = $db->prepare("SELECT * FROM user_activity_log WHERE user_id = :user_id ORDER BY created_at DESC LIMIT :limit");
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'activities' => $activities]);
    exit();
}

// POST - Log activity
if ($method === 'POST') {
    $action = $input['action'] ?? '';
    
    if ($action === 'log') {
        $activityType = $input['activity_type'] ?? '';
        $description = $input['description'] ?? '';
        $metadata = isset($input['metadata']) ? json_encode($input['metadata']) : null;
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        
        $stmt = $db->prepare("INSERT INTO user_activity_log (user_id, activity_type, description, ip_address, user_agent, metadata) VALUES (:user_id, :activity_type, :description, :ip_address, :user_agent, :metadata)");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->bindParam(':activity_type', $activityType);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':ip_address', $ipAddress);
        $stmt->bindParam(':user_agent', $userAgent);
        $stmt->bindParam(':metadata', $metadata);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'activity_id' => $db->lastInsertId()]);
        exit();
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
