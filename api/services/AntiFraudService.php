<?php

class AntiFraudService {
    private $db;
    private $maxAttemptsPerHour = 5;
    private $maxFailedAttempts = 3;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    // Check if payment should be blocked
    public function checkPaymentAttempt($userId, $ipAddress, $cardFingerprint, $amount) {
        $risks = [];
        $riskScore = 0;
        
        // 1. Check IP-based attempts
        $ipAttempts = $this->getRecentAttempts('ip', $ipAddress);
        if ($ipAttempts >= $this->maxAttemptsPerHour) {
            $risks[] = 'Too many attempts from IP';
            $riskScore += 40;
        }
        
        // 2. Check user-based attempts
        if ($userId) {
            $userAttempts = $this->getRecentAttempts('user', $userId);
            if ($userAttempts >= $this->maxAttemptsPerHour) {
                $risks[] = 'Too many attempts from user';
                $riskScore += 30;
            }
        }
        
        // 3. Check card testing pattern (multiple cards, small amounts)
        if ($amount < 1000) { // Small test amount
            $recentCards = $this->getRecentCardAttempts($userId, $ipAddress);
            if ($recentCards >= 3) {
                $risks[] = 'Card testing pattern detected';
                $riskScore += 50;
                $this->blockEntity('ip', $ipAddress, 'Card testing detected', 24);
            }
        }
        
        // 4. Check failed attempts
        $failedAttempts = $this->getFailedAttempts($userId, $ipAddress);
        if ($failedAttempts >= $this->maxFailedAttempts) {
            $risks[] = 'Multiple failed attempts';
            $riskScore += 35;
        }
        
        // 5. Check if already blocked
        if ($this->isBlocked('ip', $ipAddress)) {
            $risks[] = 'IP address blocked';
            $riskScore = 100;
        }
        
        if ($userId && $this->isBlocked('user', $userId)) {
            $risks[] = 'User account blocked';
            $riskScore = 100;
        }
        
        if ($cardFingerprint && $this->isBlocked('card', $cardFingerprint)) {
            $risks[] = 'Card blocked';
            $riskScore = 100;
        }
        
        // 6. Check velocity (rapid transactions)
        $velocity = $this->checkVelocity($userId, $ipAddress);
        if ($velocity > 5) {
            $risks[] = 'Suspicious transaction velocity';
            $riskScore += 25;
        }
        
        return [
            'allowed' => $riskScore < 70,
            'risk_score' => $riskScore,
            'risks' => $risks,
            'action' => $riskScore >= 70 ? 'block' : ($riskScore >= 40 ? 'review' : 'allow')
        ];
    }
    
    // Log payment attempt
    public function logPaymentAttempt($userId, $ipAddress, $cardFingerprint, $amount, $status, $failureReason = null) {
        $deviceFingerprint = $this->generateDeviceFingerprint();
        
        $query = "INSERT INTO payment_attempts (user_id, ip_address, card_fingerprint, amount, 
                 status, failure_reason, device_fingerprint) 
                 VALUES (:user_id, :ip, :card, :amount, :status, :reason, :device)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':ip', $ipAddress);
        $stmt->bindParam(':card', $cardFingerprint);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':reason', $failureReason);
        $stmt->bindParam(':device', $deviceFingerprint);
        $stmt->execute();
        
        // Auto-block if too many failures
        if ($status === 'failed') {
            $failedCount = $this->getFailedAttempts($userId, $ipAddress);
            if ($failedCount >= $this->maxFailedAttempts) {
                $this->blockEntity('ip', $ipAddress, 'Multiple failed payment attempts', 24);
                if ($userId) {
                    $this->blockEntity('user', $userId, 'Multiple failed payment attempts', 24);
                }
            }
        }
    }
    
    // Get recent attempts count
    private function getRecentAttempts($type, $value) {
        $column = $type === 'ip' ? 'ip_address' : 'user_id';
        $query = "SELECT COUNT(*) as count FROM payment_attempts 
                 WHERE $column = :value AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':value', $value);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'];
    }
    
    // Get recent card attempts (different cards)
    private function getRecentCardAttempts($userId, $ipAddress) {
        $query = "SELECT COUNT(DISTINCT card_fingerprint) as count FROM payment_attempts 
                 WHERE (user_id = :user_id OR ip_address = :ip) 
                 AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':ip', $ipAddress);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'];
    }
    
    // Get failed attempts
    private function getFailedAttempts($userId, $ipAddress) {
        $query = "SELECT COUNT(*) as count FROM payment_attempts 
                 WHERE (user_id = :user_id OR ip_address = :ip) 
                 AND status = 'failed' 
                 AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':ip', $ipAddress);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'];
    }
    
    // Check transaction velocity
    private function checkVelocity($userId, $ipAddress) {
        $query = "SELECT COUNT(*) as count FROM payment_attempts 
                 WHERE (user_id = :user_id OR ip_address = :ip) 
                 AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':ip', $ipAddress);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'];
    }
    
    // Block entity
    public function blockEntity($type, $value, $reason, $hours = null) {
        $blockedUntil = $hours ? date('Y-m-d H:i:s', strtotime("+$hours hours")) : null;
        $isPermanent = $hours === null;
        
        $query = "INSERT INTO blocked_entities (entity_type, entity_value, reason, 
                 blocked_until, is_permanent) VALUES (:type, :value, :reason, :until, :permanent)
                 ON DUPLICATE KEY UPDATE reason = :reason, blocked_until = :until, 
                 is_permanent = :permanent";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':value', $value);
        $stmt->bindParam(':reason', $reason);
        $stmt->bindParam(':until', $blockedUntil);
        $stmt->bindParam(':permanent', $isPermanent, PDO::PARAM_BOOL);
        $stmt->execute();
        
        // If blocking user, lock their account
        if ($type === 'user') {
            $query = "UPDATE users SET account_locked = TRUE, locked_reason = :reason, 
                     locked_until = :until WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':reason', $reason);
            $stmt->bindParam(':until', $blockedUntil);
            $stmt->bindParam(':id', $value);
            $stmt->execute();
        }
        
        $this->logAudit($type, $value, 'entity_blocked', $reason);
    }
    
    // Check if entity is blocked
    private function isBlocked($type, $value) {
        $query = "SELECT * FROM blocked_entities 
                 WHERE entity_type = :type AND entity_value = :value 
                 AND (is_permanent = TRUE OR blocked_until > NOW())";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':value', $value);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }
    
    // Unblock entity
    public function unblockEntity($type, $value) {
        $query = "DELETE FROM blocked_entities WHERE entity_type = :type AND entity_value = :value";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':value', $value);
        $stmt->execute();
        
        if ($type === 'user') {
            $query = "UPDATE users SET account_locked = FALSE, locked_reason = NULL, 
                     locked_until = NULL WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $value);
            $stmt->execute();
        }
        
        $this->logAudit($type, $value, 'entity_unblocked', 'Manual unblock');
    }
    
    // Generate device fingerprint
    private function generateDeviceFingerprint() {
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $acceptLanguage = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '';
        $acceptEncoding = $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '';
        
        return md5($userAgent . $acceptLanguage . $acceptEncoding);
    }
    
    // Detect card BIN patterns
    public function validateCardBIN($cardNumber) {
        $bin = substr($cardNumber, 0, 6);
        
        // Check against known fraud BINs (would be in database)
        $query = "SELECT * FROM fraud_card_bins WHERE bin = :bin";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':bin', $bin);
        $stmt->execute();
        
        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            return ['valid' => false, 'reason' => 'Card BIN flagged as high-risk'];
        }
        
        return ['valid' => true];
    }
    
    // Get fraud statistics
    public function getFraudStats($days = 7) {
        $query = "SELECT 
                 COUNT(*) as total_attempts,
                 SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_attempts,
                 SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_attempts,
                 COUNT(DISTINCT ip_address) as unique_ips,
                 COUNT(DISTINCT card_fingerprint) as unique_cards
                 FROM payment_attempts 
                 WHERE created_at > DATE_SUB(NOW(), INTERVAL :days DAY)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':days', $days);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function logAudit($entityType, $entityValue, $action, $reason) {
        $query = "INSERT INTO audit_logs (action_type, entity_type, entity_id, 
                 new_value, ip_address, severity) 
                 VALUES (:action, :entity_type, 0, :reason, :ip, 'critical')";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':entity_type', $entityType);
        $stmt->bindParam(':reason', $reason);
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $stmt->bindParam(':ip', $ip);
        $stmt->execute();
    }
}
