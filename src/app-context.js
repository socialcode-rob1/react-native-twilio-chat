import React, { useState, useContext, createContext } from 'react';

const defaultInitialState = { conversations: [], updateConversations: () => {} };

const AppContext = createContext(defaultInitialState);

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [conversations, setConversations] = useState([]);

  return (
    <AppContext.Provider value={{ conversations, updateConversations: setConversations }}>
      {children}
    </AppContext.Provider>
  );
}
