-- Add search logs table for analytics
CREATE TABLE IF NOT EXISTS search_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    query VARCHAR(255),
    category VARCHAR(50),
    results_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_query (query),
    INDEX idx_created (created_at)
);

-- Add user activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_type ENUM('view','search','favorite','message','booking','purchase') NOT NULL,
    entity_type ENUM('product','user','booking','message') NOT NULL,
    entity_id INT,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (activity_type),
    INDEX idx_created (created_at)
);

-- Add favorites count to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorites_count INT DEFAULT 0;

-- Update favorites count for existing users
UPDATE users u SET favorites_count = (
    SELECT COUNT(*) FROM favorites WHERE user_id = u.id
);

-- Add trigger to update favorites count
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS update_favorites_count_insert
AFTER INSERT ON favorites
FOR EACH ROW
BEGIN
    UPDATE users SET favorites_count = favorites_count + 1 WHERE id = NEW.user_id;
END$$

CREATE TRIGGER IF NOT EXISTS update_favorites_count_delete
AFTER DELETE ON favorites
FOR EACH ROW
BEGIN
    UPDATE users SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = OLD.user_id;
END$$
DELIMITER ;
