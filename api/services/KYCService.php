<?php

class KYCService {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    // Submit KYC verification
    public function submitKYC($userId, $data) {
        $query = "INSERT INTO kyc_verifications (user_id, id_type, id_number, id_front_image, 
                 id_back_image, selfie_image, verification_status) 
                 VALUES (:user_id, :id_type, :id_number, :front, :back, :selfie, 'pending')";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':id_type', $data['id_type']);
        $stmt->bindParam(':id_number', $data['id_number']);
        $stmt->bindParam(':front', $data['id_front_image']);
        $stmt->bindParam(':back', $data['id_back_image']);
        $stmt->bindParam(':selfie', $data['selfie_image']);
        
        if ($stmt->execute()) {
            $kycId = $this->db->lastInsertId();
            
            // Perform AI face matching
            $faceMatchScore = $this->performFaceMatch($data['id_front_image'], $data['selfie_image']);
            
            $query = "UPDATE kyc_verifications SET face_match_score = :score WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':score', $faceMatchScore);
            $stmt->bindParam(':id', $kycId);
            $stmt->execute();
            
            // Auto-approve if score is high
            if ($faceMatchScore >= 85) {
                $this->approveKYC($kycId, null, 'auto_approved');
            }
            
            return ['success' => true, 'kyc_id' => $kycId, 'face_match_score' => $faceMatchScore];
        }
        return ['success' => false];
    }
    
    // AI Face Matching using AWS Rekognition or similar
    private function performFaceMatch($idImagePath, $selfieImagePath) {
        // Simple face matching using PHP GD (basic implementation)
        // For production, use AWS Rekognition, Azure Face API, or Google Vision
        
        // Check if images exist
        if (!file_exists($idImagePath) || !file_exists($selfieImagePath)) {
            return 0;
        }
        
        // Basic similarity check using image histograms
        $score = $this->compareImageHistograms($idImagePath, $selfieImagePath);
        
        // For production, use AWS Rekognition:
        // $score = $this->awsRekognitionFaceMatch($idImagePath, $selfieImagePath);
        
        return $score;
    }
    
    // Basic histogram comparison
    private function compareImageHistograms($img1Path, $img2Path) {
        $img1 = imagecreatefromstring(file_get_contents($img1Path));
        $img2 = imagecreatefromstring(file_get_contents($img2Path));
        
        if (!$img1 || !$img2) return 0;
        
        // Resize for comparison
        $size = 100;
        $thumb1 = imagecreatetruecolor($size, $size);
        $thumb2 = imagecreatetruecolor($size, $size);
        
        imagecopyresampled($thumb1, $img1, 0, 0, 0, 0, $size, $size, imagesx($img1), imagesy($img1));
        imagecopyresampled($thumb2, $img2, 0, 0, 0, 0, $size, $size, imagesx($img2), imagesy($img2));
        
        // Compare pixels
        $matches = 0;
        $total = $size * $size;
        
        for ($x = 0; $x < $size; $x++) {
            for ($y = 0; $y < $size; $y++) {
                $rgb1 = imagecolorat($thumb1, $x, $y);
                $rgb2 = imagecolorat($thumb2, $x, $y);
                
                $r1 = ($rgb1 >> 16) & 0xFF;
                $g1 = ($rgb1 >> 8) & 0xFF;
                $b1 = $rgb1 & 0xFF;
                
                $r2 = ($rgb2 >> 16) & 0xFF;
                $g2 = ($rgb2 >> 8) & 0xFF;
                $b2 = $rgb2 & 0xFF;
                
                $diff = abs($r1 - $r2) + abs($g1 - $g2) + abs($b1 - $b2);
                if ($diff < 100) $matches++;
            }
        }
        
        imagedestroy($img1);
        imagedestroy($img2);
        imagedestroy($thumb1);
        imagedestroy($thumb2);
        
        return round(($matches / $total) * 100);
    }
    
    // AWS Rekognition integration (production-ready)
    private function awsRekognitionFaceMatch($sourceImage, $targetImage) {
        // Requires AWS SDK
        // composer require aws/aws-sdk-php
        
        try {
            $client = new Aws\Rekognition\RekognitionClient([
                'version' => 'latest',
                'region' => 'us-east-1',
                'credentials' => [
                    'key' => getenv('AWS_ACCESS_KEY_ID'),
                    'secret' => getenv('AWS_SECRET_ACCESS_KEY')
                ]
            ]);
            
            $result = $client->compareFaces([
                'SourceImage' => ['Bytes' => file_get_contents($sourceImage)],
                'TargetImage' => ['Bytes' => file_get_contents($targetImage)],
                'SimilarityThreshold' => 70
            ]);
            
            if (!empty($result['FaceMatches'])) {
                return $result['FaceMatches'][0]['Similarity'];
            }
        } catch (Exception $e) {
            error_log("AWS Rekognition error: " . $e->getMessage());
        }
        
        return 0;
    }
    
    // Approve KYC
    public function approveKYC($kycId, $adminId, $note = '') {
        $query = "UPDATE kyc_verifications SET verification_status = 'verified', 
                 verified_by = :admin_id, verified_at = NOW() WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':id', $kycId);
        
        if ($stmt->execute()) {
            // Update user status
            $query = "SELECT user_id FROM kyc_verifications WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $kycId);
            $stmt->execute();
            $kyc = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $query = "UPDATE users SET kyc_verified = TRUE, kyc_verified_at = NOW() WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $kyc['user_id']);
            $stmt->execute();
            
            // Log audit
            $this->logAudit($kyc['user_id'], 'kyc_approved', 'kyc_verifications', $kycId, $adminId);
            
            return true;
        }
        return false;
    }
    
    // Reject KYC
    public function rejectKYC($kycId, $adminId, $reason) {
        $query = "UPDATE kyc_verifications SET verification_status = 'rejected', 
                 verified_by = :admin_id, verified_at = NOW(), rejection_reason = :reason WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':admin_id', $adminId);
        $stmt->bindParam(':reason', $reason);
        $stmt->bindParam(':id', $kycId);
        return $stmt->execute();
    }
    
    // Check if user is KYC verified
    public function isKYCVerified($userId) {
        $query = "SELECT kyc_verified FROM users WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result && $result['kyc_verified'];
    }
    
    // Get KYC status
    public function getKYCStatus($userId) {
        $query = "SELECT * FROM kyc_verifications WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function logAudit($userId, $action, $entityType, $entityId, $adminId) {
        $query = "INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, 
                 ip_address, severity) VALUES (:user_id, :action, :entity_type, :entity_id, 
                 :ip, 'high')";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $adminId ?: $userId);
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':entity_type', $entityType);
        $stmt->bindParam(':entity_id', $entityId);
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $stmt->bindParam(':ip', $ip);
        $stmt->execute();
    }
}
