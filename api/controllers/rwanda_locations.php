<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'provinces';
        
        switch ($action) {
            case 'provinces':
                // Get all provinces
                $query = "SELECT id, name, code FROM rwanda_provinces ORDER BY name";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $provinces = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $provinces
                ]);
                break;
                
            case 'districts':
                // Get districts by province
                $province_id = $_GET['province_id'] ?? 0;
                
                if ($province_id) {
                    $query = "SELECT id, name, code FROM rwanda_districts 
                             WHERE province_id = :province_id ORDER BY name";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':province_id', $province_id);
                } else {
                    $query = "SELECT d.id, d.name, d.code, d.province_id, p.name as province_name
                             FROM rwanda_districts d
                             JOIN rwanda_provinces p ON d.province_id = p.id
                             ORDER BY p.name, d.name";
                    $stmt = $db->prepare($query);
                }
                
                $stmt->execute();
                $districts = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $districts
                ]);
                break;
                
            case 'sectors':
                // Get sectors by district
                $district_id = $_GET['district_id'] ?? 0;
                
                if ($district_id) {
                    $query = "SELECT id, name, code FROM rwanda_sectors 
                             WHERE district_id = :district_id ORDER BY name";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':district_id', $district_id);
                } else {
                    $query = "SELECT s.id, s.name, s.code, s.district_id, 
                             d.name as district_name, p.name as province_name
                             FROM rwanda_sectors s
                             JOIN rwanda_districts d ON s.district_id = d.id
                             JOIN rwanda_provinces p ON d.province_id = p.id
                             ORDER BY p.name, d.name, s.name";
                    $stmt = $db->prepare($query);
                }
                
                $stmt->execute();
                $sectors = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $sectors
                ]);
                break;
                
            case 'hierarchy':
                // Get complete hierarchy
                $query = "SELECT 
                         p.id as province_id, p.name as province_name, p.code as province_code,
                         d.id as district_id, d.name as district_name, d.code as district_code,
                         s.id as sector_id, s.name as sector_name
                         FROM rwanda_provinces p
                         LEFT JOIN rwanda_districts d ON p.id = d.province_id
                         LEFT JOIN rwanda_sectors s ON d.id = s.district_id
                         ORDER BY p.name, d.name, s.name";
                
                $stmt = $db->prepare($query);
                $stmt->execute();
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Organize into hierarchy
                $hierarchy = [];
                foreach ($results as $row) {
                    $province_id = $row['province_id'];
                    $district_id = $row['district_id'];
                    
                    if (!isset($hierarchy[$province_id])) {
                        $hierarchy[$province_id] = [
                            'id' => $province_id,
                            'name' => $row['province_name'],
                            'code' => $row['province_code'],
                            'districts' => []
                        ];
                    }
                    
                    if ($district_id && !isset($hierarchy[$province_id]['districts'][$district_id])) {
                        $hierarchy[$province_id]['districts'][$district_id] = [
                            'id' => $district_id,
                            'name' => $row['district_name'],
                            'code' => $row['district_code'],
                            'sectors' => []
                        ];
                    }
                    
                    if ($row['sector_id']) {
                        $hierarchy[$province_id]['districts'][$district_id]['sectors'][] = [
                            'id' => $row['sector_id'],
                            'name' => $row['sector_name']
                        ];
                    }
                }
                
                // Convert to indexed arrays
                $formatted = [];
                foreach ($hierarchy as $province) {
                    $province['districts'] = array_values($province['districts']);
                    $formatted[] = $province;
                }
                
                echo json_encode([
                    'success' => true,
                    'data' => $formatted
                ]);
                break;
                
            case 'search':
                // Search locations
                $search = $_GET['q'] ?? '';
                
                if (strlen($search) < 2) {
                    echo json_encode(['success' => false, 'message' => 'Search term too short']);
                    exit;
                }
                
                $search_term = "%{$search}%";
                
                $query = "SELECT 
                         'province' as type, p.id, p.name, NULL as parent_name
                         FROM rwanda_provinces p
                         WHERE p.name LIKE :search
                         UNION
                         SELECT 
                         'district' as type, d.id, d.name, p.name as parent_name
                         FROM rwanda_districts d
                         JOIN rwanda_provinces p ON d.province_id = p.id
                         WHERE d.name LIKE :search
                         UNION
                         SELECT 
                         'sector' as type, s.id, s.name, d.name as parent_name
                         FROM rwanda_sectors s
                         JOIN rwanda_districts d ON s.district_id = d.id
                         WHERE s.name LIKE :search
                         LIMIT 20";
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':search', $search_term);
                $stmt->execute();
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $results
                ]);
                break;
                
            case 'stats':
                // Get location statistics
                $query = "SELECT 
                         (SELECT COUNT(*) FROM rwanda_provinces) as total_provinces,
                         (SELECT COUNT(*) FROM rwanda_districts) as total_districts,
                         (SELECT COUNT(*) FROM rwanda_sectors) as total_sectors,
                         (SELECT COUNT(*) FROM users WHERE province_id IS NOT NULL) as users_with_location";
                
                $stmt = $db->prepare($query);
                $stmt->execute();
                $stats = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'data' => $stats
                ]);
                break;
                
            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
