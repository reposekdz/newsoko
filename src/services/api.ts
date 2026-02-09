const API_BASE_URL = 'http://localhost/Rentalsalesmarketplace/api/controllers';

let authToken = localStorage.getItem('auth_token') || null;

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = () => authToken;

export const api = {
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/products.php?${queryString}`);
    return response.json();
  },

  async getProduct(id) {
    const response = await fetch(`${API_BASE_URL}/products.php?id=${id}`);
    return response.json();
  },

  async getStats() {
    const response = await fetch(`${API_BASE_URL}/products.php?stats=1`);
    return response.json();
  },

  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/users.php`);
    return response.json();
  },

  async getUser(id) {
    const response = await fetch(`${API_BASE_URL}/users.php?id=${id}`);
    return response.json();
  },

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/users.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password })
    });
    const data = await response.json();
    if (data.success && data.data.token) {
      setAuthToken(data.data.token);
    }
    return data;
  },

  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/users.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', ...userData })
    });
    const data = await response.json();
    if (data.success && data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/users.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'logout', token: authToken })
    });
    setAuthToken(null);
    return response.json();
  },

  async verifyToken() {
    if (!authToken) return { success: false };
    const response = await fetch(`${API_BASE_URL}/users.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'verify_token', token: authToken })
    });
    return response.json();
  },

  async createProduct(productData) {
    const response = await fetch(`${API_BASE_URL}/products.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    return response.json();
  },

  async createBooking(bookingData) {
    const response = await fetch(`${API_BASE_URL}/booking_workflow.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'create_booking', ...bookingData })
    });
    return response.json();
  },

  async confirmPayment(bookingId) {
    const response = await fetch(`${API_BASE_URL}/booking_workflow.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'confirm_payment', booking_id: bookingId })
    });
    return response.json();
  },

  async completeBooking(bookingId) {
    const response = await fetch(`${API_BASE_URL}/booking_workflow.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'complete_booking', booking_id: bookingId })
    });
    return response.json();
  },

  async cancelBooking(bookingId) {
    const response = await fetch(`${API_BASE_URL}/booking_workflow.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'cancel_booking', booking_id: bookingId })
    });
    return response.json();
  },

  async getBookingDetails(bookingId) {
    const response = await fetch(`${API_BASE_URL}/booking_workflow.php?booking_id=${bookingId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getUserBookings(userId) {
    const response = await fetch(`${API_BASE_URL}/bookings.php?user_id=${userId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async updateBookingStatus(id, status) {
    const response = await fetch(`${API_BASE_URL}/bookings.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'update_status', id, status })
    });
    return response.json();
  },

  async completeBooking(id) {
    const response = await fetch(`${API_BASE_URL}/bookings.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'complete', id })
    });
    return response.json();
  },

  async initiatePayment(bookingId, amount, phoneNumber, paymentMethod) {
    const response = await fetch(`${API_BASE_URL}/payments.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        action: 'initiate', 
        booking_id: bookingId, 
        amount, 
        phone_number: phoneNumber, 
        payment_method: paymentMethod 
      })
    });
    return response.json();
  },

  async confirmPayment(paymentId, transactionId) {
    const response = await fetch(`${API_BASE_URL}/payments.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'confirm', payment_id: paymentId, transaction_id: transactionId })
    });
    return response.json();
  },

  async getNotifications() {
    const response = await fetch(`${API_BASE_URL}/notifications.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async markNotificationRead(notificationId) {
    const response = await fetch(`${API_BASE_URL}/notifications.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'mark_read', notification_id: notificationId })
    });
    return response.json();
  },

  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/analytics.php?type=dashboard`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getMarketplaceStats() {
    const response = await fetch(`${API_BASE_URL}/analytics.php?type=marketplace`);
    return response.json();
  },

  async getTrendingProducts() {
    const response = await fetch(`${API_BASE_URL}/analytics.php?type=trending`);
    return response.json();
  },

  async getCategoriesStats() {
    const response = await fetch(`${API_BASE_URL}/analytics.php?type=categories_stats`);
    return response.json();
  },

  async trackProductView(productId) {
    const response = await fetch(`${API_BASE_URL}/analytics.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'track_view', product_id: productId })
    });
    return response.json();
  },

  async getSpecializedProducts(type) {
    const response = await fetch(`${API_BASE_URL}/specialized.php?type=${type}`);
    return response.json();
  },

  async getFavorites() {
    const response = await fetch(`${API_BASE_URL}/favorites.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async addFavorite(productId) {
    const response = await fetch(`${API_BASE_URL}/favorites.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'add', product_id: productId })
    });
    return response.json();
  },

  async removeFavorite(productId) {
    const response = await fetch(`${API_BASE_URL}/favorites.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'remove', product_id: productId })
    });
    return response.json();
  },

  async getReviews(productId) {
    const response = await fetch(`${API_BASE_URL}/reviews.php?product_id=${productId}`);
    return response.json();
  },

  async addReview(productId, rating, comment) {
    const response = await fetch(`${API_BASE_URL}/reviews.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ product_id: productId, rating, comment })
    });
    return response.json();
  },

  async getConversations() {
    const response = await fetch(`${API_BASE_URL}/messages.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getMessages(conversationId) {
    const response = await fetch(`${API_BASE_URL}/messages.php?conversation_id=${conversationId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async sendMessage(receiverId, message, productId = null) {
    const response = await fetch(`${API_BASE_URL}/messages.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ receiver_id: receiverId, message, product_id: productId })
    });
    return response.json();
  },

  async getWalletBalance() {
    const response = await fetch(`${API_BASE_URL}/wallet.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getWalletTransactions() {
    const response = await fetch(`${API_BASE_URL}/wallet.php?transactions=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async topupWallet(amount, paymentMethod) {
    const response = await fetch(`${API_BASE_URL}/wallet.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'topup', amount, payment_method: paymentMethod })
    });
    return response.json();
  },

  async withdrawWallet(amount, phoneNumber) {
    const response = await fetch(`${API_BASE_URL}/wallet.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'withdraw', amount, phone_number: phoneNumber })
    });
    return response.json();
  },

  async getDisputes() {
    const response = await fetch(`${API_BASE_URL}/disputes.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async fileDispute(bookingId, reason, description, evidence) {
    const response = await fetch(`${API_BASE_URL}/disputes.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ booking_id: bookingId, reason, description, evidence })
    });
    return response.json();
  },

  async resolveDispute(disputeId, status, resolution) {
    const response = await fetch(`${API_BASE_URL}/disputes.php`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ dispute_id: disputeId, status, resolution })
    });
    return response.json();
  },

  // Admin APIs
  async getAdminUsers() {
    const response = await fetch(`${API_BASE_URL}/admin.php?action=users`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getAdminRoles() {
    const response = await fetch(`${API_BASE_URL}/admin.php?action=roles`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getAdminPermissions() {
    const response = await fetch(`${API_BASE_URL}/admin.php?action=permissions`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getAdminCategories() {
    const response = await fetch(`${API_BASE_URL}/admin.php?action=categories`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getAdminStats() {
    const response = await fetch(`${API_BASE_URL}/admin.php?action=stats`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getAdminLogs() {
    const response = await fetch(`${API_BASE_URL}/admin.php?action=logs`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async assignRole(userId, roleId) {
    const response = await fetch(`${API_BASE_URL}/admin.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'assign_role', user_id: userId, role_id: roleId })
    });
    return response.json();
  },

  async removeRole(userId, roleId) {
    const response = await fetch(`${API_BASE_URL}/admin.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'remove_role', user_id: userId, role_id: roleId })
    });
    return response.json();
  },

  async createCategory(categoryData) {
    const response = await fetch(`${API_BASE_URL}/admin.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'create_category', ...categoryData })
    });
    return response.json();
  },

  async banUser(userId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'ban_user', user_id: userId, reason })
    });
    return response.json();
  },

  async verifyUser(userId) {
    const response = await fetch(`${API_BASE_URL}/admin.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'verify_user', user_id: userId })
    });
    return response.json();
  },

  async approveProduct(productId) {
    const response = await fetch(`${API_BASE_URL}/admin.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'approve_product', product_id: productId })
    });
    return response.json();
  },

  async rejectProduct(productId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'reject_product', product_id: productId, reason })
    });
    return response.json();
  },

  async deleteUser(userId) {
    const response = await fetch(`${API_BASE_URL}/admin.php`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ user_id: userId })
    });
    return response.json();
  },

  async deleteProduct(productId) {
    const response = await fetch(`${API_BASE_URL}/admin.php`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ product_id: productId })
    });
    return response.json();
  },

  async deleteCategory(categoryId) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ category_id: categoryId })
    });
    return response.json();
  },

  async updateCategory(categoryData) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'update_category', ...categoryData })
    });
    return response.json();
  },

  async updateProduct(productData) {
    const response = await fetch(`${API_BASE_URL}/products.php`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    return response.json();
  },

  // Related Products APIs
  async getRelatedProducts(productId, limit = 8) {
    const response = await fetch(`${API_BASE_URL}/related_products.php/related/?product_id=${productId}&limit=${limit}`);
    return response.json();
  },

  async getSimilarProducts(productId) {
    const response = await fetch(`${API_BASE_URL}/related_products.php/similar/?product_id=${productId}`);
    return response.json();
  },

  async trackRelatedProductClick(sourceProductId, clickedProductId) {
    const response = await fetch(`${API_BASE_URL}/related_products.php/track-click`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        source_product_id: sourceProductId, 
        clicked_product_id: clickedProductId 
      })
    });
    return response.json();
  },

  async getAnalytics() {
    const response = await fetch(`${API_BASE_URL}/analytics.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getBookings() {
    const response = await fetch(`${API_BASE_URL}/booking_workflow.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async updateBooking(bookingId, data) {
    const response = await fetch(`${API_BASE_URL}/booking_workflow.php`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ booking_id: bookingId, ...data })
    });
    return response.json();
  },

  // Rwanda Locations APIs
  async getProvinces() {
    const response = await fetch(`${API_BASE_URL}/locations.php?action=provinces`);
    return response.json();
  },

  async getDistricts(provinceId = null) {
    const url = provinceId 
      ? `${API_BASE_URL}/locations.php?action=districts&province_id=${provinceId}`
      : `${API_BASE_URL}/locations.php?action=districts`;
    const response = await fetch(url);
    return response.json();
  },

  async getSectors(districtId = null) {
    const url = districtId 
      ? `${API_BASE_URL}/locations.php?action=sectors&district_id=${districtId}`
      : `${API_BASE_URL}/locations.php?action=sectors`;
    const response = await fetch(url);
    return response.json();
  },

  async getLocationHierarchy() {
    const response = await fetch(`${API_BASE_URL}/locations.php?action=hierarchy`);
    return response.json();
  },

  async getLocationStats() {
    const response = await fetch(`${API_BASE_URL}/locations.php?action=stats`);
    return response.json();
  },

  // Generic API method for admin operations
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async put(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async delete(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Seller Verification APIs
  async submitSellerVerification(verificationData) {
    const response = await fetch(`${API_BASE_URL}/seller_verification.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'submit_verification', ...verificationData })
    });
    return response.json();
  },

  async getUserVerificationStatus() {
    const response = await fetch(`${API_BASE_URL}/seller_verification.php?user_verification=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getPendingVerifications() {
    const response = await fetch(`${API_BASE_URL}/seller_verification.php?pending_verifications=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async approveVerification(verificationId) {
    const response = await fetch(`${API_BASE_URL}/seller_verification.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'approve_verification', verification_id: verificationId })
    });
    return response.json();
  },

  async rejectVerification(verificationId, reason) {
    const response = await fetch(`${API_BASE_URL}/seller_verification.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'reject_verification', verification_id: verificationId, reason })
    });
    return response.json();
  },

  async paySellerDeposit(paymentMethod, phoneNumber) {
    const response = await fetch(`${API_BASE_URL}/seller_verification.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'pay_seller_deposit', payment_method: paymentMethod, phone_number: phoneNumber })
    });
    return response.json();
  },

  // Product Approval APIs
  async createProductWithApproval(productData) {
    const response = await fetch(`${API_BASE_URL}/product_approval.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'create_product', ...productData })
    });
    return response.json();
  },

  async getPendingProducts() {
    const response = await fetch(`${API_BASE_URL}/product_approval.php?pending_products=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async approveProductListing(productId) {
    const response = await fetch(`${API_BASE_URL}/product_approval.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'approve_product', product_id: productId })
    });
    return response.json();
  },

  async rejectProductListing(productId, reason) {
    const response = await fetch(`${API_BASE_URL}/product_approval.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'reject_product', product_id: productId, reason })
    });
    return response.json();
  },

  async checkProductAvailability(productId, startDate, endDate) {
    const response = await fetch(`${API_BASE_URL}/product_approval.php?check_availability=1&product_id=${productId}&start_date=${startDate}&end_date=${endDate}`);
    return response.json();
  },

  async getProductAvailabilityCalendar(productId) {
    const response = await fetch(`${API_BASE_URL}/product_approval.php?availability_calendar=1&product_id=${productId}`);
    return response.json();
  },

  // Enhanced Escrow APIs
  async createBookingWithEscrow(bookingData) {
    const response = await fetch(`${API_BASE_URL}/escrow_management.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'create_booking_with_escrow', ...bookingData })
    });
    return response.json();
  },

  async confirmPaymentEscrow(paymentId, transactionId) {
    const response = await fetch(`${API_BASE_URL}/escrow_management.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'confirm_payment_escrow', payment_id: paymentId, transaction_id: transactionId })
    });
    return response.json();
  },

  async confirmItemReceived(bookingId) {
    const response = await fetch(`${API_BASE_URL}/escrow_management.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'confirm_item_received', booking_id: bookingId })
    });
    return response.json();
  },

  async completeRental(bookingId, itemCondition, deductDeposit) {
    const response = await fetch(`${API_BASE_URL}/escrow_management.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'complete_rental', booking_id: bookingId, item_condition: itemCondition, deduct_deposit: deductDeposit })
    });
    return response.json();
  },

  async autoReleaseEscrow() {
    const response = await fetch(`${API_BASE_URL}/escrow_management.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'auto_release_escrow' })
    });
    return response.json();
  },

  // Dispute Management APIs
  async fileDispute(disputeData) {
    const response = await fetch(`${API_BASE_URL}/dispute_management.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'file_dispute', ...disputeData })
    });
    return response.json();
  },

  async getUserDisputes() {
    const response = await fetch(`${API_BASE_URL}/dispute_management.php?user_disputes=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getAllDisputes(status = 'all') {
    const response = await fetch(`${API_BASE_URL}/dispute_management.php?all_disputes=1&status=${status}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async addDisputeMessage(disputeId, message, attachments = []) {
    const response = await fetch(`${API_BASE_URL}/dispute_management.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'add_dispute_message', dispute_id: disputeId, message, attachments })
    });
    return response.json();
  },

  async getDisputeMessages(disputeId) {
    const response = await fetch(`${API_BASE_URL}/dispute_management.php?dispute_messages=1&dispute_id=${disputeId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async resolveDispute(disputeId, resolution, refundAmount = 0, refundTo = null) {
    const response = await fetch(`${API_BASE_URL}/dispute_management.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'resolve_dispute', dispute_id: disputeId, resolution, refund_amount: refundAmount, refund_to: refundTo })
    });
    return response.json();
  },

  // Ratings & Reviews APIs
  async submitReview(reviewData) {
    const response = await fetch(`${API_BASE_URL}/ratings_reviews.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'submit_review', ...reviewData })
    });
    return response.json();
  },

  async getProductReviews(productId) {
    const response = await fetch(`${API_BASE_URL}/ratings_reviews.php?product_reviews=1&product_id=${productId}`);
    return response.json();
  },

  async getSellerReviews(sellerId) {
    const response = await fetch(`${API_BASE_URL}/ratings_reviews.php?seller_reviews=1&seller_id=${sellerId}`);
    return response.json();
  },

  async replyToReview(reviewId, reply) {
    const response = await fetch(`${API_BASE_URL}/ratings_reviews.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'reply_review', review_id: reviewId, reply })
    });
    return response.json();
  },

  // Payment Analytics
  async getPaymentAnalytics() {
    const response = await fetch(`${API_BASE_URL}/advanced_payments.php?payment_analytics`, {
      headers: getHeaders()
    });
    return response.json();
  },

  // Referral Program
  async getReferralCode() {
    const response = await fetch(`${API_BASE_URL}/referrals.php?get_code`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getReferralStats() {
    const response = await fetch(`${API_BASE_URL}/referrals.php?stats`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async applyReferralCode(code) {
    const response = await fetch(`${API_BASE_URL}/referrals.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'apply_code', code })
    });
    return response.json();
  },

  // Promo Codes
  async validatePromoCode(code, amount) {
    const response = await fetch(`${API_BASE_URL}/promo_codes.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'validate', code, amount })
    });
    return response.json();
  },

  async applyPromoCode(code, bookingId) {
    const response = await fetch(`${API_BASE_URL}/promo_codes.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'apply', code, booking_id: bookingId })
    });
    return response.json();
  },

  async getActivePromoCodes() {
    const response = await fetch(`${API_BASE_URL}/promo_codes.php?active`, {
      headers: getHeaders()
    });
    return response.json();
  },

  // Product Questions
  async getProductQuestions(productId) {
    const response = await fetch(`${API_BASE_URL}/product_questions.php?product_id=${productId}`);
    return response.json();
  },

  async askProductQuestion(productId, question) {
    const response = await fetch(`${API_BASE_URL}/product_questions.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'ask', product_id: productId, question })
    });
    return response.json();
  },

  async answerProductQuestion(questionId, answer) {
    const response = await fetch(`${API_BASE_URL}/product_questions.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'answer', question_id: questionId, answer })
    });
    return response.json();
  },

  // Seller Metrics
  async getSellerMetrics(sellerId = null) {
    const url = sellerId 
      ? `${API_BASE_URL}/seller_metrics.php?seller_id=${sellerId}`
      : `${API_BASE_URL}/seller_metrics.php`;
    const response = await fetch(url, { headers: getHeaders() });
    return response.json();
  },

  // Product Comparison
  async saveComparison(productIds) {
    const response = await fetch(`${API_BASE_URL}/product_comparison.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'save', product_ids: productIds })
    });
    return response.json();
  },

  async getComparisons() {
    const response = await fetch(`${API_BASE_URL}/product_comparison.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async compareProducts(productIds) {
    const response = await fetch(`${API_BASE_URL}/product_comparison.php?compare&ids=${productIds.join(',')}`);
    return response.json();
  },

  // User Activity
  async getUserActivity(limit = 50) {
    const response = await fetch(`${API_BASE_URL}/user_activity.php?limit=${limit}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async logActivity(activityType, description, metadata = {}) {
    const response = await fetch(`${API_BASE_URL}/user_activity.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        action: 'log', 
        activity_type: activityType, 
        description, 
        metadata 
      })
    });
    return response.json();
  },

  // Platform Analytics
  async getPlatformAnalytics(periodType = 'daily', metricName = null) {
    const params = new URLSearchParams({ period_type: periodType });
    if (metricName) params.append('metric_name', metricName);
    
    const response = await fetch(`${API_BASE_URL}/platform_analytics.php?${params.toString()}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  // Advanced Payment APIs
  async walletCheckout(bookingId, paymentMethod, phoneNumber, biometricToken) {
    const response = await fetch(`${API_BASE_URL}/advanced_payments.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        action: 'wallet_checkout',
        booking_id: bookingId,
        payment_method: paymentMethod,
        phone_number: phoneNumber,
        biometric_token: biometricToken
      })
    });
    return response.json();
  },

  async getEscrowProgress(bookingId) {
    const response = await fetch(`${API_BASE_URL}/advanced_payments.php?escrow_progress&booking_id=${bookingId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async setupPayoutMethod(payoutMethod, payoutPhone, bankAccount = null, bankName = null) {
    const response = await fetch(`${API_BASE_URL}/advanced_payments.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'setup_payout',
        payout_method: payoutMethod,
        payout_phone: payoutPhone,
        payout_bank_account: bankAccount,
        payout_bank_name: bankName
      })
    });
    return response.json();
  },

  async requestInstantPayout(escrowId) {
    const response = await fetch(`${API_BASE_URL}/advanced_payments.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'request_payout',
        escrow_id: escrowId
      })
    });
    return response.json();
  },

  async fraudCheckTransaction(amount, paymentData) {
    const response = await fetch(`${API_BASE_URL}/advanced_payments.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'fraud_check_transaction',
        amount,
        payment_data: paymentData
      })
    });
    return response.json();
  },

  // Live Photo Verification APIs
  async verifyLivePhoto(imagePath, productId) {
    const response = await fetch(`${API_BASE_URL}/live_photo_verification.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'verify_live_photo',
        image_path: imagePath,
        product_id: productId
      })
    });
    return response.json();
  },

  async checkImageAuthenticity(imagePath) {
    const response = await fetch(`${API_BASE_URL}/live_photo_verification.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'check_image_authenticity',
        image_path: imagePath
      })
    });
    return response.json();
  },

  async getSellerBehaviorAnalysis(sellerId) {
    const response = await fetch(`${API_BASE_URL}/live_photo_verification.php?seller_behavior&seller_id=${sellerId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getFraudLogs(entityType = null, severity = null, limit = 50) {
    const params = new URLSearchParams();
    if (entityType) params.append('entity_type', entityType);
    if (severity) params.append('severity', severity);
    params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/live_photo_verification.php?fraud_logs&${params.toString()}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async resolveFraudLog(logId, actionTaken, status = 'resolved') {
    const response = await fetch(`${API_BASE_URL}/live_photo_verification.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'resolve_fraud_log',
        log_id: logId,
        action_taken: actionTaken,
        status
      })
    });
    return response.json();
  },

  async comprehensiveFraudCheck(productData, sellerId) {
    const response = await fetch(`${API_BASE_URL}/live_photo_verification.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'fraud_check',
        product_data: productData,
        seller_id: sellerId
      })
    });
    return response.json();
  },

  // Notifications APIs (Enhanced)
  async getNotifications(unreadOnly = false) {
    const params = unreadOnly ? '?unread_only=true' : '';
    const response = await fetch(`${API_BASE_URL}/notifications.php${params}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async deleteNotification(notificationId) {
    const response = await fetch(`${API_BASE_URL}/notifications.php`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ notification_id: notificationId })
    });
    return response.json();
  },

  // Wallet APIs (Enhanced)
  async addWalletFunds(amount, paymentMethod, phoneNumber) {
    const response = await fetch(`${API_BASE_URL}/wallet.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'add_funds',
        amount,
        payment_method: paymentMethod,
        phone_number: phoneNumber
      })
    });
    return response.json();
  },

  async withdrawWalletFunds(amount, withdrawMethod, phoneNumber) {
    const response = await fetch(`${API_BASE_URL}/wallet.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'withdraw',
        amount,
        withdraw_method: withdrawMethod,
        phone_number: phoneNumber
      })
    });
    return response.json();
  },

  // Wishlist APIs
  async getWishlist() {
    const response = await fetch(`${API_BASE_URL}/wishlist.php?wishlist`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async addToWishlist(productId, notes = null, priceAlertEnabled = false, targetPrice = null) {
    const response = await fetch(`${API_BASE_URL}/wishlist.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'add_to_wishlist',
        product_id: productId,
        notes,
        price_alert_enabled: priceAlertEnabled,
        target_price: targetPrice
      })
    });
    return response.json();
  },

  async removeFromWishlist(wishlistId) {
    const response = await fetch(`${API_BASE_URL}/wishlist.php`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ wishlist_id: wishlistId })
    });
    return response.json();
  },

  async getSavedSearches() {
    const response = await fetch(`${API_BASE_URL}/wishlist.php?saved_searches`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async saveSearch(name, searchParams, alertEnabled = false, alertFrequency = 'daily') {
    const response = await fetch(`${API_BASE_URL}/wishlist.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'save_search',
        name,
        search_params: searchParams,
        alert_enabled: alertEnabled,
        alert_frequency: alertFrequency
      })
    });
    return response.json();
  },

  // Support Tickets APIs
  async getSupportTickets(status = null, category = null) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    
    const queryString = params.toString();
    const response = await fetch(`${API_BASE_URL}/support.php${queryString ? '?' + queryString : ''}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getSupportTicketDetails(ticketId) {
    const response = await fetch(`${API_BASE_URL}/support.php?ticket_id=${ticketId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async createSupportTicket(ticketData) {
    const response = await fetch(`${API_BASE_URL}/support.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'create_ticket',
        ...ticketData
      })
    });
    return response.json();
  },

  async addSupportTicketMessage(ticketId, message, attachments = null) {
    const response = await fetch(`${API_BASE_URL}/support.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'add_message',
        ticket_id: ticketId,
        message,
        attachments
      })
    });
    return response.json();
  },

  async updateSupportTicket(ticketId, status = null, assignedTo = null) {
    const response = await fetch(`${API_BASE_URL}/support.php`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        ticket_id: ticketId,
        status,
        assigned_to: assignedTo
      })
    });
    return response.json();
  },

  // Shipping Tracking APIs
  async getShippingTracking(bookingId) {
    const response = await fetch(`${API_BASE_URL}/shipping.php?booking_id=${bookingId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getShippingByTrackingNumber(trackingNumber) {
    const response = await fetch(`${API_BASE_URL}/shipping.php?tracking_number=${trackingNumber}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async createShippingTracking(bookingId, carrier, trackingNumber, estimatedDelivery) {
    const response = await fetch(`${API_BASE_URL}/shipping.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        booking_id: bookingId,
        carrier,
        tracking_number: trackingNumber,
        estimated_delivery: estimatedDelivery
      })
    });
    return response.json();
  },

  async updateShippingTracking(trackingId, status, location = null, description = '') {
    const response = await fetch(`${API_BASE_URL}/shipping.php`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        tracking_id: trackingId,
        status,
        location,
        description
      })
    });
    return response.json();
  },

  // ============================================================
  // ADVANCED FEATURES - CHAT, RECOMMENDATIONS, SUBSCRIPTIONS, AUCTIONS
  // ============================================================

  // Real-Time Chat
  async getConversations() {
    const response = await fetch(`${API_BASE_URL}/chat.php?conversations=1`, { headers: getHeaders() });
    return response.json();
  },

  async getChatMessages(conversationId, limit = 50, offset = 0) {
    const response = await fetch(`${API_BASE_URL}/chat.php?conversation_id=${conversationId}&limit=${limit}&offset=${offset}`, { headers: getHeaders() });
    return response.json();
  },

  async startConversation(otherUserId, productId = null) {
    const response = await fetch(`${API_BASE_URL}/chat.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'start_conversation', other_user_id: otherUserId, product_id: productId })
    });
    return response.json();
  },

  async sendChatMessage(conversationId, message, messageType = 'text', attachments = null) {
    const response = await fetch(`${API_BASE_URL}/chat.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'send_message', conversation_id: conversationId, message, message_type: messageType, attachments })
    });
    return response.json();
  },

  async getChatUnreadCount() {
    const response = await fetch(`${API_BASE_URL}/chat.php?unread_count=1`, { headers: getHeaders() });
    return response.json();
  },

  // AI Recommendations
  async getPersonalizedRecommendations(limit = 10) {
    const response = await fetch(`${API_BASE_URL}/recommendations.php?personalized=1&limit=${limit}`, { headers: getHeaders() });
    return response.json();
  },

  async getSimilarProducts(productId, limit = 8) {
    const response = await fetch(`${API_BASE_URL}/recommendations.php?similar=1&product_id=${productId}&limit=${limit}`);
    return response.json();
  },

  async getTrendingProducts(limit = 10, days = 7) {
    const response = await fetch(`${API_BASE_URL}/recommendations.php?trending=1&limit=${limit}&days=${days}`);
    return response.json();
  },

  async getFrequentlyBoughtTogether(productId, limit = 5) {
    const response = await fetch(`${API_BASE_URL}/recommendations.php?frequently_bought_together=1&product_id=${productId}&limit=${limit}`);
    return response.json();
  },

  // Subscription Plans
  async getSubscriptionPlans() {
    const response = await fetch(`${API_BASE_URL}/subscriptions.php?plans=1`);
    return response.json();
  },

  async getMySubscription() {
    const response = await fetch(`${API_BASE_URL}/subscriptions.php?my_subscription=1`, { headers: getHeaders() });
    return response.json();
  },

  async subscribe(planId, paymentMethod, billingCycle = 'monthly') {
    const response = await fetch(`${API_BASE_URL}/subscriptions.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'subscribe', plan_id: planId, payment_method: paymentMethod, billing_cycle: billingCycle })
    });
    return response.json();
  },

  async cancelSubscription() {
    const response = await fetch(`${API_BASE_URL}/subscriptions.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'cancel' })
    });
    return response.json();
  },

  async upgradeSubscription(planId) {
    const response = await fetch(`${API_BASE_URL}/subscriptions.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'upgrade', plan_id: planId })
    });
    return response.json();
  },

  // Auctions
  async getActiveAuctions(limit = 20, offset = 0) {
    const response = await fetch(`${API_BASE_URL}/auctions.php?active_auctions=1&limit=${limit}&offset=${offset}`);
    return response.json();
  },

  async getAuctionDetails(auctionId) {
    const response = await fetch(`${API_BASE_URL}/auctions.php?auction_id=${auctionId}`);
    return response.json();
  },

  async getMyAuctions() {
    const response = await fetch(`${API_BASE_URL}/auctions.php?my_auctions=1`, { headers: getHeaders() });
    return response.json();
  },

  async getMyBids() {
    const response = await fetch(`${API_BASE_URL}/auctions.php?my_bids=1`, { headers: getHeaders() });
    return response.json();
  },

  async createAuction(productId, startingPrice, reservePrice, bidIncrement, durationHours) {
    const response = await fetch(`${API_BASE_URL}/auctions.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'create_auction', product_id: productId, starting_price: startingPrice, reserve_price: reservePrice, bid_increment: bidIncrement, duration_hours: durationHours })
    });
    return response.json();
  },

  async placeBid(auctionId, bidAmount, isAutoBid = false, maxAutoBid = null) {
    const response = await fetch(`${API_BASE_URL}/auctions.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'place_bid', auction_id: auctionId, bid_amount: bidAmount, is_auto_bid: isAutoBid, max_auto_bid: maxAutoBid })
    });
    return response.json();
  },

  // Social Features
  async followUser(userId) {
    const response = await fetch(`${API_BASE_URL}/social.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'follow', user_id: userId })
    });
    return response.json();
  },

  async unfollowUser(userId) {
    const response = await fetch(`${API_BASE_URL}/social.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'unfollow', user_id: userId })
    });
    return response.json();
  },

  async shareProduct(productId, platform) {
    const response = await fetch(`${API_BASE_URL}/social.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'share_product', product_id: productId, platform })
    });
    return response.json();
  },

  // Loyalty Program
  async getLoyaltyPoints() {
    const response = await fetch(`${API_BASE_URL}/loyalty.php?points=1`, { headers: getHeaders() });
    return response.json();
  },

  async redeemLoyaltyPoints(points, rewardType) {
    const response = await fetch(`${API_BASE_URL}/loyalty.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'redeem', points, reward_type: rewardType })
    });
    return response.json();
  },

  // Flash Sales
  async getActiveFlashSales() {
    const response = await fetch(`${API_BASE_URL}/flash_sales.php?active=1`);
    return response.json();
  },

  // Reporting
  async reportUser(userId, reportType, description, evidence = null) {
    const response = await fetch(`${API_BASE_URL}/reports.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'report_user', reported_user_id: userId, report_type: reportType, description, evidence })
    });
    return response.json();
  },

  async reportProduct(productId, reportType, description, evidence = null) {
    const response = await fetch(`${API_BASE_URL}/reports.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'report_product', reported_product_id: productId, report_type: reportType, description, evidence })
    });
    return response.json();
  },

  // Advanced Admin Management APIs
  async getAdminDashboard() {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php?action=dashboard_stats`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminUsersList(search = '', status = 'all', limit = 50, offset = 0) {
    const params = new URLSearchParams({ search, status, limit: limit.toString(), offset: offset.toString() });
    const response = await fetch(`${API_BASE_URL}/admin_complete.php?action=users_list&${params.toString()}`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminProductsPending() {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php?action=products_pending`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminBookingsAll(status = 'all') {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php?action=bookings_all&status=${status}`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminPaymentsAll(status = 'all', limit = 100) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php?action=payments_all&status=${status}&limit=${limit}`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminDisputesAll(status = 'all') {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php?action=disputes_all&status=${status}`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminReviewsAll() {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php?action=reviews_all`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminFraudLogsAll() {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php?action=fraud_logs`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminWalletTransactions() {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php?action=wallet_transactions`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminRevenueAnalytics(period = 30) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php?action=revenue_analytics&period=${period}`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminSystemSettings() {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php?action=system_settings`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminActivityLogsAll(limit = 100) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php?action=activity_logs&limit=${limit}`, { headers: getHeaders() });
    return response.json();
  },

  async adminVerifyUser(userId) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'verify_user', user_id: userId })
    });
    return response.json();
  },

  async adminBanUser(userId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'ban_user', user_id: userId, reason })
    });
    return response.json();
  },

  async adminUnbanUser(userId) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'unban_user', user_id: userId })
    });
    return response.json();
  },

  async adminDeleteUser(userId) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'delete_user', user_id: userId })
    });
    return response.json();
  },

  async adminApproveProduct(productId) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'approve_product', product_id: productId })
    });
    return response.json();
  },

  async adminRejectProduct(productId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'reject_product', product_id: productId, reason })
    });
    return response.json();
  },

  async adminDeleteProduct(productId) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'delete_product', product_id: productId })
    });
    return response.json();
  },

  async adminResolveDispute(disputeId, resolution) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'resolve_dispute', dispute_id: disputeId, resolution })
    });
    return response.json();
  },

  async adminRefundBooking(bookingId, amount, reason) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'refund_booking', booking_id: bookingId, amount, reason })
    });
    return response.json();
  },

  async adminCancelBooking(bookingId) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'cancel_booking', booking_id: bookingId })
    });
    return response.json();
  },

  async adminDeleteReview(reviewId) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'delete_review', review_id: reviewId })
    });
    return response.json();
  },

  async adminUpdateSetting(key, value) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'update_setting', setting_key: key, setting_value: value })
    });
    return response.json();
  },

  async adminBulkAction(bulkAction, ids) {
    const response = await fetch(`${API_BASE_URL}/admin_complete.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'bulk_action', bulk_action: bulkAction, ids })
    });
    return response.json();
  },

  async getAdminUsers(status = 'all', search = '', limit = 50, offset = 0) {
    const params = new URLSearchParams({ status, search, limit: limit.toString(), offset: offset.toString() });
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?users&${params.toString()}`, { headers: getHeaders() });
    return response.json();
  },

  async toggleUserBan(userId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'toggle_ban', user_id: userId, reason })
    });
    return response.json();
  },

  async getPlatformSettings() {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?settings`, { headers: getHeaders() });
    return response.json();
  },

  async updatePlatformSetting(key, value) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'update_setting', setting_key: key, setting_value: value })
    });
    return response.json();
  },

  async getAdminPayments(status = 'all', limit = 50) {
    const params = new URLSearchParams({ status, limit: limit.toString() });
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?payments&${params.toString()}`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminDisputes(status = 'all') {
    const params = new URLSearchParams({ status });
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?disputes&${params.toString()}`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminFraudLogs() {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?fraud_logs`, { headers: getHeaders() });
    return response.json();
  },

  async getRevenueAnalytics(period = 30) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?revenue_analytics&period=${period}`, { headers: getHeaders() });
    return response.json();
  },

  async bulkApproveProducts(productIds) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'bulk_approve_products', product_ids: productIds })
    });
    return response.json();
  },

  async getAdminActivityLogs(limit = 100) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?activity_logs&limit=${limit}`, { headers: getHeaders() });
    return response.json();
  },

  // Complete Admin Advanced APIs
  async getAdminStatsComplete() {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?action=stats`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminUsersComplete() {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?action=users`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminPendingApprovals() {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?action=pending_approvals`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminBookings() {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?action=bookings`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminDisputesComplete() {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?action=disputes`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminReviews() {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?action=reviews`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminRolesComplete() {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?action=roles`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminCategoriesComplete() {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?action=categories`, { headers: getHeaders() });
    return response.json();
  },

  async getAdminLogsComplete(limit = 50) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?action=logs&limit=${limit}`, { headers: getHeaders() });
    return response.json();
  },

  async getSystemSettingsComplete() {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?action=system_settings`, { headers: getHeaders() });
    return response.json();
  },

  async verifyUserAdmin(userId) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'verify_user', user_id: userId })
    });
    return response.json();
  },

  async banUserAdmin(userId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'ban_user', user_id: userId, reason })
    });
    return response.json();
  },

  async unbanUserAdmin(userId) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'unban_user', user_id: userId })
    });
    return response.json();
  },

  async deleteUserAdmin(userId) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'delete_user', user_id: userId })
    });
    return response.json();
  },

  async assignRoleAdmin(userId, roleId) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'assign_role', user_id: userId, role_id: roleId })
    });
    return response.json();
  },

  async approveProductAdmin(productId) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'approve_product', product_id: productId })
    });
    return response.json();
  },

  async rejectProductAdmin(productId, reason) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'reject_product', product_id: productId, reason })
    });
    return response.json();
  },

  async deleteProductAdmin(productId) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'delete_product', product_id: productId })
    });
    return response.json();
  },

  async resolveDisputeAdmin(disputeId, resolution) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'resolve_dispute', dispute_id: disputeId, resolution })
    });
    return response.json();
  },

  async refundBookingAdmin(bookingId, amount, reason) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'refund_booking', booking_id: bookingId, amount, reason })
    });
    return response.json();
  },

  async cancelBookingAdmin(bookingId) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'cancel_booking', booking_id: bookingId })
    });
    return response.json();
  },

  async deleteReviewAdmin(reviewId) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'delete_review', review_id: reviewId })
    });
    return response.json();
  },

  async createCategoryAdmin(data) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'create_category', ...data })
    });
    return response.json();
  },

  async updateCategoryAdmin(data) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'update_category', ...data })
    });
    return response.json();
  },

  async deleteCategoryAdmin(categoryId) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'delete_category', category_id: categoryId })
    });
    return response.json();
  },

  async updateSettingAdmin(key, value) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'update_setting', setting_key: key, setting_value: value })
    });
    return response.json();
  },

  async sendNotificationAdmin(data) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'send_notification', ...data })
    });
    return response.json();
  },

  async exportDataAdmin(type) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php?action=export_data&type=${type}`, { headers: getHeaders() });
    return response.json();
  },

  async bulkActionAdmin(action, ids) {
    const response = await fetch(`${API_BASE_URL}/admin_advanced.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'bulk_action', action, ids })
    });
    return response.json();
  }
};
