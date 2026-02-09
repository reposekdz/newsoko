<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../services/AntiFraudService.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$fraud = new AntiFraudService($db);
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
    case 'check_payment':
        $result = $fraud->checkPaymentAttempt(
            $data['user_id'] ?? null,
            $data['ip_address'],
            $data['card_fingerprint'] ?? null,
            $data['amount']
        );
        echo json_encode(array_merge(['success' => true], $result));
        break;
        
    case 'log_attempt':
        $fraud->logPaymentAttempt(
            $data['user_id'] ?? null,
            $data['ip_address'],
            $data['card_fingerprint'] ?? null,
            $data['amount'],
            $data['status'],
            $data['failure_reason'] ?? null
        );
        echo json_encode(['success' => true, 'message' => 'Attempt logged']);
        break;
        
    case 'block':
        $user = $auth->requireAuth();
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
        $fraud->blockEntity(
            $data['entity_type'],
            $data['entity_value'],
            $data['reason'],
            $data['hours'] ?? null
        );
        echo json_encode(['success' => true, 'message' => 'Entity blocked']);
        break;
        
    case 'unblock':
        $user = $auth->requireAuth();
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
        $fraud->unblockEntity($data['entity_type'], $data['entity_value']);
        echo json_encode(['success' => true, 'message' => 'Entity unblocked']);
        break;
        
    case 'stats':
        $user = $auth->requireAuth();
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
        $stats = $fraud->getFraudStats($data['days'] ?? 7);
        echo json_encode(['success' => true, 'data' => $stats]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
