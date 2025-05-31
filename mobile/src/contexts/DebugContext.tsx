import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DebugContextProps {
  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;
  debugHour: number;
  setDebugHour: (hour: number) => void;
}

const DebugContext = createContext<DebugContextProps | undefined>(undefined);

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};

interface DebugProviderProps {
  children: ReactNode;
}

export const DebugProvider: React.FC<DebugProviderProps> = ({ children }) => {
  const [debugMode, setDebugMode] = useState(false);
  const [debugHour, setDebugHour] = useState(12); // Default to noon

  return (
    <DebugContext.Provider
      value={{
        debugMode,
        setDebugMode,
        debugHour,
        setDebugHour,
      }}
    >
      {children}
    </DebugContext.Provider>
  );
};
