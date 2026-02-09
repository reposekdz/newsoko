// COMPLETE API INTEGRATION - All Missing Features
import { api } from './api';

const API_BASE_URL = 'http://localhost/Rentalsalesmarketplace/api/controllers';

const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const securityApi = {
  // MFA APIs
  async enableMFA(userId: number, method: 'sms' | 'email', contact: string) {
    const response = await fetch(`${API_BASE_URL}/mfa.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'enable', user_id: userId, method, phone_number: contact })
    });
    return response.json();
  },

  async sendMFACode(userId: number, method: 'sms' | 'email') {
    const response = await fetch(`${API_BASE_URL}/mfa.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'send_code', user_id: userId, method })
    });
    return response.json();
  },

  async verifyMFACode(userId: number, code: string) {
    const response = await fetch(`${API_BASE_URL}/mfa.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'verify', user_id: userId, code })
    });
    return response.json();
  },

  async disableMFA(userId: number, code: string) {
    const response = await fetch(`${API_BASE_URL}/mfa.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'disable', user_id: userId, code })
    });
    return response.json();
  },

  // KYC APIs
  async submitKYC(data: any) {
    const response = await fetch(`${API_BASE_URL}/kyc.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'submit', ...data })
    });
    return response.json();
  },

  async getKYCStatus(userId: number) {
    const response = await fetch(`${API_BASE_URL}/kyc.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'status', user_id: userId })
    });
    return response.json();
  },

  // Escrow APIs
  async createEscrow(bookingId: number, amount: number) {
    const response = await fetch(`${API_BASE_URL}/escrow.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'create', booking_id: bookingId, amount })
    });
    return response.json();
  },

  async customerApproveEscrow(escrowId: number, customerId: number) {
    const response = await fetch(`${API_BASE_URL}/escrow.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'customer_approve', escrow_id: escrowId, customer_id: customerId })
    });
    return response.json();
  },

  async getEscrowStatus(bookingId: number) {
    const response = await fetch(`${API_BASE_URL}/escrow.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'status', booking_id: bookingId })
    });
    return response.json();
  },

  // Fraud Detection APIs
  async checkPayment(data: any) {
    const response = await fetch(`${API_BASE_URL}/fraud.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'check_payment', ...data })
    });
    return response.json();
  },

  async getFraudStats(days: number = 7) {
    const response = await fetch(`${API_BASE_URL}/fraud.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'stats', days })
    });
    return response.json();
  }
};

const messagingApi = {
  // Enhanced Messaging APIs
  async sendMessage(receiverId: number, productId: number, message: string) {
    const response = await fetch(`${API_BASE_URL}/messaging.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'send', receiver_id: receiverId, product_id: productId, message })
    });
    return response.json();
  },

  async getConversations() {
    const response = await fetch(`${API_BASE_URL}/messaging.php?conversations=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getMessages(otherUserId: number, productId: number) {
    const response = await fetch(`${API_BASE_URL}/messaging.php?conversation=1&other_user_id=${otherUserId}&product_id=${productId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async getUnreadCount() {
    const response = await fetch(`${API_BASE_URL}/messaging.php?unread_count=1`, {
      headers: getHeaders()
    });
    return response.json();
  },

  async markAsRead(messageId: number) {
    const response = await fetch(`${API_BASE_URL}/messaging.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'mark_read', message_id: messageId })
    });
    return response.json();
  }
};

const biometricApi = {
  async registerChallenge(userId: number) {
    const response = await fetch(`${API_BASE_URL}/biometric.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'register-challenge', user_id: userId })
    });
    return response.json();
  },

  async registerCredential(data: any) {
    const response = await fetch(`${API_BASE_URL}/biometric.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'register', ...data })
    });
    return response.json();
  },

  async authChallenge(userId: number) {
    const response = await fetch(`${API_BASE_URL}/biometric.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'auth-challenge', user_id: userId })
    });
    return response.json();
  },

  async verifyAuth(data: any) {
    const response = await fetch(`${API_BASE_URL}/biometric.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'verify', ...data })
    });
    return response.json();
  }
};

// Combine all APIs into completeApi object
const completeApi = {
  ...api,
  security: securityApi,
  messaging: messagingApi,
  biometric: biometricApi
};

// Export all APIs as default
export default completeApi;

// Named exports for convenience
export { api, securityApi, messagingApi, biometricApi };
