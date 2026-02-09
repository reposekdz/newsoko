<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    $auth = new Auth($db);
    $user = $auth->requireAuth();
    
    $stmt = $db->prepare("SELECT is_admin FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    if (!$stmt->fetchColumn()) {
        throw new Exception('Admin access required');
    }
    
    switch($method) {
        case 'GET':
            $action = $_GET['action'] ?? '';
            
            switch($action) {
                case 'dashboard_stats':
                    $stats = [
                        'total_users' => $db->query("SELECT COUNT(*) FROM users")->fetchColumn(),
                        'active_users' => $db->query("SELECT COUNT(*) FROM users WHERE is_active = TRUE")->fetchColumn(),
                        'verified_users' => $db->query("SELECT COUNT(*) FROM users WHERE is_verified = TRUE")->fetchColumn(),
                        'total_products' => $db->query("SELECT COUNT(*) FROM products")->fetchColumn(),
                        'pending_products' => $db->query("SELECT COUNT(*) FROM products WHERE approved_by IS NULL")->fetchColumn(),
                        'approved_products' => $db->query("SELECT COUNT(*) FROM products WHERE approved_by IS NOT NULL")->fetchColumn(),
                        'total_bookings' => $db->query("SELECT COUNT(*) FROM bookings")->fetchColumn(),
                        'active_bookings' => $db->query("SELECT COUNT(*) FROM bookings WHERE status = 'active'")->fetchColumn(),
                        'completed_bookings' => $db->query("SELECT COUNT(*) FROM bookings WHERE status = 'completed'")->fetchColumn(),
                        'total_revenue' => $db->query("SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status = 'completed'")->fetchColumn(),
                        'pending_disputes' => $db->query("SELECT COUNT(*) FROM disputes WHERE status = 'open'")->fetchColumn(),
                        'total_transactions' => $db->query("SELECT COUNT(*) FROM payments")->fetchColumn(),
                        'wallet_balance' => $db->query("SELECT COALESCE(SUM(balance), 0) FROM secure_wallets")->fetchColumn(),
                        'commission_earned' => $db->query("SELECT COALESCE(SUM(commission_amount), 0) FROM secure_wallet_transactions WHERE transaction_type = 'commission'")->fetchColumn()
                    ];
                    echo json_encode(['success' => true, 'data' => $stats]);
                    break;
                    
                case 'users_list':
                    $search = $_GET['search'] ?? '';
                    $status = $_GET['status'] ?? 'all';
                    $limit = $_GET['limit'] ?? 50;
                    $offset = $_GET['offset'] ?? 0;
                    
                    $where = "WHERE 1=1";
                    $params = [];
                    
                    if ($search) {
                        $where .= " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
                        $searchTerm = "%$search%";
                        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
                    }
                    
                    if ($status === 'active') $where .= " AND u.is_active = TRUE";
                    if ($status === 'banned') $where .= " AND u.is_active = FALSE";
                    if ($status === 'verified') $where .= " AND u.is_verified = TRUE";
                    if ($status === 'unverified') $where .= " AND u.is_verified = FALSE";
                    
                    $stmt = $db->prepare("SELECT u.*, GROUP_CONCAT(r.display_name) as roles,
                                         (SELECT COUNT(*) FROM products WHERE owner_id = u.id) as product_count,
                                         (SELECT COUNT(*) FROM bookings WHERE renter_id = u.id) as booking_count
                                         FROM users u
                                         LEFT JOIN user_roles ur ON u.id = ur.user_id
                                         LEFT JOIN roles r ON ur.role_id = r.id
                                         $where
                                         GROUP BY u.id
                                         ORDER BY u.created_at DESC
                                         LIMIT ? OFFSET ?");
                    $params[] = $limit;
                    $params[] = $offset;
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    break;
                    
                case 'products_pending':
                    $stmt = $db->prepare("SELECT p.*, u.name as owner_name, u.email as owner_email,
                                         c.name as category_name, p.ai_fraud_score
                                         FROM products p
                                         JOIN users u ON p.owner_id = u.id
                                         LEFT JOIN categories c ON p.category_id = c.id
                                         WHERE p.approved_by IS NULL
                                         ORDER BY p.created_at DESC");
                    $stmt->execute();
                    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    break;
                    
                case 'bookings_all':
                    $status = $_GET['status'] ?? 'all';
                    $where = $status !== 'all' ? "WHERE b.status = ?" : "";
                    
                    $stmt = $db->prepare("SELECT b.*, p.title as product_title, p.images,
                                         u1.name as renter_name, u2.name as owner_name,
                                         b.total_amount, b.status, b.start_date, b.end_date
                                         FROM bookings b
                                         JOIN products p ON b.product_id = p.id
                                         JOIN users u1 ON b.renter_id = u1.id
                                         JOIN users u2 ON p.owner_id = u2.id
                                         $where
                                         ORDER BY b.created_at DESC
                                         LIMIT 100");
                    if ($status !== 'all') $stmt->execute([$status]);
                    else $stmt->execute();
                    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    break;
                    
                case 'payments_all':
                    $status = $_GET['status'] ?? 'all';
                    $limit = $_GET['limit'] ?? 100;
                    
                    $where = $status !== 'all' ? "WHERE p.status = ?" : "";
                    
                    $stmt = $db->prepare("SELECT p.*, u.name as user_name, u.email as user_email,
                                         b.id as booking_id
                                         FROM payments p
                                         JOIN users u ON p.user_id = u.id
                                         LEFT JOIN bookings b ON p.booking_id = b.id
                                         $where
                                         ORDER BY p.created_at DESC
                                         LIMIT ?");
                    $params = $status !== 'all' ? [$status, $limit] : [$limit];
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    break;
                    
                case 'disputes_all':
                    $status = $_GET['status'] ?? 'all';
                    $where = $status !== 'all' ? "WHERE d.status = ?" : "";
                    
                    $stmt = $db->prepare("SELECT d.*, b.id as booking_id, p.title as product_title,
                                         u1.name as filed_by_name, u2.name as against_name
                                         FROM disputes d
                                         JOIN bookings b ON d.booking_id = b.id
                                         JOIN products p ON b.product_id = p.id
                                         JOIN users u1 ON d.filed_by = u1.id
                                         JOIN users u2 ON d.against_user_id = u2.id
                                         $where
                                         ORDER BY d.created_at DESC");
                    if ($status !== 'all') $stmt->execute([$status]);
                    else $stmt->execute();
                    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    break;
                    
                case 'reviews_all':
                    $stmt = $db->prepare("SELECT r.*, p.title as product_title, p.images,
                                         u1.name as reviewer_name, u2.name as seller_name
                                         FROM reviews r
                                         JOIN products p ON r.product_id = p.id
                                         JOIN users u1 ON r.user_id = u1.id
                                         JOIN users u2 ON p.owner_id = u2.id
                                         ORDER BY r.created_at DESC
                                         LIMIT 100");
                    $stmt->execute();
                    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    break;
                    
                case 'fraud_logs':
                    $stmt = $db->prepare("SELECT fl.*, u.name as user_name, u.email as user_email
                                         FROM fraud_detection_logs fl
                                         LEFT JOIN users u ON fl.user_id = u.id
                                         ORDER BY fl.created_at DESC
                                         LIMIT 100");
                    $stmt->execute();
                    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    break;
                    
                case 'wallet_transactions':
                    $stmt = $db->prepare("SELECT swt.*, u.name as user_name, u.email as user_email,
                                         sw.balance as current_balance
                                         FROM secure_wallet_transactions swt
                                         JOIN secure_wallets sw ON swt.wallet_id = sw.id
                                         JOIN users u ON sw.user_id = u.id
                                         ORDER BY swt.created_at DESC
                                         LIMIT 100");
                    $stmt->execute();
                    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    break;
                    
                case 'revenue_analytics':
                    $period = $_GET['period'] ?? 30;
                    
                    $stmt = $db->prepare("SELECT DATE(created_at) as date,
                                         COUNT(*) as transaction_count,
                                         SUM(total_amount) as revenue,
                                         SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as completed_revenue
                                         FROM bookings
                                         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                                         GROUP BY DATE(created_at)
                                         ORDER BY date DESC");
                    $stmt->execute([$period]);
                    
                    $commissionStmt = $db->prepare("SELECT SUM(commission_amount) as total_commission
                                                    FROM secure_wallet_transactions
                                                    WHERE transaction_type = 'commission'
                                                    AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)");
                    $commissionStmt->execute([$period]);
                    
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'daily_revenue' => $stmt->fetchAll(PDO::FETCH_ASSOC),
                            'total_commission' => $commissionStmt->fetchColumn()
                        ]
                    ]);
                    break;
                    
                case 'system_settings':
                    $stmt = $db->query("SELECT * FROM platform_settings ORDER BY category, setting_key");
                    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    break;
                    
                case 'activity_logs':
                    $limit = $_GET['limit'] ?? 100;
                    $stmt = $db->prepare("SELECT al.*, u.name as admin_name
                                         FROM admin_logs al
                                         JOIN users u ON al.admin_id = u.id
                                         ORDER BY al.created_at DESC
                                         LIMIT ?");
                    $stmt->execute([$limit]);
                    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    break;
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            $action = $data['action'];
            
            $db->beginTransaction();
            
            switch($action) {
                case 'verify_user':
                    $stmt = $db->prepare("UPDATE users SET is_verified = TRUE WHERE id = ?");
                    $stmt->execute([$data['user_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id) VALUES (?, 'verify_user', 'user', ?)");
                    $stmt->execute([$user['id'], $data['user_id']]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'User verified']);
                    break;
                    
                case 'ban_user':
                    $stmt = $db->prepare("UPDATE users SET is_active = FALSE, admin_notes = ? WHERE id = ?");
                    $stmt->execute([$data['reason'], $data['user_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details) VALUES (?, 'ban_user', 'user', ?, ?)");
                    $stmt->execute([$user['id'], $data['user_id'], json_encode(['reason' => $data['reason']])]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'User banned']);
                    break;
                    
                case 'unban_user':
                    $stmt = $db->prepare("UPDATE users SET is_active = TRUE WHERE id = ?");
                    $stmt->execute([$data['user_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id) VALUES (?, 'unban_user', 'user', ?)");
                    $stmt->execute([$user['id'], $data['user_id']]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'User unbanned']);
                    break;
                    
                case 'delete_user':
                    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
                    $stmt->execute([$data['user_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id) VALUES (?, 'delete_user', 'user', ?)");
                    $stmt->execute([$user['id'], $data['user_id']]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'User deleted']);
                    break;
                    
                case 'approve_product':
                    $stmt = $db->prepare("UPDATE products SET approved_by = ?, approved_at = NOW() WHERE id = ?");
                    $stmt->execute([$user['id'], $data['product_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO notifications (user_id, type, title, message, related_id)
                                         VALUES ((SELECT owner_id FROM products WHERE id = ?), 'product', 'Product Approved', 'Your product has been approved', ?)");
                    $stmt->execute([$data['product_id'], $data['product_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id) VALUES (?, 'approve_product', 'product', ?)");
                    $stmt->execute([$user['id'], $data['product_id']]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Product approved']);
                    break;
                    
                case 'reject_product':
                    $stmt = $db->prepare("UPDATE products SET rejection_reason = ?, is_available = FALSE WHERE id = ?");
                    $stmt->execute([$data['reason'], $data['product_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO notifications (user_id, type, title, message, related_id)
                                         VALUES ((SELECT owner_id FROM products WHERE id = ?), 'product', 'Product Rejected', ?, ?)");
                    $stmt->execute([$data['product_id'], $data['reason'], $data['product_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details) VALUES (?, 'reject_product', 'product', ?, ?)");
                    $stmt->execute([$user['id'], $data['product_id'], json_encode(['reason' => $data['reason']])]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Product rejected']);
                    break;
                    
                case 'delete_product':
                    $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
                    $stmt->execute([$data['product_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id) VALUES (?, 'delete_product', 'product', ?)");
                    $stmt->execute([$user['id'], $data['product_id']]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Product deleted']);
                    break;
                    
                case 'resolve_dispute':
                    $stmt = $db->prepare("UPDATE disputes SET status = 'resolved', resolution = ?, resolved_by = ?, resolved_at = NOW() WHERE id = ?");
                    $stmt->execute([$data['resolution'], $user['id'], $data['dispute_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details) VALUES (?, 'resolve_dispute', 'dispute', ?, ?)");
                    $stmt->execute([$user['id'], $data['dispute_id'], json_encode(['resolution' => $data['resolution']])]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Dispute resolved']);
                    break;
                    
                case 'refund_booking':
                    $stmt = $db->prepare("UPDATE bookings SET status = 'refunded' WHERE id = ?");
                    $stmt->execute([$data['booking_id']]);
                    
                    $stmt = $db->prepare("SELECT renter_id FROM bookings WHERE id = ?");
                    $stmt->execute([$data['booking_id']]);
                    $renterId = $stmt->fetchColumn();
                    
                    $stmt = $db->prepare("UPDATE secure_wallets SET balance = balance + ? WHERE user_id = ?");
                    $stmt->execute([$data['amount'], $renterId]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details) VALUES (?, 'refund_booking', 'booking', ?, ?)");
                    $stmt->execute([$user['id'], $data['booking_id'], json_encode(['amount' => $data['amount'], 'reason' => $data['reason']])]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Booking refunded']);
                    break;
                    
                case 'cancel_booking':
                    $stmt = $db->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?");
                    $stmt->execute([$data['booking_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id) VALUES (?, 'cancel_booking', 'booking', ?)");
                    $stmt->execute([$user['id'], $data['booking_id']]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Booking cancelled']);
                    break;
                    
                case 'delete_review':
                    $stmt = $db->prepare("DELETE FROM reviews WHERE id = ?");
                    $stmt->execute([$data['review_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id) VALUES (?, 'delete_review', 'review', ?)");
                    $stmt->execute([$user['id'], $data['review_id']]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Review deleted']);
                    break;
                    
                case 'update_setting':
                    $stmt = $db->prepare("UPDATE platform_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?");
                    $stmt->execute([$data['setting_value'], $data['setting_key']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details) VALUES (?, 'update_setting', 'setting', 0, ?)");
                    $stmt->execute([$user['id'], json_encode(['key' => $data['setting_key'], 'value' => $data['setting_value']])]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Setting updated']);
                    break;
                    
                case 'bulk_action':
                    $bulkAction = $data['bulk_action'];
                    $ids = $data['ids'];
                    
                    foreach ($ids as $id) {
                        if ($bulkAction === 'approve') {
                            $stmt = $db->prepare("UPDATE products SET approved_by = ?, approved_at = NOW() WHERE id = ?");
                            $stmt->execute([$user['id'], $id]);
                        } elseif ($bulkAction === 'reject') {
                            $stmt = $db->prepare("UPDATE products SET is_available = FALSE WHERE id = ?");
                            $stmt->execute([$id]);
                        } elseif ($bulkAction === 'delete') {
                            $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
                            $stmt->execute([$id]);
                        }
                    }
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details) VALUES (?, 'bulk_action', 'product', 0, ?)");
                    $stmt->execute([$user['id'], json_encode(['action' => $bulkAction, 'count' => count($ids)])]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => count($ids) . ' items processed']);
                    break;
            }
            break;
    }
} catch(Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
