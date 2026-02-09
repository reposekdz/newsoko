<?php

class MFAService {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    // Enable MFA for user
    public function enableMFA($userId, $method, $phoneOrEmail) {
        $query = "INSERT INTO mfa_settings (user_id, method, is_enabled, phone_number) 
                 VALUES (:user_id, :method, TRUE, :contact)
                 ON DUPLICATE KEY UPDATE method = :method, is_enabled = TRUE, phone_number = :contact";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':method', $method);
        $stmt->bindParam(':contact', $phoneOrEmail);
        
        if ($stmt->execute()) {
            $this->updateUserMFAStatus($userId, true);
            return true;
        }
        return false;
    }
    
    // Generate and send verification code
    public function sendVerificationCode($userId, $method) {
        $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));
        
        // Store code
        $query = "INSERT INTO mfa_verification_codes (user_id, code, method, expires_at) 
                 VALUES (:user_id, :code, :method, :expires_at)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':code', $code);
        $stmt->bindParam(':method', $method);
        $stmt->bindParam(':expires_at', $expiresAt);
        
        if (!$stmt->execute()) return false;
        
        // Get contact info
        $query = "SELECT phone_number FROM mfa_settings WHERE user_id = :user_id AND method = :method";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':method', $method);
        $stmt->execute();
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($method === 'sms') {
            return $this->sendSMS($settings['phone_number'], $code);
        } else {
            $query = "SELECT email FROM users WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $userId);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            return $this->sendEmail($user['email'], $code);
        }
    }
    
    // Verify MFA code
    public function verifyCode($userId, $code) {
        $query = "SELECT * FROM mfa_verification_codes 
                 WHERE user_id = :user_id AND code = :code 
                 AND expires_at > NOW() AND is_used = FALSE 
                 ORDER BY created_at DESC LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':code', $code);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result) {
            // Mark as used
            $query = "UPDATE mfa_verification_codes SET is_used = TRUE WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $result['id']);
            $stmt->execute();
            return true;
        }
        return false;
    }
    
    // Check if MFA is required
    public function isMFARequired($userId) {
        $query = "SELECT is_enabled FROM mfa_settings WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result && $result['is_enabled'];
    }
    
    private function sendSMS($phone, $code) {
        // Integration with SMS provider (e.g., Twilio, Africa's Talking)
        // For Rwanda: Use Africa's Talking or local SMS gateway
        $message = "Newsoko: Kode yawe ni $code. Ntuzayisangize n'umuntu.";
        
        // Example: Africa's Talking API
        $apiKey = getenv('AFRICASTALKING_API_KEY');
        $username = getenv('AFRICASTALKING_USERNAME');
        
        if (!$apiKey || !$username) return false;
        
        $url = "https://api.africastalking.com/version1/messaging";
        $data = [
            'username' => $username,
            'to' => $phone,
            'message' => $message
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apiKey: ' . $apiKey,
            'Content-Type: application/x-www-form-urlencoded'
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return $response !== false;
    }
    
    private function sendEmail($email, $code) {
        $subject = "Newsoko - Kode yo kwemeza";
        $message = "Kode yawe yo kwemeza ni: $code\n\nIyi kode izarangira nyuma y'iminota 10.";
        $headers = "From: noreply@newsoko.rw\r\n";
        
        return mail($email, $subject, $message, $headers);
    }
    
    private function updateUserMFAStatus($userId, $status) {
        $query = "UPDATE users SET mfa_enabled = :status WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':status', $status, PDO::PARAM_BOOL);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
    }
}
