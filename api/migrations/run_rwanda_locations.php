<?php
/**
 * Rwanda Complete Locations Migration Script
 * Executes rwanda_complete_locations.sql
 */

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Starting Rwanda Locations Migration...\n\n";
    
    // Read SQL file
    $sqlFile = __DIR__ . '/rwanda_all_sectors.sql';
    
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    
    if ($sql === false) {
        throw new Exception("Failed to read SQL file");
    }
    
    echo "SQL file loaded successfully\n";
    echo "File size: " . strlen($sql) . " bytes\n\n";
    
    // Split SQL into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && !preg_match('/^--/', $stmt);
        }
    );
    
    echo "Found " . count($statements) . " SQL statements\n\n";
    
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $index => $statement) {
        try {
            $db->exec($statement);
            $successCount++;
            
            // Show progress for major operations
            if (stripos($statement, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i', $statement, $matches);
                echo "✓ Created table: " . ($matches[1] ?? 'unknown') . "\n";
            } elseif (stripos($statement, 'INSERT INTO rwanda_provinces') !== false) {
                echo "✓ Inserted provinces\n";
            } elseif (stripos($statement, 'INSERT INTO rwanda_districts') !== false) {
                preg_match('/VALUES\s*\((\d+),/', $statement, $matches);
                $provinceId = $matches[1] ?? '';
                $count = substr_count($statement, '),(');
                echo "✓ Inserted " . ($count + 1) . " districts for province $provinceId\n";
            } elseif (stripos($statement, 'INSERT INTO rwanda_sectors') !== false) {
                preg_match('/VALUES\s*\((\d+),/', $statement, $matches);
                $districtId = $matches[1] ?? '';
                $count = substr_count($statement, '),(');
                echo "✓ Inserted " . ($count + 1) . " sectors for district $districtId\n";
            } elseif (stripos($statement, 'ALTER TABLE') !== false) {
                preg_match('/ALTER TABLE\s+(\w+)/i', $statement, $matches);
                echo "✓ Altered table: " . ($matches[1] ?? 'unknown') . "\n";
            } elseif (stripos($statement, 'CREATE INDEX') !== false) {
                preg_match('/CREATE INDEX\s+(\w+)/i', $statement, $matches);
                echo "✓ Created index: " . ($matches[1] ?? 'unknown') . "\n";
            }
            
        } catch (PDOException $e) {
            $errorCount++;
            // Ignore "already exists" errors
            if (strpos($e->getMessage(), 'already exists') === false && 
                strpos($e->getMessage(), 'Duplicate') === false) {
                echo "✗ Error in statement " . ($index + 1) . ": " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "Migration Summary:\n";
    echo str_repeat("=", 60) . "\n";
    
    // Get counts
    $provinceCount = $db->query("SELECT COUNT(*) FROM rwanda_provinces")->fetchColumn();
    $districtCount = $db->query("SELECT COUNT(*) FROM rwanda_districts")->fetchColumn();
    $sectorCount = $db->query("SELECT COUNT(*) FROM rwanda_sectors")->fetchColumn();
    
    echo "✓ Provinces: $provinceCount\n";
    echo "✓ Districts: $districtCount\n";
    echo "✓ Sectors: $sectorCount\n";
    echo "\n";
    echo "✓ Successful statements: $successCount\n";
    if ($errorCount > 0) {
        echo "✗ Errors (ignored): $errorCount\n";
    }
    echo "\n";
    
    // Show breakdown by province
    echo "Breakdown by Province:\n";
    echo str_repeat("-", 60) . "\n";
    
    $stmt = $db->query("
        SELECT 
            p.name as province,
            COUNT(DISTINCT d.id) as districts,
            COUNT(s.id) as sectors
        FROM rwanda_provinces p
        LEFT JOIN rwanda_districts d ON p.id = d.province_id
        LEFT JOIN rwanda_sectors s ON d.id = s.district_id
        GROUP BY p.id, p.name
        ORDER BY p.id
    ");
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        printf("%-25s %2d districts, %3d sectors\n", 
            $row['province'], 
            $row['districts'], 
            $row['sectors']
        );
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "✓ Migration completed successfully!\n";
    echo str_repeat("=", 60) . "\n";
    
} catch (Exception $e) {
    echo "\n✗ MIGRATION FAILED!\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}
?>
