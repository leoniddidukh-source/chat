// AI Assistant constant
export const AI_ASSISTANT = {
  id: 'ai-assistant-gemini',
  name: 'Gemini AI Assistant',
  isAI: true
};

// Helper to create a canonical chat ID from two user IDs
export const getChatId = (user1, user2) => {
  if (!user1 || !user2) return null;
  const sortedIds = [user1, user2].sort();
  return sortedIds.join('_');
};

// Check if a user ID is the AI assistant
export const isAIAssistant = (userId) => {
  return userId === AI_ASSISTANT.id;
};

