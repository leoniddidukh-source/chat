import React, { createContext, useContext } from 'react';

// Create the context
export const ChatContext = createContext(null);

// Custom hook to use the chat context easily
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

