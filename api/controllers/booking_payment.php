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

function calculateCommission($amount, $transaction_type, $user_tier, $db) {
    $query = "SELECT * FROM commission_rules 
             WHERE transaction_type = :type 
             AND (user_tier = :tier OR user_tier IS NULL)
             AND is_active = TRUE
             ORDER BY priority DESC LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':type', $transaction_type);
    $stmt->bindParam(':tier', $user_tier);
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
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (isset($data['action']) && $data['action'] === 'process_booking_payment') {
                $user = \$auth->requireAuth();
                if (!$user) throw new Exception('Unauthorized');
                
                $booking_id = $data['booking_id'];
                $payment_method = $data['payment_method'];
                $phone_number = $data['phone_number'];
                
                $db->beginTransaction();
                
                try {
                    // Get booking details
                    $query = "SELECT b.*, p.owner_id, p.title, u.subscription_plan_id
                             FROM bookings b
                             JOIN products p ON b.product_id = p.id
                             JOIN users u ON p.owner_id = u.id
                             WHERE b.id = :booking_id AND b.renter_id = :user_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':booking_id', $booking_id);
                    $stmt->bindParam(':user_id', $user['user_id']);
                    $stmt->execute();
                    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$booking) throw new Exception('Booking not found');
                    
                    // Get seller tier
                    $query = "SELECT plan_type FROM subscription_plans WHERE id = :plan_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':plan_id', $booking['subscription_plan_id']);
                    $stmt->execute();
                    $plan = $stmt->fetch(PDO::FETCH_ASSOC);
                    $seller_tier = $plan['plan_type'] ?? 'free';
                    
                    // Calculate commission
                    $transaction_type = $booking['buy_price'] ? 'sale' : 'rental';
                    $commission_data = calculateCommission($booking['total_price'], $transaction_type, $seller_tier, $db);
                    $commission_amount = $commission_data['amount'];
                    $commission_rate = $commission_data['rate'];
                    $seller_payout = $booking['total_price'] - $commission_amount;
                    
                    // Create/get buyer wallet
                    $query = "INSERT IGNORE INTO secure_wallets (user_id, pin_hash) 
                             VALUES (:user_id, :pin)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user_id', $user['user_id']);
                    $default_pin = password_hash('0000', PASSWORD_BCRYPT);
                    $stmt->bindParam(':pin', $default_pin);
                    $stmt->execute();
                    
                    // Create/get seller wallet
                    $query = "INSERT IGNORE INTO secure_wallets (user_id, pin_hash) 
                             VALUES (:user_id, :pin)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user_id', $booking['owner_id']);
                    $stmt->bindParam(':pin', $default_pin);
                    $stmt->execute();
                    
                    // Get seller wallet
                    $query = "SELECT * FROM secure_wallets WHERE user_id = :user_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user_id', $booking['owner_id']);
                    $stmt->execute();
                    $seller_wallet = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Hold money in escrow
                    $query = "UPDATE secure_wallets 
                             SET escrow_balance = escrow_balance + :amount,
                                 pending_balance = pending_balance + :seller_amount
                             WHERE id = :wallet_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':amount', $booking['total_price']);
                    $stmt->bindParam(':seller_amount', $seller_payout);
                    $stmt->bindParam(':wallet_id', $seller_wallet['id']);
                    $stmt->execute();
                    
                    // Record escrow transaction
                    $query = "INSERT INTO secure_wallet_transactions 
                             (wallet_id, transaction_type, amount, commission_amount, commission_rate, net_amount,
                              balance_before, balance_after, reference_type, reference_id, booking_id, product_id,
                              description, status, payment_method, security_verified)
                             VALUES (:wallet_id, 'escrow_hold', :amount, :commission, :rate, :net,
                                     :before, :after, 'booking', :ref_id, :booking_id, :product_id,
                                     :desc, 'completed', :method, TRUE)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':wallet_id', $seller_wallet['id']);
                    $stmt->bindParam(':amount', $booking['total_price']);
                    $stmt->bindParam(':commission', $commission_amount);
                    $stmt->bindParam(':rate', $commission_rate);
                    $stmt->bindParam(':net', $seller_payout);
                    $stmt->bindParam(':before', $seller_wallet['escrow_balance']);
                    $after = $seller_wallet['escrow_balance'] + $booking['total_price'];
                    $stmt->bindParam(':after', $after);
                    $stmt->bindParam(':ref_id', $booking_id);
                    $stmt->bindParam(':booking_id', $booking_id);
                    $stmt->bindParam(':product_id', $booking['product_id']);
                    $desc = "Payment received for " . $booking['title'];
                    $stmt->bindParam(':desc', $desc);
                    $stmt->bindParam(':method', $payment_method);
                    $stmt->execute();
                    
                    // Update booking
                    $query = "UPDATE bookings 
                             SET payment_status = 'paid', 
                                 status = 'confirmed',
                                 commission_amount = :commission,
                                 commission_rate = :rate,
                                 seller_payout_amount = :payout
                             WHERE id = :booking_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':commission', $commission_amount);
                    $stmt->bindParam(':rate', $commission_rate);
                    $stmt->bindParam(':payout', $seller_payout);
                    $stmt->bindParam(':booking_id', $booking_id);
                    $stmt->execute();
                    
                    $db->commit();
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Payment processed successfully',
                        'commission' => $commission_amount,
                        'seller_payout' => $seller_payout
                    ]);
                    
                } catch (Exception $e) {
                    $db->rollBack();
                    throw $e;
                }
                
            } elseif (isset($data['action']) && $data['action'] === 'release_escrow') {
                $user = \$auth->requireAuth();
                if (!$user) throw new Exception('Unauthorized');
                
                $booking_id = $data['booking_id'];
                
                $db->beginTransaction();
                
                try {
                    // Get booking
                    $query = "SELECT b.*, p.owner_id FROM bookings b
                             JOIN products p ON b.product_id = p.id
                             WHERE b.id = :booking_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':booking_id', $booking_id);
                    $stmt->execute();
                    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$booking) throw new Exception('Booking not found');
                    
                    // Get seller wallet
                    $query = "SELECT * FROM secure_wallets WHERE user_id = :user_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user_id', $booking['owner_id']);
                    $stmt->execute();
                    $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Release escrow to balance
                    $query = "UPDATE secure_wallets 
                             SET balance = balance + :amount,
                                 escrow_balance = escrow_balance - :total,
                                 pending_balance = pending_balance - :amount,
                                 total_earned = total_earned + :amount,
                                 commission_paid = commission_paid + :commission
                             WHERE id = :wallet_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':amount', $booking['seller_payout_amount']);
                    $stmt->bindParam(':total', $booking['total_price']);
                    $stmt->bindParam(':commission', $booking['commission_amount']);
                    $stmt->bindParam(':wallet_id', $wallet['id']);
                    $stmt->execute();
                    
                    // Record release transaction
                    $query = "INSERT INTO secure_wallet_transactions 
                             (wallet_id, transaction_type, amount, commission_amount, commission_rate, net_amount,
                              balance_before, balance_after, reference_type, reference_id, booking_id,
                              description, status, security_verified)
                             VALUES (:wallet_id, 'escrow_release', :total, :commission, :rate, :net,
                                     :before, :after, 'booking', :ref_id, :booking_id,
                                     :desc, 'completed', TRUE)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':wallet_id', $wallet['id']);
                    $stmt->bindParam(':total', $booking['total_price']);
                    $stmt->bindParam(':commission', $booking['commission_amount']);
                    $stmt->bindParam(':rate', $booking['commission_rate']);
                    $stmt->bindParam(':net', $booking['seller_payout_amount']);
                    $stmt->bindParam(':before', $wallet['balance']);
                    $after = $wallet['balance'] + $booking['seller_payout_amount'];
                    $stmt->bindParam(':after', $after);
                    $stmt->bindParam(':ref_id', $booking_id);
                    $stmt->bindParam(':booking_id', $booking_id);
                    $desc = "Escrow released - Commission: " . $booking['commission_amount'] . " RWF";
                    $stmt->bindParam(':desc', $desc);
                    $stmt->execute();
                    
                    // Update booking
                    $query = "UPDATE bookings 
                             SET seller_payout_status = 'completed',
                                 seller_payout_date = NOW(),
                                 status = 'completed'
                             WHERE id = :booking_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':booking_id', $booking_id);
                    $stmt->execute();
                    
                    $db->commit();
                    
                    echo json_encode(['success' => true, 'message' => 'Escrow released successfully']);
                    
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
