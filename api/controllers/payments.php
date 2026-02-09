<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../services/PaymentService.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$paymentService = new PaymentService($db);
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data['action']) && $data['action'] === 'initiate') {
            $user = $auth->requireAuth();
            
            $result = $paymentService->initiateMoMoPayment(
                $data['booking_id'],
                $user['id'],
                $data['amount'],
                $data['phone_number'],
                $data['payment_method']
            );
            
            echo json_encode($result);
        } elseif (isset($data['action']) && $data['action'] === 'confirm') {
            $paymentService->updatePaymentStatus($data['payment_id'], 'completed', $data['transaction_id'] ?? null);
            echo json_encode(['success' => true, 'message' => 'Payment confirmed']);
        } elseif (isset($data['action']) && $data['action'] === 'release_escrow') {
            $user = $auth->requireAuth();
            
            if ($paymentService->releaseEscrow($data['booking_id'])) {
                echo json_encode(['success' => true, 'message' => 'Escrow released']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to release escrow']);
            }
        }
        break;
        
    case 'GET':
        $user = $auth->requireAuth();
        
        if (isset($_GET['booking_id'])) {
            $query = "SELECT * FROM payments WHERE booking_id = :booking_id ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':booking_id', $_GET['booking_id']);
            $stmt->execute();
            $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $payments]);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>
