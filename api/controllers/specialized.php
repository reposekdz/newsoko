<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            if (isset($_GET['type']) && $_GET['type'] === 'spare_parts') {
                $query = "SELECT p.*, sp.*, u.name as owner_name, u.avatar as owner_avatar, u.is_verified as owner_verified
                          FROM products p
                          JOIN spare_parts sp ON p.id = sp.product_id
                          JOIN users u ON p.owner_id = u.id
                          WHERE p.category = 'spare_parts' AND p.is_available = 1
                          ORDER BY p.created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($results as &$item) {
                    $item['images'] = json_decode($item['images']);
                    $item['features'] = json_decode($item['features']);
                }
                
                echo json_encode(['success' => true, 'data' => $results]);
            } elseif (isset($_GET['type']) && $_GET['type'] === 'construction') {
                $query = "SELECT p.*, cm.*, u.name as owner_name, u.avatar as owner_avatar, u.is_verified as owner_verified
                          FROM products p
                          JOIN construction_materials cm ON p.id = cm.product_id
                          JOIN users u ON p.owner_id = u.id
                          WHERE p.category IN ('construction', 'building_materials') AND p.is_available = 1
                          ORDER BY p.created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($results as &$item) {
                    $item['images'] = json_decode($item['images']);
                    $item['features'] = json_decode($item['features']);
                }
                
                echo json_encode(['success' => true, 'data' => $results]);
            } elseif (isset($_GET['type']) && $_GET['type'] === 'rental_equipment') {
                $query = "SELECT p.*, re.*, u.name as owner_name, u.avatar as owner_avatar, u.is_verified as owner_verified
                          FROM products p
                          JOIN rental_equipment re ON p.id = re.product_id
                          JOIN users u ON p.owner_id = u.id
                          WHERE p.category = 'machinery' AND p.is_available = 1
                          ORDER BY p.created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($results as &$item) {
                    $item['images'] = json_decode($item['images']);
                    $item['features'] = json_decode($item['features']);
                }
                
                echo json_encode(['success' => true, 'data' => $results]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid type']);
            }
            break;
            
        case 'POST':
            $user = $auth->requireAuth();
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (isset($data['action']) && $data['action'] === 'create_spare_part') {
                $db->beginTransaction();
                
                try {
                    $productQuery = "INSERT INTO products (title, description, category, images, buy_price, address, lat, lng, owner_id, deposit, features, condition_status)
                                    VALUES (:title, :description, 'spare_parts', :images, :buy_price, :address, :lat, :lng, :owner_id, :deposit, :features, :condition_status)";
                    $stmt = $db->prepare($productQuery);
                    $stmt->bindParam(':title', $data['title']);
                    $stmt->bindParam(':description', $data['description']);
                    $stmt->bindParam(':images', $data['images']);
                    $stmt->bindParam(':buy_price', $data['buy_price']);
                    $stmt->bindParam(':address', $data['address']);
                    $stmt->bindParam(':lat', $data['lat']);
                    $stmt->bindParam(':lng', $data['lng']);
                    $stmt->bindParam(':owner_id', $user['id']);
                    $stmt->bindParam(':deposit', $data['deposit']);
                    $stmt->bindParam(':features', $data['features']);
                    $stmt->bindParam(':condition_status', $data['condition_status']);
                    $stmt->execute();
                    
                    $productId = $db->lastInsertId();
                    
                    $spareQuery = "INSERT INTO spare_parts (product_id, part_number, brand, model, year, compatibility, warranty_months, is_original)
                                  VALUES (:product_id, :part_number, :brand, :model, :year, :compatibility, :warranty_months, :is_original)";
                    $stmt = $db->prepare($spareQuery);
                    $stmt->bindParam(':product_id', $productId);
                    $stmt->bindParam(':part_number', $data['part_number']);
                    $stmt->bindParam(':brand', $data['brand']);
                    $stmt->bindParam(':model', $data['model']);
                    $stmt->bindParam(':year', $data['year']);
                    $stmt->bindParam(':compatibility', $data['compatibility']);
                    $stmt->bindParam(':warranty_months', $data['warranty_months']);
                    $stmt->bindParam(':is_original', $data['is_original']);
                    $stmt->execute();
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'product_id' => $productId]);
                } catch (Exception $e) {
                    $db->rollBack();
                    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                }
            } elseif (isset($data['action']) && $data['action'] === 'create_construction_material') {
                $db->beginTransaction();
                
                try {
                    $productQuery = "INSERT INTO products (title, description, category, images, buy_price, address, lat, lng, owner_id, features, condition_status)
                                    VALUES (:title, :description, :category, :images, :buy_price, :address, :lat, :lng, :owner_id, :features, :condition_status)";
                    $stmt = $db->prepare($productQuery);
                    $stmt->bindParam(':title', $data['title']);
                    $stmt->bindParam(':description', $data['description']);
                    $stmt->bindParam(':category', $data['category']);
                    $stmt->bindParam(':images', $data['images']);
                    $stmt->bindParam(':buy_price', $data['buy_price']);
                    $stmt->bindParam(':address', $data['address']);
                    $stmt->bindParam(':lat', $data['lat']);
                    $stmt->bindParam(':lng', $data['lng']);
                    $stmt->bindParam(':owner_id', $user['id']);
                    $stmt->bindParam(':features', $data['features']);
                    $stmt->bindParam(':condition_status', $data['condition_status']);
                    $stmt->execute();
                    
                    $productId = $db->lastInsertId();
                    
                    $materialQuery = "INSERT INTO construction_materials (product_id, material_type, unit, quantity_available, min_order_quantity, bulk_discount_percentage, delivery_available)
                                     VALUES (:product_id, :material_type, :unit, :quantity_available, :min_order_quantity, :bulk_discount_percentage, :delivery_available)";
                    $stmt = $db->prepare($materialQuery);
                    $stmt->bindParam(':product_id', $productId);
                    $stmt->bindParam(':material_type', $data['material_type']);
                    $stmt->bindParam(':unit', $data['unit']);
                    $stmt->bindParam(':quantity_available', $data['quantity_available']);
                    $stmt->bindParam(':min_order_quantity', $data['min_order_quantity']);
                    $stmt->bindParam(':bulk_discount_percentage', $data['bulk_discount_percentage']);
                    $stmt->bindParam(':delivery_available', $data['delivery_available']);
                    $stmt->execute();
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'product_id' => $productId]);
                } catch (Exception $e) {
                    $db->rollBack();
                    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                }
            } elseif (isset($data['action']) && $data['action'] === 'create_rental_equipment') {
                $db->beginTransaction();
                
                try {
                    $productQuery = "INSERT INTO products (title, description, category, images, rent_price, address, lat, lng, owner_id, deposit, features, condition_status)
                                    VALUES (:title, :description, 'machinery', :images, :rent_price, :address, :lat, :lng, :owner_id, :deposit, :features, :condition_status)";
                    $stmt = $db->prepare($productQuery);
                    $stmt->bindParam(':title', $data['title']);
                    $stmt->bindParam(':description', $data['description']);
                    $stmt->bindParam(':images', $data['images']);
                    $stmt->bindParam(':rent_price', $data['rent_price']);
                    $stmt->bindParam(':address', $data['address']);
                    $stmt->bindParam(':lat', $data['lat']);
                    $stmt->bindParam(':lng', $data['lng']);
                    $stmt->bindParam(':owner_id', $user['id']);
                    $stmt->bindParam(':deposit', $data['deposit']);
                    $stmt->bindParam(':features', $data['features']);
                    $stmt->bindParam(':condition_status', $data['condition_status']);
                    $stmt->execute();
                    
                    $productId = $db->lastInsertId();
                    
                    $equipmentQuery = "INSERT INTO rental_equipment (product_id, equipment_type, hourly_rate, daily_rate, weekly_rate, monthly_rate, fuel_included, driver_included, operator_required, insurance_included, maintenance_status)
                                      VALUES (:product_id, :equipment_type, :hourly_rate, :daily_rate, :weekly_rate, :monthly_rate, :fuel_included, :driver_included, :operator_required, :insurance_included, :maintenance_status)";
                    $stmt = $db->prepare($equipmentQuery);
                    $stmt->bindParam(':product_id', $productId);
                    $stmt->bindParam(':equipment_type', $data['equipment_type']);
                    $stmt->bindParam(':hourly_rate', $data['hourly_rate']);
                    $stmt->bindParam(':daily_rate', $data['daily_rate']);
                    $stmt->bindParam(':weekly_rate', $data['weekly_rate']);
                    $stmt->bindParam(':monthly_rate', $data['monthly_rate']);
                    $stmt->bindParam(':fuel_included', $data['fuel_included']);
                    $stmt->bindParam(':driver_included', $data['driver_included']);
                    $stmt->bindParam(':operator_required', $data['operator_required']);
                    $stmt->bindParam(':insurance_included', $data['insurance_included']);
                    $stmt->bindParam(':maintenance_status', $data['maintenance_status']);
                    $stmt->execute();
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'product_id' => $productId]);
                } catch (Exception $e) {
                    $db->rollBack();
                    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                }
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
