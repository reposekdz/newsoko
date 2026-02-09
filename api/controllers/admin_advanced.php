<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

// Verify admin access
$user = \$auth->requireAuth();
if (!$user || !$user['is_admin']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'stats':
            echo json_encode(getAdminStats($db));
            break;
        
        case 'users':
            echo json_encode(getUsers($db));
            break;
        
        case 'pending_approvals':
            echo json_encode(getPendingProducts($db));
            break;
        
        case 'bookings':
            echo json_encode(getAllBookings($db));
            break;
        
        case 'disputes':
            echo json_encode(getDisputes($db));
            break;
        
        case 'reviews':
            echo json_encode(getReviews($db));
            break;
        
        case 'roles':
            echo json_encode(getRoles($db));
            break;
        
        case 'categories':
            echo json_encode(getCategories($db));
            break;
        
        case 'logs':
            $limit = $_GET['limit'] ?? 50;
            echo json_encode(getActivityLogs($db, $limit));
            break;
        
        case 'system_settings':
            echo json_encode(getSystemSettings($db));
            break;
        
        case 'verify_user':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(verifyUser($db, $data['user_id'], $user['id']));
            break;
        
        case 'ban_user':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(banUser($db, $data['user_id'], $data['reason'] ?? '', $user['id']));
            break;
        
        case 'unban_user':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(unbanUser($db, $data['user_id'], $user['id']));
            break;
        
        case 'delete_user':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(deleteUser($db, $data['user_id'], $user['id']));
            break;
        
        case 'assign_role':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(assignRole($db, $data['user_id'], $data['role_id'], $user['id']));
            break;
        
        case 'approve_product':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(approveProduct($db, $data['product_id'], $user['id']));
            break;
        
        case 'reject_product':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(rejectProduct($db, $data['product_id'], $data['reason'] ?? '', $user['id']));
            break;
        
        case 'delete_product':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(deleteProduct($db, $data['product_id'], $user['id']));
            break;
        
        case 'resolve_dispute':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(resolveDispute($db, $data['dispute_id'], $data['resolution'], $user['id']));
            break;
        
        case 'refund_booking':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(refundBooking($db, $data['booking_id'], $data['amount'], $data['reason'], $user['id']));
            break;
        
        case 'cancel_booking':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(cancelBooking($db, $data['booking_id'], $user['id']));
            break;
        
        case 'delete_review':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(deleteReview($db, $data['review_id'], $user['id']));
            break;
        
        case 'create_category':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(createCategory($db, $data, $user['id']));
            break;
        
        case 'update_category':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(updateCategory($db, $data, $user['id']));
            break;
        
        case 'delete_category':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(deleteCategory($db, $data['category_id'], $user['id']));
            break;
        
        case 'update_setting':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(updateSetting($db, $data['setting_key'], $data['setting_value'], $user['id']));
            break;
        
        case 'send_notification':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(sendNotification($db, $data, $user['id']));
            break;
        
        case 'export_data':
            $type = $_GET['type'] ?? 'users';
            echo json_encode(exportData($db, $type));
            break;
        
        case 'bulk_action':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(bulkAction($db, $data, $user['id']));
            break;
        
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function getAdminStats($db) {
    $stats = [];
    
    $query = "SELECT COUNT(*) as total_users, 
              SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
              SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_users
              FROM users";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $userStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats = array_merge($stats, $userStats);
    
    $query = "SELECT COUNT(*) as total_products,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_products,
              SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_products
              FROM products";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $productStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats = array_merge($stats, $productStats);
    
    $query = "SELECT COUNT(*) as total_bookings,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
              SUM(total_amount) as total_revenue,
              SUM(platform_fee) as platform_fees
              FROM bookings";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $bookingStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats = array_merge($stats, $bookingStats);
    
    $query = "SELECT COUNT(*) as total_disputes,
              SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_disputes
              FROM disputes";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $disputeStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats = array_merge($stats, $disputeStats);
    
    return ['success' => true, 'data' => $stats];
}

function getUsers($db) {
    $query = "SELECT u.*, GROUP_CONCAT(r.display_name) as roles
              FROM users u
              LEFT JOIN user_roles ur ON u.id = ur.user_id
              LEFT JOIN roles r ON ur.role_id = r.id
              GROUP BY u.id
              ORDER BY u.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getPendingProducts($db) {
    $query = "SELECT p.*, u.name as owner_name, c.name as category_name
              FROM products p
              JOIN users u ON p.owner_id = u.id
              LEFT JOIN categories c ON p.category_id = c.id
              WHERE p.status = 'pending'
              ORDER BY p.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($products as &$product) {
        $product['images'] = json_decode($product['images'] ?? '[]');
    }
    
    return ['success' => true, 'data' => $products];
}

function getAllBookings($db) {
    $query = "SELECT b.*, p.title as product_title, 
              u1.name as user_name, u2.name as owner_name
              FROM bookings b
              JOIN products p ON b.product_id = p.id
              JOIN users u1 ON b.user_id = u1.id
              JOIN users u2 ON p.owner_id = u2.id
              ORDER BY b.created_at DESC
              LIMIT 100";
    $stmt = $db->prepare($query);
    $stmt->execute();
    return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getDisputes($db) {
    $query = "SELECT d.*, u1.name as raised_by_name, u2.name as against_name,
              b.id as booking_id, p.title as product_title
              FROM disputes d
              JOIN users u1 ON d.raised_by = u1.id
              JOIN users u2 ON d.against_user = u2.id
              LEFT JOIN bookings b ON d.booking_id = b.id
              LEFT JOIN products p ON b.product_id = p.id
              ORDER BY d.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getReviews($db) {
    $query = "SELECT r.*, u.name as reviewer_name, p.title as product_title
              FROM reviews r
              JOIN users u ON r.user_id = u.id
              JOIN products p ON r.product_id = p.id
              ORDER BY r.created_at DESC
              LIMIT 100";
    $stmt = $db->prepare($query);
    $stmt->execute();
    return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getRoles($db) {
    $query = "SELECT * FROM roles ORDER BY display_name";
    $stmt = $db->prepare($query);
    $stmt->execute();
    return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getCategories($db) {
    $query = "SELECT c.*, pc.name as parent_name,
              (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
              FROM categories c
              LEFT JOIN categories pc ON c.parent_id = pc.id
              ORDER BY c.name";
    $stmt = $db->prepare($query);
    $stmt->execute();
    return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getActivityLogs($db, $limit = 50) {
    $query = "SELECT al.*, u.name as admin_name
              FROM admin_logs al
              JOIN users u ON al.admin_id = u.id
              ORDER BY al.created_at DESC
              LIMIT :limit";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getSystemSettings($db) {
    $query = "SELECT * FROM system_settings ORDER BY setting_key";
    $stmt = $db->prepare($query);
    $stmt->execute();
    return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function verifyUser($db, $userId, $adminId) {
    $query = "UPDATE users SET is_verified = 1 WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    logAdminAction($db, $adminId, 'verify_user', 'user', $userId);
    createNotification($db, $userId, 'account_verified', 'Your account has been verified');
    
    return ['success' => true, 'message' => 'User verified successfully'];
}

function banUser($db, $userId, $reason, $adminId) {
    $query = "UPDATE users SET is_active = 0, ban_reason = :reason WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':reason', $reason);
    $stmt->execute();
    
    logAdminAction($db, $adminId, 'ban_user', 'user', $userId, $reason);
    createNotification($db, $userId, 'account_banned', 'Your account has been suspended: ' . $reason);
    
    return ['success' => true, 'message' => 'User banned successfully'];
}

function unbanUser($db, $userId, $adminId) {
    $query = "UPDATE users SET is_active = 1, ban_reason = NULL WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    logAdminAction($db, $adminId, 'unban_user', 'user', $userId);
    createNotification($db, $userId, 'account_unbanned', 'Your account has been reactivated');
    
    return ['success' => true, 'message' => 'User unbanned successfully'];
}

function deleteUser($db, $userId, $adminId) {
    $db->beginTransaction();
    try {
        $query = "DELETE FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        logAdminAction($db, $adminId, 'delete_user', 'user', $userId);
        $db->commit();
        return ['success' => true, 'message' => 'User deleted successfully'];
    } catch (Exception $e) {
        $db->rollBack();
        return ['success' => false, 'message' => 'Failed to delete user: ' . $e->getMessage()];
    }
}

function assignRole($db, $userId, $roleId, $adminId) {
    $query = "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)
              ON DUPLICATE KEY UPDATE role_id = :role_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':role_id', $roleId);
    $stmt->execute();
    
    logAdminAction($db, $adminId, 'assign_role', 'user', $userId);
    
    return ['success' => true, 'message' => 'Role assigned successfully'];
}

function approveProduct($db, $productId, $adminId) {
    $query = "UPDATE products SET status = 'approved', approved_at = NOW(), approved_by = :admin_id 
              WHERE id = :product_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':product_id', $productId);
    $stmt->bindParam(':admin_id', $adminId);
    $stmt->execute();
    
    $query = "SELECT owner_id FROM products WHERE id = :product_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':product_id', $productId);
    $stmt->execute();
    $ownerId = $stmt->fetchColumn();
    
    logAdminAction($db, $adminId, 'approve_product', 'product', $productId);
    createNotification($db, $ownerId, 'product_approved', 'Your product has been approved');
    
    return ['success' => true, 'message' => 'Product approved successfully'];
}

function rejectProduct($db, $productId, $reason, $adminId) {
    $query = "UPDATE products SET status = 'rejected', rejection_reason = :reason WHERE id = :product_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':product_id', $productId);
    $stmt->bindParam(':reason', $reason);
    $stmt->execute();
    
    $query = "SELECT owner_id FROM products WHERE id = :product_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':product_id', $productId);
    $stmt->execute();
    $ownerId = $stmt->fetchColumn();
    
    logAdminAction($db, $adminId, 'reject_product', 'product', $productId, $reason);
    createNotification($db, $ownerId, 'product_rejected', 'Your product was rejected: ' . $reason);
    
    return ['success' => true, 'message' => 'Product rejected'];
}

function deleteProduct($db, $productId, $adminId) {
    $query = "DELETE FROM products WHERE id = :product_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':product_id', $productId);
    $stmt->execute();
    
    logAdminAction($db, $adminId, 'delete_product', 'product', $productId);
    
    return ['success' => true, 'message' => 'Product deleted successfully'];
}

function resolveDispute($db, $disputeId, $resolution, $adminId) {
    $query = "UPDATE disputes SET status = 'resolved', resolution = :resolution, 
              resolved_by = :admin_id, resolved_at = NOW() WHERE id = :dispute_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':dispute_id', $disputeId);
    $stmt->bindParam(':resolution', $resolution);
    $stmt->bindParam(':admin_id', $adminId);
    $stmt->execute();
    
    $query = "SELECT raised_by, against_user FROM disputes WHERE id = :dispute_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':dispute_id', $disputeId);
    $stmt->execute();
    $dispute = $stmt->fetch(PDO::FETCH_ASSOC);
    
    logAdminAction($db, $adminId, 'resolve_dispute', 'dispute', $disputeId);
    createNotification($db, $dispute['raised_by'], 'dispute_resolved', 'Your dispute has been resolved');
    createNotification($db, $dispute['against_user'], 'dispute_resolved', 'A dispute against you has been resolved');
    
    return ['success' => true, 'message' => 'Dispute resolved successfully'];
}

function refundBooking($db, $bookingId, $amount, $reason, $adminId) {
    $db->beginTransaction();
    try {
        $query = "SELECT user_id, total_amount FROM bookings WHERE id = :booking_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->execute();
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $query = "UPDATE bookings SET status = 'refunded', refund_amount = :amount, 
                  refund_reason = :reason WHERE id = :booking_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':reason', $reason);
        $stmt->execute();
        
        $query = "UPDATE users SET wallet_balance = wallet_balance + :amount WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':user_id', $booking['user_id']);
        $stmt->execute();
        
        $query = "INSERT INTO wallet_transactions (user_id, type, amount, description, status)
                  VALUES (:user_id, 'refund', :amount, :reason, 'completed')";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $booking['user_id']);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':reason', $reason);
        $stmt->execute();
        
        logAdminAction($db, $adminId, 'refund_booking', 'booking', $bookingId);
        createNotification($db, $booking['user_id'], 'booking_refunded', 'Your booking has been refunded: ' . $amount . ' RWF');
        
        $db->commit();
        return ['success' => true, 'message' => 'Refund processed successfully'];
    } catch (Exception $e) {
        $db->rollBack();
        return ['success' => false, 'message' => 'Refund failed: ' . $e->getMessage()];
    }
}

function cancelBooking($db, $bookingId, $adminId) {
    $query = "UPDATE bookings SET status = 'cancelled' WHERE id = :booking_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':booking_id', $bookingId);
    $stmt->execute();
    
    logAdminAction($db, $adminId, 'cancel_booking', 'booking', $bookingId);
    
    return ['success' => true, 'message' => 'Booking cancelled'];
}

function deleteReview($db, $reviewId, $adminId) {
    $query = "DELETE FROM reviews WHERE id = :review_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':review_id', $reviewId);
    $stmt->execute();
    
    logAdminAction($db, $adminId, 'delete_review', 'review', $reviewId);
    
    return ['success' => true, 'message' => 'Review deleted'];
}

function createCategory($db, $data, $adminId) {
    $query = "INSERT INTO categories (name, slug, description, parent_id, icon, is_active)
              VALUES (:name, :slug, :description, :parent_id, :icon, 1)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':name', $data['name']);
    $stmt->bindParam(':slug', $data['slug']);
    $stmt->bindParam(':description', $data['description']);
    $stmt->bindParam(':parent_id', $data['parent_id']);
    $stmt->bindParam(':icon', $data['icon']);
    $stmt->execute();
    
    $categoryId = $db->lastInsertId();
    logAdminAction($db, $adminId, 'create_category', 'category', $categoryId);
    
    return ['success' => true, 'message' => 'Category created', 'id' => $categoryId];
}

function updateCategory($db, $data, $adminId) {
    $query = "UPDATE categories SET name = :name, description = :description, 
              parent_id = :parent_id, icon = :icon, is_active = :is_active
              WHERE id = :category_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':category_id', $data['category_id']);
    $stmt->bindParam(':name', $data['name']);
    $stmt->bindParam(':description', $data['description']);
    $stmt->bindParam(':parent_id', $data['parent_id']);
    $stmt->bindParam(':icon', $data['icon']);
    $stmt->bindParam(':is_active', $data['is_active']);
    $stmt->execute();
    
    logAdminAction($db, $adminId, 'update_category', 'category', $data['category_id']);
    
    return ['success' => true, 'message' => 'Category updated'];
}

function deleteCategory($db, $categoryId, $adminId) {
    $query = "DELETE FROM categories WHERE id = :category_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':category_id', $categoryId);
    $stmt->execute();
    
    logAdminAction($db, $adminId, 'delete_category', 'category', $categoryId);
    
    return ['success' => true, 'message' => 'Category deleted'];
}

function updateSetting($db, $key, $value, $adminId) {
    $query = "INSERT INTO system_settings (setting_key, setting_value) 
              VALUES (:key, :value)
              ON DUPLICATE KEY UPDATE setting_value = :value";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':key', $key);
    $stmt->bindParam(':value', $value);
    $stmt->execute();
    
    logAdminAction($db, $adminId, 'update_setting', 'setting', 0, $key);
    
    return ['success' => true, 'message' => 'Setting updated'];
}

function sendNotification($db, $data, $adminId) {
    if ($data['target'] === 'all') {
        $query = "SELECT id FROM users WHERE is_active = 1";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($users as $userId) {
            createNotification($db, $userId, $data['type'], $data['message'], $data['title']);
        }
    } else {
        createNotification($db, $data['user_id'], $data['type'], $data['message'], $data['title']);
    }
    
    logAdminAction($db, $adminId, 'send_notification', 'notification', 0);
    
    return ['success' => true, 'message' => 'Notification sent'];
}

function exportData($db, $type) {
    $data = [];
    switch ($type) {
        case 'users':
            $query = "SELECT * FROM users";
            break;
        case 'products':
            $query = "SELECT * FROM products";
            break;
        case 'bookings':
            $query = "SELECT * FROM bookings";
            break;
        default:
            return ['success' => false, 'message' => 'Invalid export type'];
    }
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return ['success' => true, 'data' => $data];
}

function bulkAction($db, $data, $adminId) {
    $action = $data['action'];
    $ids = $data['ids'];
    $count = 0;
    
    foreach ($ids as $id) {
        switch ($action) {
            case 'approve':
                approveProduct($db, $id, $adminId);
                $count++;
                break;
            case 'delete':
                deleteProduct($db, $id, $adminId);
                $count++;
                break;
        }
    }
    
    return ['success' => true, 'message' => "$count items processed"];
}

function logAdminAction($db, $adminId, $action, $entityType, $entityId, $details = null) {
    $query = "INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
              VALUES (:admin_id, :action, :entity_type, :entity_id, :details)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':admin_id', $adminId);
    $stmt->bindParam(':action', $action);
    $stmt->bindParam(':entity_type', $entityType);
    $stmt->bindParam(':entity_id', $entityId);
    $stmt->bindParam(':details', $details);
    $stmt->execute();
}

function createNotification($db, $userId, $type, $message, $title = null) {
    $query = "INSERT INTO notifications (user_id, type, title, message)
              VALUES (:user_id, :type, :title, :message)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':type', $type);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':message', $message);
    $stmt->execute();
}
