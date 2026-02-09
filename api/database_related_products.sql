-- Related Products Analytics Tables

-- Table to track related product views
CREATE TABLE IF NOT EXISTS related_product_views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    related_product_ids JSON,
    view_count INT DEFAULT 1,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_views (product_id, viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table to track clicks on related products
CREATE TABLE IF NOT EXISTS related_product_clicks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_product_id INT NOT NULL,
    clicked_product_id INT NOT NULL,
    user_id INT,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (clicked_product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_source_product (source_product_id),
    INDEX idx_clicked_product (clicked_product_id),
    INDEX idx_user_clicks (user_id, clicked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for product tags (for similarity matching)
CREATE TABLE IF NOT EXISTS product_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_tag (product_id, tag),
    INDEX idx_tag (tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for product images (if not exists)
CREATE TABLE IF NOT EXISTS product_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_images (product_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add price_range column to products if not exists
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price_range ENUM('budget', 'mid', 'premium', 'luxury') 
GENERATED ALWAYS AS (
    CASE 
        WHEN COALESCE(rent_price, buy_price) < 10000 THEN 'budget'
        WHEN COALESCE(rent_price, buy_price) < 50000 THEN 'mid'
        WHEN COALESCE(rent_price, buy_price) < 200000 THEN 'premium'
        ELSE 'luxury'
    END
) STORED;

-- Add subcategory column if not exists
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100) AFTER category;

-- View for related products performance
CREATE OR REPLACE VIEW related_products_performance AS
SELECT 
    rpc.source_product_id,
    rpc.clicked_product_id,
    p.title as clicked_product_title,
    COUNT(*) as click_count,
    COUNT(DISTINCT rpc.user_id) as unique_users,
    AVG(TIMESTAMPDIFF(SECOND, rpv.viewed_at, rpc.clicked_at)) as avg_time_to_click
FROM related_product_clicks rpc
JOIN products p ON rpc.clicked_product_id = p.id
LEFT JOIN related_product_views rpv ON rpc.source_product_id = rpv.product_id
GROUP BY rpc.source_product_id, rpc.clicked_product_id;

-- Trigger to auto-generate tags from title and description
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS generate_product_tags 
AFTER INSERT ON products
FOR EACH ROW
BEGIN
    DECLARE words TEXT;
    DECLARE word VARCHAR(50);
    DECLARE pos INT;
    
    SET words = CONCAT(NEW.title, ' ', NEW.description);
    SET words = LOWER(REPLACE(REPLACE(words, ',', ' '), '.', ' '));
    
    -- Extract meaningful words (simple implementation)
    WHILE LENGTH(words) > 0 DO
        SET pos = LOCATE(' ', words);
        IF pos > 0 THEN
            SET word = SUBSTRING(words, 1, pos - 1);
            SET words = SUBSTRING(words, pos + 1);
        ELSE
            SET word = words;
            SET words = '';
        END IF;
        
        -- Insert tag if word is meaningful (length > 3)
        IF LENGTH(word) > 3 THEN
            INSERT IGNORE INTO product_tags (product_id, tag) 
            VALUES (NEW.id, word);
        END IF;
    END WHILE;
END$$
DELIMITER ;

-- Sample data for testing
INSERT INTO product_tags (product_id, tag) VALUES
(1, 'car'), (1, 'vehicle'), (1, 'transport'),
(2, 'house'), (2, 'home'), (2, 'property'),
(3, 'laptop'), (3, 'computer'), (3, 'electronics')
ON DUPLICATE KEY UPDATE tag = tag;
