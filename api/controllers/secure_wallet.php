<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$user = $auth->requireAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$user_id = $user['user_id'];

function hashPin($pin) {
    return password_hash($pin, PASSWORD_BCRYPT);
}

function verifyPin($pin, $hash) {
    return password_verify($pin, $hash);
}

function generateOTP() {
    return str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
}

function calculateCommission($amount, $transaction_type, $user_tier, $db) {
    $query = "SELECT * FROM commission_rules 
             WHERE transaction_type = :type 
             AND (user_tier = :tier OR user_tier IS NULL)
             AND is_active = TRUE
             AND (min_amount <= :amount OR min_amount IS NULL)
             AND (max_amount >= :amount OR max_amount IS NULL)
             ORDER BY priority DESC LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':type', $transaction_type);
    $stmt->bindParam(':tier', $user_tier);
    $stmt->bindParam(':amount', $amount);
    $stmt->execute();
    $rule = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($rule) {
        $commission = ($amount * $rule['commission_rate'] / 100) + $rule['flat_fee'];
        return ['amount' => $commission, 'rate' => $rule['commission_rate']];
    }
    return ['amount' => $amount * 0.10, 'rate' => 10.00];
}

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['wallet_info'])) {
                $query = "SELECT w.*, u.name, u.email, u.phone, s.plan_type as subscription_tier
                         FROM secure_wallets w
                         JOIN users u ON w.user_id = u.id
                         LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
                         LEFT JOIN subscription_plans s ON us.plan_id = s.id
                         WHERE w.user_id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$wallet) {
                    throw new Exception('Wallet not found');
                }
                
                unset($wallet['pin_hash']);
                unset($wallet['two_factor_secret']);
                
                echo json_encode(['success' => true, 'data' => $wallet]);
                
            } elseif (isset($_GET['transactions'])) {
                $limit = $_GET['limit'] ?? 50;
                $offset = $_GET['offset'] ?? 0;
                $type = $_GET['type'] ?? null;
                
                $query = "SELECT t.*, p.title as product_title, b.start_date, b.end_date
                         FROM secure_wallet_transactions t
                         JOIN secure_wallets w ON t.wallet_id = w.id
                         LEFT JOIN products p ON t.product_id = p.id
                         LEFT JOIN bookings b ON t.booking_id = b.id
                         WHERE w.user_id = :user_id";
                
                if ($type) {
                    $query .= " AND t.transaction_type = :type";
                }
                
                $query .= " ORDER BY t.created_at DESC LIMIT :limit OFFSET :offset";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                if ($type) $stmt->bindParam(':type', $type);
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
                $stmt->execute();
                $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $transactions]);
                
            } elseif (isset($_GET['payout_requests'])) {
                $query = "SELECT pr.*, w.balance
                         FROM payout_requests pr
                         JOIN secure_wallets w ON pr.wallet_id = w.id
                         WHERE w.user_id = :user_id
                         ORDER BY pr.created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $requests]);
                
            } elseif (isset($_GET['security_logs'])) {
                $query = "SELECT * FROM wallet_security_logs 
                         WHERE wallet_id = (SELECT id FROM secure_wallets WHERE user_id = :user_id)
                         ORDER BY created_at DESC LIMIT 50";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $logs]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (isset($data['action']) && $data['action'] === 'setup_wallet') {
                $pin = $data['pin'];
                $confirm_pin = $data['confirm_pin'];
                $mobile_money_number = $data['mobile_money_number'];
                $mobile_money_provider = $data['mobile_money_provider'];
                
                if ($pin !== $confirm_pin) {
                    throw new Exception('PINs do not match');
                }
                
                if (strlen($pin) !== 4 || !ctype_digit($pin)) {
                    throw new Exception('PIN must be 4 digits');
                }
                
                $pin_hash = hashPin($pin);
                
                $query = "INSERT INTO secure_wallets 
                         (user_id, pin_hash, mobile_money_number, mobile_money_provider)
                         VALUES (:user_id, :pin_hash, :mobile, :provider)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->bindParam(':pin_hash', $pin_hash);
                $stmt->bindParam(':mobile', $mobile_money_number);
                $stmt->bindParam(':provider', $mobile_money_provider);
                $stmt->execute();
                
                $wallet_id = $db->lastInsertId();
                
                $query = "INSERT INTO payout_schedules (wallet_id) VALUES (:wallet_id)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':wallet_id', $wallet_id);
                $stmt->execute();
                
                echo json_encode(['success' => true, 'message' => 'Wallet setup successfully']);
                
            } elseif (isset($data['action']) && $data['action'] === 'verify_pin') {
                $pin = $data['pin'];
                
                $query = "SELECT * FROM secure_wallets WHERE user_id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$wallet) {
                    throw new Exception('Wallet not found');
                }
                
                if ($wallet['pin_locked_until'] && strtotime($wallet['pin_locked_until']) > time()) {
                    throw new Exception('PIN locked. Try again later');
                }
                
                if (verifyPin($pin, $wallet['pin_hash'])) {
                    $query = "UPDATE secure_wallets SET pin_attempts = 0 WHERE id = :wallet_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':wallet_id', $wallet['id']);
                    $stmt->execute();
                    
                    echo json_encode(['success' => true, 'verified' => true]);
                } else {
                    $attempts = $wallet['pin_attempts'] + 1;
                    
                    if ($attempts >= 3) {
                        $locked_until = date('Y-m-d H:i:s', strtotime('+30 minutes'));
                        $query = "UPDATE secure_wallets SET pin_attempts = :attempts, pin_locked_until = :locked 
                                 WHERE id = :wallet_id";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':attempts', $attempts);
                        $stmt->bindParam(':locked', $locked_until);
                        $stmt->bindParam(':wallet_id', $wallet['id']);
                        $stmt->execute();
                        
                        throw new Exception('Too many failed attempts. Wallet locked for 30 minutes');
                    }
                    
                    $query = "UPDATE secure_wallets SET pin_attempts = :attempts WHERE id = :wallet_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':attempts', $attempts);
                    $stmt->bindParam(':wallet_id', $wallet['id']);
                    $stmt->execute();
                    
                    throw new Exception('Invalid PIN. ' . (3 - $attempts) . ' attempts remaining');
                }
                
            } elseif (isset($data['action']) && $data['action'] === 'request_payout') {
                $amount = $data['amount'];
                $pin = $data['pin'];
                $payout_method = $data['payout_method'];
                
                $query = "SELECT * FROM secure_wallets WHERE user_id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$wallet) {
                    throw new Exception('Wallet not found');
                }
                
                if (!verifyPin($pin, $wallet['pin_hash'])) {
                    throw new Exception('Invalid PIN');
                }
                
                if ($amount > $wallet['balance']) {
                    throw new Exception('Insufficient balance');
                }
                
                if ($amount < 5000) {
                    throw new Exception('Minimum payout is 5,000 RWF');
                }
                
                $otp = generateOTP();
                $otp_expires = date('Y-m-d H:i:s', strtotime('+10 minutes'));
                
                $query = "INSERT INTO wallet_otp (wallet_id, otp_code, otp_type, phone_number, expires_at)
                         VALUES (:wallet_id, :otp, 'withdrawal', :phone, :expires)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':wallet_id', $wallet['id']);
                $stmt->bindParam(':otp', $otp);
                $stmt->bindParam(':phone', $wallet['mobile_money_number']);
                $stmt->bindParam(':expires', $otp_expires);
                $stmt->execute();
                
                $query = "INSERT INTO payout_requests 
                         (wallet_id, amount, payout_method, mobile_number, mobile_provider, pin_verified, otp_code, otp_expires_at, ip_address)
                         VALUES (:wallet_id, :amount, :method, :mobile, :provider, TRUE, :otp, :expires, :ip)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':wallet_id', $wallet['id']);
                $stmt->bindParam(':amount', $amount);
                $stmt->bindParam(':method', $payout_method);
                $stmt->bindParam(':mobile', $wallet['mobile_money_number']);
                $stmt->bindParam(':provider', $wallet['mobile_money_provider']);
                $stmt->bindParam(':otp', $otp);
                $stmt->bindParam(':expires', $otp_expires);
                $ip = $_SERVER['REMOTE_ADDR'];
                $stmt->bindParam(':ip', $ip);
                $stmt->execute();
                
                $request_id = $db->lastInsertId();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'OTP sent to your phone',
                    'request_id' => $request_id,
                    'otp_for_testing' => $otp
                ]);
                
            } elseif (isset($data['action']) && $data['action'] === 'verify_otp_payout') {
                $request_id = $data['request_id'];
                $otp = $data['otp'];
                
                $query = "SELECT pr.*, w.balance, w.user_id
                         FROM payout_requests pr
                         JOIN secure_wallets w ON pr.wallet_id = w.id
                         WHERE pr.id = :request_id AND w.user_id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':request_id', $request_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $request = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$request) {
                    throw new Exception('Payout request not found');
                }
                
                if ($request['otp_code'] !== $otp) {
                    throw new Exception('Invalid OTP');
                }
                
                if (strtotime($request['otp_expires_at']) < time()) {
                    throw new Exception('OTP expired');
                }
                
                $db->beginTransaction();
                
                try {
                    $new_balance = $request['balance'] - $request['amount'];
                    
                    $query = "UPDATE secure_wallets 
                             SET balance = :balance, total_withdrawn = total_withdrawn + :amount
                             WHERE id = :wallet_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':balance', $new_balance);
                    $stmt->bindParam(':amount', $request['amount']);
                    $stmt->bindParam(':wallet_id', $request['wallet_id']);
                    $stmt->execute();
                    
                    $query = "INSERT INTO secure_wallet_transactions 
                             (wallet_id, transaction_type, amount, net_amount, balance_before, balance_after, 
                              reference_type, reference_id, description, status, payment_method, pin_verified, otp_verified)
                             VALUES (:wallet_id, 'payout', :amount, :amount, :before, :after, 
                                     'withdrawal', :ref_id, :desc, 'completed', :method, TRUE, TRUE)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':wallet_id', $request['wallet_id']);
                    $stmt->bindParam(':amount', $request['amount']);
                    $stmt->bindParam(':before', $request['balance']);
                    $stmt->bindParam(':after', $new_balance);
                    $stmt->bindParam(':ref_id', $request_id);
                    $desc = "Payout to " . $request['mobile_provider'] . " " . $request['mobile_number'];
                    $stmt->bindParam(':desc', $desc);
                    $stmt->bindParam(':method', $request['payout_method']);
                    $stmt->execute();
                    
                    $query = "UPDATE payout_requests 
                             SET status = 'completed', otp_verified = TRUE, processed_at = NOW()
                             WHERE id = :request_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':request_id', $request_id);
                    $stmt->execute();
                    
                    $db->commit();
                    
                    echo json_encode(['success' => true, 'message' => 'Payout completed successfully']);
                    
                } catch (Exception $e) {
                    $db->rollBack();
                    throw $e;
                }
            }
            break;
    }
    
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
