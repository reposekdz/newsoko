<?php
class PaymentService {
    private $conn;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function initiateMoMoPayment($bookingId, $userId, $amount, $phoneNumber, $method) {
        $reference = 'PAY-' . time() . '-' . rand(1000, 9999);
        
        $query = "INSERT INTO payments (booking_id, user_id, amount, payment_method, payment_type, 
                  phone_number, status, reference) 
                  VALUES (:booking_id, :user_id, :amount, :method, 'booking', :phone, 'pending', :ref)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':method', $method);
        $stmt->bindParam(':phone', $phoneNumber);
        $stmt->bindParam(':ref', $reference);
        
        if ($stmt->execute()) {
            $paymentId = $this->conn->lastInsertId();
            $transactionId = 'TXN-' . time() . '-' . rand(10000, 99999);
            $this->updatePaymentStatus($paymentId, 'processing', $transactionId);
            return ['success' => true, 'payment_id' => $paymentId, 'reference' => $reference];
        }
        
        return ['success' => false, 'message' => 'Payment initiation failed'];
    }
    
    public function updatePaymentStatus($paymentId, $status, $transactionId = null) {
        $query = "UPDATE payments SET status = :status";
        if ($transactionId) {
            $query .= ", transaction_id = :txn_id";
        }
        if ($status === 'completed') {
            $query .= ", completed_at = NOW()";
        }
        $query .= " WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $paymentId);
        if ($transactionId) {
            $stmt->bindParam(':txn_id', $transactionId);
        }
        
        if ($stmt->execute() && $status === 'completed') {
            $this->processCompletedPayment($paymentId);
        }
        
        return $stmt->execute();
    }
    
    private function processCompletedPayment($paymentId) {
        $query = "SELECT * FROM payments WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $paymentId);
        $stmt->execute();
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($payment) {
            $updateBooking = "UPDATE bookings SET payment_status = 'paid', status = 'confirmed' 
                             WHERE id = :booking_id";
            $stmt = $this->conn->prepare($updateBooking);
            $stmt->bindParam(':booking_id', $payment['booking_id']);
            $stmt->execute();
            
            $this->lockEscrow($payment['booking_id'], $payment['amount']);
        }
    }
    
    private function lockEscrow($bookingId, $amount) {
        $platformFee = $amount * 0.05;
        
        $query = "INSERT INTO escrow (booking_id, amount, status, platform_fee, locked_at) 
                  VALUES (:booking_id, :amount, 'locked', :fee, NOW())";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':fee', $platformFee);
        $stmt->execute();
    }
    
    public function releaseEscrow($bookingId) {
        $query = "SELECT * FROM escrow WHERE booking_id = :booking_id AND status = 'locked'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->execute();
        $escrow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($escrow) {
            $releaseAmount = $escrow['amount'] - $escrow['platform_fee'];
            
            $bookingQuery = "SELECT owner_id FROM bookings WHERE id = :id";
            $stmt = $this->conn->prepare($bookingQuery);
            $stmt->bindParam(':id', $bookingId);
            $stmt->execute();
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $walletQuery = "UPDATE users SET wallet_balance = wallet_balance + :amount WHERE id = :id";
            $stmt = $this->conn->prepare($walletQuery);
            $stmt->bindParam(':amount', $releaseAmount);
            $stmt->bindParam(':id', $booking['owner_id']);
            $stmt->execute();
            
            $updateEscrow = "UPDATE escrow SET status = 'released', released_at = NOW(), 
                            release_to_owner = :amount WHERE id = :id";
            $stmt = $this->conn->prepare($updateEscrow);
            $stmt->bindParam(':amount', $releaseAmount);
            $stmt->bindParam(':id', $escrow['id']);
            $stmt->execute();
            
            return true;
        }
        return false;
    }
}
?>
