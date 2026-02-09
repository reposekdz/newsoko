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
require_once '../services/AIFraudDetection.php';
require_once '../services/WatermarkService.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);
$fraudDetection = new AIFraudDetection($db);
$watermarkService = new WatermarkService();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Verify Live Photo
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'verify_live_photo') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $imagePath = $input['image_path'] ?? '';
    $productId = $input['product_id'] ?? 0;

    if (empty($imagePath)) {
        echo json_encode(['success' => false, 'message' => 'Image path required']);
        exit();
    }

    // Verify live photo
    $verification = $fraudDetection->verifyLivePhoto($imagePath, $userId);

    if ($verification['is_live']) {
        // Apply watermark
        $watermarkResult = $watermarkService->applyWatermark($imagePath);
        
        if ($watermarkResult['success']) {
            // Update product with live photo verification
            if ($productId > 0) {
                $query = "UPDATE products SET live_photo_verified = TRUE, 
                         live_photo_hash = :hash, watermark_applied = TRUE 
                         WHERE id = :id AND seller_id = :seller_id";
                $stmt = $db->prepare($query);
                $hash = md5_file($imagePath);
                $stmt->bindParam(':hash', $hash);
                $stmt->bindParam(':id', $productId);
                $stmt->bindParam(':seller_id', $userId);
                $stmt->execute();
            }

            echo json_encode([
                'success' => true,
                'message' => 'Live photo verified successfully',
                'verification' => $verification,
                'watermarked_image' => $watermarkResult['watermarked_path']
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to apply watermark',
                'verification' => $verification
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Photo verification failed - please take a live photo',
            'verification' => $verification
        ]);
    }
    exit();
}

// Comprehensive Fraud Check
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'fraud_check') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $productData = $input['product_data'] ?? [];

    if (empty($productData)) {
        echo json_encode(['success' => false, 'message' => 'Product data required']);
        exit();
    }

    $fraudCheck = $fraudDetection->comprehensiveFraudCheck($productData, $userId);

    echo json_encode([
        'success' => true,
        'fraud_check' => $fraudCheck
    ]);
    exit();
}

// Check Image Authenticity
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'check_image_authenticity') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $imagePath = $input['image_path'] ?? '';

    if (empty($imagePath)) {
        echo json_encode(['success' => false, 'message' => 'Image path required']);
        exit();
    }

    $imageCheck = $fraudDetection->verifyImageAuthenticity($imagePath);
    $aiCheck = $fraudDetection->detectAIGeneratedImage($imagePath);

    echo json_encode([
        'success' => true,
        'authenticity_check' => $imageCheck,
        'ai_detection' => $aiCheck
    ]);
    exit();
}

// Analyze Seller Behavior
if ($method === 'GET' && isset($_GET['seller_behavior'])) {
    $adminId = $auth->getUserIdFromToken();
    if (!$adminId || !$auth->isAdmin($adminId)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $sellerId = $_GET['seller_id'] ?? 0;

    if ($sellerId == 0) {
        echo json_encode(['success' => false, 'message' => 'Seller ID required']);
        exit();
    }

    $behaviorAnalysis = $fraudDetection->analyzeSellerBehavior($sellerId);

    echo json_encode([
        'success' => true,
        'behavior_analysis' => $behaviorAnalysis
    ]);
    exit();
}

// Get Fraud Detection Logs
if ($method === 'GET' && isset($_GET['fraud_logs'])) {
    $adminId = $auth->getUserIdFromToken();
    if (!$adminId || !$auth->isAdmin($adminId)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $entityType = $_GET['entity_type'] ?? null;
    $severity = $_GET['severity'] ?? null;
    $limit = $_GET['limit'] ?? 50;

    $query = "SELECT fdl.*, u.name as reviewed_by_name 
              FROM fraud_detection_logs fdl
              LEFT JOIN users u ON fdl.reviewed_by = u.id
              WHERE 1=1";
    
    if ($entityType) {
        $query .= " AND fdl.entity_type = :entity_type";
    }
    if ($severity) {
        $query .= " AND fdl.severity = :severity";
    }
    
    $query .= " ORDER BY fdl.created_at DESC LIMIT :limit";

    $stmt = $db->prepare($query);
    if ($entityType) $stmt->bindParam(':entity_type', $entityType);
    if ($severity) $stmt->bindParam(':severity', $severity);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($logs as &$log) {
        $log['indicators'] = json_decode($log['indicators'], true);
    }

    echo json_encode(['success' => true, 'data' => $logs]);
    exit();
}

// Mark Fraud Log as Resolved
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'resolve_fraud_log') {
    $adminId = $auth->getUserIdFromToken();
    if (!$adminId || !$auth->isAdmin($adminId)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $logId = $input['log_id'] ?? 0;
    $actionTaken = $input['action_taken'] ?? '';
    $status = $input['status'] ?? 'resolved';

    $query = "UPDATE fraud_detection_logs SET status = :status, action_taken = :action, 
              reviewed_by = :admin_id, reviewed_at = NOW() WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':action', $actionTaken);
    $stmt->bindParam(':admin_id', $adminId);
    $stmt->bindParam(':id', $logId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Fraud log updated']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update fraud log']);
    }
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>
