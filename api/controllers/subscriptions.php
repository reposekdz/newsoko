<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['plans'])) {
                // Get all subscription plans
                $query = "SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY price ASC";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($plans as &$plan) {
                    $plan['features'] = json_decode($plan['features'], true);
                }
                
                echo json_encode(['success' => true, 'data' => $plans]);
                
            } elseif (isset($_GET['my_subscription'])) {
                // Get user's current subscription
                $user = \$auth->requireAuth();
                if (!$user) {
                    throw new Exception('Authentication required');
                }
                
                $user_id = $user['user_id'];
                
                $query = "SELECT s.*, p.name as plan_name, p.plan_type, p.features, p.max_listings, p.featured_listings
                         FROM user_subscriptions s
                         JOIN subscription_plans p ON s.plan_id = p.id
                         WHERE s.user_id = :user_id
                         AND s.status = 'active'
                         ORDER BY s.created_at DESC
                         LIMIT 1";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($subscription) {
                    $subscription['features'] = json_decode($subscription['features'], true);
                    
                    // Get usage stats
                    $query = "SELECT COUNT(*) as listing_count FROM products WHERE owner_id = :user_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user_id', $user_id);
                    $stmt->execute();
                    $usage = $stmt->fetch(PDO::FETCH_ASSOC);
                    $subscription['current_listings'] = $usage['listing_count'];
                }
                
                echo json_encode(['success' => true, 'data' => $subscription]);
                
            } elseif (isset($_GET['subscription_history'])) {
                // Get subscription history
                $user = \$auth->requireAuth();
                if (!$user) {
                    throw new Exception('Authentication required');
                }
                
                $user_id = $user['user_id'];
                
                $query = "SELECT s.*, p.name as plan_name, p.plan_type
                         FROM user_subscriptions s
                         JOIN subscription_plans p ON s.plan_id = p.id
                         WHERE s.user_id = :user_id
                         ORDER BY s.created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $history]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            $user = \$auth->requireAuth();
            
            if (!$user) {
                throw new Exception('Authentication required');
            }
            
            $user_id = $user['user_id'];
            
            if (isset($data['action']) && $data['action'] === 'subscribe') {
                // Subscribe to a plan
                $plan_id = $data['plan_id'];
                $payment_method = $data['payment_method'];
                $billing_cycle = $data['billing_cycle'] ?? 'monthly';
                
                // Get plan details
                $query = "SELECT * FROM subscription_plans WHERE id = :plan_id AND is_active = TRUE";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':plan_id', $plan_id);
                $stmt->execute();
                $plan = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$plan) {
                    throw new Exception('Plan not found');
                }
                
                // Cancel existing active subscription
                $query = "UPDATE user_subscriptions SET status = 'cancelled' 
                         WHERE user_id = :user_id AND status = 'active'";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                
                // Calculate end date based on billing cycle
                $end_date = date('Y-m-d H:i:s', strtotime('+1 ' . $billing_cycle));
                $next_payment_date = $end_date;
                
                // Create new subscription
                $query = "INSERT INTO user_subscriptions 
                         (user_id, plan_id, status, end_date, payment_method, last_payment_date, next_payment_date)
                         VALUES (:user_id, :plan_id, 'active', :end_date, :payment_method, NOW(), :next_payment)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->bindParam(':plan_id', $plan_id);
                $stmt->bindParam(':end_date', $end_date);
                $stmt->bindParam(':payment_method', $payment_method);
                $stmt->bindParam(':next_payment', $next_payment_date);
                $stmt->execute();
                
                // Update user subscription plan
                $query = "UPDATE users SET subscription_plan_id = :plan_id WHERE id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':plan_id', $plan_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Subscription activated successfully',
                    'subscription_id' => $db->lastInsertId()
                ]);
                
            } elseif (isset($data['action']) && $data['action'] === 'cancel') {
                // Cancel subscription
                $query = "UPDATE user_subscriptions 
                         SET status = 'cancelled', auto_renew = FALSE 
                         WHERE user_id = :user_id AND status = 'active'";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                
                echo json_encode(['success' => true, 'message' => 'Subscription cancelled']);
                
            } elseif (isset($data['action']) && $data['action'] === 'upgrade') {
                // Upgrade subscription
                $new_plan_id = $data['plan_id'];
                
                // Get current subscription
                $query = "SELECT * FROM user_subscriptions 
                         WHERE user_id = :user_id AND status = 'active'
                         ORDER BY created_at DESC LIMIT 1";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $current_sub = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($current_sub) {
                    // Cancel current subscription
                    $query = "UPDATE user_subscriptions SET status = 'cancelled' WHERE id = :sub_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':sub_id', $current_sub['id']);
                    $stmt->execute();
                }
                
                // Create new subscription
                $end_date = date('Y-m-d H:i:s', strtotime('+1 month'));
                $query = "INSERT INTO user_subscriptions 
                         (user_id, plan_id, status, end_date, payment_method, last_payment_date, next_payment_date)
                         VALUES (:user_id, :plan_id, 'active', :end_date, :payment_method, NOW(), :end_date)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->bindParam(':plan_id', $new_plan_id);
                $stmt->bindParam(':end_date', $end_date);
                $payment_method = $current_sub['payment_method'] ?? 'momo';
                $stmt->bindParam(':payment_method', $payment_method);
                $stmt->execute();
                
                // Update user subscription plan
                $query = "UPDATE users SET subscription_plan_id = :plan_id WHERE id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':plan_id', $new_plan_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                
                echo json_encode(['success' => true, 'message' => 'Subscription upgraded successfully']);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            $user = \$auth->requireAuth();
            
            if (!$user) {
                throw new Exception('Authentication required');
            }
            
            $user_id = $user['user_id'];
            
            if (isset($data['action']) && $data['action'] === 'toggle_auto_renew') {
                // Toggle auto-renew
                $auto_renew = $data['auto_renew'];
                
                $query = "UPDATE user_subscriptions 
                         SET auto_renew = :auto_renew 
                         WHERE user_id = :user_id AND status = 'active'";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':auto_renew', $auto_renew, PDO::PARAM_BOOL);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                
                echo json_encode(['success' => true, 'message' => 'Auto-renew updated']);
            }
            break;
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
