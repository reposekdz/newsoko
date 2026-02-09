<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../models/User.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$user = new User($db);
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $result = $user->getById($_GET['id']);
            echo json_encode(['success' => true, 'data' => $result]);
        } else {
            $results = $user->getAll();
            echo json_encode(['success' => true, 'data' => $results]);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data['action']) && $data['action'] === 'login') {
            $result = $user->login($data['email'], $data['password']);
            if ($result) {
                $token = $auth->generateToken($result['id']);
                $result['token'] = $token;
                unset($result['password']);
                echo json_encode(['success' => true, 'data' => $result]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
            }
        } elseif (isset($data['action']) && $data['action'] === 'register') {
            // Add location data to registration
            if (isset($data['province_id'])) $data['province_id'] = (int)$data['province_id'];
            if (isset($data['district_id'])) $data['district_id'] = (int)$data['district_id'];
            if (isset($data['sector_id'])) $data['sector_id'] = (int)$data['sector_id'];
            
            $userId = $user->register($data);
            if ($userId) {
                $token = $auth->generateToken($userId);
                echo json_encode(['success' => true, 'user_id' => $userId, 'token' => $token]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Registration failed']);
            }
        } elseif (isset($data['action']) && $data['action'] === 'logout') {
            $token = $data['token'] ?? null;
            if ($token && $auth->logout($token)) {
                echo json_encode(['success' => true, 'message' => 'Logged out']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Logout failed']);
            }
        } elseif (isset($data['action']) && $data['action'] === 'verify_token') {
            $token = $data['token'] ?? null;
            $userData = $auth->validateToken($token);
            if ($userData) {
                unset($userData['password']);
                echo json_encode(['success' => true, 'data' => $userData]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid token']);
            }
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>
