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

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Create Booking with Escrow
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'create_booking_with_escrow') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $productId = $input['product_id'] ?? 0;
    $bookingType = $input['booking_type'] ?? 'rental';
    $startDate = $input['start_date'] ?? null;
    $endDate = $input['end_date'] ?? null;
    $deliveryAddress = $input['delivery_address'] ?? '';
    $deliveryMethod = $input['delivery_method'] ?? 'pickup';
    $paymentMethod = $input['payment_method'] ?? 'mtn_momo';
    $phoneNumber = $input['phone_number'] ?? '';

    // Get product details
    $productQuery = "SELECT * FROM products WHERE id = :id AND is_available = TRUE AND approval_status = 'approved'";
    $stmt = $db->prepare($productQuery);
    $stmt->bindParam(':id', $productId);
    $stmt->execute();
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        echo json_encode(['success' => false, 'message' => 'Product not available']);
        exit();
    }

    if ($product['owner_id'] == $userId) {
        echo json_encode(['success' => false, 'message' => 'You cannot book your own product']);
        exit();
    }

    // Calculate pricing
    $itemPrice = $bookingType === 'rental' ? $product['rent_price'] : $product['buy_price'];
    $depositAmount = $product['deposit'] ?? 0;
    $rentalDays = 1;

    if ($bookingType === 'rental' && $startDate && $endDate) {
        $start = new DateTime($startDate);
        $end = new DateTime($endDate);
        $rentalDays = $start->diff($end)->days + 1;
        $itemPrice = $product['rent_price'] * $rentalDays;
    }

    $totalPrice = $itemPrice + $depositAmount;

    // Get commission rate
    $settingQuery = "SELECT setting_value FROM platform_settings WHERE setting_key = 'commission_rate'";
    $stmt = $db->prepare($settingQuery);
    $stmt->execute();
    $setting = $stmt->fetch(PDO::FETCH_ASSOC);
    $commissionRate = floatval($setting['setting_value'] ?? 0.10);

    $platformCommission = $itemPrice * $commissionRate;
    $ownerPayout = $itemPrice - $platformCommission;

    $db->beginTransaction();
    try {
        // Create booking
        $bookingQuery = "INSERT INTO bookings (product_id, renter_id, owner_id, booking_type, start_date, 
                        end_date, rental_days, item_price, deposit_amount, total_price, platform_commission, 
                        owner_payout, delivery_address, delivery_method, status, payment_status, escrow_status) 
                        VALUES (:product_id, :renter_id, :owner_id, :type, :start, :end, :days, :item_price, 
                        :deposit, :total, :commission, :payout, :address, :delivery, 'pending', 'pending', 'locked')";
        $stmt = $db->prepare($bookingQuery);
        $stmt->bindParam(':product_id', $productId);
        $stmt->bindParam(':renter_id', $userId);
        $stmt->bindParam(':owner_id', $product['owner_id']);
        $stmt->bindParam(':type', $bookingType);
        $stmt->bindParam(':start', $startDate);
        $stmt->bindParam(':end', $endDate);
        $stmt->bindParam(':days', $rentalDays);
        $stmt->bindParam(':item_price', $itemPrice);
        $stmt->bindParam(':deposit', $depositAmount);
        $stmt->bindParam(':total', $totalPrice);
        $stmt->bindParam(':commission', $platformCommission);
        $stmt->bindParam(':payout', $ownerPayout);
        $stmt->bindParam(':address', $deliveryAddress);
        $stmt->bindParam(':delivery', $deliveryMethod);
        $stmt->execute();

        $bookingId = $db->lastInsertId();

        // Create payment record
        $reference = 'PAY-' . time() . '-' . rand(1000, 9999);
        $paymentQuery = "INSERT INTO payments (booking_id, user_id, amount, payment_method, payment_type, 
                        phone_number, status, reference) 
                        VALUES (:booking_id, :user_id, :amount, :method, 'booking', :phone, 'pending', :ref)";
        $stmt = $db->prepare($paymentQuery);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':amount', $totalPrice);
        $stmt->bindParam(':method', $paymentMethod);
        $stmt->bindParam(':phone', $phoneNumber);
        $stmt->bindParam(':ref', $reference);
        $stmt->execute();

        $paymentId = $db->lastInsertId();

        // Block availability for rental
        if ($bookingType === 'rental') {
            $availQuery = "INSERT INTO product_availability (product_id, start_date, end_date, is_blocked, booking_id) 
                          VALUES (:product_id, :start, :end, TRUE, :booking_id)";
            $stmt = $db->prepare($availQuery);
            $stmt->bindParam(':product_id', $productId);
            $stmt->bindParam(':start', $startDate);
            $stmt->bindParam(':end', $endDate);
            $stmt->bindParam(':booking_id', $bookingId);
            $stmt->execute();
        }

        // Notify owner
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                       VALUES (:owner_id, 'booking', 'New Booking Request', 
                       'You have a new booking request for your product', :booking_id, 'booking')";
        $stmt = $db->prepare($notifQuery);
        $stmt->bindParam(':owner_id', $product['owner_id']);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->execute();

        $db->commit();
        echo json_encode([
            'success' => true, 
            'message' => 'Booking created successfully', 
            'booking_id' => $bookingId,
            'payment_id' => $paymentId,
            'reference' => $reference,
            'total_amount' => $totalPrice
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to create booking: ' . $e->getMessage()]);
    }
    exit();
}

// Confirm Payment and Lock Escrow
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'confirm_payment_escrow') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $paymentId = $input['payment_id'] ?? 0;
    $transactionId = $input['transaction_id'] ?? 'TXN-' . time();

    $db->beginTransaction();
    try {
        // Update payment status
        $paymentQuery = "UPDATE payments SET status = 'completed', transaction_id = :txn_id, 
                        completed_at = NOW() WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($paymentQuery);
        $stmt->bindParam(':txn_id', $transactionId);
        $stmt->bindParam(':id', $paymentId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        // Get payment details
        $getPaymentQuery = "SELECT * FROM payments WHERE id = :id";
        $stmt = $db->prepare($getPaymentQuery);
        $stmt->bindParam(':id', $paymentId);
        $stmt->execute();
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$payment) {
            throw new Exception('Payment not found');
        }

        $bookingId = $payment['booking_id'];

        // Update booking status
        $bookingQuery = "UPDATE bookings SET payment_status = 'paid', status = 'confirmed' WHERE id = :id";
        $stmt = $db->prepare($bookingQuery);
        $stmt->bindParam(':id', $bookingId);
        $stmt->execute();

        // Get booking details
        $getBookingQuery = "SELECT * FROM bookings WHERE id = :id";
        $stmt = $db->prepare($getBookingQuery);
        $stmt->bindParam(':id', $bookingId);
        $stmt->execute();
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);

        // Create escrow record
        $autoReleaseDays = 3; // Get from settings
        $autoReleaseDate = date('Y-m-d H:i:s', strtotime("+{$autoReleaseDays} days"));

        $escrowQuery = "INSERT INTO escrow (booking_id, amount, platform_fee, owner_amount, status, 
                       auto_release_date) VALUES (:booking_id, :amount, :fee, :owner_amount, 'locked', :auto_release)";
        $stmt = $db->prepare($escrowQuery);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->bindParam(':amount', $booking['total_price']);
        $stmt->bindParam(':fee', $booking['platform_commission']);
        $stmt->bindParam(':owner_amount', $booking['owner_payout']);
        $stmt->bindParam(':auto_release', $autoReleaseDate);
        $stmt->execute();

        // Notify both parties
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                       VALUES (:user_id, 'payment', 'Payment Confirmed', 
                       'Payment has been confirmed and funds are in escrow', :booking_id, 'booking')";
        $stmt = $db->prepare($notifQuery);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->execute();

        $stmt->bindParam(':user_id', $booking['owner_id']);
        $stmt->execute();

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Payment confirmed and escrow locked']);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to confirm payment: ' . $e->getMessage()]);
    }
    exit();
}

// Confirm Item Received
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'confirm_item_received') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $bookingId = $input['booking_id'] ?? 0;

    $db->beginTransaction();
    try {
        // Verify user is the renter
        $bookingQuery = "SELECT * FROM bookings WHERE id = :id AND renter_id = :user_id";
        $stmt = $db->prepare($bookingQuery);
        $stmt->bindParam(':id', $bookingId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$booking) {
            throw new Exception('Booking not found or unauthorized');
        }

        // Update booking
        $updateQuery = "UPDATE bookings SET item_received = TRUE, item_received_at = NOW(), status = 'active' 
                       WHERE id = :id";
        $stmt = $db->prepare($updateQuery);
        $stmt->bindParam(':id', $bookingId);
        $stmt->execute();

        // For purchases, release escrow immediately
        if ($booking['booking_type'] === 'purchase') {
            $this->releaseEscrowToOwner($db, $bookingId, $booking['owner_id'], $booking['owner_payout'], 
                                       $booking['platform_commission']);
        }

        // Notify owner
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                       VALUES (:owner_id, 'booking', 'Item Received', 
                       'Customer confirmed receiving the item', :booking_id, 'booking')";
        $stmt = $db->prepare($notifQuery);
        $stmt->bindParam(':owner_id', $booking['owner_id']);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->execute();

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Item receipt confirmed']);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit();
}

// Complete Rental and Return Item
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'complete_rental') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $bookingId = $input['booking_id'] ?? 0;
    $itemCondition = $input['item_condition'] ?? 'good';
    $deductDeposit = $input['deduct_deposit'] ?? 0;

    $db->beginTransaction();
    try {
        // Verify user is the owner
        $bookingQuery = "SELECT * FROM bookings WHERE id = :id AND owner_id = :user_id";
        $stmt = $db->prepare($bookingQuery);
        $stmt->bindParam(':id', $bookingId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$booking) {
            throw new Exception('Booking not found or unauthorized');
        }

        // Update booking
        $updateQuery = "UPDATE bookings SET item_returned = TRUE, item_returned_at = NOW(), 
                       status = 'completed' WHERE id = :id";
        $stmt = $db->prepare($updateQuery);
        $stmt->bindParam(':id', $bookingId);
        $stmt->execute();

        // Release escrow to owner
        releaseEscrowToOwner($db, $bookingId, $booking['owner_id'], $booking['owner_payout'], 
                            $booking['platform_commission']);

        // Handle deposit
        $depositReturn = $booking['deposit_amount'] - $deductDeposit;
        if ($depositReturn > 0) {
            // Return deposit to renter
            $walletQuery = "UPDATE users SET wallet_balance = wallet_balance + :amount WHERE id = :user_id";
            $stmt = $db->prepare($walletQuery);
            $stmt->bindParam(':amount', $depositReturn);
            $stmt->bindParam(':user_id', $booking['renter_id']);
            $stmt->execute();

            // Log wallet transaction
            $walletTxnQuery = "INSERT INTO wallet_transactions (user_id, amount, type, transaction_type, 
                              reference_id, reference_type, description, balance_before, balance_after) 
                              SELECT :user_id, :amount, 'credit', 'deposit_return', :ref_id, 'booking', 
                              'Deposit returned', wallet_balance - :amount, wallet_balance 
                              FROM users WHERE id = :user_id";
            $stmt = $db->prepare($walletTxnQuery);
            $stmt->bindParam(':user_id', $booking['renter_id']);
            $stmt->bindParam(':amount', $depositReturn);
            $stmt->bindParam(':ref_id', $bookingId);
            $stmt->execute();

            $updateDepositQuery = "UPDATE bookings SET deposit_returned = TRUE, deposit_returned_at = NOW() 
                                  WHERE id = :id";
            $stmt = $db->prepare($updateDepositQuery);
            $stmt->bindParam(':id', $bookingId);
            $stmt->execute();
        }

        // Update product stats
        $updateProductQuery = "UPDATE products SET is_available = TRUE WHERE id = :product_id";
        $stmt = $db->prepare($updateProductQuery);
        $stmt->bindParam(':product_id', $booking['product_id']);
        $stmt->execute();

        // Update user stats
        $updateOwnerQuery = "UPDATE users SET total_rentals = total_rentals + 1 WHERE id = :owner_id";
        $stmt = $db->prepare($updateOwnerQuery);
        $stmt->bindParam(':owner_id', $booking['owner_id']);
        $stmt->execute();

        // Notify renter
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                       VALUES (:renter_id, 'booking', 'Rental Completed', 
                       'Your rental has been completed. Deposit: RWF :deposit', :booking_id, 'booking')";
        $stmt = $db->prepare($notifQuery);
        $stmt->bindParam(':renter_id', $booking['renter_id']);
        $stmt->bindParam(':deposit', $depositReturn);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->execute();

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Rental completed successfully', 'deposit_returned' => $depositReturn]);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit();
}

// Helper function to release escrow
function releaseEscrowToOwner($db, $bookingId, $ownerId, $ownerAmount, $platformFee) {
    // Update escrow status
    $escrowQuery = "UPDATE escrow SET status = 'released', released_at = NOW(), 
                   release_to_owner = :amount, release_reason = 'Item delivered and confirmed' 
                   WHERE booking_id = :booking_id";
    $stmt = $db->prepare($escrowQuery);
    $stmt->bindParam(':amount', $ownerAmount);
    $stmt->bindParam(':booking_id', $bookingId);
    $stmt->execute();

    // Credit owner wallet
    $walletQuery = "UPDATE users SET wallet_balance = wallet_balance + :amount WHERE id = :owner_id";
    $stmt = $db->prepare($walletQuery);
    $stmt->bindParam(':amount', $ownerAmount);
    $stmt->bindParam(':owner_id', $ownerId);
    $stmt->execute();

    // Log wallet transaction
    $walletTxnQuery = "INSERT INTO wallet_transactions (user_id, amount, type, transaction_type, 
                      reference_id, reference_type, description, balance_before, balance_after) 
                      SELECT :user_id, :amount, 'credit', 'payout', :ref_id, 'booking', 
                      'Payment released from escrow', wallet_balance - :amount, wallet_balance 
                      FROM users WHERE id = :user_id";
    $stmt = $db->prepare($walletTxnQuery);
    $stmt->bindParam(':user_id', $ownerId);
    $stmt->bindParam(':amount', $ownerAmount);
    $stmt->bindParam(':ref_id', $bookingId);
    $stmt->execute();

    // Update booking escrow status
    $updateBookingQuery = "UPDATE bookings SET escrow_status = 'released' WHERE id = :booking_id";
    $stmt = $db->prepare($updateBookingQuery);
    $stmt->bindParam(':booking_id', $bookingId);
    $stmt->execute();
}

// Auto-release escrow (cron job endpoint)
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'auto_release_escrow') {
    $query = "SELECT e.*, b.owner_id, b.owner_payout, b.platform_commission 
              FROM escrow e
              JOIN bookings b ON e.booking_id = b.id
              WHERE e.status = 'locked' AND e.auto_release_date <= NOW()";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $escrows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $released = 0;
    foreach ($escrows as $escrow) {
        $db->beginTransaction();
        try {
            releaseEscrowToOwner($db, $escrow['booking_id'], $escrow['owner_id'], 
                               $escrow['owner_amount'], $escrow['platform_fee']);
            $db->commit();
            $released++;
        } catch (Exception $e) {
            $db->rollBack();
        }
    }

    echo json_encode(['success' => true, 'message' => "Auto-released {$released} escrows"]);
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>
