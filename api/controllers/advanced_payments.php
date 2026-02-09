<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../middleware/Auth.php';
require_once '../services/PaymentOrchestrator.php';
require_once '../services/AdvancedFraudDetection.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);
$orchestrator = new PaymentOrchestrator($db);
$fraudDetection = new AdvancedFraudDetection($db);

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Wallet-First Checkout with Split Payment
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'wallet_checkout') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $bookingId = $input['booking_id'] ?? 0;
    $paymentMethod = $input['payment_method'] ?? 'mtn_momo';
    $phoneNumber = $input['phone_number'] ?? '';
    $biometricToken = $input['biometric_token'] ?? '';

    // Verify biometric authentication
    if (empty($biometricToken)) {
        echo json_encode(['success' => false, 'message' => 'Biometric authentication required']);
        exit();
    }

    // Get booking amount
    $query = "SELECT total_amount FROM bookings WHERE id = :id AND renter_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $bookingId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
        echo json_encode(['success' => false, 'message' => 'Booking not found']);
        exit();
    }

    // Fraud detection check
    $fraudCheck = $fraudDetection->comprehensiveTransactionCheck($userId, $booking['total_amount'], [
        'user_id' => $userId,
        'amount' => $booking['total_amount'],
        'phone_number' => $phoneNumber
    ]);

    if ($fraudCheck['recommendation'] === 'block_transaction') {
        echo json_encode([
            'success' => false,
            'message' => 'Transaction blocked due to security concerns',
            'fraud_check' => $fraudCheck
        ]);
        exit();
    }

    // Process split payment
    $result = $orchestrator->processSplitPayment($bookingId, $booking['total_amount'], $paymentMethod, $phoneNumber);

    echo json_encode($result);
    exit();
}

// Get Escrow Progress Status
if ($method === 'GET' && isset($_GET['escrow_progress'])) {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $bookingId = $_GET['booking_id'] ?? 0;

    $query = "SELECT e.*, b.status as booking_status, b.item_received, b.item_returned 
             FROM escrow_transactions e
             JOIN bookings b ON e.booking_id = b.id
             WHERE e.booking_id = :id AND (e.buyer_id = :user_id OR e.seller_id = :user_id)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $bookingId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $escrow = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$escrow) {
        echo json_encode(['success' => false, 'message' => 'Escrow not found']);
        exit();
    }

    // Calculate progress
    $progress = [
        'payment_received' => true,
        'in_escrow' => $escrow['status'] === 'held',
        'order_shipped' => $escrow['booking_status'] !== 'pending',
        'item_received' => $escrow['item_received'] == 1,
        'funds_released' => $escrow['status'] === 'released',
        'progress_percentage' => 0
    ];

    $steps = 0;
    if ($progress['payment_received']) $steps++;
    if ($progress['in_escrow']) $steps++;
    if ($progress['order_shipped']) $steps++;
    if ($progress['item_received']) $steps++;
    if ($progress['funds_released']) $steps++;
    
    $progress['progress_percentage'] = ($steps / 5) * 100;

    echo json_encode(['success' => true, 'progress' => $progress, 'escrow' => $escrow]);
    exit();
}

// Setup Seller Payout (1-Click)
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'setup_payout') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $payoutMethod = $input['payout_method'] ?? 'mobile_money';
    $payoutPhone = $input['payout_phone'] ?? '';
    $payoutBankAccount = $input['payout_bank_account'] ?? null;
    $payoutBankName = $input['payout_bank_name'] ?? null;

    // Validate phone number for mobile money
    if ($payoutMethod === 'mobile_money' && !preg_match('/^(\+250|0)(78|79|72|73)\d{7}$/', $payoutPhone)) {
        echo json_encode(['success' => false, 'message' => 'Invalid Rwanda phone number']);
        exit();
    }

    $query = "UPDATE users SET payout_method = :method, payout_phone = :phone, 
             payout_bank_account = :bank_account, payout_bank_name = :bank_name 
             WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':method', $payoutMethod);
    $stmt->bindParam(':phone', $payoutPhone);
    $stmt->bindParam(':bank_account', $payoutBankAccount);
    $stmt->bindParam(':bank_name', $payoutBankName);
    $stmt->bindParam(':id', $userId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Payout method configured successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to configure payout method']);
    }
    exit();
}

// Request Instant Payout
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'request_payout') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $escrowId = $input['escrow_id'] ?? 0;

    // Verify escrow belongs to seller
    $query = "SELECT * FROM escrow_transactions WHERE id = :id AND seller_id = :seller_id AND status = 'held'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $escrowId);
    $stmt->bindParam(':seller_id', $userId);
    $stmt->execute();
    $escrow = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$escrow) {
        echo json_encode(['success' => false, 'message' => 'Escrow not found or not eligible for payout']);
        exit();
    }

    // Check if buyer confirmed
    if (!$escrow['buyer_confirmed']) {
        echo json_encode(['success' => false, 'message' => 'Waiting for buyer confirmation']);
        exit();
    }

    // Process instant payout
    $result = $orchestrator->instantPayout($escrowId, $userId);

    echo json_encode($result);
    exit();
}

// Auto-Release Escrow (Cron Job)
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'auto_release_escrow') {
    // This should be called by a cron job
    $query = "SELECT * FROM escrow_transactions 
             WHERE status = 'held' 
             AND auto_release_date <= NOW()
             AND buyer_confirmed = TRUE";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $escrows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $released = 0;
    foreach ($escrows as $escrow) {
        $result = $orchestrator->instantPayout($escrow['id'], $escrow['seller_id']);
        if ($result['success']) {
            $released++;
        }
    }

    echo json_encode(['success' => true, 'message' => "Auto-released {$released} escrows"]);
    exit();
}

// Get Payment Analytics
if ($method === 'GET' && isset($_GET['payment_analytics'])) {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    // Total earnings
    $earningsQuery = "SELECT SUM(net_amount) as total_earnings FROM escrow_transactions 
                     WHERE seller_id = :id AND status = 'released'";
    $stmt = $db->prepare($earningsQuery);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();
    $earnings = $stmt->fetch(PDO::FETCH_ASSOC);

    // Pending payouts
    $pendingQuery = "SELECT SUM(net_amount) as pending_amount, COUNT(*) as pending_count 
                    FROM escrow_transactions 
                    WHERE seller_id = :id AND status = 'held'";
    $stmt = $db->prepare($pendingQuery);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();
    $pending = $stmt->fetch(PDO::FETCH_ASSOC);

    // Recent transactions
    $recentQuery = "SELECT * FROM escrow_transactions 
                   WHERE seller_id = :id 
                   ORDER BY created_at DESC LIMIT 10";
    $stmt = $db->prepare($recentQuery);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();
    $recent = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'analytics' => [
            'total_earnings' => $earnings['total_earnings'] ?? 0,
            'pending_amount' => $pending['pending_amount'] ?? 0,
            'pending_count' => $pending['pending_count'] ?? 0,
            'recent_transactions' => $recent
        ]
    ]);
    exit();
}

// Fraud Check for Transaction
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'fraud_check_transaction') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $amount = $input['amount'] ?? 0;
    $paymentData = $input['payment_data'] ?? [];

    $fraudCheck = $fraudDetection->comprehensiveTransactionCheck($userId, $amount, $paymentData);

    echo json_encode(['success' => true, 'fraud_check' => $fraudCheck]);
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>
