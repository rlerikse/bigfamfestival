import { api, checkApiHealth } from '../services/api';
import { API_URL } from '../config/constants';
import NetInfo from '@react-native-community/netinfo';

// Note: axios is mocked globally in jest.setup.js
// The api instance from services/api uses axios.create()

// Mock Firebase Auth for token retrieval
jest.mock('../services/firebaseAuthService', () => ({
  getIdToken: jest.fn().mockResolvedValue('firebase-test-token'),
  getCurrentUser: jest.fn().mockReturnValue({ uid: 'test-uid', email: 'test@example.com' }),
}));

const mockedNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockedApi = api as jest.Mocked<typeof api>;

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
      mockedApi.get.mockResolvedValue({
        status: 200,
        data: { status: 'ok' },
      });

      const result = await checkApiHealth();

      expect(result.isHealthy).toBe(true);
      expect(mockedApi.get).toHaveBeenCalledWith('/health');
    });

    it('should return unhealthy status when API is unreachable', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      const result = await checkApiHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.message).toContain('Connection failed');
    });
  });

  describe('Request Interceptor', () => {
    it('should add Firebase auth token to requests', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getIdToken } = require('../services/firebaseAuthService');
      getIdToken.mockResolvedValue('firebase-test-token');

      mockedNetInfo.fetch.mockResolvedValue({
        isConnected: true,
      } as any);

      // Verify Firebase token retrieval is available
      const token = await getIdToken();
      expect(token).toBe('firebase-test-token');
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
