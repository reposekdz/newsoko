<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../services/SecurityService.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$security = new SecurityService($db);
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$action = $data['action'] ?? '';

switch($action) {
    case 'encrypt':
        $encrypted = $security->encrypt($data['data']);
        echo json_encode(['success' => true, 'encrypted' => $encrypted]);
        break;
        
    case 'decrypt':
        $decrypted = $security->decrypt($data['encrypted_data']);
        echo json_encode(['success' => true, 'decrypted' => $decrypted]);
        break;
        
    case 'track_login':
        $result = $security->trackLogin($data['user_id'], $data['ip_address']);
        echo json_encode(array_merge(['success' => true], $result));
        break;
        
    case 'audit_trail':
        $user = $auth->requireAuth();
        if ($user['role'] !== 'admin' && $user['id'] != $data['user_id']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
        $logs = $security->getAuditTrail($data['user_id'] ?? null, $data['days'] ?? 30);
        echo json_encode(['success' => true, 'data' => $logs]);
        break;
        
    case 'log_audit':
        $security->logAudit(
            $data['user_id'],
            $data['action_type'],
            $data['entity_type'],
            $data['entity_id'],
            $data['old_value'] ?? null,
            $data['new_value'] ?? null,
            $data['severity'] ?? 'low'
        );
        echo json_encode(['success' => true, 'message' => 'Audit logged']);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
