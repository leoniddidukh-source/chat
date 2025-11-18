import { useEffect, useRef, useState } from 'react';
import { useChatContext } from '../context/ChatContext';
import { AI_ASSISTANT, isAIAssistant } from '../utils/constants';
import Message from './Message';

const EMOJI_OPTIONS = [
  '😀','😂','😊','😍','😎','🤔','🙌','👍','🔥','🎉',
  '❤️','🤖','✨','🙏','🥳','😴','😅','😇','🤩','😢'
];

// Chat Window component: Handles displaying messages and the input form
const ChatWindow = ({ onMenuToggle }) => {
  // Access state and functions from Context
  const { 
    userId, 
    selectedRecipientId, 
    messages, 
    setIsConfigOpen, 
    handleSignOut,
    isLoading, 
    newMessage, 
    setNewMessage, 
    sendMessage,
    sendFile,
    sendVoiceMessage,
    registeredUsers,
    onlineUsers,
    callState,
    setCallState
  } = useChatContext();
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        event.target.getAttribute('data-emoji-button') !== 'true'
      ) {
        setIsEmojiPickerOpen(false);
      }
    };

    if (isEmojiPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmojiPickerOpen]);

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingFile(true);
      try {
        await sendFile(file);
      } catch (error) {
        console.error("Error in handleFileSelect:", error);
      } finally {
        setIsUploadingFile(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const duration = recordingTime;
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Reset recording state
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
        
        // Upload voice message
        setIsUploadingVoice(true);
        try {
          await sendVoiceMessage(audioBlob, duration);
        } catch (error) {
          console.error("Error in onstop:", error);
        } finally {
          setIsUploadingVoice(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };
  
  // Check if selected recipient is AI assistant
  const isAI = isAIAssistant(selectedRecipientId);
  
  // Check registeredUsers for recipient name
  const registeredRecipient = registeredUsers.find(r => (r.uid || r.id) === selectedRecipientId);
  const selectedRecipient = registeredRecipient;
  const selectedRecipientName = isAI
    ? AI_ASSISTANT.name
    : (selectedRecipient 
        ? (selectedRecipient.name || selectedRecipient.displayName || selectedRecipient.email || 'User')
        : 'Select a User');

  // Check if recipient is online
  const isRecipientOnline = selectedRecipientId && onlineUsers.has(selectedRecipientId);

  // Handle video call initiation
  const handleStartCall = () => {
    if (!isRecipientOnline || callState !== 'idle') {
      return;
    }
    setCallState('calling');
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev = '') => `${prev}${emoji}`);
    setIsEmojiPickerOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col flex-grow min-h-0 min-w-0 bg-white relative z-[1] h-full">
      {/* Chat Header */}
      <div 
        className="px-3 md:px-5 py-3 md:py-4 border-b flex items-center gap-2 md:gap-4"
        style={{ borderColor: '#E1E4E8' }}
      >
        {/* Mobile Menu Toggle */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 flex-shrink-0"
            style={{ color: 'var(--secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--light)';
              e.currentTarget.style.color = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--secondary)';
            }}
            title="Toggle Menu"
          >
            <span className="material-icons text-xl">menu</span>
          </button>
        )}

        {/* Avatar */}
        <div 
          className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-sm md:text-base flex-shrink-0"
          style={{ backgroundColor: isAI ? 'var(--primary-light)' : 'var(--light)', color: isAI ? 'var(--primary)' : 'var(--dark)' }}
        >
          {isAI ? '🤖' : getUserInitials(selectedRecipientName)}
        </div>

        {/* Chat Title */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm md:text-base flex items-center gap-1.5" style={{ color: 'var(--dark)' }}>
            <span className="truncate">{selectedRecipientName}</span>
          </div>
          {!isAI && (
            <div className="text-[10px] md:text-xs" style={{ color: 'var(--secondary)' }}>
              {isRecipientOnline ? 'Online' : 'Offline'}
            </div>
          )}
        </div>

        {/* Chat Actions */}
        <div className="flex gap-1.5 md:gap-2.5">
          {/* Settings Button */}
          <button
            onClick={() => setIsConfigOpen(true)}
            className="px-2 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1 md:gap-1.5 cursor-pointer transition-all duration-300"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Settings"
          >
            <span className="material-icons text-lg md:text-xl">settings</span>
            <span className="text-[10px] md:text-xs font-medium hidden sm:inline">Settings</span>
          </button>
          
          {/* Video Call Button - Always visible for non-AI users */}
          {!isAI && (
            <button
              onClick={handleStartCall}
              disabled={!isRecipientOnline || callState !== 'idle'}
              className="px-2 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1 md:gap-1.5 cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--light)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              title={!isRecipientOnline ? "User must be online to start a video call" : "Video call"}
            >
              <span className="material-icons text-lg md:text-xl">videocam</span>
              <span className="text-[10px] md:text-xs font-medium hidden sm:inline">Video</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className="px-2 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1 md:gap-1.5 cursor-pointer transition-all duration-300"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Sign out"
          >
            <span className="material-icons text-lg md:text-xl">logout</span>
            <span className="text-[10px] md:text-xs font-medium hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
      
      {/* Message Area */}
      <main className="flex-grow overflow-y-auto px-3 md:px-5 py-3 md:py-5 flex flex-col gap-3 md:gap-4 bg-white" style={{ animation: 'fadeIn 0.3s ease' }}>
        {isLoading && (
          <div className="flex justify-center items-center h-full font-medium" style={{ color: 'var(--secondary)' }}>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading Messages...
          </div>
        )}
        
        {!isLoading && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-5">
            <div className="text-5xl mb-4" style={{ color: '#d0d0d0' }}>💬</div>
            <div className="text-base font-medium mb-2.5" style={{ color: 'var(--dark)' }}>No messages yet</div>
            <div className="text-sm max-w-xs mx-auto" style={{ color: 'var(--secondary)' }}>
            Say hello to {selectedRecipientName} to start the conversation!
            </div>
          </div>
        )}

        {!isLoading && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map(msg => (
          <Message key={msg.id} message={msg} />
        ))}
          </div>
        )}
        <div ref={messagesEndRef} /> {/* Scroll target */}
      </main>

      {/* Message Input Box */}
      <footer 
        className="px-3 md:px-5 py-3 md:py-4 border-t flex items-center gap-2 md:gap-2.5"
        style={{ borderColor: '#E1E4E8' }}
      >
        <form onSubmit={sendMessage} className="flex items-center gap-2.5 flex-1">
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={!userId || isLoading || !selectedRecipientId || isUploadingFile || isRecording || isAI}
          />
          <label
            htmlFor="file-upload"
            className={`w-8 h-8 md:w-9.5 md:h-9.5 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 flex-shrink-0 ${
              !userId || isLoading || !selectedRecipientId || isUploadingFile || isAI 
                ? 'cursor-not-allowed opacity-50' 
                : ''
            }`}
            style={{ 
              backgroundColor: 'var(--light)',
              color: 'var(--secondary)'
            }}
            onMouseEnter={(e) => {
              if (!(!userId || isLoading || !selectedRecipientId || isUploadingFile || isAI)) {
                e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                e.currentTarget.style.color = 'var(--primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!(!userId || isLoading || !selectedRecipientId || isUploadingFile || isAI)) {
                e.currentTarget.style.backgroundColor = 'var(--light)';
                e.currentTarget.style.color = 'var(--secondary)';
              }
            }}
            title={isAI ? "File upload not available for AI assistant" : (isUploadingFile ? "Uploading..." : "Upload File")}
          >
            {isUploadingFile ? (
              <span className="material-icons animate-spin text-lg md:text-xl">hourglass_empty</span>
            ) : (
              <span className="material-icons text-lg md:text-xl">attach_file</span>
            )}
          </label>

          {/* Voice Recording Button */}
          {isUploadingVoice ? (
            <button
              type="button"
              disabled
              className="w-8 h-8 md:w-9.5 md:h-9.5 rounded-full flex items-center justify-center cursor-not-allowed flex-shrink-0 opacity-50"
              style={{ backgroundColor: 'var(--light)', color: 'var(--secondary)' }}
              title="Uploading voice message..."
            >
              <span className="material-icons animate-spin text-lg md:text-xl">hourglass_empty</span>
            </button>
          ) : !isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={!userId || isLoading || !selectedRecipientId || isUploadingFile || isAI}
              className="w-8 h-8 md:w-9.5 md:h-9.5 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--light)', color: 'var(--secondary)' }}
              onMouseEnter={(e) => {
                if (!(!userId || isLoading || !selectedRecipientId || isUploadingFile || isAI)) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                  e.currentTarget.style.color = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!(!userId || isLoading || !selectedRecipientId || isUploadingFile || isAI)) {
                  e.currentTarget.style.backgroundColor = 'var(--light)';
                  e.currentTarget.style.color = 'var(--secondary)';
                }
              }}
              title={isAI ? "Voice recording not available for AI assistant" : "Record Voice Message"}
            >
              <span className="material-icons text-lg md:text-xl">mic</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="w-8 h-8 md:w-9.5 md:h-9.5 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 animate-pulse"
              style={{ backgroundColor: 'var(--danger)', color: 'white' }}
              title="Stop Recording"
            >
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="material-icons text-sm md:text-base">stop</span>
                <span className="text-[10px] md:text-xs">{recordingTime}s</span>
              </div>
            </button>
          )}

          {/* Emoji Picker Button */}
          <div className="relative">
            <button
              type="button"
              data-emoji-button="true"
              onClick={() => setIsEmojiPickerOpen(prev => !prev)}
              disabled={!userId || isLoading || !selectedRecipientId || isRecording || isUploadingFile || isUploadingVoice}
              className="w-8 h-8 md:w-9.5 md:h-9.5 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--light)', color: 'var(--secondary)' }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                  e.currentTarget.style.color = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--light)';
                  e.currentTarget.style.color = 'var(--secondary)';
                }
              }}
              title="Add emoji"
            >
              <span className="material-icons text-lg md:text-xl">insert_emoticon</span>
            </button>

            {isEmojiPickerOpen && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-12 md:bottom-14 left-1/2 -translate-x-1/2 bg-white border rounded-xl shadow-lg p-2 grid grid-cols-5 gap-1 z-20 w-48 md:w-52"
                style={{ borderColor: '#E1E4E8' }}
              >
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-xl md:text-2xl p-1 rounded-lg hover:bg-[var(--primary-light)] transition"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${selectedRecipientName}...`}
              disabled={!userId || isLoading || !selectedRecipientId || isRecording || isUploadingFile || isUploadingVoice}
              className="w-full px-3 md:px-4 py-2 md:py-3 rounded-[20px] border text-xs md:text-sm transition-all duration-300 resize-none h-[40px] md:h-[45px] min-w-0 disabled:opacity-50"
              style={{
                borderColor: '#E1E4E8',
                fontSize: '14px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.boxShadow = '0 0 0 2px var(--primary-light)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E1E4E8';
                e.target.style.boxShadow = 'none';
              }}
              ref={inputRef}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || !userId || isLoading || !selectedRecipientId || isRecording || isUploadingFile || isUploadingVoice}
            className="w-8 h-8 md:w-9.5 md:h-9.5 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 flex-shrink-0 border-none disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'var(--primary)',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#1a46e0';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            aria-label="Send Message"
          >
            <span className="material-icons text-base md:text-lg">send</span>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatWindow;

