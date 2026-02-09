<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once '../config/database.php');
require_once '../middleware/Auth.php';

$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['active_auctions'])) {
                // Get all active auctions
                $limit = $_GET['limit'] ?? 20;
                $offset = $_GET['offset'] ?? 0;
                
                $query = "SELECT a.*, p.title, p.images, p.description, p.category,
                         u.name as seller_name, u.avatar as seller_avatar,
                         (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id) as bid_count,
                         TIMESTAMPDIFF(SECOND, NOW(), a.end_time) as time_remaining
                         FROM auctions a
                         JOIN products p ON a.product_id = p.id
                         JOIN users u ON a.seller_id = u.id
                         WHERE a.status = 'active'
                         AND a.end_time > NOW()
                         ORDER BY a.end_time ASC
                         LIMIT :limit OFFSET :offset";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
                $stmt->execute();
                $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($auctions as &$auction) {
                    $auction['images'] = json_decode($auction['images'], true);
                }
                
                echo json_encode(['success' => true, 'data' => $auctions]);
                
            } elseif (isset($_GET['auction_id'])) {
                // Get auction details
                $auction_id = $_GET['auction_id'];
                
                $query = "SELECT a.*, p.title, p.images, p.description, p.category, p.condition_status,
                         u.name as seller_name, u.avatar as seller_avatar, u.rating as seller_rating,
                         (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id) as bid_count,
                         TIMESTAMPDIFF(SECOND, NOW(), a.end_time) as time_remaining
                         FROM auctions a
                         JOIN products p ON a.product_id = p.id
                         JOIN users u ON a.seller_id = u.id
                         WHERE a.id = :auction_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':auction_id', $auction_id);
                $stmt->execute();
                $auction = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$auction) {
                    throw new Exception('Auction not found');
                }
                
                $auction['images'] = json_decode($auction['images'], true);
                
                // Get bid history
                $query = "SELECT b.*, u.name as bidder_name, u.avatar as bidder_avatar
                         FROM auction_bids b
                         JOIN users u ON b.bidder_id = u.id
                         WHERE b.auction_id = :auction_id
                         ORDER BY b.created_at DESC
                         LIMIT 20";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':auction_id', $auction_id);
                $stmt->execute();
                $auction['bid_history'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $auction]);
                
            } elseif (isset($_GET['my_auctions'])) {
                // Get user's auctions (as seller)
                $user = \$auth->requireAuth();
                if (!$user) {
                    throw new Exception('Authentication required');
                }
                
                $user_id = $user['user_id'];
                
                $query = "SELECT a.*, p.title, p.images,
                         (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id) as bid_count
                         FROM auctions a
                         JOIN products p ON a.product_id = p.id
                         WHERE a.seller_id = :user_id
                         ORDER BY a.created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($auctions as &$auction) {
                    $auction['images'] = json_decode($auction['images'], true);
                }
                
                echo json_encode(['success' => true, 'data' => $auctions]);
                
            } elseif (isset($_GET['my_bids'])) {
                // Get user's bids
                $user = \$auth->requireAuth();
                if (!$user) {
                    throw new Exception('Authentication required');
                }
                
                $user_id = $user['user_id'];
                
                $query = "SELECT b.*, a.current_bid, a.status as auction_status, a.end_time,
                         p.title, p.images,
                         CASE 
                            WHEN b.bid_amount = a.current_bid AND a.status = 'active' THEN 'winning'
                            WHEN b.bid_amount < a.current_bid THEN 'outbid'
                            WHEN a.winner_id = :user_id THEN 'won'
                            ELSE 'lost'
                         END as bid_status
                         FROM auction_bids b
                         JOIN auctions a ON b.auction_id = a.id
                         JOIN products p ON a.product_id = p.id
                         WHERE b.bidder_id = :user_id
                         ORDER BY b.created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $bids = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($bids as &$bid) {
                    $bid['images'] = json_decode($bid['images'], true);
                }
                
                echo json_encode(['success' => true, 'data' => $bids]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            $user = \$auth->requireAuth();
            
            if (!$user) {
                throw new Exception('Authentication required');
            }
            
            $user_id = $user['user_id'];
            
            if (isset($data['action']) && $data['action'] === 'create_auction') {
                // Create new auction
                $product_id = $data['product_id'];
                $starting_price = $data['starting_price'];
                $reserve_price = $data['reserve_price'] ?? null;
                $bid_increment = $data['bid_increment'] ?? 1000;
                $duration_hours = $data['duration_hours'] ?? 24;
                
                // Verify product ownership
                $query = "SELECT * FROM products WHERE id = :product_id AND owner_id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                
                if ($stmt->rowCount() === 0) {
                    throw new Exception('Product not found or unauthorized');
                }
                
                $start_time = date('Y-m-d H:i:s');
                $end_time = date('Y-m-d H:i:s', strtotime("+{$duration_hours} hours"));
                
                $query = "INSERT INTO auctions 
                         (product_id, seller_id, starting_price, reserve_price, bid_increment, start_time, end_time, status)
                         VALUES (:product_id, :seller_id, :starting_price, :reserve_price, :bid_increment, :start_time, :end_time, 'active')";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->bindParam(':seller_id', $user_id);
                $stmt->bindParam(':starting_price', $starting_price);
                $stmt->bindParam(':reserve_price', $reserve_price);
                $stmt->bindParam(':bid_increment', $bid_increment);
                $stmt->bindParam(':start_time', $start_time);
                $stmt->bindParam(':end_time', $end_time);
                $stmt->execute();
                
                $auction_id = $db->lastInsertId();
                
                // Update product
                $query = "UPDATE products SET is_auction = TRUE, auction_id = :auction_id WHERE id = :product_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':auction_id', $auction_id);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->execute();
                
                echo json_encode(['success' => true, 'auction_id' => $auction_id]);
                
            } elseif (isset($data['action']) && $data['action'] === 'place_bid') {
                // Place a bid
                $auction_id = $data['auction_id'];
                $bid_amount = $data['bid_amount'];
                $is_auto_bid = $data['is_auto_bid'] ?? false;
                $max_auto_bid = $data['max_auto_bid'] ?? null;
                
                // Get auction details
                $query = "SELECT * FROM auctions WHERE id = :auction_id AND status = 'active' AND end_time > NOW()";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':auction_id', $auction_id);
                $stmt->execute();
                $auction = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$auction) {
                    throw new Exception('Auction not found or ended');
                }
                
                if ($auction['seller_id'] == $user_id) {
                    throw new Exception('Cannot bid on your own auction');
                }
                
                // Validate bid amount
                $min_bid = $auction['current_bid'] ? $auction['current_bid'] + $auction['bid_increment'] : $auction['starting_price'];
                if ($bid_amount < $min_bid) {
                    throw new Exception("Minimum bid is {$min_bid} RWF");
                }
                
                // Place bid
                $query = "INSERT INTO auction_bids 
                         (auction_id, bidder_id, bid_amount, is_auto_bid, max_auto_bid, status)
                         VALUES (:auction_id, :bidder_id, :bid_amount, :is_auto_bid, :max_auto_bid, 'active')";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':auction_id', $auction_id);
                $stmt->bindParam(':bidder_id', $user_id);
                $stmt->bindParam(':bid_amount', $bid_amount);
                $stmt->bindParam(':is_auto_bid', $is_auto_bid, PDO::PARAM_BOOL);
                $stmt->bindParam(':max_auto_bid', $max_auto_bid);
                $stmt->execute();
                
                // Update auction current bid
                $query = "UPDATE auctions 
                         SET current_bid = :bid_amount, total_bids = total_bids + 1
                         WHERE id = :auction_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':bid_amount', $bid_amount);
                $stmt->bindParam(':auction_id', $auction_id);
                $stmt->execute();
                
                // Mark previous bids as outbid
                $query = "UPDATE auction_bids 
                         SET status = 'outbid' 
                         WHERE auction_id = :auction_id 
                         AND bidder_id != :bidder_id 
                         AND status = 'active'";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':auction_id', $auction_id);
                $stmt->bindParam(':bidder_id', $user_id);
                $stmt->execute();
                
                // Auto-extend if near end
                if ($auction['auto_extend']) {
                    $time_remaining = strtotime($auction['end_time']) - time();
                    if ($time_remaining < 300) { // Less than 5 minutes
                        $new_end_time = date('Y-m-d H:i:s', strtotime($auction['end_time']) + ($auction['extend_minutes'] * 60));
                        $query = "UPDATE auctions SET end_time = :end_time WHERE id = :auction_id";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':end_time', $new_end_time);
                        $stmt->bindParam(':auction_id', $auction_id);
                        $stmt->execute();
                    }
                }
                
                echo json_encode(['success' => true, 'message' => 'Bid placed successfully']);
                
            } elseif (isset($data['action']) && $data['action'] === 'end_auction') {
                // End auction (admin or seller)
                $auction_id = $data['auction_id'];
                
                $query = "SELECT * FROM auctions WHERE id = :auction_id AND seller_id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':auction_id', $auction_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                
                if ($stmt->rowCount() === 0) {
                    throw new Exception('Unauthorized');
                }
                
                // Get highest bidder
                $query = "SELECT bidder_id, MAX(bid_amount) as winning_bid 
                         FROM auction_bids 
                         WHERE auction_id = :auction_id 
                         GROUP BY bidder_id 
                         ORDER BY winning_bid DESC 
                         LIMIT 1";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':auction_id', $auction_id);
                $stmt->execute();
                $winner = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($winner) {
                    $query = "UPDATE auctions 
                             SET status = 'ended', winner_id = :winner_id 
                             WHERE id = :auction_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':winner_id', $winner['bidder_id']);
                    $stmt->bindParam(':auction_id', $auction_id);
                    $stmt->execute();
                    
                    // Update winning bid
                    $query = "UPDATE auction_bids 
                             SET status = 'won' 
                             WHERE auction_id = :auction_id 
                             AND bidder_id = :winner_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':auction_id', $auction_id);
                    $stmt->bindParam(':winner_id', $winner['bidder_id']);
                    $stmt->execute();
                    
                    // Mark other bids as lost
                    $query = "UPDATE auction_bids 
                             SET status = 'lost' 
                             WHERE auction_id = :auction_id 
                             AND bidder_id != :winner_id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':auction_id', $auction_id);
                    $stmt->bindParam(':winner_id', $winner['bidder_id']);
                    $stmt->execute();
                }
                
                echo json_encode(['success' => true, 'winner_id' => $winner['bidder_id'] ?? null]);
            }
            break;
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
