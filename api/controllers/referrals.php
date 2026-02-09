<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$user = $auth->requireAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// GET - Get referral code and stats
if ($method === 'GET') {
    if (isset($_GET['get_code'])) {
        // Get or create referral code
        $stmt = $db->prepare("SELECT referral_code FROM users WHERE id = :user_id");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result['referral_code']) {
            $referralCode = strtoupper(substr(md5($user['id'] . time()), 0, 8));
            $updateStmt = $db->prepare("UPDATE users SET referral_code = :code WHERE id = :user_id");
            $updateStmt->bindParam(':code', $referralCode);
            $updateStmt->bindParam(':user_id', $user['id']);
            $updateStmt->execute();
        } else {
            $referralCode = $result['referral_code'];
        }
        
        echo json_encode(['success' => true, 'referral_code' => $referralCode]);
        exit();
    }
    
    if (isset($_GET['stats'])) {
        // Get referral statistics
        $stmt = $db->prepare("SELECT COUNT(*) as total_referrals, SUM(reward_amount) as total_rewards, SUM(CASE WHEN reward_paid = TRUE THEN reward_amount ELSE 0 END) as paid_rewards FROM referrals WHERE referrer_id = :user_id");
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get recent referrals
        $recentStmt = $db->prepare("SELECT r.*, u.full_name as referred_name FROM referrals r JOIN users u ON r.referred_id = u.id WHERE r.referrer_id = :user_id ORDER BY r.created_at DESC LIMIT 10");
        $recentStmt->bindParam(':user_id', $user['id']);
        $recentStmt->execute();
        $recent = $recentStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'stats' => $stats, 'recent_referrals' => $recent]);
        exit();
    }
}

// POST - Apply referral code
if ($method === 'POST') {
    $action = $input['action'] ?? '';
    
    if ($action === 'apply_code') {
        $code = $input['code'] ?? '';
        
        // Check if user already used a referral code
        $checkStmt = $db->prepare("SELECT referred_by FROM users WHERE id = :user_id");
        $checkStmt->bindParam(':user_id', $user['id']);
        $checkStmt->execute();
        $userCheck = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($userCheck['referred_by']) {
            echo json_encode(['success' => false, 'message' => 'You have already used a referral code']);
            exit();
        }
        
        // Find referrer
        $referrerStmt = $db->prepare("SELECT id FROM users WHERE referral_code = :code");
        $referrerStmt->bindParam(':code', $code);
        $referrerStmt->execute();
        $referrer = $referrerStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$referrer) {
            echo json_encode(['success' => false, 'message' => 'Invalid referral code']);
            exit();
        }
        
        if ($referrer['id'] == $user['id']) {
            echo json_encode(['success' => false, 'message' => 'Cannot use your own referral code']);
            exit();
        }
        
        $db->beginTransaction();
        
        try {
            // Create referral record
            $rewardAmount = 5000; // 5000 RWF reward
            $insertStmt = $db->prepare("INSERT INTO referrals (referrer_id, referred_id, referral_code, reward_amount) VALUES (:referrer_id, :referred_id, :code, :reward)");
            $insertStmt->bindParam(':referrer_id', $referrer['id']);
            $insertStmt->bindParam(':referred_id', $user['id']);
            $insertStmt->bindParam(':code', $code);
            $insertStmt->bindParam(':reward', $rewardAmount);
            $insertStmt->execute();
            
            // Update user
            $updateUserStmt = $db->prepare("UPDATE users SET referred_by = :referrer_id WHERE id = :user_id");
            $updateUserStmt->bindParam(':referrer_id', $referrer['id']);
            $updateUserStmt->bindParam(':user_id', $user['id']);
            $updateUserStmt->execute();
            
            // Update referrer count
            $updateReferrerStmt = $db->prepare("UPDATE users SET total_referrals = total_referrals + 1 WHERE id = :referrer_id");
            $updateReferrerStmt->bindParam(':referrer_id', $referrer['id']);
            $updateReferrerStmt->execute();
            
            $db->commit();
            
            echo json_encode(['success' => true, 'message' => 'Referral code applied successfully', 'reward' => $rewardAmount]);
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => 'Failed to apply referral code']);
        }
        exit();
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
