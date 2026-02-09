<?php
class Auth {
    private $conn;
    private $secret_key = "your_secret_key_change_in_production_2025";
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function generateToken($userId) {
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
        
        $query = "INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) 
                  VALUES (:user_id, :token, :ip, :user_agent, :expires_at)";
        $stmt = $this->conn->prepare($query);
        
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':ip', $ip);
        $stmt->bindParam(':user_agent', $userAgent);
        $stmt->bindParam(':expires_at', $expiresAt);
        
        if ($stmt->execute()) {
            return $token;
        }
        return false;
    }
    
    public function validateToken($token) {
        $query = "SELECT s.*, u.* FROM sessions s 
                  JOIN users u ON s.user_id = u.id 
                  WHERE s.token = :token AND s.expires_at > NOW() AND u.account_status = 'active'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result) {
            $this->updateLastLogin($result['user_id']);
            return $result;
        }
        return false;
    }
    
    public function logout($token) {
        $query = "DELETE FROM sessions WHERE token = :token";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':token', $token);
        return $stmt->execute();
    }
    
    private function updateLastLogin($userId) {
        $query = "UPDATE users SET last_login = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
    }
    
    public function requireAuth() {
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? $_GET['token'] ?? null;
        
        if ($token && strpos($token, 'Bearer ') === 0) {
            $token = substr($token, 7);
        }
        
        if (!$token) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Authentication required']);
            exit;
        }
        
        $user = $this->validateToken($token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
            exit;
        }
        
        return $user;
    }
}
?>
