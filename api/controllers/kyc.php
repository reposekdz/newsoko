<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../services/KYCService.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$kyc = new KYCService($db);
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
    case 'submit':
        $result = $kyc->submitKYC($data['user_id'], [
            'id_type' => $data['id_type'],
            'id_number' => $data['id_number'],
            'id_front_image' => $data['id_front_image'],
            'id_back_image' => $data['id_back_image'],
            'selfie_image' => $data['selfie_image']
        ]);
        echo json_encode($result);
        break;
        
    case 'status':
        $status = $kyc->getKYCStatus($data['user_id']);
        echo json_encode(['success' => true, 'data' => $status]);
        break;
        
    case 'approve':
        $user = $auth->requireAuth();
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
        $result = $kyc->approveKYC($data['kyc_id'], $data['admin_id']);
        echo json_encode(['success' => $result, 'message' => $result ? 'KYC approved' : 'Failed']);
        break;
        
    case 'reject':
        $user = $auth->requireAuth();
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
        $result = $kyc->rejectKYC($data['kyc_id'], $data['admin_id'], $data['reason']);
        echo json_encode(['success' => $result, 'message' => $result ? 'KYC rejected' : 'Failed']);
        break;
        
    case 'is_verified':
        $verified = $kyc->isKYCVerified($data['user_id']);
        echo json_encode(['success' => true, 'verified' => $verified]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
