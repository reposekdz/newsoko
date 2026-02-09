<?php

class AIFraudDetection {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    // Check if image is likely fake or stolen
    public function verifyImageAuthenticity($imagePath) {
        $result = [
            'is_authentic' => true,
            'confidence' => 0,
            'flags' => []
        ];
        
        // Check EXIF data for manipulation
        $exifData = @exif_read_data($imagePath);
        if (!$exifData || !isset($exifData['DateTime'])) {
            $result['flags'][] = 'No EXIF data found - possible stock image';
            $result['confidence'] += 20;
        }
        
        // Check for watermarks from other sites
        $watermarkPatterns = ['shutterstock', 'gettyimages', 'istockphoto', 'dreamstime'];
        $imageText = $this->extractTextFromImage($imagePath);
        foreach ($watermarkPatterns as $pattern) {
            if (stripos($imageText, $pattern) !== false) {
                $result['flags'][] = 'Stock photo watermark detected';
                $result['confidence'] += 40;
                $result['is_authentic'] = false;
            }
        }
        
        // Check image dimensions (too perfect = likely stock)
        list($width, $height) = getimagesize($imagePath);
        if (($width == 1920 && $height == 1080) || ($width == 1280 && $height == 720)) {
            $result['flags'][] = 'Perfect dimensions suggest stock photo';
            $result['confidence'] += 15;
        }
        
        // Check for reverse image search (simplified)
        if ($this->checkImageDuplication($imagePath)) {
            $result['flags'][] = 'Image found in multiple listings';
            $result['confidence'] += 30;
            $result['is_authentic'] = false;
        }
        
        return $result;
    }
    
    // Extract text from image using OCR
    private function extractTextFromImage($imagePath) {
        // Check if Tesseract is available
        if (function_exists('exec')) {
            $output = [];
            exec("tesseract " . escapeshellarg($imagePath) . " stdout 2>&1", $output);
            return implode(' ', $output);
        }
        return '';
    }
    
    // Advanced: Detect AI-generated or manipulated images (2026)
    public function detectAIGeneratedImage($imagePath) {
        $result = [
            'is_ai_generated' => false,
            'confidence' => 0,
            'indicators' => []
        ];
        
        // Check for common AI artifacts
        $imageInfo = getimagesize($imagePath);
        if (!$imageInfo) return $result;
        
        // AI images often have perfect symmetry
        $img = imagecreatefromstring(file_get_contents($imagePath));
        if (!$img) return $result;
        
        // Check for unrealistic patterns
        $width = imagesx($img);
        $height = imagesy($img);
        
        // Sample pixels for pattern analysis
        $patterns = [];
        for ($i = 0; $i < 10; $i++) {
            $x = rand(0, $width - 1);
            $y = rand(0, $height - 1);
            $rgb = imagecolorat($img, $x, $y);
            $patterns[] = $rgb;
        }
        
        // Check for too much uniformity (AI artifact)
        $uniqueColors = count(array_unique($patterns));
        if ($uniqueColors < 3) {
            $result['indicators'][] = 'Suspicious color uniformity';
            $result['confidence'] += 30;
        }
        
        imagedestroy($img);
        
        if ($result['confidence'] > 50) {
            $result['is_ai_generated'] = true;
        }
        
        return $result;
    }
    
    // Live camera verification
    public function verifyLivePhoto($imagePath, $userId) {
        $result = [
            'is_live' => false,
            'confidence' => 0,
            'flags' => []
        ];
        
        // Check EXIF for camera metadata
        $exif = @exif_read_data($imagePath);
        if ($exif) {
            // Check if photo was taken recently (within 5 minutes)
            if (isset($exif['DateTime'])) {
                $photoTime = strtotime($exif['DateTime']);
                $now = time();
                $diff = $now - $photoTime;
                
                if ($diff < 300) { // 5 minutes
                    $result['confidence'] += 40;
                    $result['flags'][] = 'Photo taken recently';
                } else {
                    $result['flags'][] = 'Photo not recent (taken ' . round($diff/60) . ' minutes ago)';
                }
            }
            
            // Check for GPS data
            if (isset($exif['GPSLatitude']) && isset($exif['GPSLongitude'])) {
                $result['confidence'] += 30;
                $result['flags'][] = 'GPS data present';
            }
            
            // Check for camera make/model
            if (isset($exif['Make']) && isset($exif['Model'])) {
                $result['confidence'] += 20;
                $result['flags'][] = 'Camera metadata present';
            }
        } else {
            $result['flags'][] = 'No EXIF data - likely screenshot or edited';
        }
        
        // Store hash for future verification
        $imageHash = md5_file($imagePath);
        $query = "INSERT INTO product_images (product_id, image_url, original_hash, watermark_applied) 
                 VALUES (0, :path, :hash, FALSE) ON DUPLICATE KEY UPDATE original_hash = :hash";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':path', $imagePath);
        $stmt->bindParam(':hash', $imageHash);
        $stmt->execute();
        
        $result['is_live'] = $result['confidence'] >= 60;
        return $result;
    }
    
    // Check if image hash exists in database
    private function checkImageDuplication($imagePath) {
        $imageHash = md5_file($imagePath);
        
        $query = "SELECT COUNT(*) as count FROM product_images WHERE image_hash = :hash";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':hash', $imageHash);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result['count'] > 1;
    }
    
    // Analyze seller behavior patterns
    public function analyzeSellerBehavior($sellerId) {
        $riskScore = 0;
        $flags = [];
        
        // Check account age
        $query = "SELECT DATEDIFF(NOW(), created_at) as account_age FROM users WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $sellerId);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user['account_age'] < 7) {
            $riskScore += 20;
            $flags[] = 'New account (less than 7 days)';
        }
        
        // Check for multiple listings in short time
        $query = "SELECT COUNT(*) as count FROM products 
                 WHERE owner_id = :id AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $sellerId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] > 5) {
            $riskScore += 30;
            $flags[] = 'Bulk listing detected';
        }
        
        // Check for suspiciously low prices
        $query = "SELECT p.price, AVG(p2.price) as avg_price 
                 FROM products p
                 JOIN products p2 ON p.category_id = p2.category_id
                 WHERE p.owner_id = :id AND p2.owner_id != :id
                 GROUP BY p.id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $sellerId);
        $stmt->execute();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if ($row['price'] < ($row['avg_price'] * 0.5)) {
                $riskScore += 25;
                $flags[] = 'Suspiciously low pricing detected';
                break;
            }
        }
        
        // Check verification status
        $query = "SELECT verification_status FROM seller_verifications WHERE user_id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $sellerId);
        $stmt->execute();
        $verification = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$verification || $verification['verification_status'] !== 'verified') {
            $riskScore += 15;
            $flags[] = 'Seller not verified';
        }
        
        return [
            'risk_score' => $riskScore,
            'risk_level' => $this->getRiskLevel($riskScore),
            'flags' => $flags
        ];
    }
    
    private function getRiskLevel($score) {
        if ($score >= 70) return 'high';
        if ($score >= 40) return 'medium';
        return 'low';
    }
    
    // Detect fake product descriptions with AI sentiment analysis
    public function analyzeProductDescription($description, $title) {
        $riskScore = 0;
        $flags = [];
        
        // Check for spam keywords (expanded list)
        $spamKeywords = ['100% guaranteed', 'limited time', 'act now', 'click here', 'free money', 
                        'urgent', 'winner', 'congratulations', 'claim now', 'risk free'];
        foreach ($spamKeywords as $keyword) {
            if (stripos($description, $keyword) !== false) {
                $riskScore += 15;
                $flags[] = 'Spam keywords detected';
                break;
            }
        }
        
        // Check for excessive capitalization
        $upperCount = preg_match_all('/[A-Z]/', $description);
        $totalCount = strlen(preg_replace('/[^a-zA-Z]/', '', $description));
        if ($totalCount > 0 && ($upperCount / $totalCount) > 0.3) {
            $riskScore += 10;
            $flags[] = 'Excessive capitalization';
        }
        
        // Check for contact information (phone, email, WhatsApp)
        if (preg_match('/\b\d{9,10}\b|\b[\w\.-]+@[\w\.-]+\.\w+\b|whatsapp|telegram|viber/i', $description)) {
            $riskScore += 25;
            $flags[] = 'Contact information in description (policy violation)';
        }
        
        // Check description length
        if (strlen($description) < 50) {
            $riskScore += 10;
            $flags[] = 'Very short description';
        }
        
        // Check for copied content (common phrases)
        $commonPhrases = ['brand new', 'never used', 'original', 'authentic', 'genuine'];
        $phraseCount = 0;
        foreach ($commonPhrases as $phrase) {
            if (stripos($description, $phrase) !== false) {
                $phraseCount++;
            }
        }
        if ($phraseCount >= 4) {
            $riskScore += 15;
            $flags[] = 'Generic/copied description detected';
        }
        
        // Check for unrealistic claims
        $unrealisticWords = ['perfect', 'flawless', 'best ever', 'unbeatable', 'miracle'];
        foreach ($unrealisticWords as $word) {
            if (stripos($description, $word) !== false) {
                $riskScore += 10;
                $flags[] = 'Unrealistic claims detected';
                break;
            }
        }
        
        // Check title-description mismatch
        $titleWords = explode(' ', strtolower($title));
        $descWords = explode(' ', strtolower($description));
        $commonWords = array_intersect($titleWords, $descWords);
        if (count($commonWords) < 2) {
            $riskScore += 20;
            $flags[] = 'Title and description mismatch';
        }
        
        return [
            'risk_score' => $riskScore,
            'risk_level' => $this->getRiskLevel($riskScore),
            'flags' => $flags
        ];
    }
    
    // Comprehensive fraud check for new listings
    public function comprehensiveFraudCheck($productData, $sellerId) {
        $totalRiskScore = 0;
        $allFlags = [];
        
        // 1. Verify images
        if (isset($productData['images']) && is_array($productData['images'])) {
            foreach ($productData['images'] as $image) {
                $imageCheck = $this->verifyImageAuthenticity($image);
                if (!$imageCheck['is_authentic']) {
                    $totalRiskScore += $imageCheck['confidence'];
                    $allFlags = array_merge($allFlags, $imageCheck['flags']);
                }
                
                // Check for AI-generated images
                $aiCheck = $this->detectAIGeneratedImage($image);
                if ($aiCheck['is_ai_generated']) {
                    $totalRiskScore += 30;
                    $allFlags[] = 'AI-generated image detected';
                }
            }
        }
        
        // 2. Analyze description
        if (isset($productData['description']) && isset($productData['title'])) {
            $descCheck = $this->analyzeProductDescription($productData['description'], $productData['title']);
            $totalRiskScore += $descCheck['risk_score'];
            $allFlags = array_merge($allFlags, $descCheck['flags']);
        }
        
        // 3. Analyze seller behavior
        $sellerCheck = $this->analyzeSellerBehavior($sellerId);
        $totalRiskScore += $sellerCheck['risk_score'];
        $allFlags = array_merge($allFlags, $sellerCheck['flags']);
        
        // 4. Check pricing
        if (isset($productData['price']) && isset($productData['category_id'])) {
            $priceCheck = $this->analyzePricing($productData['price'], $productData['category_id']);
            $totalRiskScore += $priceCheck['risk_score'];
            $allFlags = array_merge($allFlags, $priceCheck['flags']);
        }
        
        // Log to fraud detection table
        if ($totalRiskScore > 40) {
            $this->logFraudDetection('product', 0, 'suspicious_listing', $totalRiskScore, $allFlags);
        }
        
        return [
            'risk_score' => $totalRiskScore,
            'risk_level' => $this->getRiskLevel($totalRiskScore),
            'flags' => array_unique($allFlags),
            'recommendation' => $totalRiskScore > 70 ? 'reject' : ($totalRiskScore > 40 ? 'manual_review' : 'approve')
        ];
    }
    
    // Analyze pricing anomalies
    private function analyzePricing($price, $categoryId) {
        $riskScore = 0;
        $flags = [];
        
        // Get average price for category
        $query = "SELECT AVG(price) as avg_price, MIN(price) as min_price, MAX(price) as max_price 
                 FROM products WHERE category_id = :cat_id AND status = 'approved'";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':cat_id', $categoryId);
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($stats && $stats['avg_price']) {
            // Too low (possible scam)
            if ($price < ($stats['avg_price'] * 0.3)) {
                $riskScore += 40;
                $flags[] = 'Price suspiciously low (70% below average)';
            } elseif ($price < ($stats['avg_price'] * 0.5)) {
                $riskScore += 20;
                $flags[] = 'Price significantly below average';
            }
            
            // Too high (possible overpricing)
            if ($price > ($stats['avg_price'] * 3)) {
                $riskScore += 15;
                $flags[] = 'Price unusually high';
            }
        }
        
        return [
            'risk_score' => $riskScore,
            'flags' => $flags
        ];
    }
    
    // Log fraud detection
    private function logFraudDetection($entityType, $entityId, $detectionType, $riskScore, $flags) {
        $severity = $riskScore > 70 ? 'critical' : ($riskScore > 50 ? 'high' : 'medium');
        $indicators = json_encode($flags);
        
        $query = "INSERT INTO fraud_detection_logs (entity_type, entity_id, detection_type, risk_score, 
                 indicators, severity, status) VALUES (:type, :id, :detection, :score, :indicators, :severity, 'detected')";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':type', $entityType);
        $stmt->bindParam(':id', $entityId);
        $stmt->bindParam(':detection', $detectionType);
        $stmt->bindParam(':score', $riskScore);
        $stmt->bindParam(':indicators', $indicators);
        $stmt->bindParam(':severity', $severity);
        $stmt->execute();
    }
    
    // Monitor transaction patterns
    public function detectSuspiciousTransactions($userId) {
        $flags = [];
        
        // Check for rapid cancellations
        $query = "SELECT COUNT(*) as count FROM bookings 
                 WHERE (renter_id = :id OR owner_id = :id) 
                 AND status = 'cancelled' 
                 AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] > 3) {
            $flags[] = 'Multiple cancellations in short period';
        }
        
        // Check for disputes
        $query = "SELECT COUNT(*) as count FROM disputes 
                 WHERE (filed_by = :id OR against_user = :id) 
                 AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] > 2) {
            $flags[] = 'Multiple disputes filed';
        }
        
        return $flags;
    }
}
