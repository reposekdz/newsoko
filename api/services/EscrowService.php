<?php

class EscrowService {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    // Create escrow transaction when payment is made
    public function createEscrow($bookingId, $amount) {
        // Calculate refund deadline (e.g., 7 days after delivery)
        $refundDeadline = date('Y-m-d H:i:s', strtotime('+7 days'));
        
        $query = "INSERT INTO escrow_transactions (booking_id, amount, status, refund_deadline) 
                 VALUES (:booking_id, :amount, 'held', :deadline)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':deadline', $refundDeadline);
        
        if ($stmt->execute()) {
            $escrowId = $this->db->lastInsertId();
            
            // Update booking
            $query = "UPDATE bookings SET escrow_status = 'held' WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $bookingId);
            $stmt->execute();
            
            $this->logAudit($bookingId, 'escrow_created', $amount);
            return $escrowId;
        }
        return false;
    }
    
    // Step 1: Customer confirms receipt
    public function customerApproval($escrowId, $customerId) {
        // Verify customer owns this booking
        $query = "SELECT e.*, b.renter_id FROM escrow_transactions e 
                 JOIN bookings b ON e.booking_id = b.id 
                 WHERE e.id = :id AND b.renter_id = :customer_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $escrowId);
        $stmt->bindParam(':customer_id', $customerId);
        $stmt->execute();
        $escrow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$escrow) return ['success' => false, 'message' => 'Unauthorized'];
        
        if ($escrow['status'] !== 'held') {
            return ['success' => false, 'message' => 'Invalid escrow status'];
        }
        
        $query = "UPDATE escrow_transactions SET status = 'customer_approved', 
                 customer_approval_at = NOW() WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $escrowId);
        
        if ($stmt->execute()) {
            $this->logAudit($escrow['booking_id'], 'customer_approved_escrow', $escrow['amount']);
            return ['success' => true, 'message' => 'Approval recorded. Waiting for refund period.'];
        }
        return ['success' => false];
    }
    
    // Step 2: Check if refund period has passed (automated)
    public function checkRefundPeriods() {
        $query = "SELECT * FROM escrow_transactions 
                 WHERE status = 'customer_approved' AND refund_deadline < NOW()";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $escrows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($escrows as $escrow) {
            $query = "UPDATE escrow_transactions SET status = 'refund_period_passed' WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $escrow['id']);
            $stmt->execute();
            
            $this->logAudit($escrow['booking_id'], 'refund_period_passed', $escrow['amount']);
        }
        
        return count($escrows);
    }
    
    // Step 3: Admin final approval
    public function adminApproval($escrowId, $adminId) {
        $query = "SELECT * FROM escrow_transactions WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $escrowId);
        $stmt->execute();
        $escrow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$escrow) return ['success' => false, 'message' => 'Escrow not found'];
        
        if ($escrow['status'] !== 'refund_period_passed') {
            return ['success' => false, 'message' => 'Refund period not yet passed'];
        }
        
        $query = "UPDATE escrow_transactions SET status = 'admin_approved', 
                 admin_approved_by = :admin_id, admin_approval_at = NOW() WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':id', $escrowId);
        
        if ($stmt->execute()) {
            // Trigger payment release
            $this->releasePayment($escrowId);
            return ['success' => true, 'message' => 'Payment approved for release'];
        }
        return ['success' => false];
    }
    
    // Release payment to seller
    private function releasePayment($escrowId) {
        $query = "SELECT e.*, b.owner_id, b.id as booking_id FROM escrow_transactions e 
                 JOIN bookings b ON e.booking_id = b.id WHERE e.id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $escrowId);
        $stmt->execute();
        $escrow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$escrow) return false;
        
        // Update escrow status
        $query = "UPDATE escrow_transactions SET status = 'released', release_date = NOW() WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $escrowId);
        $stmt->execute();
        
        // Credit seller wallet
        $query = "UPDATE wallets SET balance = balance + :amount WHERE user_id = :seller_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':amount', $escrow['amount']);
        $stmt->bindParam(':seller_id', $escrow['owner_id']);
        $stmt->execute();
        
        // Record transaction
        $query = "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, 
                 description, reference_type, reference_id) 
                 SELECT id, 'credit', :amount, 'Escrow release', 'booking', :booking_id 
                 FROM wallets WHERE user_id = :seller_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':amount', $escrow['amount']);
        $stmt->bindParam(':booking_id', $escrow['booking_id']);
        $stmt->bindParam(':seller_id', $escrow['owner_id']);
        $stmt->execute();
        
        // Update booking
        $query = "UPDATE bookings SET escrow_status = 'released', 
                 escrow_release_date = NOW() WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $escrow['booking_id']);
        $stmt->execute();
        
        $this->logAudit($escrow['booking_id'], 'escrow_released', $escrow['amount']);
        return true;
    }
    
    // Refund to customer (if dispute or cancellation)
    public function refundEscrow($escrowId, $reason, $adminId) {
        $query = "SELECT e.*, b.renter_id, b.id as booking_id FROM escrow_transactions e 
                 JOIN bookings b ON e.booking_id = b.id WHERE e.id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $escrowId);
        $stmt->execute();
        $escrow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$escrow) return false;
        
        // Update escrow
        $query = "UPDATE escrow_transactions SET status = 'refunded', notes = :reason WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':reason', $reason);
        $stmt->bindParam(':id', $escrowId);
        $stmt->execute();
        
        // Credit customer wallet
        $query = "UPDATE wallets SET balance = balance + :amount WHERE user_id = :customer_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':amount', $escrow['amount']);
        $stmt->bindParam(':customer_id', $escrow['renter_id']);
        $stmt->execute();
        
        // Record transaction
        $query = "INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, 
                 description, reference_type, reference_id) 
                 SELECT id, 'credit', :amount, 'Escrow refund', 'booking', :booking_id 
                 FROM wallets WHERE user_id = :customer_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':amount', $escrow['amount']);
        $stmt->bindParam(':booking_id', $escrow['booking_id']);
        $stmt->bindParam(':customer_id', $escrow['renter_id']);
        $stmt->execute();
        
        // Update booking
        $query = "UPDATE bookings SET escrow_status = 'refunded' WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $escrow['booking_id']);
        $stmt->execute();
        
        $this->logAudit($escrow['booking_id'], 'escrow_refunded', $escrow['amount']);
        return true;
    }
    
    // Get escrow status
    public function getEscrowStatus($bookingId) {
        $query = "SELECT * FROM escrow_transactions WHERE booking_id = :id ORDER BY created_at DESC LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $bookingId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Get pending admin approvals
    public function getPendingApprovals() {
        $query = "SELECT e.*, b.*, u.full_name as seller_name 
                 FROM escrow_transactions e 
                 JOIN bookings b ON e.booking_id = b.id 
                 JOIN users u ON b.owner_id = u.id 
                 WHERE e.status = 'refund_period_passed' 
                 ORDER BY e.refund_deadline ASC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function logAudit($bookingId, $action, $amount) {
        $query = "INSERT INTO audit_logs (action_type, entity_type, entity_id, 
                 new_value, ip_address, severity) 
                 VALUES (:action, 'escrow', :booking_id, :amount, :ip, 'high')";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->bindParam(':amount', $amount);
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $stmt->bindParam(':ip', $ip);
        $stmt->execute();
    }
}
