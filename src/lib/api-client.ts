import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  try {
    console.log(`[API Client] Connecting to: ${API_BASE_URL}`);
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('[API Client] Health check failed:', error);
    throw error;
  }
};

export default apiClient;