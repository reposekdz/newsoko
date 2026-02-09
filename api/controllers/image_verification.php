<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../services/AIFraudDetection.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$ai = new AIFraudDetection($db);
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$action = $data['action'] ?? '';

switch($action) {
    case 'verify_authenticity':
        $result = $ai->verifyImageAuthenticity($data['image_path']);
        echo json_encode(array_merge(['success' => true], $result));
        break;
        
    case 'detect_ai':
        $result = $ai->detectAIGeneratedImage($data['image_path']);
        echo json_encode(array_merge(['success' => true], $result));
        break;
        
    case 'verify_live':
        $result = $ai->verifyLivePhoto($data['image_path'], $data['user_id']);
        echo json_encode(array_merge(['success' => true], $result));
        break;
        
    case 'analyze_seller':
        $result = $ai->analyzeSellerBehavior($data['seller_id']);
        echo json_encode(array_merge(['success' => true], $result));
        break;
        
    case 'analyze_description':
        $result = $ai->analyzeProductDescription($data['description'], $data['title']);
        echo json_encode(array_merge(['success' => true], $result));
        break;
        
    case 'comprehensive_check':
        $result = $ai->comprehensiveFraudCheck($data['product_data'], $data['seller_id']);
        echo json_encode(array_merge(['success' => true], $result));
        break;
        
    case 'google_vision':
        if (!getenv('GOOGLE_APPLICATION_CREDENTIALS')) {
            echo json_encode(['success' => false, 'message' => 'Google Vision not configured']);
            exit;
        }
        
        try {
            if (file_exists('../vendor/autoload.php')) {
                require_once '../vendor/autoload.php';
                $client = new \Google\Cloud\Vision\V1\ImageAnnotatorClient();
                $image = file_get_contents($data['image_path']);
                $response = $client->labelDetection($image);
                $labels = [];
                
                foreach ($response->getLabelAnnotations() as $label) {
                    $labels[] = [
                        'description' => $label->getDescription(),
                        'score' => $label->getScore()
                    ];
                }
                
                $client->close();
                echo json_encode(['success' => true, 'labels' => $labels]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Google Vision SDK not installed']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
