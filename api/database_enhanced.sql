-- Add new categories to products table
ALTER TABLE products MODIFY COLUMN category ENUM(
  'vehicles','electronics','clothing','houses','furniture','tools','others',
  'spare_parts','construction','building_materials','car_parts','machinery',
  'plumbing','electrical','hardware','paint','cement','steel','wood'
) NOT NULL;

-- Create spare parts table
CREATE TABLE spare_parts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    part_number VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    year INT,
    compatibility TEXT,
    warranty_months INT DEFAULT 0,
    is_original BOOLEAN DEFAULT FALSE,
    is_refurbished BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_part_number (part_number),
    INDEX idx_brand (brand)
);

-- Create construction materials table
CREATE TABLE construction_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    material_type ENUM('cement','steel','wood','paint','tiles','bricks','sand','gravel','other') NOT NULL,
    unit ENUM('bag','ton','cubic_meter','piece','liter','square_meter','kg') NOT NULL,
    quantity_available INT DEFAULT 0,
    min_order_quantity INT DEFAULT 1,
    bulk_discount_percentage DECIMAL(5,2) DEFAULT 0,
    delivery_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_material_type (material_type)
);

-- Create rental equipment table
CREATE TABLE rental_equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    equipment_type ENUM('vehicle','machinery','tools','electronics','furniture','other') NOT NULL,
    hourly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    weekly_rate DECIMAL(10,2),
    monthly_rate DECIMAL(10,2),
    fuel_included BOOLEAN DEFAULT FALSE,
    driver_included BOOLEAN DEFAULT FALSE,
    operator_required BOOLEAN DEFAULT FALSE,
    insurance_included BOOLEAN DEFAULT FALSE,
    maintenance_status ENUM('excellent','good','fair') DEFAULT 'good',
    last_service_date DATE,
    next_service_date DATE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_equipment_type (equipment_type)
);

-- Insert sample spare parts
INSERT INTO products (title, description, category, images, rent_price, buy_price, address, lat, lng, owner_id, rating, review_count, deposit, features, condition_status) VALUES
('Toyota Corolla Brake Pads - Original', 'Brake pads za Toyota Corolla 2015-2023. Original parts from Japan. Warranty 6 months.', 'spare_parts', '["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1080"]', NULL, 45000, 'Nyabugogo, Kigali', -1.9378, 30.0545, 1, 4.8, 15, NULL, '["Original","6 Months Warranty","Japanese Quality"]', 'new'),
('Engine Oil Filter - Universal', 'Oil filter ikoreshwa kuri imodoka nyinshi. High quality, long lasting.', 'spare_parts', '["https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=1080"]', NULL, 8000, 'Remera, Kigali', -1.9536, 30.0987, 2, 4.5, 8, NULL, '["Universal Fit","High Quality","Long Lasting"]', 'new');

INSERT INTO spare_parts (product_id, part_number, brand, model, year, compatibility, warranty_months, is_original) VALUES
(7, 'BP-TC-2015', 'Toyota', 'Corolla', 2015, 'Toyota Corolla 2015-2023', 6, TRUE),
(8, 'OF-UNI-001', 'Generic', 'Universal', 2024, 'Most vehicles', 3, FALSE);

-- Insert sample construction materials
INSERT INTO products (title, description, category, images, rent_price, buy_price, address, lat, lng, owner_id, rating, review_count, deposit, features, condition_status) VALUES
('Cement - 50kg Bags', 'Cement nziza ya Cimerwa. 50kg per bag. Bulk orders available with discount.', 'construction', '["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1080"]', NULL, 18000, 'Gikondo, Kigali', -1.9667, 30.1044, 1, 4.9, 45, NULL, '["50kg Bags","Cimerwa Brand","Bulk Discount Available"]', 'new'),
('Steel Bars - 12mm', 'Steel bars for construction. 12mm diameter, 6 meters long. High quality.', 'construction', '["https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1080"]', NULL, 25000, 'Gikondo, Kigali', -1.9667, 30.1044, 2, 4.7, 23, NULL, '["12mm Diameter","6 Meters Long","High Quality Steel"]', 'new'),
('Paint - Interior White 20L', 'White paint for interior walls. 20 liters. Covers 100 square meters.', 'construction', '["https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1080"]', NULL, 65000, 'Kimironko, Kigali', -1.9412, 30.1267, 1, 4.8, 18, NULL, '["20 Liters","Interior Use","100sqm Coverage"]', 'new');

INSERT INTO construction_materials (product_id, material_type, unit, quantity_available, min_order_quantity, bulk_discount_percentage, delivery_available) VALUES
(9, 'cement', 'bag', 500, 10, 5.00, TRUE),
(10, 'steel', 'piece', 200, 5, 3.00, TRUE),
(11, 'paint', 'liter', 100, 1, 0, TRUE);

-- Insert sample rental equipment
INSERT INTO products (title, description, category, images, rent_price, buy_price, address, lat, lng, owner_id, rating, review_count, deposit, features, condition_status) VALUES
('Excavator - Komatsu PC200', 'Excavator nini ya Komatsu. Ikoreshwa mu kubaka. Driver included.', 'machinery', '["https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1080"]', 250000, 45000000, 'Gikondo, Kigali', -1.9667, 30.1044, 1, 4.9, 12, 500000, '["Driver Included","Fuel Extra","Insurance Included"]', 'good'),
('Concrete Mixer - 350L', 'Concrete mixer nini. 350 liters. Ikoreshwa mu kubaka.', 'machinery', '["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1080"]', 15000, 850000, 'Nyabugogo, Kigali', -1.9378, 30.0545, 2, 4.6, 8, 30000, '["350L Capacity","Electric Motor","Easy to Use"]', 'good'),
('Scaffolding Set - Complete', 'Scaffolding set yuzuye. Ikoreshwa mu kubaka. 20 meters height.', 'tools', '["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1080"]', 50000, 1200000, 'Remera, Kigali', -1.9536, 30.0987, 1, 4.7, 15, 100000, '["20m Height","Complete Set","Safety Certified"]', 'good');

INSERT INTO rental_equipment (product_id, equipment_type, hourly_rate, daily_rate, weekly_rate, monthly_rate, fuel_included, driver_included, operator_required, insurance_included, maintenance_status) VALUES
(12, 'machinery', NULL, 250000, 1500000, 5000000, FALSE, TRUE, FALSE, TRUE, 'excellent'),
(13, 'machinery', 5000, 15000, 90000, 300000, FALSE, FALSE, FALSE, FALSE, 'good'),
(14, 'tools', NULL, 50000, 300000, 1000000, FALSE, FALSE, FALSE, FALSE, 'good');

-- Update stats
UPDATE products SET views = FLOOR(RAND() * 500) + 50, favorites = FLOOR(RAND() * 100) + 5;
