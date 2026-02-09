<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../services/EscrowService.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$escrow = new EscrowService($db);
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
    case 'create':
        $escrowId = $escrow->createEscrow($data['booking_id'], $data['amount']);
        if ($escrowId) {
            $status = $escrow->getEscrowStatus($data['booking_id']);
            echo json_encode(['success' => true, 'escrow_id' => $escrowId, 'status' => $status['status'], 'refund_deadline' => $status['refund_deadline']]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create escrow']);
        }
        break;
        
    case 'customer_approve':
        $result = $escrow->customerApproval($data['escrow_id'], $data['customer_id']);
        echo json_encode($result);
        break;
        
    case 'admin_approve':
        $user = $auth->requireAuth();
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
        $result = $escrow->adminApproval($data['escrow_id'], $data['admin_id']);
        echo json_encode($result);
        break;
        
    case 'refund':
        $user = $auth->requireAuth();
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
        $result = $escrow->refundEscrow($data['escrow_id'], $data['reason'], $data['admin_id']);
        echo json_encode(['success' => $result, 'message' => $result ? 'Refund processed' : 'Failed']);
        break;
        
    case 'status':
        $status = $escrow->getEscrowStatus($data['booking_id']);
        echo json_encode(['success' => true, 'data' => $status]);
        break;
        
    case 'pending_approvals':
        $user = $auth->requireAuth();
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
        $pending = $escrow->getPendingApprovals();
        echo json_encode(['success' => true, 'data' => $pending]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
