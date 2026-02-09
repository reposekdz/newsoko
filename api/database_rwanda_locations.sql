-- Rwanda Administrative Divisions Database
-- Complete hierarchy: Provinces -> Districts -> Sectors

-- Provinces Table
CREATE TABLE IF NOT EXISTS rwanda_provinces (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Districts Table
CREATE TABLE IF NOT EXISTS rwanda_districts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    province_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES rwanda_provinces(id) ON DELETE CASCADE,
    UNIQUE KEY unique_district (province_id, name),
    INDEX idx_province (province_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sectors Table
CREATE TABLE IF NOT EXISTS rwanda_sectors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    district_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES rwanda_districts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_sector (district_id, name),
    INDEX idx_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Provinces
INSERT INTO rwanda_provinces (name, code) VALUES
('Kigali City', 'KGL'),
('Eastern Province', 'EST'),
('Northern Province', 'NTH'),
('Southern Province', 'STH'),
('Western Province', 'WST');

-- Insert Districts for Kigali City
INSERT INTO rwanda_districts (province_id, name, code) VALUES
(1, 'Gasabo', 'GSB'),
(1, 'Kicukiro', 'KCK'),
(1, 'Nyarugenge', 'NYR');

-- Insert Districts for Eastern Province
INSERT INTO rwanda_districts (province_id, name, code) VALUES
(2, 'Bugesera', 'BGS'),
(2, 'Gatsibo', 'GTS'),
(2, 'Kayonza', 'KYZ'),
(2, 'Kirehe', 'KRH'),
(2, 'Ngoma', 'NGM'),
(2, 'Nyagatare', 'NYG'),
(2, 'Rwamagana', 'RWM');

-- Insert Districts for Northern Province
INSERT INTO rwanda_districts (province_id, name, code) VALUES
(3, 'Burera', 'BRR'),
(3, 'Gakenke', 'GKK'),
(3, 'Gicumbi', 'GCM'),
(3, 'Musanze', 'MSZ'),
(3, 'Rulindo', 'RLD');

-- Insert Districts for Southern Province
INSERT INTO rwanda_districts (province_id, name, code) VALUES
(4, 'Gisagara', 'GSG'),
(4, 'Huye', 'HYE'),
(4, 'Kamonyi', 'KMN'),
(4, 'Muhanga', 'MHG'),
(4, 'Nyamagabe', 'NYM'),
(4, 'Nyanza', 'NYZ'),
(4, 'Nyaruguru', 'NYU'),
(4, 'Ruhango', 'RHG');

-- Insert Districts for Western Province
INSERT INTO rwanda_districts (province_id, name, code) VALUES
(5, 'Karongi', 'KRG'),
(5, 'Ngororero', 'NGR'),
(5, 'Nyabihu', 'NYB'),
(5, 'Nyamasheke', 'NYS'),
(5, 'Rubavu', 'RBV'),
(5, 'Rusizi', 'RSZ'),
(5, 'Rutsiro', 'RTS');

-- Insert Sectors for Gasabo District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(1, 'Bumbogo'), (1, 'Gatsata'), (1, 'Gikomero'), (1, 'Gisozi'),
(1, 'Jabana'), (1, 'Jali'), (1, 'Kacyiru'), (1, 'Kimihurura'),
(1, 'Kimironko'), (1, 'Kinyinya'), (1, 'Ndera'), (1, 'Nduba'),
(1, 'Remera'), (1, 'Rusororo'), (1, 'Rutunga');

-- Insert Sectors for Kicukiro District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(2, 'Gahanga'), (2, 'Gatenga'), (2, 'Gikondo'), (2, 'Kagarama'),
(2, 'Kanombe'), (2, 'Kicukiro'), (2, 'Kigarama'), (2, 'Masaka'),
(2, 'Niboye'), (2, 'Nyarugunga');

-- Insert Sectors for Nyarugenge District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(3, 'Gitega'), (3, 'Kanyinya'), (3, 'Kigali'), (3, 'Kimisagara'),
(3, 'Mageragere'), (3, 'Muhima'), (3, 'Nyakabanda'), (3, 'Nyamirambo'),
(3, 'Nyarugenge'), (3, 'Rwezamenyo');

-- Insert Sectors for Bugesera District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(4, 'Gashora'), (4, 'Juru'), (4, 'Kamabuye'), (4, 'Mareba'),
(4, 'Mayange'), (4, 'Musenyi'), (4, 'Mwogo'), (4, 'Ngeruka'),
(4, 'Ntarama'), (4, 'Nyamata'), (4, 'Nyarugenge'), (4, 'Rilima'),
(4, 'Ruhuha'), (4, 'Rweru'), (4, 'Shyara');

-- Insert Sectors for Gatsibo District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(5, 'Gasange'), (5, 'Gatsibo'), (5, 'Gitoki'), (5, 'Kabarore'),
(5, 'Kageyo'), (5, 'Kiramuruzi'), (5, 'Kiziguro'), (5, 'Muhura'),
(5, 'Murambi'), (5, 'Ngarama'), (5, 'Nyagihanga'), (5, 'Remera'),
(5, 'Rugarama'), (5, 'Rwimbogo');

-- Insert Sectors for Kayonza District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(6, 'Gahini'), (6, 'Kabare'), (6, 'Kabarondo'), (6, 'Mukarange'),
(6, 'Murama'), (6, 'Murundi'), (6, 'Mwiri'), (6, 'Ndego'),
(6, 'Nyamirama'), (6, 'Rukara'), (6, 'Ruramira'), (6, 'Rwinkwavu');

-- Insert Sectors for Kirehe District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(7, 'Gahara'), (7, 'Gatore'), (7, 'Kigarama'), (7, 'Kigina'),
(7, 'Kirehe'), (7, 'Mahama'), (7, 'Mpanga'), (7, 'Musaza'),
(7, 'Nasho'), (7, 'Nyamugari'), (7, 'Nyarubuye');

-- Insert Sectors for Ngoma District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(8, 'Gashanda'), (8, 'Jarama'), (8, 'Karembo'), (8, 'Kazo'),
(8, 'Kibungo'), (8, 'Mugesera'), (8, 'Murama'), (8, 'Mutenderi'),
(8, 'Remera'), (8, 'Rukira'), (8, 'Rukumberi'), (8, 'Rurenge'),
(8, 'Sake'), (8, 'Zaza');

-- Insert Sectors for Nyagatare District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(9, 'Gatunda'), (9, 'Karama'), (9, 'Karangazi'), (9, 'Katabagemu'),
(9, 'Kiyombe'), (9, 'Matimba'), (9, 'Mimuli'), (9, 'Mukama'),
(9, 'Musheli'), (9, 'Nyagatare'), (9, 'Rukomo'), (9, 'Rwempasha'),
(9, 'Rwimiyaga'), (9, 'Tabagwe');

-- Insert Sectors for Rwamagana District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(10, 'Fumbwe'), (10, 'Gahengeri'), (10, 'Gishari'), (10, 'Karenge'),
(10, 'Kigabiro'), (10, 'Muhazi'), (10, 'Munyaga'), (10, 'Munyiginya'),
(10, 'Musha'), (10, 'Muyumbu'), (10, 'Mwulire'), (10, 'Nyakaliro'),
(10, 'Nzige'), (10, 'Rubona');

-- Insert Sectors for Musanze District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(15, 'Busogo'), (15, 'Cyuve'), (15, 'Gacaca'), (15, 'Gashaki'),
(15, 'Gataraga'), (15, 'Kimonyi'), (15, 'Kinigi'), (15, 'Muhoza'),
(15, 'Muko'), (15, 'Musanze'), (15, 'Nkotsi'), (15, 'Nyange'),
(15, 'Remera'), (15, 'Rwaza'), (15, 'Shingiro');

-- Insert Sectors for Huye District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(19, 'Gishamvu'), (19, 'Karama'), (19, 'Kigoma'), (19, 'Kinazi'),
(19, 'Maraba'), (19, 'Mbazi'), (19, 'Mukura'), (19, 'Ngoma'),
(19, 'Ruhashya'), (19, 'Rusatira'), (19, 'Rwaniro'), (19, 'Simbi'),
(19, 'Tumba'), (19, 'Huye');

-- Insert Sectors for Rubavu District
INSERT INTO rwanda_sectors (district_id, name) VALUES
(28, 'Bugeshi'), (28, 'Busasamana'), (28, 'Cyanzarwe'), (28, 'Gisenyi'),
(28, 'Kanama'), (28, 'Kanzenze'), (28, 'Mudende'), (28, 'Nyakiliba'),
(28, 'Nyamyumba'), (28, 'Nyundo'), (28, 'Rubavu'), (28, 'Rugerero');

-- Update users table to include location fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS province_id INT AFTER email,
ADD COLUMN IF NOT EXISTS district_id INT AFTER province_id,
ADD COLUMN IF NOT EXISTS sector_id INT AFTER district_id,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) AFTER sector_id,
ADD COLUMN IF NOT EXISTS national_id VARCHAR(20) AFTER phone,
ADD COLUMN IF NOT EXISTS date_of_birth DATE AFTER national_id,
ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'other') AFTER date_of_birth,
ADD FOREIGN KEY (province_id) REFERENCES rwanda_provinces(id) ON DELETE SET NULL,
ADD FOREIGN KEY (district_id) REFERENCES rwanda_districts(id) ON DELETE SET NULL,
ADD FOREIGN KEY (sector_id) REFERENCES rwanda_sectors(id) ON DELETE SET NULL;

-- Create index for faster location queries
CREATE INDEX idx_user_location ON users(province_id, district_id, sector_id);

-- View for complete user location
CREATE OR REPLACE VIEW user_locations AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u.phone,
    p.name as province,
    d.name as district,
    s.name as sector,
    CONCAT(s.name, ', ', d.name, ', ', p.name) as full_address
FROM users u
LEFT JOIN rwanda_provinces p ON u.province_id = p.id
LEFT JOIN rwanda_districts d ON u.district_id = d.id
LEFT JOIN rwanda_sectors s ON u.sector_id = s.id;
