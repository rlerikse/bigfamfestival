/**
 * Coverage for subscribeFriendLocations() — the SSE realtime friend-location
 * client (replaces the old 30s poll). We mock react-native-sse so we can drive
 * synthetic 'message'/'error' events and assert routing + teardown, without a
 * real network connection.
 */

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../services/firebaseAuthService', () => ({
  getIdToken: jest.fn().mockResolvedValue('firebase-test-token'),
}));

jest.mock('../config/constants', () => ({
  API_URL: 'https://api.test.local',
}));

// Keep the axios-backed `api` import in friendService happy.
jest.mock('../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));


// `mock`-prefixed so jest permits referencing it inside the mock factory.
const mockSse: { last: any } = { last: null };

jest.mock('react-native-sse', () => {
  class FakeEventSource {
    url: string;
    options: any;
    listeners: Record<string, ((e: any) => void)[]> = {};
    removeAllCalled = false;
    closeCalled = false;
    constructor(url: string, options: any) {
      this.url = url;
      this.options = options;
      mockSse.last = this;
    }
    addEventListener(type: string, cb: (e: any) => void) {
      (this.listeners[type] ||= []).push(cb);
    }
    removeAllEventListeners() {
      this.removeAllCalled = true;
    }
    close() {
      this.closeCalled = true;
    }
    emit(type: string, event: any) {
      (this.listeners[type] || []).forEach((cb) => cb(event));
    }
  }
  return {
    __esModule: true,
    default: jest.fn((url: string, options: any) => new FakeEventSource(url, options)),
  };
});

import { subscribeFriendLocations } from '../services/friendService';
import { getIdToken } from '../services/firebaseAuthService';

describe('subscribeFriendLocations (SSE realtime)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSse.last = null;
    (getIdToken as jest.Mock).mockResolvedValue('firebase-test-token');
  });

  it('opens the stream URL with the Bearer auth header', async () => {
    await subscribeFriendLocations(jest.fn());
    const es = mockSse.last;
    expect(es.url).toBe('https://api.test.local/friends/locations/stream');
    expect(es.options.headers.Authorization).toBe('Bearer firebase-test-token');
  });

  it('routes a valid location payload to onData', async () => {
    const onData = jest.fn();
    await subscribeFriendLocations(onData);
    const es = mockSse.last;
    const locations = [
      { userId: 'u1', name: 'Ada', lat: 1, lng: 2, updatedAt: 'now' },
    ];
    es.emit('message', { data: JSON.stringify(locations) });
    expect(onData).toHaveBeenCalledWith(locations);
  });

  it('routes a server error payload to onError, NOT onData', async () => {
    const onData = jest.fn();
    const onError = jest.fn();
    await subscribeFriendLocations(onData, onError);
    const es = mockSse.last;
    es.emit('message', {
      data: JSON.stringify({ error: 'stream_error', message: 'boom' }),
    });
    expect(onData).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('routes a connection error event to onError', async () => {
    const onError = jest.fn();
    await subscribeFriendLocations(jest.fn(), onError);
    const es = mockSse.last;
    es.emit('error', { type: 'error', message: 'network down' });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('ignores empty/malformed payloads without crashing', async () => {
    const onData = jest.fn();
    const onError = jest.fn();
    await subscribeFriendLocations(onData, onError);
    const es = mockSse.last;
    es.emit('message', { data: '' }); // empty → ignored
    expect(onData).not.toHaveBeenCalled();
    es.emit('message', { data: '{not json' }); // malformed → onError, no throw
    expect(onData).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('close() tears down listeners and the connection', async () => {
    const sub = await subscribeFriendLocations(jest.fn());
    const es = mockSse.last;
    sub.close();
    expect(es.removeAllCalled).toBe(true);
    expect(es.closeCalled).toBe(true);
  });

  it('still opens (without auth header) when no token is available', async () => {
    (getIdToken as jest.Mock).mockResolvedValue(null);
    await subscribeFriendLocations(jest.fn());
    const es = mockSse.last;
    expect(es.options.headers.Authorization).toBeUndefined();
  });

  // Reconnect/recovery path (Architect PR #204 review): each subscribe must
  // re-mint a token, so an explicit re-subscribe after a stale-token error
  // recovers instead of replaying the expired Bearer token forever.
  it('re-mints a fresh token on every (re)subscribe', async () => {
    (getIdToken as jest.Mock)
      .mockResolvedValueOnce('token-hour-1')
      .mockResolvedValueOnce('token-hour-2');

    const sub1 = await subscribeFriendLocations(jest.fn());
    const es1 = mockSse.last;
    expect(es1.options.headers.Authorization).toBe('Bearer token-hour-1');

    // Simulate the stale-token error that triggers our explicit reconnect.
    const onError = jest.fn();
    es1.emit('error', { type: 'error', message: '401' });
    sub1.close();

    // Explicit re-subscribe (what MapScreen's reconnect loop does).
    await subscribeFriendLocations(jest.fn(), onError);
    const es2 = mockSse.last;
    expect(es2).not.toBe(es1); // brand-new connection
    expect(es2.options.headers.Authorization).toBe('Bearer token-hour-2');
    expect(getIdToken).toHaveBeenCalledTimes(2);
  });

  it('a recovered stream delivers data on the new connection', async () => {
    const onData = jest.fn();
    // First stream errors out.
    const sub1 = await subscribeFriendLocations(onData);
    const es1 = mockSse.last;
    es1.emit('error', { type: 'error' });
    sub1.close();
    expect(es1.closeCalled).toBe(true);

    // Reconnect + a fresh push lands on the new connection.
    await subscribeFriendLocations(onData);
    const es2 = mockSse.last;
    const locations = [{ userId: 'u9', name: 'Grace', lat: 3, lng: 4, updatedAt: 'now' }];
    es2.emit('message', { data: JSON.stringify(locations) });
    expect(onData).toHaveBeenCalledWith(locations);
  });
});
