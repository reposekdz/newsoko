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

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// GET - Get active promo codes
if ($method === 'GET') {
    if (isset($_GET['active'])) {
        $stmt = $db->prepare("SELECT * FROM promotional_campaigns WHERE is_active = TRUE AND start_date <= NOW() AND end_date >= NOW() ORDER BY created_at DESC");
        $stmt->execute();
        $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'campaigns' => $campaigns]);
        exit();
    }
}

// POST - Validate or apply promo code
if ($method === 'POST') {
    $action = $input['action'] ?? '';
    
    if ($action === 'validate') {
        $code = $input['code'] ?? '';
        $amount = floatval($input['amount'] ?? 0);
        
        $stmt = $db->prepare("SELECT * FROM promotional_campaigns WHERE code = :code AND is_active = TRUE AND start_date <= NOW() AND end_date >= NOW()");
        $stmt->bindParam(':code', $code);
        $stmt->execute();
        $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$campaign) {
            echo json_encode(['success' => false, 'message' => 'Invalid or expired promo code']);
            exit();
        }
        
        // Check usage limit
        if ($campaign['usage_limit'] && $campaign['usage_count'] >= $campaign['usage_limit']) {
            echo json_encode(['success' => false, 'message' => 'Promo code usage limit reached']);
            exit();
        }
        
        // Check minimum purchase
        if ($amount < floatval($campaign['min_purchase_amount'])) {
            echo json_encode(['success' => false, 'message' => 'Minimum purchase amount not met: ' . $campaign['min_purchase_amount'] . ' RWF']);
            exit();
        }
        
        // Calculate discount
        $discount = 0;
        if ($campaign['discount_type'] === 'percentage') {
            $discount = ($amount * floatval($campaign['discount_value'])) / 100;
            if ($campaign['max_discount_amount']) {
                $discount = min($discount, floatval($campaign['max_discount_amount']));
            }
        } elseif ($campaign['discount_type'] === 'fixed_amount') {
            $discount = floatval($campaign['discount_value']);
        }
        
        echo json_encode([
            'success' => true,
            'campaign' => $campaign,
            'discount_amount' => $discount,
            'final_amount' => max(0, $amount - $discount)
        ]);
        exit();
    }
    
    if ($action === 'apply') {
        $user = \$auth->requireAuth();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit();
        }
        
        $code = $input['code'] ?? '';
        $bookingId = $input['booking_id'] ?? null;
        
        $stmt = $db->prepare("SELECT * FROM promotional_campaigns WHERE code = :code AND is_active = TRUE AND start_date <= NOW() AND end_date >= NOW()");
        $stmt->bindParam(':code', $code);
        $stmt->execute();
        $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$campaign) {
            echo json_encode(['success' => false, 'message' => 'Invalid promo code']);
            exit();
        }
        
        // Check user usage limit
        $usageStmt = $db->prepare("SELECT COUNT(*) as count FROM promo_code_usage WHERE campaign_id = :campaign_id AND user_id = :user_id");
        $usageStmt->bindParam(':campaign_id', $campaign['id']);
        $usageStmt->bindParam(':user_id', $user['id']);
        $usageStmt->execute();
        $usage = $usageStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($usage['count'] >= $campaign['user_limit']) {
            echo json_encode(['success' => false, 'message' => 'You have already used this promo code']);
            exit();
        }
        
        // Get booking amount
        $bookingStmt = $db->prepare("SELECT total_amount FROM bookings WHERE id = :booking_id");
        $bookingStmt->bindParam(':booking_id', $bookingId);
        $bookingStmt->execute();
        $booking = $bookingStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$booking) {
            echo json_encode(['success' => false, 'message' => 'Booking not found']);
            exit();
        }
        
        $amount = floatval($booking['total_amount']);
        
        // Calculate discount
        $discount = 0;
        if ($campaign['discount_type'] === 'percentage') {
            $discount = ($amount * floatval($campaign['discount_value'])) / 100;
            if ($campaign['max_discount_amount']) {
                $discount = min($discount, floatval($campaign['max_discount_amount']));
            }
        } elseif ($campaign['discount_type'] === 'fixed_amount') {
            $discount = floatval($campaign['discount_value']);
        }
        
        $db->beginTransaction();
        
        try {
            // Record usage
            $insertStmt = $db->prepare("INSERT INTO promo_code_usage (campaign_id, user_id, booking_id, discount_amount) VALUES (:campaign_id, :user_id, :booking_id, :discount)");
            $insertStmt->bindParam(':campaign_id', $campaign['id']);
            $insertStmt->bindParam(':user_id', $user['id']);
            $insertStmt->bindParam(':booking_id', $bookingId);
            $insertStmt->bindParam(':discount', $discount);
            $insertStmt->execute();
            
            // Update campaign usage count
            $updateStmt = $db->prepare("UPDATE promotional_campaigns SET usage_count = usage_count + 1 WHERE id = :id");
            $updateStmt->bindParam(':id', $campaign['id']);
            $updateStmt->execute();
            
            // Update booking
            $finalAmount = max(0, $amount - $discount);
            $updateBookingStmt = $db->prepare("UPDATE bookings SET discount_amount = :discount, total_amount = :final_amount, promo_code = :code WHERE id = :booking_id");
            $updateBookingStmt->bindParam(':discount', $discount);
            $updateBookingStmt->bindParam(':final_amount', $finalAmount);
            $updateBookingStmt->bindParam(':code', $code);
            $updateBookingStmt->bindParam(':booking_id', $bookingId);
            $updateBookingStmt->execute();
            
            $db->commit();
            
            echo json_encode(['success' => true, 'discount_amount' => $discount, 'final_amount' => $finalAmount]);
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => 'Failed to apply promo code']);
        }
        exit();
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
