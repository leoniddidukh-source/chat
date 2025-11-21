import { GoogleGenAI } from '@google/genai';

// Gemini API configuration
// Webpack's DefinePlugin will replace process.env.GEMINI_API_KEY with the actual string at build time
// Define it as a constant that webpack can statically replace
const GEMINI_API_KEY_BUILD_TIME = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

const getGeminiApiKey = () => {
  // First check window (for runtime injection/override)
  if (typeof window !== 'undefined') {
    const envFromWindow =
      window.__APP_CONFIG__?.GEMINI_API_KEY ||
      window.__APP_CONFIG__?.VITE_GEMINI_API_KEY ||
      window.GEMINI_API_KEY ||
      window.VITE_GEMINI_API_KEY;
    if (envFromWindow && envFromWindow !== 'YOUR_GEMINI_API_KEY') {
      console.log('Gemini API key found in window:', envFromWindow.substring(0, 10) + '...');
      return envFromWindow;
    }
  }

  // Use the build-time injected key (webpack DefinePlugin replaces process.env.* with string literals)
  const webpackKey = GEMINI_API_KEY_BUILD_TIME;
  
  if (webpackKey && webpackKey !== 'YOUR_GEMINI_API_KEY' && webpackKey !== '') {
    console.log('Gemini API key found from webpack DefinePlugin:', webpackKey.substring(0, 10) + '...');
    return webpackKey;
  }

  console.warn('Gemini API key not found. Check build configuration.');
  return 'YOUR_GEMINI_API_KEY';
};

const GEMINI_API_KEY = getGeminiApiKey();
console.log('Gemini API key initialized:', GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' ? 'Yes' : 'No');

let genAI = null;

// Initialize Gemini AI
const initializeGemini = () => {
  if (!genAI && GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
    try {
      // Pass API key explicitly for browser/Vite environment
      genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      console.log('Gemini AI initialized successfully');
    } catch (error) {
      console.error('Error initializing Gemini AI:', error);
    }
  }
  return genAI;
};

// Send message to Gemini AI and get response
export const sendToGemini = async (message, chatHistory = []) => {
  try {
    console.log('sendToGemini called with message:', message.substring(0, 50) + '...', 'history length:', chatHistory.length);
    const ai = initializeGemini();
    
    if (!ai) {
      console.error('Gemini AI is not initialized');
      throw new Error('Gemini AI is not initialized. Please set VITE_GEMINI_API_KEY environment variable.');
    }

    console.log('Gemini AI instance:', ai ? 'available' : 'null');
    console.log('Available methods:', Object.keys(ai || {}));

    // Format chat history for Gemini (only include last 10 messages for context)
    // If no history, use simple string format
    if (chatHistory.length === 0) {
      // Simple case: just send the message as a string
      console.log('Sending simple message (no history) to gemini-2.5-flash');
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
      });
      console.log('Gemini response received:', response ? 'yes' : 'no', response?.text ? response.text.substring(0, 50) + '...' : 'no text');
      return response.text;
    }

    // Build contents array with proper role structure for chat history
    const historyContents = chatHistory
      .slice(-10)
      .filter(msg => msg && msg.role && (msg.text || msg.parts))
      .map(msg => {
        // Handle both formats: {role, text} and {role, parts}
        const text = msg.text || (msg.parts && msg.parts[0]?.text) || '';
        return {
          role: msg.role, // 'user' or 'model'
          parts: [{ text: text }]
        };
      });

    // Ensure the first message is from user (remove any leading model messages)
    let filteredHistory = historyContents;
    while (filteredHistory.length > 0 && filteredHistory[0].role === 'model') {
      filteredHistory = filteredHistory.slice(1);
    }

    // If after filtering we have no history, just send the current message as string
    if (filteredHistory.length === 0) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
      });
      return response.text;
    }

    // Add current user message
    const currentUserMessage = {
      role: 'user',
      parts: [{ text: message }]
    };

    // Combine history and current message
    const contents = [...filteredHistory, currentUserMessage];

    // Try gemini-2.5-flash first, fallback to other models
    let response;
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro', 'gemini-1.5-pro'];
    
    console.log('Trying models with contents:', JSON.stringify(contents).substring(0, 200) + '...');
    
    for (const model of models) {
      try {
        console.log(`Attempting to call model: ${model}`);
        response = await ai.models.generateContent({
          model: model,
          contents: contents,
        });
        console.log(`Success with model ${model}, response:`, response ? 'received' : 'null');
        break; // Success, exit loop
      } catch (modelError) {
        console.error(`Model ${model} failed:`, modelError.message);
        if (model === models[models.length - 1]) {
          // Last model failed, throw error
          console.error('All models failed, throwing error');
          throw modelError;
        }
        // Try next model
        console.log(`Trying next model...`);
        continue;
      }
    }

    if (!response) {
      throw new Error('No response from Gemini API');
    }

    const text = response.text;
    console.log('Final response text length:', text ? text.length : 0);
    return text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    console.error('Error details:', error.message, error.stack);
    throw error;
  }
};

// Check if Gemini is available
export const isGeminiAvailable = () => {
  return GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY';
};

// Validate API key and model availability by making a test call
export const validateGeminiAPI = async () => {
  try {
    if (!isGeminiAvailable()) {
      return {
        valid: false,
        error: 'API key is not configured. Please set the VITE_GEMINI_API_KEY environment variable.'
      };
    }

    const ai = initializeGemini();
    
    if (!ai) {
      return {
        valid: false,
        error: 'Failed to initialize Gemini AI. Please check your API key.'
      };
    }

    // Make a simple test call to validate the API key
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Hi',
      });
      
      // If we get a response, the API key is valid
      if (response && response.text) {
        return {
          valid: true,
          error: null
        };
      } else {
        return {
          valid: false,
          error: 'API returned invalid response format.'
        };
      }
    } catch (apiError) {
      console.error('Gemini API validation error:', apiError);
      
      // Check for specific error types
      if (apiError.message?.includes('API_KEY_INVALID') || apiError.message?.includes('API key')) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your VITE_GEMINI_API_KEY environment variable.'
        };
      } else if (apiError.message?.includes('PERMISSION_DENIED') || apiError.message?.includes('permission')) {
        return {
          valid: false,
          error: 'API key does not have permission to access Gemini. Please check your API key permissions.'
        };
      } else if (apiError.message?.includes('QUOTA_EXCEEDED') || apiError.message?.includes('quota')) {
        return {
          valid: false,
          error: 'API quota exceeded. Please check your Gemini API quota limits.'
        };
      } else {
        return {
          valid: false,
          error: `API validation failed: ${apiError.message || 'Unknown error'}`
        };
      }
    }
  } catch (error) {
    console.error('Error validating Gemini API:', error);
    return {
      valid: false,
      error: `Failed to validate API: ${error.message || 'Unknown error'}`
    };
  }
};

