<?php
class Booking {
    private $conn;
    private $table = 'bookings';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table . " 
                  (product_id, renter_id, owner_id, booking_type, start_date, end_date, days, total_price, deposit, 
                   status, payment_status, delivery_method, delivery_address, delivery_fee) 
                  VALUES (:product_id, :renter_id, :owner_id, :booking_type, :start_date, :end_date, :days, :total_price, 
                          :deposit, :status, :payment_status, :delivery_method, :delivery_address, :delivery_fee)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':product_id', $data['product_id']);
        $stmt->bindParam(':renter_id', $data['renter_id']);
        $stmt->bindParam(':owner_id', $data['owner_id']);
        $stmt->bindParam(':booking_type', $data['booking_type']);
        $stmt->bindParam(':start_date', $data['start_date']);
        $stmt->bindParam(':end_date', $data['end_date']);
        $stmt->bindParam(':days', $data['days']);
        $stmt->bindParam(':total_price', $data['total_price']);
        $stmt->bindParam(':deposit', $data['deposit']);
        $stmt->bindParam(':status', $data['status']);
        $stmt->bindParam(':payment_status', $data['payment_status']);
        $stmt->bindParam(':delivery_method', $data['delivery_method']);
        $stmt->bindParam(':delivery_address', $data['delivery_address']);
        $stmt->bindParam(':delivery_fee', $data['delivery_fee']);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function getByUser($userId) {
        $query = "SELECT b.*, p.title as product_title, p.images as product_images, p.category,
                  u.name as owner_name, u.phone as owner_phone
                  FROM " . $this->table . " b
                  LEFT JOIN products p ON b.product_id = p.id
                  LEFT JOIN users u ON b.owner_id = u.id
                  WHERE b.renter_id = :user_id
                  ORDER BY b.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT b.*, p.title as product_title, p.images as product_images,
                  u.name as owner_name, r.name as renter_name
                  FROM " . $this->table . " b
                  LEFT JOIN products p ON b.product_id = p.id
                  LEFT JOIN users u ON b.owner_id = u.id
                  LEFT JOIN users r ON b.renter_id = r.id
                  WHERE b.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateStatus($id, $status) {
        $query = "UPDATE " . $this->table . " SET status = :status WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public function completeBooking($id) {
        $query = "UPDATE " . $this->table . " SET status = 'completed', completed_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}
?>
