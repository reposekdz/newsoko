<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// GET - Get product questions
if ($method === 'GET') {
    $productId = $_GET['product_id'] ?? null;
    
    if ($productId) {
        $stmt = $db->prepare("SELECT q.*, u.full_name as user_name, a.full_name as answerer_name FROM product_questions q JOIN users u ON q.user_id = u.id LEFT JOIN users a ON q.answered_by = a.id WHERE q.product_id = :product_id AND q.is_public = TRUE ORDER BY q.created_at DESC");
        $stmt->bindParam(':product_id', $productId);
        $stmt->execute();
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'questions' => $questions]);
        exit();
    }
}

// POST - Ask or answer question
if ($method === 'POST') {
    $user = $auth->requireAuth();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $action = $input['action'] ?? '';
    
    if ($action === 'ask') {
        $productId = $input['product_id'] ?? null;
        $question = $input['question'] ?? '';
        
        if (!$productId || !$question) {
            echo json_encode(['success' => false, 'message' => 'Product ID and question required']);
            exit();
        }
        
        $stmt = $db->prepare("INSERT INTO product_questions (product_id, user_id, question) VALUES (:product_id, :user_id, :question)");
        $stmt->bindParam(':product_id', $productId);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->bindParam(':question', $question);
        $stmt->execute();
        
        // Update product question count
        $updateStmt = $db->prepare("UPDATE products SET question_count = question_count + 1 WHERE id = :id");
        $updateStmt->bindParam(':id', $productId);
        $updateStmt->execute();
        
        echo json_encode(['success' => true, 'question_id' => $db->lastInsertId()]);
        exit();
    }
    
    if ($action === 'answer') {
        $questionId = $input['question_id'] ?? null;
        $answer = $input['answer'] ?? '';
        
        if (!$questionId || !$answer) {
            echo json_encode(['success' => false, 'message' => 'Question ID and answer required']);
            exit();
        }
        
        // Check if user is the product seller
        $checkStmt = $db->prepare("SELECT p.seller_id FROM product_questions q JOIN products p ON q.product_id = p.id WHERE q.id = :question_id");
        $checkStmt->bindParam(':question_id', $questionId);
        $checkStmt->execute();
        $check = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$check || $check['seller_id'] != $user['id']) {
            echo json_encode(['success' => false, 'message' => 'Only the seller can answer this question']);
            exit();
        }
        
        $stmt = $db->prepare("UPDATE product_questions SET answer = :answer, answered_by = :answered_by, answered_at = NOW() WHERE id = :id");
        $stmt->bindParam(':answer', $answer);
        $stmt->bindParam(':answered_by', $user['id']);
        $stmt->bindParam(':id', $questionId);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Answer posted successfully']);
        exit();
    }
    
    if ($action === 'mark_helpful') {
        $questionId = $input['question_id'] ?? null;
        
        $stmt = $db->prepare("UPDATE product_questions SET helpful_count = helpful_count + 1 WHERE id = :id");
        $stmt->bindParam(':id', $questionId);
        $stmt->execute();
        
        echo json_encode(['success' => true]);
        exit();
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
