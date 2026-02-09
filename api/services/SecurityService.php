<?php

class SecurityService {
    private $db;
    private $encryptionKey;
    
    public function __construct($database) {
        $this->db = $database;
        $this->encryptionKey = $this->getEncryptionKey();
    }
    
    // ===== DATA ENCRYPTION =====
    
    // Encrypt sensitive data (AES-256-CBC)
    public function encrypt($data) {
        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('AES-256-CBC'));
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $this->encryptionKey, 0, $iv);
        return base64_encode($encrypted . '::' . $iv);
    }
    
    // Decrypt sensitive data
    public function decrypt($encryptedData) {
        list($encrypted, $iv) = explode('::', base64_decode($encryptedData), 2);
        return openssl_decrypt($encrypted, 'AES-256-CBC', $this->encryptionKey, 0, $iv);
    }
    
    // Get or create encryption key
    private function getEncryptionKey() {
        $query = "SELECT encrypted_key FROM encryption_keys WHERE key_name = 'master' AND is_active = TRUE";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            return base64_decode($result['encrypted_key']);
        }
        
        // Generate new key
        $key = openssl_random_pseudo_bytes(32);
        $query = "INSERT INTO encryption_keys (key_name, encrypted_key, algorithm) 
                 VALUES ('master', :key, 'AES-256-CBC')";
        $stmt = $this->db->prepare($query);
        $encodedKey = base64_encode($key);
        $stmt->bindParam(':key', $encodedKey);
        $stmt->execute();
        
        return $key;
    }
    
    // Hash sensitive data (one-way)
    public function hash($data) {
        return hash('sha256', $data . $this->encryptionKey);
    }
    
    // ===== RATE LIMITING =====
    
    // Check rate limit
    public function checkRateLimit($identifier, $endpoint, $maxRequests = 60, $windowMinutes = 1) {
        $windowStart = date('Y-m-d H:i:00', strtotime("-$windowMinutes minutes"));
        
        $query = "SELECT request_count, blocked_until FROM rate_limits 
                 WHERE identifier = :id AND endpoint = :endpoint AND window_start >= :window";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $identifier);
        $stmt->bindParam(':endpoint', $endpoint);
        $stmt->bindParam(':window', $windowStart);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Check if blocked
        if ($result && $result['blocked_until'] && strtotime($result['blocked_until']) > time()) {
            return [
                'allowed' => false,
                'reason' => 'Rate limit exceeded',
                'retry_after' => strtotime($result['blocked_until']) - time()
            ];
        }
        
        // Check request count
        if ($result && $result['request_count'] >= $maxRequests) {
            // Block for 15 minutes
            $blockedUntil = date('Y-m-d H:i:s', strtotime('+15 minutes'));
            $query = "UPDATE rate_limits SET blocked_until = :until WHERE identifier = :id AND endpoint = :endpoint";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':until', $blockedUntil);
            $stmt->bindParam(':id', $identifier);
            $stmt->bindParam(':endpoint', $endpoint);
            $stmt->execute();
            
            return [
                'allowed' => false,
                'reason' => 'Rate limit exceeded',
                'retry_after' => 900
            ];
        }
        
        // Increment counter
        $query = "INSERT INTO rate_limits (identifier, endpoint, request_count, window_start) 
                 VALUES (:id, :endpoint, 1, :window)
                 ON DUPLICATE KEY UPDATE request_count = request_count + 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $identifier);
        $stmt->bindParam(':endpoint', $endpoint);
        $stmt->bindParam(':window', $windowStart);
        $stmt->execute();
        
        return ['allowed' => true, 'remaining' => $maxRequests - ($result['request_count'] ?? 0) - 1];
    }
    
    // ===== IP TRACKING & GEOLOCATION =====
    
    // Track login with geolocation
    public function trackLogin($userId, $ipAddress) {
        $geoData = $this->getGeolocation($ipAddress);
        $deviceInfo = $this->getDeviceInfo();
        $isSuspicious = $this->detectSuspiciousLogin($userId, $ipAddress, $geoData);
        
        $query = "INSERT INTO login_history (user_id, ip_address, country, city, latitude, 
                 longitude, device_type, browser, is_suspicious, risk_score) 
                 VALUES (:user_id, :ip, :country, :city, :lat, :lng, :device, :browser, 
                 :suspicious, :risk)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':ip', $ipAddress);
        $stmt->bindParam(':country', $geoData['country']);
        $stmt->bindParam(':city', $geoData['city']);
        $stmt->bindParam(':lat', $geoData['latitude']);
        $stmt->bindParam(':lng', $geoData['longitude']);
        $stmt->bindParam(':device', $deviceInfo['device']);
        $stmt->bindParam(':browser', $deviceInfo['browser']);
        $stmt->bindParam(':suspicious', $isSuspicious['is_suspicious'], PDO::PARAM_BOOL);
        $stmt->bindParam(':risk', $isSuspicious['risk_score']);
        $stmt->execute();
        
        // Alert user if suspicious
        if ($isSuspicious['is_suspicious']) {
            $this->sendSecurityAlert($userId, $isSuspicious['reasons']);
        }
        
        return $isSuspicious;
    }
    
    // Get geolocation from IP
    private function getGeolocation($ipAddress) {
        // Use free IP geolocation API
        $url = "http://ip-api.com/json/$ipAddress";
        $response = @file_get_contents($url);
        
        if ($response) {
            $data = json_decode($response, true);
            if ($data && $data['status'] === 'success') {
                return [
                    'country' => $data['country'] ?? '',
                    'city' => $data['city'] ?? '',
                    'latitude' => $data['lat'] ?? 0,
                    'longitude' => $data['lon'] ?? 0
                ];
            }
        }
        
        return ['country' => '', 'city' => '', 'latitude' => 0, 'longitude' => 0];
    }
    
    // Detect suspicious login patterns
    private function detectSuspiciousLogin($userId, $ipAddress, $geoData) {
        $riskScore = 0;
        $reasons = [];
        
        // Get last login location
        $query = "SELECT country, city, latitude, longitude, created_at 
                 FROM login_history WHERE user_id = :user_id 
                 ORDER BY created_at DESC LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $lastLogin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($lastLogin) {
            // Check if location changed drastically
            if ($lastLogin['country'] !== $geoData['country']) {
                $timeDiff = time() - strtotime($lastLogin['created_at']);
                
                // Calculate distance
                $distance = $this->calculateDistance(
                    $lastLogin['latitude'], $lastLogin['longitude'],
                    $geoData['latitude'], $geoData['longitude']
                );
                
                // Impossible travel (e.g., 1000km in 1 hour)
                $maxSpeed = 1000; // km/h (airplane speed)
                $requiredTime = $distance / $maxSpeed * 3600; // seconds
                
                if ($timeDiff < $requiredTime && $distance > 100) {
                    $riskScore += 60;
                    $reasons[] = "Impossible travel: {$distance}km in " . round($timeDiff/60) . " minutes";
                } elseif ($lastLogin['country'] !== $geoData['country']) {
                    $riskScore += 30;
                    $reasons[] = "Login from different country: {$geoData['country']}";
                }
            }
        }
        
        // Check if IP is from known VPN/Proxy
        if ($this->isVPNorProxy($ipAddress)) {
            $riskScore += 20;
            $reasons[] = "VPN/Proxy detected";
        }
        
        // Check login frequency
        $query = "SELECT COUNT(*) as count FROM login_history 
                 WHERE user_id = :user_id AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] > 10) {
            $riskScore += 25;
            $reasons[] = "Multiple login attempts";
        }
        
        return [
            'is_suspicious' => $riskScore >= 50,
            'risk_score' => $riskScore,
            'reasons' => $reasons
        ];
    }
    
    // Calculate distance between two coordinates (Haversine formula)
    private function calculateDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371; // km
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $earthRadius * $c;
    }
    
    // Check if IP is VPN/Proxy
    private function isVPNorProxy($ipAddress) {
        // Use VPN detection API (e.g., IPHub, VPNBlocker)
        // For now, simple check
        $vpnRanges = ['10.', '172.16.', '192.168.']; // Private IPs
        foreach ($vpnRanges as $range) {
            if (strpos($ipAddress, $range) === 0) {
                return true;
            }
        }
        return false;
    }
    
    // Get device info from user agent
    private function getDeviceInfo() {
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        $device = 'Unknown';
        if (preg_match('/mobile/i', $userAgent)) $device = 'Mobile';
        elseif (preg_match('/tablet/i', $userAgent)) $device = 'Tablet';
        elseif (preg_match('/windows|mac|linux/i', $userAgent)) $device = 'Desktop';
        
        $browser = 'Unknown';
        if (preg_match('/chrome/i', $userAgent)) $browser = 'Chrome';
        elseif (preg_match('/firefox/i', $userAgent)) $browser = 'Firefox';
        elseif (preg_match('/safari/i', $userAgent)) $browser = 'Safari';
        elseif (preg_match('/edge/i', $userAgent)) $browser = 'Edge';
        
        return ['device' => $device, 'browser' => $browser];
    }
    
    // Send security alert
    private function sendSecurityAlert($userId, $reasons) {
        $query = "SELECT email, full_name FROM users WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $message = "Mwaramutse {$user['full_name']},\n\n";
            $message .= "Twabonye kwinjira mu konti yanyu kuva ahantu hatandukanye:\n\n";
            $message .= implode("\n", $reasons);
            $message .= "\n\nNiba atari wewe, hamagara support@newsoko.rw.";
            
            mail($user['email'], "Newsoko - Umutekano w'Konti", $message, "From: security@newsoko.rw");
        }
    }
    
    // ===== AUDIT LOGGING =====
    
    public function logAudit($userId, $action, $entityType, $entityId, $oldValue, $newValue, $severity = 'low') {
        $query = "INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, 
                 old_value, new_value, ip_address, user_agent, severity) 
                 VALUES (:user_id, :action, :entity_type, :entity_id, :old, :new, :ip, :ua, :severity)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':entity_type', $entityType);
        $stmt->bindParam(':entity_id', $entityId);
        $stmt->bindParam(':old', $oldValue);
        $stmt->bindParam(':new', $newValue);
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $stmt->bindParam(':ip', $ip);
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $stmt->bindParam(':ua', $ua);
        $stmt->bindParam(':severity', $severity);
        $stmt->execute();
    }
    
    // Get audit trail
    public function getAuditTrail($userId = null, $days = 30) {
        $query = "SELECT * FROM audit_logs WHERE 1=1";
        if ($userId) $query .= " AND user_id = :user_id";
        $query .= " AND created_at > DATE_SUB(NOW(), INTERVAL :days DAY) ORDER BY created_at DESC";
        
        $stmt = $this->db->prepare($query);
        if ($userId) $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':days', $days);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
