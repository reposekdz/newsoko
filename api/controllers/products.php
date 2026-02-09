<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../config/database.php';
require_once '../models/Product.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$product = new Product($db);
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'PUT':
        $auth = new Auth($db);
        $user = $auth->requireAuth();
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        try {
            $db->beginTransaction();
            
            $stmt = $db->prepare("UPDATE products SET
                title = ?, description = ?, category_id = ?, images = ?, rent_price = ?, buy_price = ?,
                address = ?, deposit = ?, features = ?, condition_status = ?, stock_quantity = ?,
                weight = ?, dimensions = ?, brand = ?, model = ?, year_manufactured = ?,
                warranty_period = ?, tags = ?, seo_title = ?, seo_description = ?, is_featured = ?,
                discount_percentage = ?
                WHERE id = ?");
            
            $stmt->execute([
                $data['title'],
                $data['description'],
                $data['category_id'],
                json_encode($data['images']),
                $data['rent_price'],
                $data['buy_price'],
                $data['address'],
                $data['deposit'],
                json_encode($data['features']),
                $data['condition_status'],
                $data['stock_quantity'],
                $data['weight'],
                $data['dimensions'],
                $data['brand'],
                $data['model'],
                $data['year_manufactured'],
                $data['warranty_period'],
                json_encode($data['tags']),
                $data['seo_title'],
                $data['seo_description'],
                $data['is_featured'] ?? false,
                $data['discount_percentage'] ?? 0,
                $data['id']
            ]);
            
            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Product updated']);
        } catch(Exception $e) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
        
    case 'GET':
        if (isset($_GET['id'])) {
            $result = $product->getById($_GET['id']);
            if ($result) {
                // Hide exhausted products
                if ($result['stock_quantity'] <= 0 && $result['listing_type'] === 'sale') {
                    echo json_encode(['success' => false, 'message' => 'Product not available']);
                    break;
                }
                
                $result['images'] = json_decode($result['images']);
                $result['features'] = json_decode($result['features']);
                
                // Hide seller contact info - only show name and rating
                $result['owner'] = [
                    'id' => $result['owner_id'],
                    'name' => $result['owner_name'],
                    'avatar' => $result['owner_avatar'],
                    'isVerified' => (bool)$result['owner_verified'],
                    'rating' => (float)$result['owner_rating'],
                    'reviewCount' => (int)$result['owner_review_count'],
                    'location' => $result['owner_location']
                ];
                
                // Get attributes
                $stmt = $db->prepare("SELECT * FROM product_attributes WHERE product_id = ?");
                $stmt->execute([$result['id']]);
                $result['attributes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get variants
                $stmt = $db->prepare("SELECT * FROM product_variants WHERE product_id = ? AND is_available = 1");
                $stmt->execute([$result['id']]);
                $result['variants'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get related products
                $stmt = $db->prepare("SELECT p.*, u.full_name as owner_name, u.avatar as owner_avatar 
                    FROM products p 
                    JOIN users u ON p.owner_id = u.id 
                    WHERE p.category_id = ? AND p.id != ? AND p.status = 'approved' 
                    AND (p.stock_quantity > 0 OR p.listing_type = 'rent') 
                    ORDER BY p.views DESC LIMIT 6");
                $stmt->execute([$result['category_id'], $result['id']]);
                $related = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($related as &$rel) {
                    $rel['images'] = json_decode($rel['images']);
                }
                $result['related_products'] = $related;
                
                $result['tags'] = json_decode($result['tags'] ?? '[]');
                echo json_encode(['success' => true, 'data' => $result]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Product not found']);
            }
        } elseif (isset($_GET['stats'])) {
            $stats = $product->getStats();
            echo json_encode(['success' => true, 'data' => $stats]);
        } else {
            $category = $_GET['category'] ?? null;
            $search = $_GET['search'] ?? null;
            $limit = $_GET['limit'] ?? 50;
            $sort = $_GET['sort'] ?? 'newest';
            $minPrice = $_GET['min_price'] ?? null;
            $maxPrice = $_GET['max_price'] ?? null;
            $condition = $_GET['condition'] ?? null;
            $location = $_GET['location'] ?? null;
            
            $results = $product->getAll($category, $search, $limit, $sort, $minPrice, $maxPrice, $condition, $location);
            
            // Get attributes and variants for each product
            $attrStmt = $db->prepare("SELECT * FROM product_attributes WHERE product_id = ?");
            $variantStmt = $db->prepare("SELECT * FROM product_variants WHERE product_id = ? AND is_available = 1");
            
            $filteredResults = [];
            foreach ($results as &$item) {
                // Hide exhausted products from listing
                if ($item['stock_quantity'] <= 0 && $item['listing_type'] === 'sale') {
                    continue;
                }
                
                $item['images'] = json_decode($item['images']);
                $item['features'] = json_decode($item['features']);
                
                // Hide seller contact info
                $item['owner'] = [
                    'id' => $item['owner_id'],
                    'name' => $item['owner_name'],
                    'avatar' => $item['owner_avatar'],
                    'isVerified' => (bool)$item['owner_verified'],
                    'rating' => (float)$item['owner_rating'],
                    'reviewCount' => (int)$item['owner_review_count'],
                    'location' => $item['owner_location']
                ];
                
                // Get attributes
                $attrStmt->execute([$item['id']]);
                $item['attributes'] = $attrStmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get variants
                $variantStmt->execute([$item['id']]);
                $item['variants'] = $variantStmt->fetchAll(PDO::FETCH_ASSOC);
                
                $item['tags'] = json_decode($item['tags'] ?? '[]');
                $filteredResults[] = $item;
            }
            
            echo json_encode(['success' => true, 'data' => $filteredResults]);
        }
        break;
        
    case 'POST':
        $auth = new Auth($db);
        $user = $auth->requireAuth();
        
        $data = json_decode(file_get_contents("php://input"), true);
        $data['owner_id'] = $user['id'];
        
        try {
            $db->beginTransaction();
            
            // Create main product
            $stmt = $db->prepare("INSERT INTO products 
                (title, description, category_id, images, rent_price, buy_price, address, lat, lng,
                 owner_id, deposit, features, condition_status, sku, stock_quantity, weight, dimensions,
                 brand, model, year_manufactured, warranty_period, tags, seo_title, seo_description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $stmt->execute([
                $data['title'],
                $data['description'],
                $data['category_id'] ?? null,
                json_encode($data['images'] ?? []),
                $data['rent_price'] ?? null,
                $data['buy_price'] ?? null,
                $data['address'],
                $data['lat'] ?? null,
                $data['lng'] ?? null,
                $data['owner_id'],
                $data['deposit'] ?? null,
                json_encode($data['features'] ?? []),
                $data['condition_status'] ?? 'good',
                $data['sku'] ?? null,
                $data['stock_quantity'] ?? 0,
                $data['weight'] ?? null,
                $data['dimensions'] ?? null,
                $data['brand'] ?? null,
                $data['model'] ?? null,
                $data['year_manufactured'] ?? null,
                $data['warranty_period'] ?? null,
                json_encode($data['tags'] ?? []),
                $data['seo_title'] ?? $data['title'],
                $data['seo_description'] ?? $data['description']
            ]);
            
            $productId = $db->lastInsertId();
            
            // Add product attributes
            if (!empty($data['attributes'])) {
                $stmt = $db->prepare("INSERT INTO product_attributes (product_id, attribute_name, attribute_value) VALUES (?, ?, ?)");
                foreach ($data['attributes'] as $attr) {
                    $stmt->execute([$productId, $attr['name'], $attr['value']]);
                }
            }
            
            // Add product variants
            if (!empty($data['variants'])) {
                $stmt = $db->prepare("INSERT INTO product_variants 
                    (product_id, variant_name, variant_value, price_adjustment, stock_quantity, sku)
                    VALUES (?, ?, ?, ?, ?, ?)");
                foreach ($data['variants'] as $variant) {
                    $stmt->execute([
                        $productId,
                        $variant['name'],
                        $variant['value'],
                        $variant['price_adjustment'] ?? 0,
                        $variant['stock_quantity'] ?? 0,
                        $variant['sku'] ?? null
                    ]);
                }
            }
            
            // Log inventory
            if (isset($data['stock_quantity']) && $data['stock_quantity'] > 0) {
                $stmt = $db->prepare("INSERT INTO inventory_logs 
                    (product_id, change_type, quantity, previous_quantity, new_quantity, reason, admin_id)
                    VALUES (?, 'add', ?, 0, ?, 'Initial stock', ?)");
                $stmt->execute([$productId, $data['stock_quantity'], $data['stock_quantity'], $user['id']]);
            }
            
            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Product created', 'product_id' => $productId]);
        } catch(Exception $e) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        $auth = new Auth($db);
        $user = $auth->requireAuth();
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Check if user owns product or is admin
        $stmt = $db->prepare("SELECT owner_id FROM products WHERE id = ?");
        $stmt->execute([$data['id']]);
        $ownerId = $stmt->fetchColumn();
        
        if ($ownerId != $user['id'] && !$user['is_admin']) {
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            break;
        }
        
        $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
        if ($stmt->execute([$data['id']])) {
            echo json_encode(['success' => true, 'message' => 'Product deleted']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete product']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>
