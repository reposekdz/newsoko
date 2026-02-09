<?php

class PaymentOrchestrator {
    private $db;
    private $providers = [];
    
    public function __construct($database) {
        $this->db = $database;
        $this->initializeProviders();
    }
    
    private function initializeProviders() {
        $this->providers = [
            'mtn_momo' => ['fee' => 0.02, 'uptime' => 0.99, 'speed' => 'instant'],
            'airtel_money' => ['fee' => 0.025, 'uptime' => 0.98, 'speed' => 'instant'],
            'stripe' => ['fee' => 0.029, 'uptime' => 0.999, 'speed' => 'instant'],
            'bank_transfer' => ['fee' => 0.01, 'uptime' => 0.95, 'speed' => 'delayed']
        ];
    }
    
    // Select best payment provider based on amount, speed, and fees
    public function selectOptimalProvider($amount, $preferredMethod = null, $priority = 'cost') {
        if ($preferredMethod && isset($this->providers[$preferredMethod])) {
            return $preferredMethod;
        }
        
        $best = null;
        $bestScore = -1;
        
        foreach ($this->providers as $name => $provider) {
            $score = 0;
            if ($priority === 'cost') {
                $score = (1 - $provider['fee']) * 100;
            } elseif ($priority === 'speed') {
                $score = ($provider['speed'] === 'instant' ? 100 : 50) * $provider['uptime'];
            } else {
                $score = $provider['uptime'] * 100;
            }
            
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $name;
            }
        }
        
        return $best;
    }
    
    // Automated split payment with escrow
    public function processSplitPayment($bookingId, $totalAmount, $paymentMethod, $phoneNumber) {
        $db = $this->db;
        
        // Get booking details
        $query = "SELECT b.*, p.title, u.phone as seller_phone 
                 FROM bookings b 
                 JOIN products p ON b.product_id = p.id
                 JOIN users u ON b.seller_id = u.id
                 WHERE b.id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $bookingId);
        $stmt->execute();
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$booking) {
            return ['success' => false, 'message' => 'Booking not found'];
        }
        
        // Calculate splits
        $splits = $this->calculateSplits($totalAmount, $booking);
        
        // Select optimal provider
        $provider = $this->selectOptimalProvider($totalAmount, $paymentMethod, 'speed');
        
        $db->beginTransaction();
        try {
            // Create payment record
            $paymentRef = 'PAY-' . time() . '-' . rand(1000, 9999);
            $paymentQuery = "INSERT INTO payments (payment_number, booking_id, user_id, amount, currency, 
                            payment_method, provider, status, phone_number) 
                            VALUES (:ref, :booking_id, :user_id, :amount, 'RWF', :method, :provider, 'processing', :phone)";
            $stmt = $db->prepare($paymentQuery);
            $stmt->bindParam(':ref', $paymentRef);
            $stmt->bindParam(':booking_id', $bookingId);
            $stmt->bindParam(':user_id', $booking['renter_id']);
            $stmt->bindParam(':amount', $totalAmount);
            $stmt->bindParam(':method', $paymentMethod);
            $stmt->bindParam(':provider', $provider);
            $stmt->bindParam(':phone', $phoneNumber);
            $stmt->execute();
            $paymentId = $db->lastInsertId();
            
            // Create escrow transaction
            $escrowRef = 'ESC-' . time() . '-' . rand(1000, 9999);
            $autoReleaseDate = date('Y-m-d H:i:s', strtotime('+3 days'));
            
            $escrowQuery = "INSERT INTO escrow_transactions (transaction_number, booking_id, product_id, 
                           buyer_id, seller_id, amount, platform_commission, commission_percentage, 
                           net_amount, type, status, payment_reference, auto_release_date) 
                           VALUES (:ref, :booking_id, :product_id, :buyer_id, :seller_id, :amount, 
                           :commission, :commission_pct, :net_amount, 'sale', 'held', :payment_ref, :auto_release)";
            $stmt = $db->prepare($escrowQuery);
            $stmt->bindParam(':ref', $escrowRef);
            $stmt->bindParam(':booking_id', $bookingId);
            $stmt->bindParam(':product_id', $booking['product_id']);
            $stmt->bindParam(':buyer_id', $booking['renter_id']);
            $stmt->bindParam(':seller_id', $booking['seller_id']);
            $stmt->bindParam(':amount', $totalAmount);
            $stmt->bindParam(':commission', $splits['platform_fee']);
            $stmt->bindParam(':commission_pct', $splits['commission_rate']);
            $stmt->bindParam(':net_amount', $splits['seller_amount']);
            $stmt->bindParam(':payment_ref', $paymentRef);
            $stmt->bindParam(':auto_release', $autoReleaseDate);
            $stmt->execute();
            $escrowId = $db->lastInsertId();
            
            // Process payment with provider
            $providerResult = $this->processWithProvider($provider, $phoneNumber, $totalAmount, $paymentRef);
            
            if ($providerResult['success']) {
                // Update payment status
                $updateQuery = "UPDATE payments SET status = 'completed', provider_transaction_id = :txn_id, 
                               completed_at = NOW() WHERE id = :id";
                $stmt = $db->prepare($updateQuery);
                $stmt->bindParam(':txn_id', $providerResult['transaction_id']);
                $stmt->bindParam(':id', $paymentId);
                $stmt->execute();
                
                // Update booking
                $updateBookingQuery = "UPDATE bookings SET payment_status = 'paid', status = 'confirmed' WHERE id = :id";
                $stmt = $db->prepare($updateBookingQuery);
                $stmt->bindParam(':id', $bookingId);
                $stmt->execute();
                
                $db->commit();
                
                return [
                    'success' => true,
                    'payment_id' => $paymentId,
                    'escrow_id' => $escrowId,
                    'reference' => $paymentRef,
                    'splits' => $splits,
                    'provider' => $provider
                ];
            } else {
                $db->rollBack();
                return ['success' => false, 'message' => $providerResult['message']];
            }
        } catch (Exception $e) {
            $db->rollBack();
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    // Calculate payment splits
    private function calculateSplits($totalAmount, $booking) {
        $commissionRate = 0.10; // 10% default
        
        // Get category-specific commission
        $query = "SELECT commission_percentage FROM categories WHERE id = 
                 (SELECT category_id FROM products WHERE id = :product_id)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':product_id', $booking['product_id']);
        $stmt->execute();
        $category = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($category) {
            $commissionRate = $category['commission_percentage'] / 100;
        }
        
        $platformFee = $totalAmount * $commissionRate;
        $sellerAmount = $totalAmount - $platformFee;
        
        return [
            'total_amount' => $totalAmount,
            'platform_fee' => $platformFee,
            'seller_amount' => $sellerAmount,
            'commission_rate' => $commissionRate * 100,
            'tax_amount' => 0,
            'delivery_fee' => 0
        ];
    }
    
    // Process payment with specific provider
    private function processWithProvider($provider, $phoneNumber, $amount, $reference) {
        switch ($provider) {
            case 'mtn_momo':
                return $this->processMTNMoMo($phoneNumber, $amount, $reference);
            case 'airtel_money':
                return $this->processAirtelMoney($phoneNumber, $amount, $reference);
            case 'stripe':
                return $this->processStripe($phoneNumber, $amount, $reference);
            default:
                return ['success' => false, 'message' => 'Provider not supported'];
        }
    }
    
    // MTN MoMo Collection
    private function processMTNMoMo($phoneNumber, $amount, $reference) {
        // MTN MoMo API integration
        // In production, use actual MTN MoMo API
        return [
            'success' => true,
            'transaction_id' => 'MTN-' . time(),
            'provider' => 'mtn_momo'
        ];
    }
    
    // Airtel Money Collection
    private function processAirtelMoney($phoneNumber, $amount, $reference) {
        // Airtel Money API integration
        return [
            'success' => true,
            'transaction_id' => 'AIRTEL-' . time(),
            'provider' => 'airtel_money'
        ];
    }
    
    // Stripe Payment
    private function processStripe($phoneNumber, $amount, $reference) {
        // Stripe API integration
        return [
            'success' => true,
            'transaction_id' => 'STRIPE-' . time(),
            'provider' => 'stripe'
        ];
    }
    
    // Instant payout to seller
    public function instantPayout($escrowId, $sellerId) {
        $db = $this->db;
        
        // Get escrow details
        $query = "SELECT e.*, u.phone as seller_phone, u.email as seller_email 
                 FROM escrow_transactions e
                 JOIN users u ON e.seller_id = u.id
                 WHERE e.id = :id AND e.status = 'held'";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $escrowId);
        $stmt->execute();
        $escrow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$escrow) {
            return ['success' => false, 'message' => 'Escrow not found or already released'];
        }
        
        // Get seller payout preferences
        $prefQuery = "SELECT payout_method, payout_phone, payout_bank_account FROM users WHERE id = :id";
        $stmt = $db->prepare($prefQuery);
        $stmt->bindParam(':id', $sellerId);
        $stmt->execute();
        $seller = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $payoutMethod = $seller['payout_method'] ?? 'mobile_money';
        $payoutPhone = $seller['payout_phone'] ?? $escrow['seller_phone'];
        
        $db->beginTransaction();
        try {
            // Process payout
            $payoutResult = $this->processPayout($payoutMethod, $payoutPhone, $escrow['net_amount'], $escrowId);
            
            if ($payoutResult['success']) {
                // Update escrow
                $updateQuery = "UPDATE escrow_transactions SET status = 'released', released_at = NOW(), 
                               payout_reference = :payout_ref WHERE id = :id";
                $stmt = $db->prepare($updateQuery);
                $stmt->bindParam(':payout_ref', $payoutResult['transaction_id']);
                $stmt->bindParam(':id', $escrowId);
                $stmt->execute();
                
                // Update wallet
                $walletQuery = "UPDATE wallets SET balance = balance + :amount WHERE user_id = :user_id";
                $stmt = $db->prepare($walletQuery);
                $stmt->bindParam(':amount', $escrow['net_amount']);
                $stmt->bindParam(':user_id', $sellerId);
                $stmt->execute();
                
                $db->commit();
                
                return [
                    'success' => true,
                    'amount' => $escrow['net_amount'],
                    'transaction_id' => $payoutResult['transaction_id'],
                    'method' => $payoutMethod
                ];
            } else {
                $db->rollBack();
                return ['success' => false, 'message' => $payoutResult['message']];
            }
        } catch (Exception $e) {
            $db->rollBack();
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    // Process payout to seller
    private function processPayout($method, $phone, $amount, $reference) {
        switch ($method) {
            case 'mobile_money':
                return $this->payoutMTNMoMo($phone, $amount, $reference);
            case 'bank_transfer':
                return $this->payoutBankTransfer($phone, $amount, $reference);
            default:
                return ['success' => false, 'message' => 'Payout method not supported'];
        }
    }
    
    // MTN MoMo Disbursement
    private function payoutMTNMoMo($phoneNumber, $amount, $reference) {
        // MTN MoMo Disbursement API
        // In production, use actual MTN MoMo Disbursement API
        return [
            'success' => true,
            'transaction_id' => 'PAYOUT-MTN-' . time(),
            'method' => 'mtn_momo'
        ];
    }
    
    // Bank Transfer Payout
    private function payoutBankTransfer($accountNumber, $amount, $reference) {
        // Bank transfer API (SEPA Instant, Faster Payments, etc.)
        return [
            'success' => true,
            'transaction_id' => 'PAYOUT-BANK-' . time(),
            'method' => 'bank_transfer'
        ];
    }
}
