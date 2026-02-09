<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../middleware/Auth.php';
require_once '../services/PaymentService.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);
$paymentService = new PaymentService($db);

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'POST':
            $user = $auth->requireAuth();
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (isset($data['action']) && $data['action'] === 'create_booking') {
                $db->beginTransaction();
                
                try {
                    // Create booking
                    $query = "INSERT INTO bookings (product_id, renter_id, owner_id, booking_type, start_date, end_date, days, 
                              total_price, deposit, service_fee, status, payment_status, escrow_status, delivery_method, 
                              delivery_address, delivery_fee, notes)
                              VALUES (:product_id, :renter_id, :owner_id, :booking_type, :start_date, :end_date, :days,
                              :total_price, :deposit, :service_fee, 'pending', 'pending', 'pending', :delivery_method,
                              :delivery_address, :delivery_fee, :notes)";
                    
                    $stmt = $db->prepare($query);
                    $serviceFee = $data['total_price'] * 0.05;
                    
                    $stmt->bindParam(':product_id', $data['product_id']);
                    $stmt->bindParam(':renter_id', $user['id']);
                    $stmt->bindParam(':owner_id', $data['owner_id']);
                    $stmt->bindParam(':booking_type', $data['booking_type']);
                    $stmt->bindParam(':start_date', $data['start_date']);
                    $stmt->bindParam(':end_date', $data['end_date']);
                    $stmt->bindParam(':days', $data['days']);
                    $stmt->bindParam(':total_price', $data['total_price']);
                    $stmt->bindParam(':deposit', $data['deposit']);
                    $stmt->bindParam(':service_fee', $serviceFee);
                    $stmt->bindParam(':delivery_method', $data['delivery_method']);
                    $stmt->bindParam(':delivery_address', $data['delivery_address']);
                    $stmt->bindParam(':delivery_fee', $data['delivery_fee']);
                    $stmt->bindParam(':notes', $data['notes']);
                    $stmt->execute();
                    
                    $bookingId = $db->lastInsertId();
                    
                    // Create notification for owner
                    $notifQuery = "INSERT INTO notifications (user_id, type, title, message, link)
                                   VALUES (:user_id, 'booking', :title, :message, :link)";
                    $stmt = $db->prepare($notifQuery);
                    $title = 'New Booking Request';
                    $message = 'You have a new booking request for your product';
                    $link = '/bookings/' . $bookingId;
                    $stmt->bindParam(':user_id', $data['owner_id']);
                    $stmt->bindParam(':title', $title);
                    $stmt->bindParam(':message', $message);
                    $stmt->bindParam(':link', $link);
                    $stmt->execute();
                    
                    // Log activity
                    $activityQuery = "INSERT INTO activity_logs (user_id, activity_type, entity_type, entity_id)
                                     VALUES (:user_id, 'booking', 'booking', :booking_id)";
                    $stmt = $db->prepare($activityQuery);
                    $stmt->bindParam(':user_id', $user['id']);
                    $stmt->bindParam(':booking_id', $bookingId);
                    $stmt->execute();
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'booking_id' => $bookingId]);
                    
                } catch (Exception $e) {
                    $db->rollBack();
                    throw $e;
                }
                
            } elseif (isset($data['action']) && $data['action'] === 'confirm_payment') {
                $db->beginTransaction();
                
                try {
                    // Update booking payment status
                    $query = "UPDATE bookings SET payment_status = 'paid', status = 'confirmed', confirmed_at = NOW()
                              WHERE id = :booking_id AND renter_id = :user_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':booking_id', $data['booking_id']);
                    $stmt->bindParam(':user_id', $user['id']);
                    $stmt->execute();
                    
                    // Get booking details
                    $bookingQuery = "SELECT * FROM bookings WHERE id = :id";
                    $stmt = $db->prepare($bookingQuery);
                    $stmt->bindParam(':id', $data['booking_id']);
                    $stmt->execute();
                    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Create escrow
                    $escrowQuery = "INSERT INTO escrow (booking_id, amount, status, platform_fee, locked_at)
                                   VALUES (:booking_id, :amount, 'locked', :fee, NOW())";
                    $stmt = $db->prepare($escrowQuery);
                    $platformFee = $booking['total_price'] * 0.05;
                    $stmt->bindParam(':booking_id', $data['booking_id']);
                    $stmt->bindParam(':amount', $booking['total_price']);
                    $stmt->bindParam(':fee', $platformFee);
                    $stmt->execute();
                    
                    // Update product availability if purchase
                    if ($booking['booking_type'] === 'purchase') {
                        $updateProduct = "UPDATE products SET is_available = 0 WHERE id = :id";
                        $stmt = $db->prepare($updateProduct);
                        $stmt->bindParam(':id', $booking['product_id']);
                        $stmt->execute();
                    }
                    
                    // Notify owner
                    $notifQuery = "INSERT INTO notifications (user_id, type, title, message, link)
                                   VALUES (:user_id, 'payment', :title, :message, :link)";
                    $stmt = $db->prepare($notifQuery);
                    $title = 'Payment Received';
                    $message = 'Payment confirmed for booking #' . $data['booking_id'];
                    $link = '/bookings/' . $data['booking_id'];
                    $stmt->bindParam(':user_id', $booking['owner_id']);
                    $stmt->bindParam(':title', $title);
                    $stmt->bindParam(':message', $message);
                    $stmt->bindParam(':link', $link);
                    $stmt->execute();
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Payment confirmed']);
                    
                } catch (Exception $e) {
                    $db->rollBack();
                    throw $e;
                }
                
            } elseif (isset($data['action']) && $data['action'] === 'complete_booking') {
                $db->beginTransaction();
                
                try {
                    // Update booking status
                    $query = "UPDATE bookings SET status = 'completed', completed_at = NOW()
                              WHERE id = :booking_id AND (renter_id = :user_id OR owner_id = :user_id)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':booking_id', $data['booking_id']);
                    $stmt->bindParam(':user_id', $user['id']);
                    $stmt->execute();
                    
                    // Release escrow
                    $result = $paymentService->releaseEscrow($data['booking_id']);
                    
                    if ($result) {
                        // Update product availability if rental
                        $bookingQuery = "SELECT * FROM bookings WHERE id = :id";
                        $stmt = $db->prepare($bookingQuery);
                        $stmt->bindParam(':id', $data['booking_id']);
                        $stmt->execute();
                        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
                        
                        if ($booking['booking_type'] === 'rental') {
                            $updateProduct = "UPDATE products SET is_available = 1 WHERE id = :id";
                            $stmt = $db->prepare($updateProduct);
                            $stmt->bindParam(':id', $booking['product_id']);
                            $stmt->execute();
                        }
                        
                        // Notify both parties
                        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, link)
                                       VALUES (:user_id, 'booking', :title, :message, :link)";
                        $stmt = $db->prepare($notifQuery);
                        $title = 'Booking Completed';
                        $message = 'Booking #' . $data['booking_id'] . ' has been completed';
                        $link = '/bookings/' . $data['booking_id'];
                        
                        // Notify renter
                        $stmt->bindParam(':user_id', $booking['renter_id']);
                        $stmt->bindParam(':title', $title);
                        $stmt->bindParam(':message', $message);
                        $stmt->bindParam(':link', $link);
                        $stmt->execute();
                        
                        // Notify owner
                        $stmt->bindParam(':user_id', $booking['owner_id']);
                        $stmt->execute();
                        
                        $db->commit();
                        echo json_encode(['success' => true, 'message' => 'Booking completed']);
                    } else {
                        throw new Exception('Failed to release escrow');
                    }
                    
                } catch (Exception $e) {
                    $db->rollBack();
                    throw $e;
                }
                
            } elseif (isset($data['action']) && $data['action'] === 'cancel_booking') {
                $db->beginTransaction();
                
                try {
                    // Update booking status
                    $query = "UPDATE bookings SET status = 'cancelled'
                              WHERE id = :booking_id AND (renter_id = :user_id OR owner_id = :user_id) AND status = 'pending'";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':booking_id', $data['booking_id']);
                    $stmt->bindParam(':user_id', $user['id']);
                    $stmt->execute();
                    
                    if ($stmt->rowCount() > 0) {
                        // Refund if payment was made
                        $bookingQuery = "SELECT * FROM bookings WHERE id = :id";
                        $stmt = $db->prepare($bookingQuery);
                        $stmt->bindParam(':id', $data['booking_id']);
                        $stmt->execute();
                        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
                        
                        if ($booking['payment_status'] === 'paid') {
                            // Update escrow to refunded
                            $escrowQuery = "UPDATE escrow SET status = 'refunded' WHERE booking_id = :booking_id";
                            $stmt = $db->prepare($escrowQuery);
                            $stmt->bindParam(':booking_id', $data['booking_id']);
                            $stmt->execute();
                            
                            // Add to wallet
                            $walletQuery = "UPDATE users SET wallet_balance = wallet_balance + :amount WHERE id = :user_id";
                            $stmt = $db->prepare($walletQuery);
                            $stmt->bindParam(':amount', $booking['total_price']);
                            $stmt->bindParam(':user_id', $booking['renter_id']);
                            $stmt->execute();
                        }
                        
                        $db->commit();
                        echo json_encode(['success' => true, 'message' => 'Booking cancelled']);
                    } else {
                        throw new Exception('Cannot cancel booking');
                    }
                    
                } catch (Exception $e) {
                    $db->rollBack();
                    throw $e;
                }
            }
            break;
            
        case 'GET':
            $user = $auth->requireAuth();
            
            if (isset($_GET['booking_id'])) {
                $query = "SELECT b.*, p.title as product_title, p.images as product_images,
                          u1.name as owner_name, u1.phone as owner_phone,
                          u2.name as renter_name, u2.phone as renter_phone,
                          e.status as escrow_status, e.amount as escrow_amount
                          FROM bookings b
                          JOIN products p ON b.product_id = p.id
                          JOIN users u1 ON b.owner_id = u1.id
                          JOIN users u2 ON b.renter_id = u2.id
                          LEFT JOIN escrow e ON b.id = e.booking_id
                          WHERE b.id = :id AND (b.renter_id = :user_id OR b.owner_id = :user_id)";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $_GET['booking_id']);
                $stmt->bindParam(':user_id', $user['id']);
                $stmt->execute();
                $booking = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($booking) {
                    $booking['product_images'] = json_decode($booking['product_images']);
                    echo json_encode(['success' => true, 'data' => $booking]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Booking not found']);
                }
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
