<?php
class User {
    private $conn;
    private $table = 'users';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT id, name, email, phone, avatar, is_verified, rating, review_count, location, created_at 
                  FROM " . $this->table . " ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT id, name, email, phone, avatar, is_verified, rating, review_count, location, created_at 
                  FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function login($email, $password) {
        $query = "SELECT * FROM " . $this->table . " WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            unset($user['password']);
            return $user;
        }
        return false;
    }

    public function register($data) {
        // Build dynamic query based on provided fields
        $fields = ['name', 'email', 'phone', 'password'];
        $values = [':name', ':email', ':phone', ':password'];
        $params = [
            ':name' => $data['name'],
            ':email' => $data['email'],
            ':phone' => $data['phone'] ?? '',
            ':password' => password_hash($data['password'], PASSWORD_BCRYPT)
        ];
        
        // Add Rwanda location fields if provided
        if (isset($data['province_id']) && $data['province_id']) {
            $fields[] = 'province_id';
            $values[] = ':province_id';
            $params[':province_id'] = (int)$data['province_id'];
        }
        if (isset($data['district_id']) && $data['district_id']) {
            $fields[] = 'district_id';
            $values[] = ':district_id';
            $params[':district_id'] = (int)$data['district_id'];
        }
        if (isset($data['sector_id']) && $data['sector_id']) {
            $fields[] = 'sector_id';
            $values[] = ':sector_id';
            $params[':sector_id'] = (int)$data['sector_id'];
        }
        
        // Build location string from IDs if location fields provided
        $location = '';
        if (isset($data['province_id']) && isset($data['district_id']) && isset($data['sector_id'])) {
            $location = $this->buildLocationString($data['province_id'], $data['district_id'], $data['sector_id']);
        } elseif (isset($data['location'])) {
            $location = $data['location'];
        }
        
        if ($location) {
            $fields[] = 'location';
            $values[] = ':location';
            $params[':location'] = $location;
        }
        
        $query = "INSERT INTO " . $this->table . " (" . implode(', ', $fields) . ") 
                  VALUES (" . implode(', ', $values) . ")";
        
        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }
    
    private function buildLocationString($provinceId, $districtId, $sectorId) {
        try {
            $provinceName = '';
            $districtName = '';
            $sectorName = '';
            
            $stmt = $this->conn->prepare("SELECT name FROM rwanda_provinces WHERE id = :id");
            $stmt->bindParam(':id', $provinceId);
            $stmt->execute();
            $provinceName = $stmt->fetchColumn() ?: '';
            
            $stmt = $this->conn->prepare("SELECT name FROM rwanda_districts WHERE id = :id");
            $stmt->bindParam(':id', $districtId);
            $stmt->execute();
            $districtName = $stmt->fetchColumn() ?: '';
            
            $stmt = $this->conn->prepare("SELECT name FROM rwanda_sectors WHERE id = :id");
            $stmt->bindParam(':id', $sectorId);
            $stmt->execute();
            $sectorName = $stmt->fetchColumn() ?: '';
            
            return trim("$sectorName, $districtName, $provinceName");
        } catch (Exception $e) {
            return '';
        }
    }
}
?>
