<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../models/Booking.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$booking = new Booking($db);
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $user = $auth->requireAuth();
        
        if (isset($_GET['user_id'])) {
            $results = $booking->getByUser($_GET['user_id']);
            echo json_encode(['success' => true, 'data' => $results]);
        } elseif (isset($_GET['id'])) {
            $result = $booking->getById($_GET['id']);
            echo json_encode(['success' => true, 'data' => $result]);
        } else {
            echo json_encode(['success' => false, 'message' => 'User ID required']);
        }
        break;
        
    case 'POST':
        $user = $auth->requireAuth();
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data['action']) && $data['action'] === 'create') {
            $data['renter_id'] = $user['id'];
            $bookingId = $booking->create($data);
            if ($bookingId) {
                echo json_encode(['success' => true, 'booking_id' => $bookingId]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create booking']);
            }
        } elseif (isset($data['action']) && $data['action'] === 'update_status') {
            if ($booking->updateStatus($data['id'], $data['status'])) {
                echo json_encode(['success' => true, 'message' => 'Status updated']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update status']);
            }
        } elseif (isset($data['action']) && $data['action'] === 'complete') {
            if ($booking->completeBooking($data['id'])) {
                echo json_encode(['success' => true, 'message' => 'Booking completed']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to complete']);
            }
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>
