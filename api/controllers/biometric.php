<?php
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

switch($method) {
    case 'POST':
        if (isset($data['action'])) {
            switch($data['action']) {
                case 'register-challenge':
                    $challenge = base64_encode(random_bytes(32));
                    $userId = array_map('ord', str_split(str_pad($data['user_id'], 16, "\0")));
                    
                    $_SESSION['webauthn_challenge'] = $challenge;
                    $_SESSION['webauthn_user_id'] = $data['user_id'];
                    
                    echo json_encode([
                        'success' => true,
                        'challenge' => $challenge,
                        'userId' => $userId
                    ]);
                    break;
                    
                case 'register':
                    $query = "INSERT INTO biometric_credentials (user_id, credential_id, public_key, 
                             device_name, device_type) VALUES (:user_id, :cred_id, :pub_key, :device, :type)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user_id', $data['user_id']);
                    $stmt->bindParam(':cred_id', $data['credential_id']);
                    $stmt->bindParam(':pub_key', $data['public_key']);
                    $stmt->bindParam(':device', $data['device_name']);
                    $type = detectDeviceType();
                    $stmt->bindParam(':type', $type);
                    
                    if ($stmt->execute()) {
                        echo json_encode(['success' => true, 'message' => 'Biometric registered']);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Registration failed']);
                    }
                    break;
                    
                case 'auth-challenge':
                    $challenge = base64_encode(random_bytes(32));
                    $_SESSION['webauthn_challenge'] = $challenge;
                    
                    $query = "SELECT credential_id FROM biometric_credentials WHERE user_id = :user_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':user_id', $data['user_id']);
                    $stmt->execute();
                    $credentials = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    echo json_encode([
                        'success' => true,
                        'challenge' => $challenge,
                        'credentials' => $credentials
                    ]);
                    break;
                    
                case 'verify':
                    $query = "SELECT * FROM biometric_credentials WHERE credential_id = :cred_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':cred_id', $data['credential_id']);
                    $stmt->execute();
                    $credential = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($credential) {
                        $query = "UPDATE biometric_credentials SET last_used = NOW() WHERE id = :id";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':id', $credential['id']);
                        $stmt->execute();
                        
                        $token = $auth->generateToken($credential['user_id']);
                        echo json_encode(['success' => true, 'token' => $token]);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Verification failed']);
                    }
                    break;
            }
        }
        break;
}

function detectDeviceType() {
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    if (preg_match('/iPhone|iPad/', $ua)) return 'face_id';
    if (preg_match('/Windows/', $ua)) return 'windows_hello';
    return 'fingerprint';
}
