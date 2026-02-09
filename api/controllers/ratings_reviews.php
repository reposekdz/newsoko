<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Submit Review
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'submit_review') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $bookingId = $input['booking_id'] ?? 0;
    $rating = $input['rating'] ?? 0;
    $review = $input['review'] ?? '';
    $reviewType = $input['review_type'] ?? 'product'; // 'product' or 'seller'

    // Verify booking exists and user is the renter
    $bookingQuery = "SELECT b.*, p.owner_id FROM bookings b 
                    JOIN products p ON b.product_id = p.id 
                    WHERE b.id = :id AND b.renter_id = :user_id AND b.status = 'completed'";
    $stmt = $db->prepare($bookingQuery);
    $stmt->bindParam(':id', $bookingId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
        echo json_encode(['success' => false, 'message' => 'Booking not found or not eligible for review']);
        exit();
    }

    // Check if already reviewed
    $checkQuery = "SELECT id FROM ratings_reviews WHERE booking_id = :booking_id AND review_type = :type";
    $stmt = $db->prepare($checkQuery);
    $stmt->bindParam(':booking_id', $bookingId);
    $stmt->bindParam(':type', $reviewType);
    $stmt->execute();
    
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'You have already reviewed this']);
        exit();
    }

    $db->beginTransaction();
    try {
        // Insert review
        $targetId = ($reviewType === 'product') ? $booking['product_id'] : $booking['owner_id'];
        
        $query = "INSERT INTO ratings_reviews (booking_id, reviewer_id, target_id, target_type, rating, review) 
                  VALUES (:booking_id, :reviewer_id, :target_id, :target_type, :rating, :review)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':booking_id', $bookingId);
        $stmt->bindParam(':reviewer_id', $userId);
        $stmt->bindParam(':target_id', $targetId);
        $stmt->bindParam(':target_type', $reviewType);
        $stmt->bindParam(':rating', $rating);
        $stmt->bindParam(':review', $review);
        $stmt->execute();

        // Update average rating
        if ($reviewType === 'product') {
            $updateQuery = "UPDATE products SET 
                           average_rating = (SELECT AVG(rating) FROM ratings_reviews WHERE target_id = :id AND target_type = 'product'),
                           total_reviews = (SELECT COUNT(*) FROM ratings_reviews WHERE target_id = :id AND target_type = 'product')
                           WHERE id = :id";
        } else {
            $updateQuery = "UPDATE users SET 
                           seller_rating = (SELECT AVG(rating) FROM ratings_reviews WHERE target_id = :id AND target_type = 'seller'),
                           total_seller_reviews = (SELECT COUNT(*) FROM ratings_reviews WHERE target_id = :id AND target_type = 'seller')
                           WHERE id = :id";
        }
        
        $stmt = $db->prepare($updateQuery);
        $stmt->bindParam(':id', $targetId);
        $stmt->execute();

        // Check for low ratings and flag seller
        if ($reviewType === 'seller' && $rating <= 2) {
            $checkLowRatings = "SELECT COUNT(*) as low_count FROM ratings_reviews 
                               WHERE target_id = :seller_id AND target_type = 'seller' AND rating <= 2";
            $stmt = $db->prepare($checkLowRatings);
            $stmt->bindParam(':seller_id', $targetId);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result['low_count'] >= 3) {
                $flagQuery = "UPDATE users SET account_status = 'flagged', 
                             flagged_reason = 'Multiple low ratings' WHERE id = :id";
                $stmt = $db->prepare($flagQuery);
                $stmt->bindParam(':id', $targetId);
                $stmt->execute();
            }
        }

        // Notify seller
        $notifQuery = "INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) 
                      VALUES (:user_id, 'review', 'New Review', 'You received a new review', :ref_id, 'review')";
        $stmt = $db->prepare($notifQuery);
        $stmt->bindParam(':user_id', $booking['owner_id']);
        $stmt->bindParam(':ref_id', $db->lastInsertId());
        $stmt->execute();

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Review submitted successfully']);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to submit review: ' . $e->getMessage()]);
    }
    exit();
}

// Get Product Reviews
if ($method === 'GET' && isset($_GET['product_reviews'])) {
    $productId = $_GET['product_id'] ?? 0;
    
    $query = "SELECT rr.*, u.name as reviewer_name, u.avatar as reviewer_avatar 
              FROM ratings_reviews rr 
              JOIN users u ON rr.reviewer_id = u.id 
              WHERE rr.target_id = :product_id AND rr.target_type = 'product' 
              ORDER BY rr.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':product_id', $productId);
    $stmt->execute();
    
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $reviews]);
    exit();
}

// Get Seller Reviews
if ($method === 'GET' && isset($_GET['seller_reviews'])) {
    $sellerId = $_GET['seller_id'] ?? 0;
    
    $query = "SELECT rr.*, u.name as reviewer_name, u.avatar as reviewer_avatar,
              p.title as product_title, p.images as product_images
              FROM ratings_reviews rr 
              JOIN users u ON rr.reviewer_id = u.id 
              JOIN bookings b ON rr.booking_id = b.id
              JOIN products p ON b.product_id = p.id
              WHERE rr.target_id = :seller_id AND rr.target_type = 'seller' 
              ORDER BY rr.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':seller_id', $sellerId);
    $stmt->execute();
    
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($reviews as &$review) {
        $review['product_images'] = json_decode($review['product_images'], true);
    }
    
    echo json_encode(['success' => true, 'data' => $reviews]);
    exit();
}

// Reply to Review (Seller)
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'reply_review') {
    $userId = $auth->getUserIdFromToken();
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $reviewId = $input['review_id'] ?? 0;
    $reply = $input['reply'] ?? '';

    // Verify user is the seller
    $reviewQuery = "SELECT rr.*, b.product_id, p.owner_id 
                   FROM ratings_reviews rr 
                   JOIN bookings b ON rr.booking_id = b.id 
                   JOIN products p ON b.product_id = p.id 
                   WHERE rr.id = :id";
    $stmt = $db->prepare($reviewQuery);
    $stmt->bindParam(':id', $reviewId);
    $stmt->execute();
    $review = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$review || $review['owner_id'] != $userId) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $updateQuery = "UPDATE ratings_reviews SET seller_reply = :reply, replied_at = NOW() WHERE id = :id";
    $stmt = $db->prepare($updateQuery);
    $stmt->bindParam(':reply', $reply);
    $stmt->bindParam(':id', $reviewId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Reply posted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to post reply']);
    }
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
