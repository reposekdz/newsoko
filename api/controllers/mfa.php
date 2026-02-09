<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../services/MFAService.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$mfa = new MFAService($db);
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
    case 'enable':
        $result = $mfa->enableMFA($data['user_id'], $data['method'], $data['phone_number'] ?? $data['email'] ?? '');
        echo json_encode(['success' => $result, 'message' => $result ? 'MFA enabled' : 'Failed to enable MFA']);
        break;
        
    case 'send_code':
        $result = $mfa->sendVerificationCode($data['user_id'], $data['method']);
        echo json_encode(['success' => $result, 'message' => $result ? 'Code sent' : 'Failed to send code', 'expires_in' => 600]);
        break;
        
    case 'verify':
        $result = $mfa->verifyCode($data['user_id'], $data['code']);
        echo json_encode(['success' => true, 'verified' => $result]);
        break;
        
    case 'disable':
        if ($mfa->verifyCode($data['user_id'], $data['code'])) {
            $query = "UPDATE mfa_settings SET is_enabled = FALSE WHERE user_id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $data['user_id']);
            $stmt->execute();
            echo json_encode(['success' => true, 'message' => 'MFA disabled']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid code']);
        }
        break;
        
    case 'status':
        $required = $mfa->isMFARequired($data['user_id']);
        echo json_encode(['success' => true, 'mfa_enabled' => $required]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
