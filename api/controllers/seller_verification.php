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

// Verify Seller - Submit Verification Documents
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'submit_verification') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $documentType = $input['document_type'] ?? '';
    $documentNumber = $input['document_number'] ?? '';
    $documentImage = $input['document_image'] ?? '';
    $selfieImage = $input['selfie_image'] ?? '';
    $businessName = $input['business_name'] ?? null;
    $businessAddress = $input['business_address'] ?? null;
    $gpsLat = $input['gps_latitude'] ?? null;
    $gpsLng = $input['gps_longitude'] ?? null;

    if (empty($documentType) || empty($documentNumber) || empty($documentImage) || empty($selfieImage)) {
        echo json_encode(['success' => false, 'message' => 'All verification documents are required']);
        exit();
    }

    // Check if user already has pending verification
    $checkQuery = "SELECT id FROM seller_verifications WHERE user_id = :user_id AND status = 'pending'";
    $stmt = $db->prepare($checkQuery);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'message' => 'You already have a pending verification request']);
        exit();
    }

    $query = "INSERT INTO seller_verifications (user_id, document_type, document_number, document_image, 
              selfie_image, business_name, business_address, gps_latitude, gps_longitude, status) 
              VALUES (:user_id, :doc_type, :doc_num, :doc_img, :selfie, :biz_name, :biz_addr, :lat, :lng, 'pending')";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':doc_type', $documentType);
    $stmt->bindParam(':doc_num', $documentNumber);
    $stmt->bindParam(':doc_img', $documentImage);
    $stmt->bindParam(':selfie', $selfieImage);
    $stmt->bindParam(':biz_name', $businessName);
    $stmt->bindParam(':biz_addr', $businessAddress);
    $stmt->bindParam(':lat', $gpsLat);
    $stmt->bindParam(':lng', $gpsLng);

    if ($stmt->execute()) {
        // Create notification for admin
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                       SELECT id, 'verification', 'New Seller Verification', 
                       'A new seller verification request has been submitted', :ref_id, 'verification'
                       FROM users WHERE is_admin = TRUE";
        $notifStmt = $db->prepare($notifQuery);
        $verificationId = $db->lastInsertId();
        $notifStmt->bindParam(':ref_id', $verificationId);
        $notifStmt->execute();

        echo json_encode(['success' => true, 'message' => 'Verification submitted successfully', 'verification_id' => $verificationId]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to submit verification']);
    }
    exit();
}

// Get User Verification Status
if ($method === 'GET' && isset($_GET['user_verification'])) {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $query = "SELECT * FROM seller_verifications WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $verification = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $verification]);
    exit();
}

// Admin: Get All Pending Verifications
if ($method === 'GET' && isset($_GET['pending_verifications'])) {
    $userId = $auth->getUserIdFromToken();
    if (!$userId || !$auth->isAdmin($userId)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $query = "SELECT sv.*, u.name, u.email, u.phone, u.avatar 
              FROM seller_verifications sv
              JOIN users u ON sv.user_id = u.id
              WHERE sv.status = 'pending'
              ORDER BY sv.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();

    $verifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $verifications]);
    exit();
}

// Admin: Approve Verification
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'approve_verification') {
    $adminId = $auth->getUserIdFromToken();
    if (!$adminId || !$auth->isAdmin($adminId)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $verificationId = $input['verification_id'] ?? 0;

    $db->beginTransaction();
    try {
        // Update verification status
        $query = "UPDATE seller_verifications SET status = 'approved', verified_by = :admin_id, 
                  verified_at = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':id', $verificationId);
        $stmt->execute();

        // Get user_id from verification
        $getUserQuery = "SELECT user_id FROM seller_verifications WHERE id = :id";
        $stmt = $db->prepare($getUserQuery);
        $stmt->bindParam(':id', $verificationId);
        $stmt->execute();
        $verification = $stmt->fetch(PDO::FETCH_ASSOC);
        $userId = $verification['user_id'];

        // Update user verification status
        $updateUserQuery = "UPDATE users SET is_verified = TRUE WHERE id = :user_id";
        $stmt = $db->prepare($updateUserQuery);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        // Create notification for user
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                       VALUES (:user_id, 'verification', 'Verification Approved', 
                       'Your seller verification has been approved. You can now list products.', :ref_id, 'verification')";
        $stmt = $db->prepare($notifQuery);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':ref_id', $verificationId);
        $stmt->execute();

        // Log admin action
        $logQuery = "INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) 
                     VALUES (:admin_id, 'approve_verification', 'verification', :target_id, 'Approved seller verification')";
        $stmt = $db->prepare($logQuery);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':target_id', $verificationId);
        $stmt->execute();

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Verification approved successfully']);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to approve verification: ' . $e->getMessage()]);
    }
    exit();
}

// Admin: Reject Verification
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'reject_verification') {
    $adminId = $auth->getUserIdFromToken();
    if (!$adminId || !$auth->isAdmin($adminId)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $verificationId = $input['verification_id'] ?? 0;
    $reason = $input['reason'] ?? 'Documents not valid';

    $db->beginTransaction();
    try {
        // Update verification status
        $query = "UPDATE seller_verifications SET status = 'rejected', rejection_reason = :reason, 
                  verified_by = :admin_id, verified_at = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':reason', $reason);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':id', $verificationId);
        $stmt->execute();

        // Get user_id
        $getUserQuery = "SELECT user_id FROM seller_verifications WHERE id = :id";
        $stmt = $db->prepare($getUserQuery);
        $stmt->bindParam(':id', $verificationId);
        $stmt->execute();
        $verification = $stmt->fetch(PDO::FETCH_ASSOC);
        $userId = $verification['user_id'];

        // Create notification
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                       VALUES (:user_id, 'verification', 'Verification Rejected', 
                       'Your seller verification was rejected. Reason: :reason', :ref_id, 'verification')";
        $stmt = $db->prepare($notifQuery);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':reason', $reason);
        $stmt->bindParam(':ref_id', $verificationId);
        $stmt->execute();

        // Log admin action
        $logQuery = "INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) 
                     VALUES (:admin_id, 'reject_verification', 'verification', :target_id, :reason)";
        $stmt = $db->prepare($logQuery);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':target_id', $verificationId);
        $stmt->bindParam(':reason', $reason);
        $stmt->execute();

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Verification rejected']);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to reject verification: ' . $e->getMessage()]);
    }
    exit();
}

// Pay Seller Deposit
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'pay_seller_deposit') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    // Get required deposit amount from settings
    $settingQuery = "SELECT setting_value FROM platform_settings WHERE setting_key = 'seller_deposit_required'";
    $stmt = $db->prepare($settingQuery);
    $stmt->execute();
    $setting = $stmt->fetch(PDO::FETCH_ASSOC);
    $depositAmount = floatval($setting['setting_value'] ?? 50000);

    $paymentMethod = $input['payment_method'] ?? 'mtn_momo';
    $phoneNumber = $input['phone_number'] ?? '';

    $db->beginTransaction();
    try {
        // Create payment record
        $reference = 'DEP-' . time() . '-' . rand(1000, 9999);
        $paymentQuery = "INSERT INTO payments (user_id, amount, payment_method, payment_type, phone_number, status, reference) 
                         VALUES (:user_id, :amount, :method, 'deposit', :phone, 'completed', :ref)";
        $stmt = $db->prepare($paymentQuery);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':amount', $depositAmount);
        $stmt->bindParam(':method', $paymentMethod);
        $stmt->bindParam(':phone', $phoneNumber);
        $stmt->bindParam(':ref', $reference);
        $stmt->execute();

        // Update user seller deposit
        $updateQuery = "UPDATE users SET seller_deposit = seller_deposit + :amount WHERE id = :user_id";
        $stmt = $db->prepare($updateQuery);
        $stmt->bindParam(':amount', $depositAmount);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Seller deposit paid successfully', 'reference' => $reference]);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to process deposit: ' . $e->getMessage()]);
    }
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>
