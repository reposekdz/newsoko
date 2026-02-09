// Marketplace API - Core endpoints for rental/sales marketplace
const API_BASE = '/api';

// ============================================================
// ESCROW API - Secure payment holding system
// ============================================================

export const EscrowApi = {
  // Create escrow transaction
  async create(data: {
    product_id: number;
    booking_id?: number;
    amount: number;
    type: 'sale' | 'rental_deposit' | 'security_deposit';
    payment_method: 'mtn_momo' | 'airtel_money' | 'bank_transfer';
    payer_phone: string;
    payer_name: string;
  }) {
    return fetch(`${API_BASE}/escrow/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },

  // Get transaction status
  async getStatus(transactionId: number) {
    return fetch(`${API_BASE}/escrow/${transactionId}`).then(r => r.json());
  },

  // Buyer confirms receipt
  async confirmReceipt(transactionId: number) {
    return fetch(`${API_BASE}/escrow/${transactionId}/confirm-receipt`, {
      method: 'POST',
    }).then(r => r.json());
  },

  // Release escrow to seller
  async release(transactionId: number, reason?: string) {
    return fetch(`${API_BASE}/escrow/${transactionId}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }).then(r => r.json());
  },

  // Request refund
  async requestRefund(transactionId: number, reason: string) {
    return fetch(`${API_BASE}/escrow/${transactionId}/request-refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }).then(r => r.json());
  },

  // Get escrow stats
  async getStats() {
    return fetch(`${API_BASE}/escrow/stats`).then(r => r.json());
  },
};

// ============================================================
// PAYMENTS API - Mobile Money Integration
// ============================================================

export const PaymentsApi = {
  // Initialize MTN MoMo payment
  async payWithMomo(data: {
    amount: number;
    phone: string;
    reference: string;
    description?: string;
  }) {
    return fetch(`${API_BASE}/payments/mtn-momo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },

  // Initialize Airtel Money payment
  async payWithAirtel(data: {
    amount: number;
    phone: string;
    reference: string;
    description?: string;
  }) {
    return fetch(`${API_BASE}/payments/airtel-money`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },

  // Initialize general payment
  async initialize(data: {
    amount: number;
    payment_method: string;
    reference_type: string;
    reference_id: number;
    phone_number?: string;
    description?: string;
  }) {
    return fetch(`${API_BASE}/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },

  // Verify payment
  async verify(transactionId: string) {
    return fetch(`${API_BASE}/payments/verify/${transactionId}`).then(r => r.json());
  },

  // Get payment status
  async getStatus(paymentId: number) {
    return fetch(`${API_BASE}/payments/${paymentId}/status`).then(r => r.json());
  },

  // Refund payment
  async refund(paymentId: number, amount?: number, reason?: string) {
    return fetch(`${API_BASE}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, reason }),
    }).then(r => r.json());
  },
};

// ============================================================
// DISPUTES API - Conflict resolution
// ============================================================

export const DisputesApi = {
  // Create dispute
  async create(data: {
    booking_id?: number;
    product_id: number;
    dispute_type: string;
    reason: string;
    description: string;
  }) {
    return fetch(`${API_BASE}/disputes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },

  // Get dispute by ID
  async get(disputeId: number) {
    return fetch(`${API_BASE}/disputes/${disputeId}`).then(r => r.json());
  },

  // Get my disputes
  async getMyDisputes(params?: { status?: string; page?: number }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetch(`${API_BASE}/disputes/my-disputes${query}`).then(r => r.json());
  },

  // Add evidence
  async addEvidence(disputeId: number, evidence: FormData) {
    return fetch(`${API_BASE}/disputes/${disputeId}/evidence`, {
      method: 'POST',
      body: evidence,
    }).then(r => r.json());
  },

  // Submit decision
  async submitDecision(disputeId: number, decision: 'accept' | 'reject', notes?: string) {
    return fetch(`${API_BASE}/disputes/${disputeId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes }),
    }).then(r => r.json());
  },

  // Admin: Resolve dispute
  async resolve(disputeId: number, resolution: {
    resolution_type: string;
    amount?: number;
    notes: string;
  }) {
    return fetch(`${API_BASE}/disputes/${disputeId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolution),
    }).then(r => r.json());
  },
};

// ============================================================
// SELLER VERIFICATION API
// ============================================================

export const SellerVerificationApi = {
  // Submit verification
  async submit(data: {
    verification_type: string;
    id_card_number: string;
    id_card_front: string;
    id_card_back: string;
    selfie_photo: string;
    business_name?: string;
    business_registration_number?: string;
    province?: string;
    district?: string;
  }) {
    return fetch(`${API_BASE}/seller-verification/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },

  // Upload document
  async uploadDocument(file: File, documentType: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    return fetch(`${API_BASE}/seller-verification/upload_document`, {
      method: 'POST',
      body: formData,
    }).then(r => r.json());
  },

  // Get my verification status
  async getStatus() {
    return fetch(`${API_BASE}/seller-verification/my_status`).then(r => r.json());
  },

  // Admin: Get pending verifications
  async getPending(filters?: { status?: string; search?: string }) {
    const query = filters ? '?' + new URLSearchParams(filters as any).toString() : '';
    return fetch(`${API_BASE}/seller-verification/pending${query}`).then(r => r.json());
  },

  // Admin: Review verification
  async review(verificationId: number, action: 'approve' | 'reject' | 'request_revision', notes?: string) {
    return fetch(`${API_BASE}/seller-verification/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification_id: verificationId, action, notes }),
    }).then(r => r.json());
  },
};

// ============================================================
// PRODUCT APPROVAL API
// ============================================================

export const ProductApprovalApi = {
  // Submit product for approval
  async submit(productId: number) {
    return fetch(`${API_BASE}/product-approval/submit/${productId}`, {
      method: 'POST',
    }).then(r => r.json());
  },

  // Admin: Get pending products
  async getPending(filters?: { category?: string; search?: string }) {
    const query = filters ? '?' + new URLSearchParams(filters as any).toString() : '';
    return fetch(`${API_BASE}/product-approval/pending${query}`).then(r => r.json());
  },

  // Admin: Review product
  async review(productId: number, action: 'approve' | 'reject' | 'request_revision', notes?: string) {
    return fetch(`${API_BASE}/product-approval/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, action, notes }),
    }).then(r => r.json());
  },

  // Get approval history
  async getHistory(productId: number) {
    return fetch(`${API_BASE}/product-approval/history/${productId}`).then(r => r.json());
  },
};

// ============================================================
// BOOKINGS API - Rentals and Sales
// ============================================================

export const BookingsApi = {
  // Create booking
  async create(data: {
    product_id: number;
    booking_type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'sale';
    start_date: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    quantity?: number;
    customer_notes?: string;
    use_escrow?: boolean;
  }) {
    return fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },

  // Get booking
  async get(bookingId: number) {
    return fetch(`${API_BASE}/bookings/${bookingId}`).then(r => r.json());
  },

  // Get my bookings
  async getMyBookings(params?: { status?: string; type?: string }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetch(`${API_BASE}/bookings/my-bookings${query}`).then(r => r.json());
  },

  // Get seller bookings
  async getSellerBookings(params?: { status?: string }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetch(`${API_BASE}/bookings/seller-bookings${query}`).then(r => r.json());
  },

  // Get availability calendar
  async getAvailability(productId: number, startDate: string, endDate: string) {
    return fetch(
      `${API_BASE}/bookings/availability/${productId}?start_date=${startDate}&end_date=${endDate}`
    ).then(r => r.json());
  },

  // Calculate price
  async calculatePrice(data: {
    product_id: number;
    booking_type: string;
    start_date: string;
    end_date?: string;
    quantity?: number;
  }) {
    return fetch(`${API_BASE}/bookings/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },

  // Cancel booking
  async cancel(bookingId: number, reason?: string) {
    return fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }).then(r => r.json());
  },

  // Confirm booking
  async confirm(bookingId: number) {
    return fetch(`${API_BASE}/bookings/${bookingId}/confirm`, {
      method: 'POST',
    }).then(r => r.json());
  },

  // Complete booking
  async complete(bookingId: number, condition_notes?: string) {
    return fetch(`${API_BASE}/bookings/${bookingId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ condition_notes }),
    }).then(r => r.json());
  },
};

// ============================================================
// REVIEWS API
// ============================================================

export const ReviewsApi = {
  // Create review
  async create(data: {
    booking_id: number;
    product_id: number;
    review_type: string;
    rating_product: number;
    rating_communication?: number;
    rating_delivery?: number;
    rating_overall: number;
    title?: string;
    review_text: string;
  }) {
    return fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },

  // Get product reviews
  async getProductReviews(productId: number, params?: { page?: number }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetch(`${API_BASE}/reviews/product/${productId}${query}`).then(r => r.json());
  },

  // Get seller reviews
  async getSellerReviews(sellerId: number) {
    return fetch(`${API_BASE}/reviews/seller/${sellerId}`).then(r => r.json());
  },

  // Respond to review
  async respond(reviewId: number, response: string) {
    return fetch(`${API_BASE}/reviews/${reviewId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response }),
    }).then(r => r.json());
  },

  // Mark helpful
  async markHelpful(reviewId: number, helpful: boolean) {
    return fetch(`${API_BASE}/reviews/${reviewId}/helpful`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ helpful }),
    }).then(r => r.json());
  },
};

// ============================================================
// RWANDA LOCATIONS API
// ============================================================

export const RwandaLocationsApi = {
  async getProvinces() {
    return fetch(`${API_BASE}/rwanda-locations/provinces`).then(r => r.json());
  },

  async getDistricts(provinceId: number) {
    return fetch(`${API_BASE}/rwanda-locations/provinces/${provinceId}/districts`).then(r => r.json());
  },

  async getSectors(districtId: number) {
    return fetch(`${API_BASE}/rwanda-locations/districts/${districtId}/sectors`).then(r => r.json());
  },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

// Calculate escrow commission
export function calculateCommission(amount: number, type: 'sale' | 'rental' = 'sale'): {
  commission: number;
  net_amount: number;
  percent: number;
} {
  const percent = type === 'sale' ? 10 : 8; // 10% for sales, 8% for rentals
  const commission = (amount * percent) / 100;
  return { commission, net_amount: amount - commission, percent };
}

// Calculate security deposit
export function calculateDeposit(price: number, percent: number = 10): number {
  return Math.round((price * percent) / 100);
}

// Format currency (RWF)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-RW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Generate unique booking number
export function generateBookingNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK${year}${month}-${random}`;
}

// Validate Rwanda phone number
export function validateRwandaPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^(?:\+250|0)?[0-9]{9}$/.test(cleaned);
}

// Format Rwanda phone number
export function formatRwandaPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('250')) {
    cleaned = cleaned.substring(3);
  }
  return cleaned.startsWith('0') ? cleaned : '0' + cleaned;
}

// Mobile money providers
export const MOBILE_MONEY = {
  MTN: {
    name: 'MTN Mobile Money',
    code: 'mtn_momo',
    shortCode: '*182*8*1#',
    minAmount: 100,
    maxAmount: 5000000,
    color: '#FFD700',
  },
  AIRTEL: {
    name: 'Airtel Money',
    code: 'airtel_money',
    shortCode: '*182*1#',
    minAmount: 100,
    maxAmount: 5000000,
    color: '#FF0000',
  },
};
