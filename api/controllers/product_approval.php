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

// Create Product with Approval Workflow
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'create_product') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    // Check if user is verified
    $userQuery = "SELECT is_verified, is_banned FROM users WHERE id = :user_id";
    $stmt = $db->prepare($userQuery);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user['is_banned']) {
        echo json_encode(['success' => false, 'message' => 'Your account has been banned']);
        exit();
    }

    // Check if verification is required
    $settingQuery = "SELECT setting_value FROM platform_settings WHERE setting_key = 'require_seller_verification'";
    $stmt = $db->prepare($settingQuery);
    $stmt->execute();
    $setting = $stmt->fetch(PDO::FETCH_ASSOC);
    $requireVerification = ($setting['setting_value'] ?? 'true') === 'true';

    if ($requireVerification && !$user['is_verified']) {
        echo json_encode(['success' => false, 'message' => 'You must complete seller verification before listing products']);
        exit();
    }

    $title = $input['title'] ?? '';
    $description = $input['description'] ?? '';
    $category = $input['category'] ?? '';
    $subcategory = $input['subcategory'] ?? null;
    $images = json_encode($input['images'] ?? []);
    $rentPrice = $input['rent_price'] ?? null;
    $buyPrice = $input['buy_price'] ?? null;
    $address = $input['address'] ?? '';
    $lat = $input['lat'] ?? null;
    $lng = $input['lng'] ?? null;
    $deposit = $input['deposit'] ?? null;
    $features = json_encode($input['features'] ?? []);
    $conditionStatus = $input['condition_status'] ?? 'good';
    $livePhotoVerified = $input['live_photo_verified'] ?? false;

    if (empty($title) || empty($category) || (empty($rentPrice) && empty($buyPrice))) {
        echo json_encode(['success' => false, 'message' => 'Title, category, and at least one price are required']);
        exit();
    }

    // Calculate AI fraud score (simplified - in production use actual AI)
    $fraudScore = 0.0;
    if (!$livePhotoVerified) $fraudScore += 0.3;
    if (empty($description) || strlen($description) < 50) $fraudScore += 0.2;
    if (count($input['images'] ?? []) < 2) $fraudScore += 0.2;

    $query = "INSERT INTO products (title, description, category, subcategory, images, rent_price, buy_price, 
              address, lat, lng, owner_id, deposit, features, condition_status, approval_status, 
              live_photo_verified, ai_fraud_score, watermark_applied) 
              VALUES (:title, :desc, :cat, :subcat, :imgs, :rent, :buy, :addr, :lat, :lng, :owner, 
              :deposit, :features, :condition, 'pending', :live_photo, :fraud_score, TRUE)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':desc', $description);
    $stmt->bindParam(':cat', $category);
    $stmt->bindParam(':subcat', $subcategory);
    $stmt->bindParam(':imgs', $images);
    $stmt->bindParam(':rent', $rentPrice);
    $stmt->bindParam(':buy', $buyPrice);
    $stmt->bindParam(':addr', $address);
    $stmt->bindParam(':lat', $lat);
    $stmt->bindParam(':lng', $lng);
    $stmt->bindParam(':owner', $userId);
    $stmt->bindParam(':deposit', $deposit);
    $stmt->bindParam(':features', $features);
    $stmt->bindParam(':condition', $conditionStatus);
    $stmt->bindParam(':live_photo', $livePhotoVerified);
    $stmt->bindParam(':fraud_score', $fraudScore);

    if ($stmt->execute()) {
        $productId = $db->lastInsertId();

        // Log fraud detection if score is high
        if ($fraudScore > 0.5) {
            $fraudQuery = "INSERT INTO fraud_detection_logs (user_id, product_id, detection_type, risk_score, 
                          details, action_taken) VALUES (:user_id, :product_id, 'suspicious_behavior', :score, 
                          'High fraud score detected on product creation', 'flagged')";
            $stmt = $db->prepare($fraudQuery);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':product_id', $productId);
            $stmt->bindParam(':score', $fraudScore);
            $stmt->execute();
        }

        // Notify admins for approval
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                       SELECT id, 'system', 'New Product Pending Approval', 
                       'A new product has been submitted for approval', :ref_id, 'product'
                       FROM users WHERE is_admin = TRUE";
        $stmt = $db->prepare($notifQuery);
        $stmt->bindParam(':ref_id', $productId);
        $stmt->execute();

        echo json_encode([
            'success' => true, 
            'message' => 'Product submitted for approval', 
            'product_id' => $productId,
            'fraud_score' => $fraudScore
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create product']);
    }
    exit();
}

// Admin: Get Pending Products
if ($method === 'GET' && isset($_GET['pending_products'])) {
    $adminId = $auth->getUserIdFromToken();
    if (!$adminId || !$auth->isAdmin($adminId)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $query = "SELECT p.*, u.name as owner_name, u.email as owner_email, u.rating as owner_rating,
              u.is_verified as owner_verified
              FROM products p
              JOIN users u ON p.owner_id = u.id
              WHERE p.approval_status = 'pending'
              ORDER BY p.ai_fraud_score DESC, p.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();

    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($products as &$product) {
        $product['images'] = json_decode($product['images'], true);
        $product['features'] = json_decode($product['features'], true);
    }

    echo json_encode(['success' => true, 'data' => $products]);
    exit();
}

// Admin: Approve Product
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'approve_product') {
    $adminId = $auth->getUserIdFromToken();
    if (!$adminId || !$auth->isAdmin($adminId)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $productId = $input['product_id'] ?? 0;

    $db->beginTransaction();
    try {
        $query = "UPDATE products SET approval_status = 'approved', approved_by = :admin_id, 
                  approved_at = NOW(), is_available = TRUE WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':id', $productId);
        $stmt->execute();

        // Get owner_id
        $ownerQuery = "SELECT owner_id, title FROM products WHERE id = :id";
        $stmt = $db->prepare($ownerQuery);
        $stmt->bindParam(':id', $productId);
        $stmt->execute();
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        // Notify owner
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                       VALUES (:user_id, 'system', 'Product Approved', 
                       'Your product \":title\" has been approved and is now live', :ref_id, 'product')";
        $stmt = $db->prepare($notifQuery);
        $stmt->bindParam(':user_id', $product['owner_id']);
        $title = $product['title'];
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':ref_id', $productId);
        $stmt->execute();

        // Log admin action
        $logQuery = "INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) 
                     VALUES (:admin_id, 'approve_product', 'product', :target_id, 'Approved product listing')";
        $stmt = $db->prepare($logQuery);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':target_id', $productId);
        $stmt->execute();

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Product approved successfully']);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to approve product: ' . $e->getMessage()]);
    }
    exit();
}

// Admin: Reject Product
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'reject_product') {
    $adminId = $auth->getUserIdFromToken();
    if (!$adminId || !$auth->isAdmin($adminId)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $productId = $input['product_id'] ?? 0;
    $reason = $input['reason'] ?? 'Product does not meet our guidelines';

    $db->beginTransaction();
    try {
        $query = "UPDATE products SET approval_status = 'rejected', rejection_reason = :reason, 
                  approved_by = :admin_id, approved_at = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':reason', $reason);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':id', $productId);
        $stmt->execute();

        // Get owner_id
        $ownerQuery = "SELECT owner_id, title FROM products WHERE id = :id";
        $stmt = $db->prepare($ownerQuery);
        $stmt->bindParam(':id', $productId);
        $stmt->execute();
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        // Notify owner
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                       VALUES (:user_id, 'system', 'Product Rejected', 
                       'Your product \":title\" was rejected. Reason: :reason', :ref_id, 'product')";
        $stmt = $db->prepare($notifQuery);
        $stmt->bindParam(':user_id', $product['owner_id']);
        $title = $product['title'];
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':reason', $reason);
        $stmt->bindParam(':ref_id', $productId);
        $stmt->execute();

        // Log admin action
        $logQuery = "INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) 
                     VALUES (:admin_id, 'reject_product', 'product', :target_id, :reason)";
        $stmt = $db->prepare($logQuery);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':target_id', $productId);
        $stmt->bindParam(':reason', $reason);
        $stmt->execute();

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Product rejected']);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to reject product: ' . $e->getMessage()]);
    }
    exit();
}

// Check Product Availability
if ($method === 'GET' && isset($_GET['check_availability'])) {
    $productId = $_GET['product_id'] ?? 0;
    $startDate = $_GET['start_date'] ?? '';
    $endDate = $_GET['end_date'] ?? '';

    $query = "SELECT COUNT(*) as count FROM product_availability 
              WHERE product_id = :product_id 
              AND ((start_date BETWEEN :start AND :end) OR (end_date BETWEEN :start AND :end)
              OR (:start BETWEEN start_date AND end_date))";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':product_id', $productId);
    $stmt->bindParam(':start', $startDate);
    $stmt->bindParam(':end', $endDate);
    $stmt->execute();

    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $isAvailable = $result['count'] == 0;

    echo json_encode(['success' => true, 'available' => $isAvailable]);
    exit();
}

// Get Product Availability Calendar
if ($method === 'GET' && isset($_GET['availability_calendar'])) {
    $productId = $_GET['product_id'] ?? 0;

    $query = "SELECT * FROM product_availability WHERE product_id = :product_id ORDER BY start_date";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':product_id', $productId);
    $stmt->execute();

    $availability = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $availability]);
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>
