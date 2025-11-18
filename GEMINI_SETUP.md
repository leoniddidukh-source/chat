# Gemini AI Assistant Setup

The chat app now includes a Gemini AI Assistant that users can chat with. The AI assistant appears at the top of the user list in the sidebar.

## Setup Instructions

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure the API Key

Create a `.env` file in the root of your project (if it doesn't exist) and add:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual Gemini API key.

### 3. Restart the Development Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## Features

- **AI Assistant in Sidebar**: The Gemini AI Assistant appears at the top of the user list with a blue background
- **Chat with AI**: Users can select the AI assistant and have conversations
- **Context Awareness**: The AI remembers the last 10 messages in the conversation for context
- **Message History**: All AI conversations are saved in Firestore like regular chats
- **File/Voice Restrictions**: File uploads and voice recordings are disabled when chatting with the AI (text only)

## Usage

1. Click on "Gemini AI Assistant" in the sidebar
2. Type your message and press Enter
3. The AI will respond automatically
4. Continue the conversation - the AI remembers context from previous messages

## Troubleshooting

### AI Assistant Not Responding

- Check that `VITE_GEMINI_API_KEY` is set in your `.env` file
- Verify the API key is valid and has not expired
- Check the browser console for error messages
- Make sure you've restarted the dev server after adding the API key

### API Key Errors

If you see "Gemini AI is not initialized" error:
- Ensure the `.env` file is in the project root
- Make sure the variable name is exactly `VITE_GEMINI_API_KEY`
- Restart the development server after making changes

## Notes

- The AI assistant uses Google's Gemini Pro model
- Conversations are stored in Firestore under the chat ID format: `{userId}_ai-assistant-gemini`
- The AI maintains conversation context from the last 10 messages

