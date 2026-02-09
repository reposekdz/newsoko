<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
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

$user = \$auth->requireAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    switch ($method) {
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (isset($data['action']) && $data['action'] === 'create_product') {
                $db->beginTransaction();
                
                try {
                    $query = "INSERT INTO products 
                             (title, description, category, images, rent_price, buy_price, 
                              address, lat, lng, owner_id, deposit, features, condition_status,
                              is_available, stock_quantity, min_rental_days, max_rental_days)
                             VALUES (:title, :desc, :cat, :imgs, :rent, :buy, 
                                     :addr, :lat, :lng, :owner, :dep, :feat, :cond,
                                     TRUE, :stock, :min_days, :max_days)";
                    
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':title', $data['title']);
                    $stmt->bindParam(':desc', $data['description']);
                    $stmt->bindParam(':cat', $data['category']);
                    $images = json_encode($data['images']);
                    $stmt->bindParam(':imgs', $images);
                    $stmt->bindParam(':rent', $data['rent_price']);
                    $stmt->bindParam(':buy', $data['buy_price']);
                    $stmt->bindParam(':addr', $data['address']);
                    $stmt->bindParam(':lat', $data['lat']);
                    $stmt->bindParam(':lng', $data['lng']);
                    $stmt->bindParam(':owner', $user['user_id']);
                    $stmt->bindParam(':dep', $data['deposit']);
                    $features = json_encode($data['features']);
                    $stmt->bindParam(':feat', $features);
                    $stmt->bindParam(':cond', $data['condition']);
                    $stock = $data['stock_quantity'] ?? 1;
                    $stmt->bindParam(':stock', $stock);
                    $min_days = $data['min_rental_days'] ?? 1;
                    $stmt->bindParam(':min_days', $min_days);
                    $max_days = $data['max_rental_days'] ?? 365;
                    $stmt->bindParam(':max_days', $max_days);
                    $stmt->execute();
                    
                    $product_id = $db->lastInsertId();
                    
                    // Add variants if provided
                    if (isset($data['variants']) && is_array($data['variants'])) {
                        foreach ($data['variants'] as $variant) {
                            $query = "INSERT INTO product_variants 
                                     (product_id, variant_name, variant_value, price_adjustment, stock_quantity)
                                     VALUES (:pid, :name, :value, :price, :stock)";
                            $stmt = $db->prepare($query);
                            $stmt->bindParam(':pid', $product_id);
                            $stmt->bindParam(':name', $variant['name']);
                            $stmt->bindParam(':value', $variant['value']);
                            $stmt->bindParam(':price', $variant['price_adjustment']);
                            $stmt->bindParam(':stock', $variant['stock']);
                            $stmt->execute();
                        }
                    }
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'product_id' => $product_id]);
                    
                } catch (Exception $e) {
                    $db->rollBack();
                    throw $e;
                }
                
            } elseif (isset($data['action']) && $data['action'] === 'bulk_upload') {
                $products = $data['products'];
                $created = 0;
                $failed = 0;
                
                foreach ($products as $product) {
                    try {
                        $query = "INSERT INTO products 
                                 (title, description, category, images, rent_price, buy_price, 
                                  address, owner_id, deposit, condition_status)
                                 VALUES (:title, :desc, :cat, :imgs, :rent, :buy, :addr, :owner, :dep, :cond)";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':title', $product['title']);
                        $stmt->bindParam(':desc', $product['description']);
                        $stmt->bindParam(':cat', $product['category']);
                        $images = json_encode($product['images']);
                        $stmt->bindParam(':imgs', $images);
                        $stmt->bindParam(':rent', $product['rent_price']);
                        $stmt->bindParam(':buy', $product['buy_price']);
                        $stmt->bindParam(':addr', $product['address']);
                        $stmt->bindParam(':owner', $user['user_id']);
                        $stmt->bindParam(':dep', $product['deposit']);
                        $stmt->bindParam(':cond', $product['condition']);
                        $stmt->execute();
                        $created++;
                    } catch (Exception $e) {
                        $failed++;
                    }
                }
                
                echo json_encode(['success' => true, 'created' => $created, 'failed' => $failed]);
                
            } elseif (isset($data['action']) && $data['action'] === 'update_inventory') {
                $product_id = $data['product_id'];
                $stock_quantity = $data['stock_quantity'];
                
                $query = "UPDATE products SET stock_quantity = :stock WHERE id = :pid AND owner_id = :owner";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':stock', $stock_quantity);
                $stmt->bindParam(':pid', $product_id);
                $stmt->bindParam(':owner', $user['user_id']);
                $stmt->execute();
                
                echo json_encode(['success' => true]);
            }
            break;
            
        case 'GET':
            if (isset($_GET['my_products'])) {
                $query = "SELECT p.*, 
                         (SELECT COUNT(*) FROM bookings WHERE product_id = p.id) as total_bookings,
                         (SELECT COUNT(*) FROM bookings WHERE product_id = p.id AND status = 'active') as active_bookings
                         FROM products p
                         WHERE p.owner_id = :owner
                         ORDER BY p.created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':owner', $user['user_id']);
                $stmt->execute();
                $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($products as &$product) {
                    $product['images'] = json_decode($product['images'], true);
                    $product['features'] = json_decode($product['features'], true);
                }
                
                echo json_encode(['success' => true, 'data' => $products]);
                
            } elseif (isset($_GET['inventory_report'])) {
                $query = "SELECT 
                         COUNT(*) as total_products,
                         SUM(stock_quantity) as total_stock,
                         SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
                         SUM(CASE WHEN stock_quantity < 5 THEN 1 ELSE 0 END) as low_stock
                         FROM products WHERE owner_id = :owner";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':owner', $user['user_id']);
                $stmt->execute();
                $report = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $report]);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            $product_id = $data['product_id'];
            
            $query = "UPDATE products SET 
                     title = :title, description = :desc, category = :cat,
                     rent_price = :rent, buy_price = :buy, deposit = :dep,
                     condition_status = :cond, stock_quantity = :stock
                     WHERE id = :pid AND owner_id = :owner";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':desc', $data['description']);
            $stmt->bindParam(':cat', $data['category']);
            $stmt->bindParam(':rent', $data['rent_price']);
            $stmt->bindParam(':buy', $data['buy_price']);
            $stmt->bindParam(':dep', $data['deposit']);
            $stmt->bindParam(':cond', $data['condition']);
            $stmt->bindParam(':stock', $data['stock_quantity']);
            $stmt->bindParam(':pid', $product_id);
            $stmt->bindParam(':owner', $user['user_id']);
            $stmt->execute();
            
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"), true);
            $product_id = $data['product_id'];
            
            $query = "DELETE FROM products WHERE id = :pid AND owner_id = :owner";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':pid', $product_id);
            $stmt->bindParam(':owner', $user['user_id']);
            $stmt->execute();
            
            echo json_encode(['success' => true]);
            break;
    }
    
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
