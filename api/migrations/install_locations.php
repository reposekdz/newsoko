<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Starting Rwanda Locations Migration...\n\n";

try {
    $db->exec("SET FOREIGN_KEY_CHECKS=0");
    $db->exec("DROP TABLE IF EXISTS rwanda_sectors");
    $db->exec("DROP TABLE IF EXISTS rwanda_districts");
    $db->exec("DROP TABLE IF EXISTS rwanda_provinces");
    $db->exec("SET FOREIGN_KEY_CHECKS=1");
    
    $db->exec("CREATE TABLE rwanda_provinces (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL UNIQUE, code VARCHAR(10) NOT NULL UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    $db->exec("CREATE TABLE rwanda_districts (id INT PRIMARY KEY AUTO_INCREMENT, province_id INT NOT NULL, name VARCHAR(100) NOT NULL, code VARCHAR(10) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (province_id) REFERENCES rwanda_provinces(id) ON DELETE CASCADE, UNIQUE KEY unique_district (province_id, name))");
    $db->exec("CREATE TABLE rwanda_sectors (id INT PRIMARY KEY AUTO_INCREMENT, district_id INT NOT NULL, name VARCHAR(100) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (district_id) REFERENCES rwanda_districts(id) ON DELETE CASCADE, UNIQUE KEY unique_sector (district_id, name))");
    
    echo "✓ Created tables\n";
    
    $db->exec("INSERT INTO rwanda_provinces (name, code) VALUES ('Kigali City', 'KGL'), ('Eastern Province', 'EST'), ('Northern Province', 'NTH'), ('Southern Province', 'STH'), ('Western Province', 'WST')");
    echo "✓ Inserted 5 provinces\n";
    
    $db->exec("INSERT INTO rwanda_districts (province_id, name, code) VALUES (1, 'Gasabo', 'GSB'), (1, 'Kicukiro', 'KCK'), (1, 'Nyarugenge', 'NYR'), (2, 'Bugesera', 'BGS'), (2, 'Gatsibo', 'GTS'), (2, 'Kayonza', 'KYZ'), (2, 'Kirehe', 'KRH'), (2, 'Ngoma', 'NGM'), (2, 'Nyagatare', 'NYG'), (2, 'Rwamagana', 'RWM'), (3, 'Burera', 'BRR'), (3, 'Gakenke', 'GKN'), (3, 'Gicumbi', 'GCM'), (3, 'Musanze', 'MSZ'), (3, 'Rulindo', 'RLD'), (4, 'Gisagara', 'GSG'), (4, 'Huye', 'HYE'), (4, 'Kamonyi', 'KMN'), (4, 'Muhanga', 'MHG'), (4, 'Nyamagabe', 'NYM'), (4, 'Nyanza', 'NYZ'), (4, 'Nyaruguru', 'NYR'), (4, 'Ruhango', 'RHG'), (5, 'Karongi', 'KRG'), (5, 'Ngororero', 'NGR'), (5, 'Nyabihu', 'NYB'), (5, 'Nyamasheke', 'NYS'), (5, 'Rubavu', 'RBV'), (5, 'Rusizi', 'RSZ'), (5, 'Rutsiro', 'RTS')");
    echo "✓ Inserted 30 districts\n";
    
    $sectors = [
        [1,'Bumbogo'],[1,'Gatsata'],[1,'Gikomero'],[1,'Gisozi'],[1,'Jabana'],[1,'Jali'],[1,'Kacyiru'],[1,'Kimihurura'],[1,'Kimironko'],[1,'Kinyinya'],[1,'Ndera'],[1,'Nduba'],[1,'Remera'],[1,'Rusororo'],[1,'Rutunga'],
        [2,'Gahanga'],[2,'Gatenga'],[2,'Gikondo'],[2,'Kagarama'],[2,'Kanombe'],[2,'Kicukiro'],[2,'Kigarama'],[2,'Masaka'],[2,'Niboye'],[2,'Nyarugunga'],
        [3,'Gitega'],[3,'Kanyinya'],[3,'Kigali'],[3,'Kimisagara'],[3,'Mageragere'],[3,'Muhima'],[3,'Nyakabanda'],[3,'Nyamirambo'],[3,'Nyarugenge'],[3,'Rwezamenyo'],
        [4,'Gashora'],[4,'Juru'],[4,'Kamabuye'],[4,'Mareba'],[4,'Mayange'],[4,'Musenyi'],[4,'Mwogo'],[4,'Ngeruka'],[4,'Ntarama'],[4,'Nyamata'],[4,'Nyarugenge'],[4,'Rilima'],[4,'Ruhuha'],[4,'Rweru'],[4,'Shyara'],
        [5,'Gasange'],[5,'Gatsibo'],[5,'Gitoki'],[5,'Kabarore'],[5,'Kageyo'],[5,'Kiramuruzi'],[5,'Kiziguro'],[5,'Muhura'],[5,'Murambi'],[5,'Ngarama'],[5,'Nyagihanga'],[5,'Remera'],[5,'Rugarama'],[5,'Rwimbogo'],
        [6,'Gahini'],[6,'Kabare'],[6,'Kabarondo'],[6,'Mukarange'],[6,'Murama'],[6,'Murundi'],[6,'Mwiri'],[6,'Ndego'],[6,'Nyamirama'],[6,'Rukara'],[6,'Ruramira'],[6,'Rwinkwavu'],
        [7,'Gahara'],[7,'Gatore'],[7,'Kigarama'],[7,'Kigina'],[7,'Kirehe'],[7,'Mahama'],[7,'Mpanga'],[7,'Musaza'],[7,'Mushikiri'],[7,'Nasho'],[7,'Nyamugari'],[7,'Nyarubuye'],
        [8,'Gashanda'],[8,'Jarama'],[8,'Karembo'],[8,'Kazo'],[8,'Kibungo'],[8,'Mugesera'],[8,'Murama'],[8,'Mutenderi'],[8,'Remera'],[8,'Rukira'],[8,'Rukumberi'],[8,'Rurenge'],[8,'Sake'],[8,'Zaza'],
        [9,'Gatunda'],[9,'Karama'],[9,'Karangazi'],[9,'Katabagemu'],[9,'Kiyombe'],[9,'Matimba'],[9,'Mimuri'],[9,'Mukama'],[9,'Musheli'],[9,'Nyagatare'],[9,'Rukomo'],[9,'Rwempasha'],[9,'Rwimiyaga'],[9,'Tabagwe'],
        [10,'Fumbwe'],[10,'Gahengeri'],[10,'Gishari'],[10,'Karenge'],[10,'Kigabiro'],[10,'Muhazi'],[10,'Munyaga'],[10,'Munyiginya'],[10,'Musha'],[10,'Muyumbu'],[10,'Mwulire'],[10,'Nyakaliro'],[10,'Nzige'],[10,'Rubona'],
        [11,'Bungwe'],[11,'Butaro'],[11,'Cyanika'],[11,'Cyeru'],[11,'Gahunga'],[11,'Gatebe'],[11,'Gitovu'],[11,'Kagogo'],[11,'Kinoni'],[11,'Kinyababa'],[11,'Kivuye'],[11,'Nemba'],[11,'Rugarama'],[11,'Rugendabari'],[11,'Ruhunde'],[11,'Rusarabuye'],[11,'Rwerere'],
        [12,'Busengo'],[12,'Coko'],[12,'Cyabingo'],[12,'Gakenke'],[12,'Gashenyi'],[12,'Janja'],[12,'Kamubuga'],[12,'Karambo'],[12,'Kivuruga'],[12,'Mataba'],[12,'Minazi'],[12,'Muhondo'],[12,'Mugunga'],[12,'Muyongwe'],[12,'Muzo'],[12,'Nemba'],[12,'Ruli'],[12,'Rusasa'],[12,'Rushashi'],
        [13,'Bukure'],[13,'Bwisige'],[13,'Byumba'],[13,'Cyumba'],[13,'Giti'],[13,'Kaniga'],[13,'Kanyinya'],[13,'Miyove'],[13,'Muko'],[13,'Mutete'],[13,'Nyamiyaga'],[13,'Nyankenke'],[13,'Rubaya'],[13,'Rukomo'],[13,'Rushaki'],[13,'Rutare'],[13,'Ruvune'],[13,'Rwamiko'],[13,'Shangasha'],
        [14,'Busogo'],[14,'Cyuve'],[14,'Gacaca'],[14,'Gashaki'],[14,'Gataraga'],[14,'Kimonyi'],[14,'Kinigi'],[14,'Muhoza'],[14,'Muko'],[14,'Musanze'],[14,'Nkotsi'],[14,'Nyange'],[14,'Remera'],[14,'Rwaza'],[14,'Shingiro'],
        [15,'Base'],[15,'Burega'],[15,'Bushoki'],[15,'Buyoga'],[15,'Cyinzuzi'],[15,'Cyungo'],[15,'Kinihira'],[15,'Kisaro'],[15,'Masoro'],[15,'Mbogo'],[15,'Murambi'],[15,'Ngoma'],[15,'Ntarabana'],[15,'Rukozo'],[15,'Rusiga'],[15,'Shyorongi'],[15,'Tumba'],
        [16,'Gikonko'],[16,'Gishubi'],[16,'Kansi'],[16,'Kibilizi'],[16,'Kigembe'],[16,'Mamba'],[16,'Muganza'],[16,'Mugombwa'],[16,'Mukindo'],[16,'Musha'],[16,'Ndora'],[16,'Nyanza'],[16,'Save'],
        [17,'Gishamvu'],[17,'Huye'],[17,'Karama'],[17,'Kigoma'],[17,'Kinazi'],[17,'Maraba'],[17,'Mbazi'],[17,'Mukura'],[17,'Ngoma'],[17,'Ruhashya'],[17,'Rusatira'],[17,'Rwaniro'],[17,'Simbi'],[17,'Tumba'],
        [18,'Gacurabwenge'],[18,'Karama'],[18,'Kayenzi'],[18,'Kayumbu'],[18,'Mugina'],[18,'Musambira'],[18,'Ngamba'],[18,'Nyamiyaga'],[18,'Nyarubaka'],[18,'Rukoma'],[18,'Rugarika'],[18,'Runda'],
        [19,'Cyeza'],[19,'Kabacuzi'],[19,'Kibangu'],[19,'Kiyumba'],[19,'Muhanga'],[19,'Mushishiro'],[19,'Nyabinoni'],[19,'Nyamabuye'],[19,'Nyarusange'],[19,'Rongi'],[19,'Rugendabari'],[19,'Shyogwe'],
        [20,'Buruhukiro'],[20,'Cyanika'],[20,'Gasaka'],[20,'Gatare'],[20,'Kaduha'],[20,'Kamegeri'],[20,'Kibirizi'],[20,'Kibumbwe'],[20,'Kitabi'],[20,'Mbazi'],[20,'Mugano'],[20,'Musange'],[20,'Musebeya'],[20,'Mushubi'],[20,'Nkomane'],[20,'Tare'],[20,'Uwinkingi'],
        [21,'Busasamana'],[21,'Busoro'],[21,'Cyabakamyi'],[21,'Kibirizi'],[21,'Mukingo'],[21,'Muyira'],[21,'Ntyazo'],[21,'Nyagisozi'],[21,'Rwabicuma'],[21,'Nyanza'],
        [22,'Cyahinda'],[22,'Busanze'],[22,'Kibeho'],[22,'Kivu'],[22,'Mata'],[22,'Muganza'],[22,'Munini'],[22,'Ngera'],[22,'Ngoma'],[22,'Nyabimata'],[22,'Nyagisozi'],[22,'Ruheru'],[22,'Ruramba'],[22,'Rusenge'],
        [23,'Bweramana'],[23,'Byimana'],[23,'Kabagari'],[23,'Kinazi'],[23,'Kinihira'],[23,'Mbuye'],[23,'Mwendo'],[23,'Ntongwe'],[23,'Ruhango'],
        [24,'Bwishyura'],[24,'Gashari'],[24,'Gishyita'],[24,'Gitesi'],[24,'Mubuga'],[24,'Murambi'],[24,'Murundi'],[24,'Mutuntu'],[24,'Rubengera'],[24,'Rugabano'],[24,'Ruganda'],[24,'Rwankuba'],[24,'Twumba'],
        [25,'Bwira'],[25,'Gatumba'],[25,'Hindiro'],[25,'Kabaya'],[25,'Kageyo'],[25,'Kavumu'],[25,'Matyazo'],[25,'Muhanda'],[25,'Muhororo'],[25,'Ndaro'],[25,'Ngororero'],[25,'Nyange'],[25,'Sovu'],
        [26,'Bigogwe'],[26,'Jenda'],[26,'Jomba'],[26,'Kabatwa'],[26,'Karago'],[26,'Kintobo'],[26,'Mukamira'],[26,'Muringa'],[26,'Rambura'],[26,'Rugera'],[26,'Rurembo'],[26,'Shyira'],
        [27,'Bushekeri'],[27,'Bushenge'],[27,'Cyato'],[27,'Gihombo'],[27,'Kagano'],[27,'Kanjongo'],[27,'Karambi'],[27,'Karengera'],[27,'Kirimbi'],[27,'Macuba'],[27,'Nyabitekeri'],[27,'Rangiro'],[27,'Ruharambuga'],[27,'Shangi'],
        [28,'Bugeshi'],[28,'Busasamana'],[28,'Cyanzarwe'],[28,'Gisenyi'],[28,'Kanama'],[28,'Kanzenze'],[28,'Mudende'],[28,'Nyakiliba'],[28,'Nyamyumba'],[28,'Nyundo'],[28,'Rubavu'],[28,'Rugerero'],
        [29,'Bugarama'],[29,'Butare'],[29,'Bweyeye'],[29,'Gikundamvura'],[29,'Gashonga'],[29,'Giheke'],[29,'Gihundwe'],[29,'Gitambi'],[29,'Kamembe'],[29,'Muganza'],[29,'Mururu'],[29,'Nkanka'],[29,'Nkombo'],[29,'Nkungu'],[29,'Nyakabuye'],[29,'Nyakarenzo'],[29,'Nzahaha'],[29,'Rwimbogo'],
        [30,'Boneza'],[30,'Gihango'],[30,'Kigeyo'],[30,'Kivumu'],[30,'Manihira'],[30,'Mukura'],[30,'Murunda'],[30,'Musasa'],[30,'Nyabirasi'],[30,'Ruhango'],[30,'Rusebeya'],[30,'Mushonyi'],[30,'Mushubati']
    ];
    
    $stmt = $db->prepare("INSERT INTO rwanda_sectors (district_id, name) VALUES (?, ?)");
    $count = 0;
    foreach ($sectors as $sector) {
        $stmt->execute($sector);
        $count++;
    }
    echo "✓ Inserted $count sectors\n";
    
    $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS province_id INT, ADD COLUMN IF NOT EXISTS district_id INT, ADD COLUMN IF NOT EXISTS sector_id INT");
    $db->exec("ALTER TABLE products ADD COLUMN IF NOT EXISTS province_id INT, ADD COLUMN IF NOT EXISTS district_id INT, ADD COLUMN IF NOT EXISTS sector_id INT");
    echo "✓ Updated users and products tables\n";
    
    $db->exec("CREATE INDEX IF NOT EXISTS idx_districts_province ON rwanda_districts(province_id)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_sectors_district ON rwanda_sectors(district_id)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_users_location ON users(province_id, district_id, sector_id)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_products_location ON products(province_id, district_id, sector_id)");
    echo "✓ Created indexes\n\n";
    
    echo str_repeat("=", 60) . "\n";
    echo "Migration Summary:\n";
    echo str_repeat("=", 60) . "\n";
    
    $provinceCount = $db->query("SELECT COUNT(*) FROM rwanda_provinces")->fetchColumn();
    $districtCount = $db->query("SELECT COUNT(*) FROM rwanda_districts")->fetchColumn();
    $sectorCount = $db->query("SELECT COUNT(*) FROM rwanda_sectors")->fetchColumn();
    
    echo "✓ Provinces: $provinceCount\n";
    echo "✓ Districts: $districtCount\n";
    echo "✓ Sectors: $sectorCount\n\n";
    
    $stmt = $db->query("SELECT p.name as province, COUNT(DISTINCT d.id) as districts, COUNT(s.id) as sectors FROM rwanda_provinces p LEFT JOIN rwanda_districts d ON p.id = d.province_id LEFT JOIN rwanda_sectors s ON d.id = s.district_id GROUP BY p.id, p.name ORDER BY p.id");
    
    echo "Breakdown by Province:\n";
    echo str_repeat("-", 60) . "\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        printf("%-25s %2d districts, %3d sectors\n", $row['province'], $row['districts'], $row['sectors']);
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "✓ Migration completed successfully!\n";
    echo str_repeat("=", 60) . "\n";
    
} catch (Exception $e) {
    echo "\n✗ MIGRATION FAILED: " . $e->getMessage() . "\n";
    exit(1);
}
?>
