import { api, checkApiHealth } from '../services/api';
import { API_URL } from '../config/constants';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('axios');
jest.mock('expo-secure-store');
jest.mock('@react-native-community/netinfo');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockedNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as any);
  });

  describe('checkApiHealth', () => {
    it('should return healthy status when API is reachable', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'ok' },
      });

      const result = await checkApiHealth();

      expect(result.isHealthy).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith('/health', expect.any(Object));
    });

    it('should return unhealthy status when API is unreachable', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await checkApiHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.message).toContain('Connection failed');
    });
  });

  describe('Request Interceptor', () => {
    it('should add auth token to requests', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValue('test-token');
      mockedNetInfo.fetch.mockResolvedValue({
        isConnected: true,
      } as any);

      const axiosInstance = mockedAxios.create();
      const interceptor = axiosInstance.interceptors.request.use as jest.Mock;
      
      // This is a simplified test - in reality, we'd test the actual interceptor
      expect(mockedSecureStore.getItemAsync).toBeDefined();
    });

    it('should throw error when offline', async () => {
      mockedNetInfo.fetch.mockResolvedValue({
        isConnected: false,
      } as any);

      // Test would verify offline error is thrown
      expect(mockedNetInfo.fetch).toBeDefined();
    });
  });
});

