<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT');
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

// GET - Fetch tracking info
if ($method === 'GET') {
    $bookingId = $_GET['booking_id'] ?? null;
    $trackingNumber = $_GET['tracking_number'] ?? null;
    
    if ($bookingId) {
        $stmt = $db->prepare("SELECT st.*, b.buyer_id, b.seller_id FROM shipping_tracking st JOIN bookings b ON st.booking_id = b.id WHERE st.booking_id = :booking_id AND (b.buyer_id = :user_id OR b.seller_id = :user_id OR :is_admin = TRUE)");
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->bindParam(':user_id', $user['id']);
        $isAdmin = $user['role'] === 'admin';
        $stmt->bindParam(':is_admin', $isAdmin, PDO::PARAM_BOOL);
        $stmt->execute();
        
        $tracking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$tracking) {
            echo json_encode(['success' => false, 'message' => 'Tracking not found']);
            exit();
        }
        
        // Get updates
        $updatesStmt = $db->prepare("SELECT * FROM shipping_updates WHERE tracking_id = :tracking_id ORDER BY timestamp ASC");
        $updatesStmt->bindParam(':tracking_id', $tracking['id']);
        $updatesStmt->execute();
        
        $updates = $updatesStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'tracking' => $tracking, 'updates' => $updates]);
        exit();
    }
    
    if ($trackingNumber) {
        $stmt = $db->prepare("SELECT * FROM shipping_tracking WHERE tracking_number = :tracking_number");
        $stmt->bindParam(':tracking_number', $trackingNumber);
        $stmt->execute();
        
        $tracking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($tracking) {
            $updatesStmt = $db->prepare("SELECT * FROM shipping_updates WHERE tracking_id = :tracking_id ORDER BY timestamp ASC");
            $updatesStmt->bindParam(':tracking_id', $tracking['id']);
            $updatesStmt->execute();
            
            $updates = $updatesStmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'tracking' => $tracking, 'updates' => $updates]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Tracking not found']);
        }
        exit();
    }
}

// POST - Create tracking
if ($method === 'POST') {
    $bookingId = $input['booking_id'] ?? null;
    $carrier = $input['carrier'] ?? null;
    $trackingNumber = $input['tracking_number'] ?? null;
    $estimatedDelivery = $input['estimated_delivery'] ?? null;
    
    // Verify seller or admin
    $checkStmt = $db->prepare("SELECT seller_id FROM bookings WHERE id = :id");
    $checkStmt->bindParam(':id', $bookingId);
    $checkStmt->execute();
    $booking = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$booking || ($booking['seller_id'] != $user['id'] && $user['role'] !== 'admin')) {
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    $stmt = $db->prepare("INSERT INTO shipping_tracking (booking_id, carrier, tracking_number, estimated_delivery, status) VALUES (:booking_id, :carrier, :tracking_number, :estimated_delivery, 'pending')");
    $stmt->bindParam(':booking_id', $bookingId);
    $stmt->bindParam(':carrier', $carrier);
    $stmt->bindParam(':tracking_number', $trackingNumber);
    $stmt->bindParam(':estimated_delivery', $estimatedDelivery);
    $stmt->execute();
    
    $trackingId = $db->lastInsertId();
    
    // Create initial update
    $updateStmt = $db->prepare("INSERT INTO shipping_updates (tracking_id, status, description) VALUES (:tracking_id, 'Shipment created', 'Shipping label created')");
    $updateStmt->bindParam(':tracking_id', $trackingId);
    $updateStmt->execute();
    
    echo json_encode(['success' => true, 'tracking_id' => $trackingId]);
    exit();
}

// PUT - Update tracking
if ($method === 'PUT') {
    $trackingId = $input['tracking_id'] ?? null;
    $status = $input['status'] ?? null;
    $location = $input['location'] ?? null;
    $description = $input['description'] ?? '';
    
    if ($user['role'] !== 'admin') {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    // Update tracking
    $updates = [];
    $params = [':id' => $trackingId];
    
    if ($status) {
        $updates[] = "status = :status";
        $params[':status'] = $status;
        
        if ($status === 'delivered') {
            $updates[] = "actual_delivery = NOW()";
        }
    }
    
    if ($location) {
        $updates[] = "current_location = :location";
        $params[':location'] = $location;
    }
    
    if (!empty($updates)) {
        $query = "UPDATE shipping_tracking SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
    }
    
    // Add update entry
    $updateStmt = $db->prepare("INSERT INTO shipping_updates (tracking_id, status, location, description) VALUES (:tracking_id, :status, :location, :description)");
    $updateStmt->bindParam(':tracking_id', $trackingId);
    $updateStmt->bindParam(':status', $status);
    $updateStmt->bindParam(':location', $location);
    $updateStmt->bindParam(':description', $description);
    $updateStmt->execute();
    
    echo json_encode(['success' => true, 'message' => 'Tracking updated']);
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
