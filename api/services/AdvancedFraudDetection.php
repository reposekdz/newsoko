<?php

class AdvancedFraudDetection {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    // Detect velocity spikes (unusual high-value transactions)
    public function detectVelocitySpike($userId, $amount, $timeWindow = 3600) {
        $riskScore = 0;
        $flags = [];
        
        // Check transaction volume in last hour
        $query = "SELECT COUNT(*) as count, SUM(amount) as total 
                 FROM payments 
                 WHERE user_id = :user_id 
                 AND created_at > DATE_SUB(NOW(), INTERVAL :window SECOND)
                 AND status = 'completed'";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':window', $timeWindow);
        $stmt->execute();
        $velocity = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // High transaction count
        if ($velocity['count'] > 5) {
            $riskScore += 40;
            $flags[] = 'High transaction velocity: ' . $velocity['count'] . ' transactions in 1 hour';
        }
        
        // High transaction value
        if ($velocity['total'] > 1000000) { // 1M RWF
            $riskScore += 50;
            $flags[] = 'High value velocity: ' . number_format($velocity['total']) . ' RWF in 1 hour';
        }
        
        // Sudden spike compared to average
        $avgQuery = "SELECT AVG(daily_total) as avg_daily FROM (
                    SELECT DATE(created_at) as date, SUM(amount) as daily_total 
                    FROM payments 
                    WHERE user_id = :user_id 
                    AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY DATE(created_at)
                ) as daily_stats";
        $stmt = $this->db->prepare($avgQuery);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $avgData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($avgData['avg_daily'] && $velocity['total'] > ($avgData['avg_daily'] * 5)) {
            $riskScore += 60;
            $flags[] = 'Velocity spike: 5x above average daily volume';
        }
        
        return [
            'risk_score' => $riskScore,
            'risk_level' => $this->getRiskLevel($riskScore),
            'flags' => $flags,
            'velocity_data' => $velocity
        ];
    }
    
    // Detect synthetic identity (fake/stolen identity)
    public function detectSyntheticIdentity($userId) {
        $riskScore = 0;
        $flags = [];
        
        // Get user data
        $query = "SELECT u.*, sv.* FROM users u 
                 LEFT JOIN seller_verifications sv ON u.id = sv.user_id 
                 WHERE u.id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) return ['risk_score' => 100, 'flags' => ['User not found']];
        
        // Check 1: Email pattern analysis
        if (preg_match('/^[a-z]+\d{4,}@/', $user['email'])) {
            $riskScore += 20;
            $flags[] = 'Suspicious email pattern (name + numbers)';
        }
        
        // Check 2: Phone number validation
        if (!preg_match('/^(\+250|0)(78|79|72|73)\d{7}$/', $user['phone'])) {
            $riskScore += 15;
            $flags[] = 'Invalid Rwanda phone number format';
        }
        
        // Check 3: Rapid account creation and activity
        $accountAge = strtotime('now') - strtotime($user['created_at']);
        $activityQuery = "SELECT COUNT(*) as activity_count FROM (
                         SELECT id FROM products WHERE seller_id = :id
                         UNION ALL
                         SELECT id FROM bookings WHERE renter_id = :id
                         ) as activities";
        $stmt = $this->db->prepare($activityQuery);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $activity = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($accountAge < 86400 && $activity['activity_count'] > 3) { // < 1 day, > 3 activities
            $riskScore += 40;
            $flags[] = 'Rapid activity on new account';
        }
        
        // Check 4: Verification document analysis
        if ($user['verification_status'] === 'pending' || !$user['verification_status']) {
            $riskScore += 30;
            $flags[] = 'No verified identity documents';
        }
        
        // Check 5: Multiple accounts from same device/IP
        $duplicateQuery = "SELECT COUNT(DISTINCT user_id) as count FROM analytics_events 
                          WHERE ip_address = (SELECT ip_address FROM analytics_events 
                          WHERE user_id = :id ORDER BY created_at DESC LIMIT 1)
                          AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $stmt = $this->db->prepare($duplicateQuery);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $duplicate = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($duplicate['count'] > 3) {
            $riskScore += 35;
            $flags[] = 'Multiple accounts from same IP address';
        }
        
        // Check 6: Inconsistent location data
        if ($user['gps_latitude'] && $user['location_province']) {
            // Check if GPS matches province (simplified)
            $locationMismatch = false; // Implement actual GPS validation
            if ($locationMismatch) {
                $riskScore += 25;
                $flags[] = 'GPS location does not match stated address';
            }
        }
        
        // Log if high risk
        if ($riskScore > 50) {
            $this->logFraudDetection('user', $userId, 'synthetic_identity', $riskScore, $flags);
        }
        
        return [
            'risk_score' => $riskScore,
            'risk_level' => $this->getRiskLevel($riskScore),
            'flags' => $flags,
            'recommendation' => $riskScore > 70 ? 'block' : ($riskScore > 40 ? 'manual_review' : 'allow')
        ];
    }
    
    // Detect payment fraud patterns
    public function detectPaymentFraud($paymentData) {
        $riskScore = 0;
        $flags = [];
        
        // Check 1: Amount anomaly
        if ($paymentData['amount'] > 5000000) { // > 5M RWF
            $riskScore += 30;
            $flags[] = 'Unusually high payment amount';
        }
        
        // Check 2: Rapid payment attempts
        $query = "SELECT COUNT(*) as count FROM payments 
                 WHERE user_id = :user_id 
                 AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                 AND status IN ('pending', 'failed')";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $paymentData['user_id']);
        $stmt->execute();
        $attempts = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($attempts['count'] > 3) {
            $riskScore += 40;
            $flags[] = 'Multiple payment attempts in short time';
        }
        
        // Check 3: Failed payment history
        $failQuery = "SELECT COUNT(*) as fail_count FROM payments 
                     WHERE user_id = :user_id 
                     AND status = 'failed'
                     AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $stmt = $this->db->prepare($failQuery);
        $stmt->bindParam(':user_id', $paymentData['user_id']);
        $stmt->execute();
        $failures = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($failures['fail_count'] > 5) {
            $riskScore += 35;
            $flags[] = 'High payment failure rate';
        }
        
        // Check 4: Phone number mismatch
        $userQuery = "SELECT phone FROM users WHERE id = :id";
        $stmt = $this->db->prepare($userQuery);
        $stmt->bindParam(':id', $paymentData['user_id']);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && $user['phone'] !== $paymentData['phone_number']) {
            $riskScore += 25;
            $flags[] = 'Payment phone number does not match account';
        }
        
        return [
            'risk_score' => $riskScore,
            'risk_level' => $this->getRiskLevel($riskScore),
            'flags' => $flags,
            'action' => $riskScore > 70 ? 'block' : ($riskScore > 40 ? 'verify' : 'proceed')
        ];
    }
    
    // Comprehensive fraud check for transactions
    public function comprehensiveTransactionCheck($userId, $amount, $paymentData) {
        $velocityCheck = $this->detectVelocitySpike($userId, $amount);
        $identityCheck = $this->detectSyntheticIdentity($userId);
        $paymentCheck = $this->detectPaymentFraud($paymentData);
        
        $totalRisk = ($velocityCheck['risk_score'] + $identityCheck['risk_score'] + $paymentCheck['risk_score']) / 3;
        $allFlags = array_merge($velocityCheck['flags'], $identityCheck['flags'], $paymentCheck['flags']);
        
        // Log high-risk transactions
        if ($totalRisk > 60) {
            $this->logFraudDetection('payment', 0, 'high_risk_transaction', $totalRisk, $allFlags);
        }
        
        return [
            'overall_risk_score' => $totalRisk,
            'risk_level' => $this->getRiskLevel($totalRisk),
            'velocity_check' => $velocityCheck,
            'identity_check' => $identityCheck,
            'payment_check' => $paymentCheck,
            'all_flags' => $allFlags,
            'recommendation' => $totalRisk > 70 ? 'block_transaction' : ($totalRisk > 50 ? 'manual_approval' : 'auto_approve')
        ];
    }
    
    private function getRiskLevel($score) {
        if ($score >= 70) return 'critical';
        if ($score >= 50) return 'high';
        if ($score >= 30) return 'medium';
        return 'low';
    }
    
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
}
