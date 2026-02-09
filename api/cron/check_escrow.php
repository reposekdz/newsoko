<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/EscrowService.php';

$database = new Database();
$db = $database->getConnection();
$escrow = new EscrowService($db);

echo "[" . date('Y-m-d H:i:s') . "] Starting escrow check...\n";
$count = $escrow->checkRefundPeriods();
echo "[" . date('Y-m-d H:i:s') . "] Processed $count escrow transactions\n";
