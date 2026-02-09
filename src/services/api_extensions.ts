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

  async getPaymentAnalytics() {
    const response = await fetch(`${API_BASE_URL}/advanced_payments.php?payment_analytics`, {
      headers: getHeaders()
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
  }

  // Notifications APIs
  async getNotifications(unreadOnly = false) {
    const params = unreadOnly ? '?unread_only=true' : '';
    const response = await fetch(`${API_BASE_URL}/notifications.php${params}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async markNotificationRead(notificationId = null) {
    const response = await fetch(`${API_BASE_URL}/notifications.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'mark_read',
        notification_id: notificationId
      })
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

  // Wallet APIs
  async getWalletBalance() {
    const response = await fetch(`${API_BASE_URL}/wallet.php?balance`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getWalletTransactions(limit = 50, type = null) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (type) params.append('type', type);
    
    const response = await fetch(`${API_BASE_URL}/wallet.php?transactions&${params.toString()}`, {
      headers: getHeaders()
    });
    return response.json();
  },

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
  }
