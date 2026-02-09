// NEWSOKO MARKETPLACE - UNIFIED API EXPORTS
// Import this file everywhere: import { api, completeApi } from '@/services';

export { api, setAuthToken, getAuthToken } from './api';
export { default as completeApi, securityApi, messagingApi, biometricApi } from './completeApi';

// Re-export for convenience
export const useApi = () => {
  return {
    // Core APIs
    ...require('./api').api,
    
    // Security APIs
    security: require('./completeApi').securityApi,
    
    // Messaging APIs
    messaging: require('./completeApi').messagingApi,
    
    // Biometric APIs
    biometric: require('./completeApi').biometricApi
  };
};
