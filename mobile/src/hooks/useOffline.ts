import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to detect offline/online state and manage offline mode
 * Provides network status and helper functions for offline handling
 */
export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
      setIsOffline(!state.isConnected);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      setIsOffline(!connected);

      // When coming back online, refetch queries
      if (connected) {
        queryClient.refetchQueries();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return {
    isOffline,
    isConnected,
    isOnline: isConnected === true,
  };
};

