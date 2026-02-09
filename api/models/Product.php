<?php
class Product {
    private $conn;
    private $table = 'products';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll($category = null, $search = null, $limit = 50, $sort = 'newest', $minPrice = null, $maxPrice = null, $condition = null, $location = null, $provinceId = null, $districtId = null, $sectorId = null) {
        $query = "SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone, 
                  u.avatar as owner_avatar, u.is_verified as owner_verified, u.rating as owner_rating, 
                  u.review_count as owner_review_count, u.location as owner_location
                  FROM " . $this->table . " p 
                  LEFT JOIN users u ON p.owner_id = u.id 
                  WHERE p.is_available = 1";
        
        if ($category) {
            $query .= " AND p.category_id = :category";
        }
        if ($search) {
            $query .= " AND (p.title LIKE :search OR p.description LIKE :search)";
        }
        if ($minPrice !== null) {
            $query .= " AND (p.rent_price >= :min_price OR p.buy_price >= :min_price)";
        }
        if ($maxPrice !== null) {
            $query .= " AND (p.rent_price <= :max_price OR p.buy_price <= :max_price)";
        }
        if ($condition) {
            $query .= " AND p.condition_status = :condition";
        }
        if ($location) {
            $query .= " AND p.address LIKE :location";
        }
        // Rwanda location filters
        if ($provinceId) {
            $query .= " AND p.province_id = :province_id";
        }
        if ($districtId) {
            $query .= " AND p.district_id = :district_id";
        }
        if ($sectorId) {
            $query .= " AND p.sector_id = :sector_id";
        }
        
        switch($sort) {
            case 'price_low':
                $query .= " ORDER BY COALESCE(p.rent_price, p.buy_price) ASC";
                break;
            case 'price_high':
                $query .= " ORDER BY COALESCE(p.rent_price, p.buy_price) DESC";
                break;
            case 'popular':
                $query .= " ORDER BY p.views DESC, p.favorites DESC";
                break;
            case 'rating':
                $query .= " ORDER BY p.rating DESC";
                break;
            default:
                $query .= " ORDER BY p.created_at DESC";
        }
        
        $query .= " LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        
        if ($category) $stmt->bindParam(':category', $category);
        if ($search) {
            $searchTerm = "%{$search}%";
            $stmt->bindParam(':search', $searchTerm);
        }
        if ($minPrice !== null) $stmt->bindParam(':min_price', $minPrice);
        if ($maxPrice !== null) $stmt->bindParam(':max_price', $maxPrice);
        if ($condition) $stmt->bindParam(':condition', $condition);
        if ($location) {
            $locationTerm = "%{$location}%";
            $stmt->bindParam(':location', $locationTerm);
        }
        if ($provinceId) $stmt->bindParam(':province_id', $provinceId, PDO::PARAM_INT);
        if ($districtId) $stmt->bindParam(':district_id', $districtId, PDO::PARAM_INT);
        if ($sectorId) $stmt->bindParam(':sector_id', $sectorId, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
                  u.avatar as owner_avatar, u.is_verified as owner_verified, u.rating as owner_rating,
                  u.review_count as owner_review_count, u.location as owner_location
                  FROM " . $this->table . " p
                  LEFT JOIN users u ON p.owner_id = u.id
                  WHERE p.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table . " 
                  (title, description, category, images, rent_price, buy_price, address, lat, lng, 
                   owner_id, deposit, features, condition_status) 
                  VALUES (:title, :description, :category, :images, :rent_price, :buy_price, :address, 
                          :lat, :lng, :owner_id, :deposit, :features, :condition_status)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':category', $data['category']);
        $stmt->bindParam(':images', $data['images']);
        $stmt->bindParam(':rent_price', $data['rent_price']);
        $stmt->bindParam(':buy_price', $data['buy_price']);
        $stmt->bindParam(':address', $data['address']);
        $stmt->bindParam(':lat', $data['lat']);
        $stmt->bindParam(':lng', $data['lng']);
        $stmt->bindParam(':owner_id', $data['owner_id']);
        $stmt->bindParam(':deposit', $data['deposit']);
        $stmt->bindParam(':features', $data['features']);
        $stmt->bindParam(':condition_status', $data['condition_status']);
        
        return $stmt->execute();
    }

    public function getStats() {
        $query = "SELECT 
                  (SELECT COUNT(*) FROM products WHERE is_available = 1) as total_products,
                  (SELECT COUNT(*) FROM users) as total_users,
                  (SELECT AVG(rating) FROM products) as avg_rating";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
