<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    $auth = new Auth($db);
    \$user = \$auth->requireAuth();
    
    switch($method) {
        case 'GET':
            $stmt = $db->prepare("SELECT d.*, b.product_id, p.title as product_title 
                                 FROM disputes d 
                                 JOIN bookings b ON d.booking_id = b.id 
                                 JOIN products p ON b.product_id = p.id 
                                 WHERE d.complainant_id = ? OR d.respondent_id = ? 
                                 ORDER BY d.created_at DESC");
            $stmt->execute([$user['id'], $user['id']]);
            $disputes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $disputes]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            $db->beginTransaction();
            
            // Get booking details
            $stmt = $db->prepare("SELECT * FROM bookings WHERE id = ?");
            $stmt->execute([$data['booking_id']]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $respondentId = ($booking['user_id'] == $user['id']) ? $booking['owner_id'] : $booking['user_id'];
            
            $stmt = $db->prepare("INSERT INTO disputes 
                                 (booking_id, complainant_id, respondent_id, reason, description, evidence) 
                                 VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['booking_id'],
                $user['id'],
                $respondentId,
                $data['reason'],
                $data['description'],
                json_encode($data['evidence'] ?? [])
            ]);
            
            // Notify respondent
            $stmt = $db->prepare("INSERT INTO notifications (user_id, type, title, message, related_id) 
                                 VALUES (?, 'dispute', 'New Dispute', 'A dispute has been filed against you', ?)");
            $stmt->execute([$respondentId, $db->lastInsertId()]);
            
            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Dispute filed']);
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            
            $db->beginTransaction();
            
            $stmt = $db->prepare("UPDATE disputes SET status = ?, resolution = ?, resolved_at = NOW() 
                                 WHERE id = ?");
            $stmt->execute([$data['status'], $data['resolution'], $data['dispute_id']]);
            
            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Dispute updated']);
            break;
    }
} catch(Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
