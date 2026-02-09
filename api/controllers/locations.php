<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $action = $_GET['action'] ?? '';
    
    switch($action) {
        case 'provinces':
            $stmt = $db->query("SELECT * FROM rwanda_provinces ORDER BY name");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'districts':
            if (isset($_GET['province_id'])) {
                $stmt = $db->prepare("SELECT * FROM rwanda_districts WHERE province_id = ? ORDER BY name");
                $stmt->execute([$_GET['province_id']]);
            } else {
                $stmt = $db->query("SELECT d.*, p.name as province_name FROM rwanda_districts d 
                                   JOIN rwanda_provinces p ON d.province_id = p.id ORDER BY d.name");
            }
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'sectors':
            if (isset($_GET['district_id'])) {
                $stmt = $db->prepare("SELECT * FROM rwanda_sectors WHERE district_id = ? ORDER BY name");
                $stmt->execute([$_GET['district_id']]);
            } else {
                $stmt = $db->query("SELECT s.*, d.name as district_name FROM rwanda_sectors s 
                                   JOIN rwanda_districts d ON s.district_id = d.id ORDER BY s.name");
            }
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'hierarchy':
            $stmt = $db->query("SELECT p.id as province_id, p.name as province_name,
                               d.id as district_id, d.name as district_name,
                               s.id as sector_id, s.name as sector_name
                               FROM rwanda_provinces p
                               LEFT JOIN rwanda_districts d ON p.id = d.province_id
                               LEFT JOIN rwanda_sectors s ON d.id = s.district_id
                               ORDER BY p.name, d.name, s.name");
            
            $hierarchy = [];
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $pId = $row['province_id'];
                if (!isset($hierarchy[$pId])) {
                    $hierarchy[$pId] = [
                        'id' => $pId,
                        'name' => $row['province_name'],
                        'districts' => []
                    ];
                }
                
                if ($row['district_id']) {
                    $dId = $row['district_id'];
                    if (!isset($hierarchy[$pId]['districts'][$dId])) {
                        $hierarchy[$pId]['districts'][$dId] = [
                            'id' => $dId,
                            'name' => $row['district_name'],
                            'sectors' => []
                        ];
                    }
                    
                    if ($row['sector_id']) {
                        $hierarchy[$pId]['districts'][$dId]['sectors'][] = [
                            'id' => $row['sector_id'],
                            'name' => $row['sector_name']
                        ];
                    }
                }
            }
            
            foreach ($hierarchy as &$province) {
                $province['districts'] = array_values($province['districts']);
            }
            
            echo json_encode(['success' => true, 'data' => array_values($hierarchy)]);
            break;
            
        case 'stats':
            $stats = [
                'provinces' => $db->query("SELECT COUNT(*) FROM rwanda_provinces")->fetchColumn(),
                'districts' => $db->query("SELECT COUNT(*) FROM rwanda_districts")->fetchColumn(),
                'sectors' => $db->query("SELECT COUNT(*) FROM rwanda_sectors")->fetchColumn(),
                'users_by_province' => $db->query("SELECT p.name, COUNT(u.id) as count 
                                                   FROM rwanda_provinces p 
                                                   LEFT JOIN users u ON p.id = u.province_id 
                                                   GROUP BY p.id")->fetchAll(PDO::FETCH_ASSOC),
                'products_by_province' => $db->query("SELECT p.name, COUNT(pr.id) as count 
                                                      FROM rwanda_provinces p 
                                                      LEFT JOIN products pr ON p.id = pr.province_id 
                                                      GROUP BY p.id")->fetchAll(PDO::FETCH_ASSOC)
            ];
            echo json_encode(['success' => true, 'data' => $stats]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch(Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
