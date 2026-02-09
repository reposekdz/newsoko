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

$user = $auth->requireAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// GET - Fetch wallet info
if ($method === 'GET') {
    if (isset($_GET['balance'])) {
        // Get or create wallet
        $stmt = $db->prepare("SELECT * FROM user_wallets WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$wallet) {
            $createStmt = $db->prepare("INSERT INTO user_wallets (user_id) VALUES (:user_id)");
            $createStmt->bindParam(':user_id', $user['id']);
            $createStmt->execute();
            
            $stmt->execute();
            $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        echo json_encode(['success' => true, 'wallet' => $wallet]);
        exit();
    }
    
    if (isset($_GET['transactions'])) {
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
        $type = $_GET['type'] ?? null;
        
        // Get wallet
        $walletStmt = $db->prepare("SELECT id FROM user_wallets WHERE user_id = :user_id");
        $walletStmt->bindParam(':user_id', $user['id']);
        $walletStmt->execute();
        $wallet = $walletStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$wallet) {
            echo json_encode(['success' => true, 'transactions' => []]);
            exit();
        }
        
        $query = "SELECT * FROM wallet_transactions WHERE wallet_id = :wallet_id";
        if ($type) {
            $query .= " AND type = :type";
        }
        $query .= " ORDER BY created_at DESC LIMIT :limit";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':wallet_id', $wallet['id']);
        if ($type) {
            $stmt->bindParam(':type', $type);
        }
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'transactions' => $transactions]);
        exit();
    }
}

// POST - Wallet operations
if ($method === 'POST') {
    $action = $input['action'] ?? '';
    
    if ($action === 'add_funds') {
        $amount = floatval($input['amount'] ?? 0);
        $paymentMethod = $input['payment_method'] ?? 'mobile_money';
        $phoneNumber = $input['phone_number'] ?? '';
        
        if ($amount <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid amount']);
            exit();
        }
        
        // Get or create wallet
        $stmt = $db->prepare("SELECT * FROM user_wallets WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$wallet) {
            $createStmt = $db->prepare("INSERT INTO user_wallets (user_id) VALUES (:user_id)");
            $createStmt->bindParam(':user_id', $user['id']);
            $createStmt->execute();
            
            $stmt->execute();
            $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        $db->beginTransaction();
        
        try {
            $balanceBefore = floatval($wallet['balance']);
            $balanceAfter = $balanceBefore + $amount;
            
            // Update wallet
            $updateStmt = $db->prepare("UPDATE user_wallets SET balance = :balance, total_earned = total_earned + :amount, last_transaction_at = NOW() WHERE id = :id");
            $updateStmt->bindParam(':balance', $balanceAfter);
            $updateStmt->bindParam(':amount', $amount);
            $updateStmt->bindParam(':id', $wallet['id']);
            $updateStmt->execute();
            
            // Create transaction record
            $metadata = json_encode(['payment_method' => $paymentMethod, 'phone_number' => $phoneNumber]);
            $description = "Wallet top-up via $paymentMethod";
            
            $transStmt = $db->prepare("INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, description, metadata) VALUES (:wallet_id, 'credit', :amount, :balance_before, :balance_after, :description, :metadata)");
            $transStmt->bindParam(':wallet_id', $wallet['id']);
            $transStmt->bindParam(':amount', $amount);
            $transStmt->bindParam(':balance_before', $balanceBefore);
            $transStmt->bindParam(':balance_after', $balanceAfter);
            $transStmt->bindParam(':description', $description);
            $transStmt->bindParam(':metadata', $metadata);
            $transStmt->execute();
            
            $db->commit();
            
            echo json_encode(['success' => true, 'new_balance' => $balanceAfter, 'transaction_id' => $db->lastInsertId()]);
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => 'Transaction failed: ' . $e->getMessage()]);
        }
        exit();
    }
    
    if ($action === 'withdraw') {
        $amount = floatval($input['amount'] ?? 0);
        $withdrawMethod = $input['withdraw_method'] ?? 'mobile_money';
        $phoneNumber = $input['phone_number'] ?? '';
        
        if ($amount <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid amount']);
            exit();
        }
        
        // Get wallet
        $stmt = $db->prepare("SELECT * FROM user_wallets WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$wallet || floatval($wallet['balance']) < $amount) {
            echo json_encode(['success' => false, 'message' => 'Insufficient balance']);
            exit();
        }
        
        $db->beginTransaction();
        
        try {
            $balanceBefore = floatval($wallet['balance']);
            $balanceAfter = $balanceBefore - $amount;
            
            // Update wallet
            $updateStmt = $db->prepare("UPDATE user_wallets SET balance = :balance, total_spent = total_spent + :amount, last_transaction_at = NOW() WHERE id = :id");
            $updateStmt->bindParam(':balance', $balanceAfter);
            $updateStmt->bindParam(':amount', $amount);
            $updateStmt->bindParam(':id', $wallet['id']);
            $updateStmt->execute();
            
            // Create transaction record
            $metadata = json_encode(['withdraw_method' => $withdrawMethod, 'phone_number' => $phoneNumber]);
            $description = "Withdrawal to $withdrawMethod";
            
            $transStmt = $db->prepare("INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, description, metadata) VALUES (:wallet_id, 'withdrawal', :amount, :balance_before, :balance_after, :description, :metadata)");
            $transStmt->bindParam(':wallet_id', $wallet['id']);
            $transStmt->bindParam(':amount', $amount);
            $transStmt->bindParam(':balance_before', $balanceBefore);
            $transStmt->bindParam(':balance_after', $balanceAfter);
            $transStmt->bindParam(':description', $description);
            $transStmt->bindParam(':metadata', $metadata);
            $transStmt->execute();
            
            $db->commit();
            
            echo json_encode(['success' => true, 'new_balance' => $balanceAfter, 'transaction_id' => $db->lastInsertId()]);
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => 'Withdrawal failed: ' . $e->getMessage()]);
        }
        exit();
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
