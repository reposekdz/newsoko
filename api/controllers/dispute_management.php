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

// File Dispute
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'file_dispute') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $bookingId = $input['booking_id'] ?? 0;
    $reason = $input['reason'] ?? '';
    $description = $input['description'] ?? '';
    $evidence = json_encode($input['evidence'] ?? []);

    // Verify user is part of the booking
    $bookingQuery = "SELECT * FROM bookings WHERE id = :id AND (renter_id = :user_id OR owner_id = :user_id)";
    $stmt = $db->prepare($bookingQuery);
    $stmt->bindParam(':id', $bookingId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
        echo json_encode(['success' => false, 'message' => 'Booking not found or unauthorized']);
        exit();
    }

    $againstUser = ($booking['renter_id'] == $userId) ? $booking['owner_id'] : $booking['renter_id'];

    $db->beginTransaction();
    try {
        // Create dispute
        $query = "INSERT INTO disputes (booking_id, filed_by, against_user, reason, description, evidence, status) 
                  VALUES (:booking_id, :filed_by, :against, :reason, :desc, :evidence, 'open')";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->bindParam(':filed_by', $userId);
        $stmt->bindParam(':against', $againstUser);
        $stmt->bindParam(':reason', $reason);
        $stmt->bindParam(':desc', $description);
        $stmt->bindParam(':evidence', $evidence);
        $stmt->execute();

        $disputeId = $db->lastInsertId();

        // Update booking status
        $updateBooking = "UPDATE bookings SET status = 'disputed' WHERE id = :id";
        $stmt = $db->prepare($updateBooking);
        $stmt->bindParam(':id', $bookingId);
        $stmt->execute();

        // Notify other party
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                       VALUES (:user_id, 'dispute', 'Dispute Filed', 
                       'A dispute has been filed for your booking', :ref_id, 'dispute')";
        $stmt = $db->prepare($notifQuery);
        $stmt->bindParam(':user_id', $againstUser);
        $stmt->bindParam(':ref_id', $disputeId);
        $stmt->execute();

        // Notify admins
        $adminNotifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                           SELECT id, 'dispute', 'New Dispute', 
                           'A new dispute has been filed and requires review', :ref_id, 'dispute'
                           FROM users WHERE is_admin = TRUE";
        $stmt = $db->prepare($adminNotifQuery);
        $stmt->bindParam(':ref_id', $disputeId);
        $stmt->execute();

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Dispute filed successfully', 'dispute_id' => $disputeId]);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to file dispute: ' . $e->getMessage()]);
    }
    exit();
}

// Get User Disputes
if ($method === 'GET' && isset($_GET['user_disputes'])) {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $query = "SELECT d.*, b.product_id, p.title as product_title, p.images,
              u1.name as filed_by_name, u2.name as against_user_name
              FROM disputes d
              JOIN bookings b ON d.booking_id = b.id
              JOIN products p ON b.product_id = p.id
              JOIN users u1 ON d.filed_by = u1.id
              JOIN users u2 ON d.against_user = u2.id
              WHERE d.filed_by = :user_id OR d.against_user = :user_id
              ORDER BY d.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $disputes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($disputes as &$dispute) {
        $dispute['evidence'] = json_decode($dispute['evidence'], true);
        $dispute['images'] = json_decode($dispute['images'], true);
    }

    echo json_encode(['success' => true, 'data' => $disputes]);
    exit();
}

// Get All Disputes (Admin)
if ($method === 'GET' && isset($_GET['all_disputes'])) {
    $adminId = $auth->getUserIdFromToken();
    if (!$adminId || !$auth->isAdmin($adminId)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $status = $_GET['status'] ?? 'all';
    $query = "SELECT d.*, b.product_id, p.title as product_title, p.images,
              u1.name as filed_by_name, u1.email as filed_by_email,
              u2.name as against_user_name, u2.email as against_user_email
              FROM disputes d
              JOIN bookings b ON d.booking_id = b.id
              JOIN products p ON b.product_id = p.id
              JOIN users u1 ON d.filed_by = u1.id
              JOIN users u2 ON d.against_user = u2.id";
    
    if ($status !== 'all') {
        $query .= " WHERE d.status = :status";
    }
    
    $query .= " ORDER BY d.created_at DESC";
    
    $stmt = $db->prepare($query);
    if ($status !== 'all') {
        $stmt->bindParam(':status', $status);
    }
    $stmt->execute();

    $disputes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($disputes as &$dispute) {
        $dispute['evidence'] = json_decode($dispute['evidence'], true);
        $dispute['images'] = json_decode($dispute['images'], true);
    }

    echo json_encode(['success' => true, 'data' => $disputes]);
    exit();
}

// Add Dispute Message
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'add_dispute_message') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $disputeId = $input['dispute_id'] ?? 0;
    $message = $input['message'] ?? '';
    $attachments = json_encode($input['attachments'] ?? []);

    // Verify user is part of dispute or admin
    $disputeQuery = "SELECT * FROM disputes WHERE id = :id AND (filed_by = :user_id OR against_user = :user_id)";
    $stmt = $db->prepare($disputeQuery);
    $stmt->bindParam(':id', $disputeId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $dispute = $stmt->fetch(PDO::FETCH_ASSOC);

    $isAdmin = $auth->isAdmin($userId);
    if (!$dispute && !$isAdmin) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $query = "INSERT INTO dispute_messages (dispute_id, user_id, message, attachments) 
              VALUES (:dispute_id, :user_id, :message, :attachments)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':dispute_id', $disputeId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':message', $message);
    $stmt->bindParam(':attachments', $attachments);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Message added']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add message']);
    }
    exit();
}

// Get Dispute Messages
if ($method === 'GET' && isset($_GET['dispute_messages'])) {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $disputeId = $_GET['dispute_id'] ?? 0;

    $query = "SELECT dm.*, u.name, u.avatar, u.is_admin
              FROM dispute_messages dm
              JOIN users u ON dm.user_id = u.id
              WHERE dm.dispute_id = :dispute_id
              ORDER BY dm.created_at ASC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':dispute_id', $disputeId);
    $stmt->execute();

    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($messages as &$msg) {
        $msg['attachments'] = json_decode($msg['attachments'], true);
    }

    echo json_encode(['success' => true, 'data' => $messages]);
    exit();
}

// Resolve Dispute (Admin)
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'resolve_dispute') {
    $adminId = $auth->getUserIdFromToken();
    if (!$adminId || !$auth->isAdmin($adminId)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $disputeId = $input['dispute_id'] ?? 0;
    $resolution = $input['resolution'] ?? '';
    $refundAmount = $input['refund_amount'] ?? 0;
    $refundTo = $input['refund_to'] ?? null; // 'renter' or 'owner'

    $db->beginTransaction();
    try {
        // Get dispute details
        $disputeQuery = "SELECT d.*, b.total_price, b.renter_id, b.owner_id, b.product_id 
                        FROM disputes d 
                        JOIN bookings b ON d.booking_id = b.id 
                        WHERE d.id = :id";
        $stmt = $db->prepare($disputeQuery);
        $stmt->bindParam(':id', $disputeId);
        $stmt->execute();
        $dispute = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$dispute) {
            throw new Exception('Dispute not found');
        }

        // Update dispute status
        $updateDispute = "UPDATE disputes SET status = 'resolved', resolution = :resolution, 
                         resolved_by = :admin_id, resolved_at = NOW() WHERE id = :id";
        $stmt = $db->prepare($updateDispute);
        $stmt->bindParam(':resolution', $resolution);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':id', $disputeId);
        $stmt->execute();

        // Handle refund if specified
        if ($refundAmount > 0 && $refundTo) {
            $refundUserId = ($refundTo === 'renter') ? $dispute['renter_id'] : $dispute['owner_id'];
            
            $refundQuery = "INSERT INTO escrow_transactions (booking_id, transaction_type, amount, 
                           from_user, to_user, status, description) 
                           VALUES (:booking_id, 'refund', :amount, NULL, :to_user, 'completed', 
                           'Dispute resolution refund')";
            $stmt = $db->prepare($refundQuery);
            $stmt->bindParam(':booking_id', $dispute['booking_id']);
            $stmt->bindParam(':amount', $refundAmount);
            $stmt->bindParam(':to_user', $refundUserId);
            $stmt->execute();

            // Update user wallet
            $updateWallet = "UPDATE users SET wallet_balance = wallet_balance + :amount WHERE id = :user_id";
            $stmt = $db->prepare($updateWallet);
            $stmt->bindParam(':amount', $refundAmount);
            $stmt->bindParam(':user_id', $refundUserId);
            $stmt->execute();
        }

        // Update booking status
        $updateBooking = "UPDATE bookings SET status = 'completed' WHERE id = :id";
        $stmt = $db->prepare($updateBooking);
        $stmt->bindParam(':id', $dispute['booking_id']);
        $stmt->execute();

        // Notify both parties
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                      VALUES (:user_id, 'dispute_resolved', 'Dispute Resolved', :message, :ref_id, 'dispute')";
        $stmt = $db->prepare($notifQuery);
        
        $message = "Your dispute has been resolved. " . $resolution;
        $stmt->bindParam(':message', $message);
        $stmt->bindParam(':ref_id', $disputeId);
        
        $stmt->bindParam(':user_id', $dispute['filed_by']);
        $stmt->execute();
        
        $stmt->bindParam(':user_id', $dispute['against_user']);
        $stmt->execute();

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Dispute resolved successfully']);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to resolve dispute: ' . $e->getMessage()]);
    }
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);minId || !$auth->isAdmin($adminId)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $disputeId = $input['dispute_id'] ?? 0;
    $resolution = $input['resolution'] ?? '';
    $refundAmount = $input['refund_amount'] ?? 0;
    $refundTo = $input['refund_to'] ?? 'renter'; // 'renter' or 'owner'

    $db->beginTransaction();
    try {
        // Get dispute details
        $disputeQuery = "SELECT d.*, b.renter_id, b.owner_id, b.total_price, b.deposit_amount
                        FROM disputes d
                        JOIN bookings b ON d.booking_id = b.id
                        WHERE d.id = :id";
        $stmt = $db->prepare($disputeQuery);
        $stmt->bindParam(':id', $disputeId);
        $stmt->execute();
        $dispute = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$dispute) {
            throw new Exception('Dispute not found');
        }

        // Update dispute status
        $updateQuery = "UPDATE disputes SET status = 'resolved', resolution = :resolution, 
                       resolved_by = :admin_id, resolved_at = NOW(), refund_amount = :refund 
                       WHERE id = :id";
        $stmt = $db->prepare($updateQuery);
        $stmt->bindParam(':resolution', $resolution);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':refund', $refundAmount);
        $stmt->bindParam(':id', $disputeId);
        $stmt->execute();

        // Process refund if applicable
        if ($refundAmount > 0) {
            $refundUserId = ($refundTo === 'renter') ? $dispute['renter_id'] : $dispute['owner_id'];
            
            // Update escrow
            $escrowQuery = "UPDATE escrow SET status = 'partial_refund', refund_to_renter = :refund 
                           WHERE booking_id = :booking_id";
            $stmt = $db->prepare($escrowQuery);
            $stmt->bindParam(':refund', $refundAmount);
            $stmt->bindParam(':booking_id', $dispute['booking_id']);
            $stmt->execute();

            // Credit wallet
            $walletQuery = "UPDATE users SET wallet_balance = wallet_balance + :amount WHERE id = :user_id";
            $stmt = $db->prepare($walletQuery);
            $stmt->bindParam(':amount', $refundAmount);
            $stmt->bindParam(':user_id', $refundUserId);
            $stmt->execute();

            // Log transaction
            $txnQuery = "INSERT INTO wallet_transactions (user_id, amount, type, transaction_type, 
                        reference_id, reference_type, description, balance_before, balance_after) 
                        SELECT :user_id, :amount, 'credit', 'refund', :ref_id, 'dispute', 
                        'Dispute resolution refund', wallet_balance - :amount, wallet_balance 
                        FROM users WHERE id = :user_id";
            $stmt = $db->prepare($txnQuery);
            $stmt->bindParam(':user_id', $refundUserId);
            $stmt->bindParam(':amount', $refundAmount);
            $stmt->bindParam(':ref_id', $disputeId);
            $stmt->execute();
        }

        // Update booking status
        $updateBooking = "UPDATE bookings SET status = 'completed' WHERE id = :id";
        $stmt = $db->prepare($updateBooking);
        $stmt->bindParam(':id', $dispute['booking_id']);
        $stmt->execute();

        // Notify both parties
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                       VALUES (:user_id, 'dispute', 'Dispute Resolved', :message, :ref_id, 'dispute')";
        $stmt = $db->prepare($notifQuery);
        
        $notifMessage = "Your dispute has been resolved. " . $resolution;
        $stmt->bindParam(':user_id', $dispute['filed_by']);
        $stmt->bindParam(':message', $notifMessage);
        $stmt->bindParam(':ref_id', $disputeId);
        $stmt->execute();

        $stmt->bindParam(':user_id', $dispute['against_user']);
        $stmt->execute();

        // Log admin action
        $logQuery = "INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) 
                     VALUES (:admin_id, 'resolve_dispute', 'dispute', :target_id, :resolution)";
        $stmt = $db->prepare($logQuery);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':target_id', $disputeId);
        $stmt->bindParam(':resolution', $resolution);
        $stmt->execute();

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Dispute resolved successfully']);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to resolve dispute: ' . $e->getMessage()]);
    }
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>
