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
    
    // Check if user is admin
    $stmt = $db->prepare("SELECT is_admin FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    if (!$stmt->fetchColumn()) {
        throw new Exception('Unauthorized: Admin access required');
    }
    
    // Check permission
    function hasPermission($db, $userId, $permission) {
        $stmt = $db->prepare("SELECT COUNT(*) FROM user_roles ur
                             JOIN role_permissions rp ON ur.role_id = rp.role_id
                             JOIN permissions p ON rp.permission_id = p.id
                             WHERE ur.user_id = ? AND p.name = ?");
        $stmt->execute([$userId, $permission]);
        return $stmt->fetchColumn() > 0;
    }
    
    switch($method) {
        case 'GET':
            if (isset($_GET['action'])) {
                switch($_GET['action']) {
                    case 'users':
                        if (!hasPermission($db, $user['id'], 'users.view')) {
                            throw new Exception('Permission denied');
                        }
                        $stmt = $db->prepare("SELECT u.*, GROUP_CONCAT(r.display_name) as roles
                                             FROM users u
                                             LEFT JOIN user_roles ur ON u.id = ur.user_id
                                             LEFT JOIN roles r ON ur.role_id = r.id
                                             GROUP BY u.id
                                             ORDER BY u.created_at DESC");
                        $stmt->execute();
                        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                        break;
                        
                    case 'roles':
                        $stmt = $db->query("SELECT * FROM roles ORDER BY level DESC");
                        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                        break;
                        
                    case 'permissions':
                        $stmt = $db->query("SELECT * FROM permissions ORDER BY category, name");
                        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                        break;
                        
                    case 'role_permissions':
                        $stmt = $db->prepare("SELECT p.* FROM role_permissions rp
                                             JOIN permissions p ON rp.permission_id = p.id
                                             WHERE rp.role_id = ?");
                        $stmt->execute([$_GET['role_id']]);
                        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                        break;
                        
                    case 'categories':
                        $stmt = $db->query("SELECT c.*, p.name as parent_name 
                                           FROM categories c
                                           LEFT JOIN categories p ON c.parent_id = p.id
                                           ORDER BY c.sort_order");
                        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                        break;
                        
                    case 'logs':
                        if (!hasPermission($db, $user['id'], 'system.view_logs')) {
                            throw new Exception('Permission denied');
                        }
                        $stmt = $db->prepare("SELECT al.*, u.name as admin_name
                                             FROM admin_logs al
                                             JOIN users u ON al.admin_id = u.id
                                             ORDER BY al.created_at DESC
                                             LIMIT 100");
                        $stmt->execute();
                        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                        break;
                        
                    case 'stats':
                        $stats = [
                            'total_users' => $db->query("SELECT COUNT(*) FROM users")->fetchColumn(),
                            'total_products' => $db->query("SELECT COUNT(*) FROM products")->fetchColumn(),
                            'pending_products' => $db->query("SELECT COUNT(*) FROM products WHERE approved_by IS NULL")->fetchColumn(),
                            'total_bookings' => $db->query("SELECT COUNT(*) FROM bookings")->fetchColumn(),
                            'total_revenue' => $db->query("SELECT SUM(total_amount) FROM bookings WHERE status = 'completed'")->fetchColumn(),
                            'active_disputes' => $db->query("SELECT COUNT(*) FROM disputes WHERE status = 'open'")->fetchColumn()
                        ];
                        echo json_encode(['success' => true, 'data' => $stats]);
                        break;
                }
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            $action = $data['action'];
            
            $db->beginTransaction();
            
            switch($action) {
                case 'assign_role':
                    if (!hasPermission($db, $user['id'], 'roles.assign')) {
                        throw new Exception('Permission denied');
                    }
                    $stmt = $db->prepare("INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)");
                    $stmt->execute([$data['user_id'], $data['role_id'], $user['id']]);
                    
                    $stmt = $db->prepare("UPDATE users SET is_admin = TRUE WHERE id = ?");
                    $stmt->execute([$data['user_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
                                         VALUES (?, 'assign_role', 'user', ?, ?)");
                    $stmt->execute([$user['id'], $data['user_id'], json_encode(['role_id' => $data['role_id']])]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Role assigned']);
                    break;
                    
                case 'remove_role':
                    if (!hasPermission($db, $user['id'], 'roles.assign')) {
                        throw new Exception('Permission denied');
                    }
                    $stmt = $db->prepare("DELETE FROM user_roles WHERE user_id = ? AND role_id = ?");
                    $stmt->execute([$data['user_id'], $data['role_id']]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Role removed']);
                    break;
                    
                case 'create_category':
                    if (!hasPermission($db, $user['id'], 'content.manage_categories')) {
                        throw new Exception('Permission denied');
                    }
                    $stmt = $db->prepare("INSERT INTO categories (name, slug, parent_id, description, icon, sort_order)
                                         VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $data['name'],
                        $data['slug'],
                        $data['parent_id'] ?? null,
                        $data['description'],
                        $data['icon'],
                        $data['sort_order'] ?? 0
                    ]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Category created']);
                    break;
                    
                case 'ban_user':
                    if (!hasPermission($db, $user['id'], 'users.ban')) {
                        throw new Exception('Permission denied');
                    }
                    $stmt = $db->prepare("UPDATE users SET is_active = FALSE, admin_notes = ? WHERE id = ?");
                    $stmt->execute([$data['reason'], $data['user_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
                                         VALUES (?, 'ban_user', 'user', ?, ?)");
                    $stmt->execute([$user['id'], $data['user_id'], json_encode(['reason' => $data['reason']])]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'User banned']);
                    break;
                    
                case 'verify_user':
                    if (!hasPermission($db, $user['id'], 'users.verify')) {
                        throw new Exception('Permission denied');
                    }
                    $stmt = $db->prepare("UPDATE users SET is_verified = TRUE WHERE id = ?");
                    $stmt->execute([$data['user_id']]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'User verified']);
                    break;
                    
                case 'approve_product':
                    if (!hasPermission($db, $user['id'], 'products.approve')) {
                        throw new Exception('Permission denied');
                    }
                    $stmt = $db->prepare("UPDATE products SET approved_by = ?, approved_at = NOW() WHERE id = ?");
                    $stmt->execute([$user['id'], $data['product_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO notifications (user_id, type, title, message, related_id)
                                         VALUES ((SELECT owner_id FROM products WHERE id = ?), 'product', 'Product Approved', 'Your product has been approved', ?)");
                    $stmt->execute([$data['product_id'], $data['product_id']]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Product approved']);
                    break;
                    
                case 'reject_product':
                    if (!hasPermission($db, $user['id'], 'products.approve')) {
                        throw new Exception('Permission denied');
                    }
                    $stmt = $db->prepare("UPDATE products SET rejection_reason = ?, is_available = FALSE WHERE id = ?");
                    $stmt->execute([$data['reason'], $data['product_id']]);
                    
                    $stmt = $db->prepare("INSERT INTO notifications (user_id, type, title, message, related_id)
                                         VALUES ((SELECT owner_id FROM products WHERE id = ?), 'product', 'Product Rejected', ?, ?)");
                    $stmt->execute([$data['product_id'], $data['reason'], $data['product_id']]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Product rejected']);
                    break;
            }
            break;
            
        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (isset($data['user_id']) && hasPermission($db, $user['id'], 'users.delete')) {
                $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$data['user_id']]);
                echo json_encode(['success' => true, 'message' => 'User deleted']);
            } else if (isset($data['product_id']) && hasPermission($db, $user['id'], 'products.delete')) {
                $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
                $stmt->execute([$data['product_id']]);
                echo json_encode(['success' => true, 'message' => 'Product deleted']);
            } else {
                throw new Exception('Permission denied');
            }
            break;
    }
} catch(Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
