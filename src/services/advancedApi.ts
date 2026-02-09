// Advanced Marketplace API Extensions
import { api, getHeaders } from './api';

const API_BASE_URL = 'http://localhost/Rentalsalesmarketplace/api/controllers';

// ============================================================
// REAL-TIME CHAT SYSTEM
// ============================================================

export const chatApi = {
  async getConversations() {
    const response = await fetch(`${API_BASE_URL}/chat.php?conversations=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getMessages(conversationId, limit = 50, offset = 0) {
    const response = await fetch(`${API_BASE_URL}/chat.php?conversation_id=${conversationId}&limit=${limit}&offset=${offset}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async startConversation(otherUserId, productId = null) {
    const response = await fetch(`${API_BASE_URL}/chat.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'start_conversation',
        other_user_id: otherUserId,
        product_id: productId
      })
    });
    return response.json();
  },

  async sendMessage(conversationId, message, messageType = 'text', attachments = null) {
    const response = await fetch(`${API_BASE_URL}/chat.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'send_message',
        conversation_id: conversationId,
        message,
        message_type: messageType,
        attachments
      })
    });
    return response.json();
  },

  async markAsRead(conversationId) {
    const response = await fetch(`${API_BASE_URL}/chat.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'mark_read',
        conversation_id: conversationId
      })
    });
    return response.json();
  },

  async getUnreadCount() {
    const response = await fetch(`${API_BASE_URL}/chat.php?unread_count=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async deleteMessage(messageId) {
    const response = await fetch(`${API_BASE_URL}/chat.php`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ message_id: messageId })
    });
    return response.json();
  },

  async archiveConversation(conversationId) {
    const response = await fetch(`${API_BASE_URL}/chat.php`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ conversation_id: conversationId })
    });
    return response.json();
  }
};

// ============================================================
// AI RECOMMENDATIONS ENGINE
// ============================================================

export const recommendationsApi = {
  async getPersonalized(limit = 10) {
    const response = await fetch(`${API_BASE_URL}/recommendations.php?personalized=1&limit=${limit}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getSimilar(productId, limit = 8) {
    const response = await fetch(`${API_BASE_URL}/recommendations.php?similar=1&product_id=${productId}&limit=${limit}`);
    return response.json();
  },

  async getTrending(limit = 10, days = 7) {
    const response = await fetch(`${API_BASE_URL}/recommendations.php?trending=1&limit=${limit}&days=${days}`);
    return response.json();
  },

  async getFrequentlyBoughtTogether(productId, limit = 5) {
    const response = await fetch(`${API_BASE_URL}/recommendations.php?frequently_bought_together=1&product_id=${productId}&limit=${limit}`);
    return response.json();
  },

  async updatePreferences(preferences) {
    const response = await fetch(`${API_BASE_URL}/recommendations.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'update_preferences',
        ...preferences
      })
    });
    return response.json();
  },

  async trackView(productId) {
    const response = await fetch(`${API_BASE_URL}/recommendations.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'track_view',
        product_id: productId
      })
    });
    return response.json();
  }
};

// ============================================================
// SUBSCRIPTION PLANS
// ============================================================

export const subscriptionApi = {
  async getPlans() {
    const response = await fetch(`${API_BASE_URL}/subscriptions.php?plans=1`);
    return response.json();
  },

  async getMySubscription() {
    const response = await fetch(`${API_BASE_URL}/subscriptions.php?my_subscription=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getSubscriptionHistory() {
    const response = await fetch(`${API_BASE_URL}/subscriptions.php?subscription_history=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async subscribe(planId, paymentMethod, billingCycle = 'monthly') {
    const response = await fetch(`${API_BASE_URL}/subscriptions.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'subscribe',
        plan_id: planId,
        payment_method: paymentMethod,
        billing_cycle: billingCycle
      })
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
      body: JSON.stringify({
        action: 'upgrade',
        plan_id: planId
      })
    });
    return response.json();
  },

  async toggleAutoRenew(autoRenew) {
    const response = await fetch(`${API_BASE_URL}/subscriptions.php`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'toggle_auto_renew',
        auto_renew: autoRenew
      })
    });
    return response.json();
  }
};

// ============================================================
// AUCTION SYSTEM
// ============================================================

export const auctionApi = {
  async getActiveAuctions(limit = 20, offset = 0) {
    const response = await fetch(`${API_BASE_URL}/auctions.php?active_auctions=1&limit=${limit}&offset=${offset}`);
    return response.json();
  },

  async getAuctionDetails(auctionId) {
    const response = await fetch(`${API_BASE_URL}/auctions.php?auction_id=${auctionId}`);
    return response.json();
  },

  async getMyAuctions() {
    const response = await fetch(`${API_BASE_URL}/auctions.php?my_auctions=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getMyBids() {
    const response = await fetch(`${API_BASE_URL}/auctions.php?my_bids=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async createAuction(productId, startingPrice, reservePrice, bidIncrement, durationHours) {
    const response = await fetch(`${API_BASE_URL}/auctions.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'create_auction',
        product_id: productId,
        starting_price: startingPrice,
        reserve_price: reservePrice,
        bid_increment: bidIncrement,
        duration_hours: durationHours
      })
    });
    return response.json();
  },

  async placeBid(auctionId, bidAmount, isAutoBid = false, maxAutoBid = null) {
    const response = await fetch(`${API_BASE_URL}/auctions.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'place_bid',
        auction_id: auctionId,
        bid_amount: bidAmount,
        is_auto_bid: isAutoBid,
        max_auto_bid: maxAutoBid
      })
    });
    return response.json();
  },

  async endAuction(auctionId) {
    const response = await fetch(`${API_BASE_URL}/auctions.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'end_auction',
        auction_id: auctionId
      })
    });
    return response.json();
  }
};

// ============================================================
// INSURANCE & PROTECTION
// ============================================================

export const insuranceApi = {
  async getInsurancePlans() {
    const response = await fetch(`${API_BASE_URL}/insurance.php?plans=1`);
    return response.json();
  },

  async addInsuranceToBooking(bookingId, insurancePlanId) {
    const response = await fetch(`${API_BASE_URL}/insurance.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'add_insurance',
        booking_id: bookingId,
        insurance_plan_id: insurancePlanId
      })
    });
    return response.json();
  },

  async getBookingInsurance(bookingId) {
    const response = await fetch(`${API_BASE_URL}/insurance.php?booking_id=${bookingId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async fileClaim(insuranceId, claimAmount, description, evidence) {
    const response = await fetch(`${API_BASE_URL}/insurance.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'file_claim',
        insurance_id: insuranceId,
        claim_amount: claimAmount,
        description,
        evidence
      })
    });
    return response.json();
  }
};

// ============================================================
// SOCIAL FEATURES
// ============================================================

export const socialApi = {
  async followUser(userId) {
    const response = await fetch(`${API_BASE_URL}/social.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'follow',
        user_id: userId
      })
    });
    return response.json();
  },

  async unfollowUser(userId) {
    const response = await fetch(`${API_BASE_URL}/social.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'unfollow',
        user_id: userId
      })
    });
    return response.json();
  },

  async getFollowers(userId) {
    const response = await fetch(`${API_BASE_URL}/social.php?followers=1&user_id=${userId}`);
    return response.json();
  },

  async getFollowing(userId) {
    const response = await fetch(`${API_BASE_URL}/social.php?following=1&user_id=${userId}`);
    return response.json();
  },

  async shareProduct(productId, platform) {
    const response = await fetch(`${API_BASE_URL}/social.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'share_product',
        product_id: productId,
        platform
      })
    });
    return response.json();
  },

  async getUserBadges(userId) {
    const response = await fetch(`${API_BASE_URL}/social.php?badges=1&user_id=${userId}`);
    return response.json();
  }
};

// ============================================================
// LOYALTY PROGRAM
// ============================================================

export const loyaltyApi = {
  async getPoints() {
    const response = await fetch(`${API_BASE_URL}/loyalty.php?points=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getTransactions(limit = 50) {
    const response = await fetch(`${API_BASE_URL}/loyalty.php?transactions=1&limit=${limit}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async redeemPoints(points, rewardType) {
    const response = await fetch(`${API_BASE_URL}/loyalty.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'redeem',
        points,
        reward_type: rewardType
      })
    });
    return response.json();
  }
};

// ============================================================
// FLASH SALES
// ============================================================

export const flashSaleApi = {
  async getActiveFlashSales() {
    const response = await fetch(`${API_BASE_URL}/flash_sales.php?active=1`);
    return response.json();
  },

  async getFlashSaleProducts(flashSaleId) {
    const response = await fetch(`${API_BASE_URL}/flash_sales.php?flash_sale_id=${flashSaleId}`);
    return response.json();
  }
};

// ============================================================
// REPORTING SYSTEM
// ============================================================

export const reportApi = {
  async reportUser(userId, reportType, description, evidence = null) {
    const response = await fetch(`${API_BASE_URL}/reports.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'report_user',
        reported_user_id: userId,
        report_type: reportType,
        description,
        evidence
      })
    });
    return response.json();
  },

  async reportProduct(productId, reportType, description, evidence = null) {
    const response = await fetch(`${API_BASE_URL}/reports.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'report_product',
        reported_product_id: productId,
        report_type: reportType,
        description,
        evidence
      })
    });
    return response.json();
  },

  async getMyReports() {
    const response = await fetch(`${API_BASE_URL}/reports.php?my_reports=1`, {
      headers: getHeaders()
    });
    return response.json();
  }
};

// Export all APIs
export const advancedApi = {
  chat: chatApi,
  recommendations: recommendationsApi,
  subscriptions: subscriptionApi,
  auctions: auctionApi,
  insurance: insuranceApi,
  social: socialApi,
  loyalty: loyaltyApi,
  flashSales: flashSaleApi,
  reports: reportApi
};
