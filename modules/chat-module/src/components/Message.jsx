import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '../context/ChatContext';
import { AI_ASSISTANT, isAIAssistant } from '../utils/constants';

// Message display component
const Message = ({ message }) => {
  const { userId, currentUserName, registeredUsers, sendFile, setSelectedRecipientId, selectedRecipientId } = useChatContext();
  const [isForwarding, setIsForwarding] = useState(false);
  const [showForwardMenu, setShowForwardMenu] = useState(false);
  const forwardMenuRef = useRef(null);
  const isUserMessage = message.senderId === userId;

  // Close forward menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (forwardMenuRef.current && !forwardMenuRef.current.contains(event.target)) {
        setShowForwardMenu(false);
      }
    };

    if (showForwardMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showForwardMenu]);
  
  const timeString = message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Check if sender is AI assistant
  const isAIMessage = isAIAssistant(message.senderId);
  
  // Determine the sender's display name - check AI and registeredUsers
  const registeredSender = registeredUsers.find(r => (r.uid || r.id) === message.senderId);
  const sender = registeredSender;
  
  const senderName = isUserMessage 
    ? currentUserName 
    : isAIMessage
    ? AI_ASSISTANT.name
    : (sender 
        ? (sender.name || sender.displayName || sender.email || `User ${message.senderId?.slice(0, 8) || 'Unknown'}...`)
        : `User ${message.senderId?.slice(0, 8) || 'Unknown'}...`);

  // Check if file is an image
  const isImage = message.type === 'file' && message.fileType && message.fileType.startsWith('image/');
  
  // Download file handler
  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!message.fileURL) return;
    
    try {
      const response = await fetch(message.fileURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      // Fallback: open in new tab
      window.open(message.fileURL, '_blank');
    }
  };

  // Forward file handler
  const handleForward = async (recipientId) => {
    if (!message.fileURL || !sendFile) return;
    
    setIsForwarding(true);
    try {
      // Fetch the file from the URL
      const response = await fetch(message.fileURL);
      const blob = await response.blob();
      
      // Create a File object from the blob
      const file = new File([blob], message.fileName || 'forwarded-file', { type: message.fileType || 'application/octet-stream' });
      
      // Save current recipient
      const currentRecipient = selectedRecipientId;
      
      // Temporarily change recipient to forward target
      setSelectedRecipientId(recipientId);
      
      // Wait a bit for the context to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Send the file
      await sendFile(file);
      
      // Restore original recipient
      setSelectedRecipientId(currentRecipient);
      
      setShowForwardMenu(false);
    } catch (error) {
      console.error("Error forwarding file:", error);
      alert(`Failed to forward file: ${error.message}`);
    } finally {
      setIsForwarding(false);
    }
  };

  // Get all available recipients for forwarding
  const getAvailableRecipients = () => {
    const formattedRegisteredUsers = registeredUsers
      .filter(user => {
        const userUid = user.uid || user.id;
        return userUid && userUid !== userId && userUid !== message.senderId;
      })
      .map(user => {
        const userUid = user.uid || user.id;
        const userName = user.displayName || user.user_name || user.email || `User-${userUid ? userUid.slice(0, 5) : 'Unknown'}`;
        return {
          id: userUid,
          name: userName,
          email: user.email || user.user_email || '',
          isRegistered: true
        };
      });

    return formattedRegisteredUsers;
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
    <div 
      className={`flex gap-2.5 max-w-[80%] ${isUserMessage ? 'self-end flex-row-reverse' : 'self-start'}`}
      style={{ animation: 'fadeIn 0.3s ease' }}
    >
      {/* Message Avatar */}
      {!isUserMessage && (
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0"
          style={{ backgroundColor: 'var(--light)', color: 'var(--dark)' }}
        >
          {isAIMessage ? '🤖' : getUserInitials(senderName)}
        </div>
      )}

      {/* Message Content */}
      <div className="flex flex-col gap-0.5">
        {/* Sender Name (Only for incoming messages) */}
        {!isUserMessage && (
          <div 
            className="text-xs font-medium mb-0.5"
            style={{ color: 'var(--secondary)' }}
          >
            {senderName}
          </div>
        )}
        
        {/* Message Bubble */}
        <div 
          className={`px-4 py-2.5 rounded-[18px] text-sm max-w-full break-words relative
            ${isUserMessage 
              ? 'rounded-tr-[4px]' 
              : 'rounded-tl-[4px]'
            }`}
          style={
            isUserMessage
              ? { backgroundColor: 'var(--primary)', color: 'white' }
              : { backgroundColor: 'var(--light)', color: 'var(--dark)' }
          }
        >
        
          {/* Message Content */}
          {message.type === 'file' && message.fileURL && (
            <div className="mb-2 space-y-2">
              {/* Image Display */}
              {isImage ? (
                <div className="relative group">
                  <img
                    src={message.fileURL}
                    alt={message.fileName || 'Image'}
                    className="max-w-full max-h-96 rounded-lg object-contain cursor-pointer"
                    onClick={() => window.open(message.fileURL, '_blank')}
                    onError={(e) => {
                      // Fallback to file link if image fails to load
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(e);
                      }}
                      className={`p-2 rounded-full shadow-lg hover:opacity-90 transition`}
                      style={isUserMessage ? { backgroundColor: 'rgba(108, 122, 137, 0.5)' } : { backgroundColor: 'white' }}
                      title="Download"
                    >
                      <span className="material-icons text-base" style={{ color: isUserMessage ? "white" : "currentColor" }}>download</span>
                    </button>
                    {sendFile && (
                      <div className="relative" ref={forwardMenuRef}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowForwardMenu(!showForwardMenu);
                          }}
                          className={`p-2 rounded-full shadow-lg hover:opacity-90 transition`}
                          style={isUserMessage ? { backgroundColor: 'rgba(108, 122, 137, 0.5)' } : { backgroundColor: 'white' }}
                          title="Forward"
                          disabled={isForwarding}
                        >
                          <span className="material-icons text-base" style={{ color: isUserMessage ? "white" : "currentColor" }}>forward</span>
                        </button>
                        {showForwardMenu && (
                          <div 
                            className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border p-2 z-50 max-h-48 overflow-y-auto min-w-[200px]"
                            style={{ borderColor: '#E1E4E8' }}
                          >
                            <div className="text-xs font-semibold mb-2 px-2" style={{ color: 'var(--primary)' }}>Forward to:</div>
                            {getAvailableRecipients().length === 0 ? (
                              <div className="text-xs px-2 py-1" style={{ color: 'var(--secondary)' }}>No other users available</div>
                            ) : (
                              getAvailableRecipients().map(recipient => (
                                <button
                                  key={recipient.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleForward(recipient.id);
                                  }}
                                  className="w-full text-left px-2 py-1 text-sm rounded transition"
                                  style={{ color: 'var(--dark)' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--light)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  disabled={isForwarding}
                                >
                                  {recipient.name}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* File info below image */}
                  <div className="mt-1 flex items-center justify-between text-xs" style={{ color: isUserMessage ? 'rgba(255,255,255,0.8)' : 'var(--secondary)' }}>
                    <span>{message.fileName || 'Image'}</span>
                    {message.fileSize && (
                      <span>{(message.fileSize / 1024).toFixed(1)} KB</span>
                    )}
                  </div>
                </div>
              ) : (
              /* Non-image file display */
              <div 
                className="flex items-center gap-2 p-2 rounded-lg transition-all duration-300 border"
                style={
                  isUserMessage
                    ? { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }
                    : { backgroundColor: 'var(--light)', borderColor: '#E1E4E8', color: 'var(--dark)' }
                }
              >
                <span className="material-icons text-xl">description</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {message.fileName || 'File'}
                  </p>
                  {message.fileSize && (
                    <p className="text-xs opacity-75">
                      {(message.fileSize / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={handleDownload}
                    className="p-1 rounded hover:opacity-80 transition"
                    title="Download"
                  >
                    <span className="material-icons text-base">download</span>
                  </button>
                  {sendFile && (
                    <div className="relative" ref={forwardMenuRef}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowForwardMenu(!showForwardMenu);
                        }}
                        className="p-1 rounded hover:opacity-80 transition"
                        title="Forward"
                        disabled={isForwarding}
                      >
                        <span className="material-icons text-base">forward</span>
                      </button>
                      {showForwardMenu && (
                        <div 
                          className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border p-2 z-50 max-h-48 overflow-y-auto min-w-[200px]"
                          style={{ borderColor: '#E1E4E8' }}
                        >
                          <div className="text-xs font-semibold mb-2 px-2" style={{ color: 'var(--primary)' }}>Forward to:</div>
                          {getAvailableRecipients().length === 0 ? (
                            <div className="text-xs px-2 py-1" style={{ color: 'var(--secondary)' }}>No other users available</div>
                          ) : (
                            getAvailableRecipients().map(recipient => (
                              <button
                                key={recipient.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleForward(recipient.id);
                                }}
                                className="w-full text-left px-2 py-1 text-sm rounded transition"
                                style={{ color: 'var(--dark)' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--light)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                disabled={isForwarding}
                              >
                                {recipient.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          {message.type === 'voice' && message.fileURL && (
            <div className="mb-2">
              <audio controls className="w-full max-w-xs">
                <source src={message.fileURL} type={message.fileType || 'audio/webm'} />
                Your browser does not support the audio element.
              </audio>
              {message.duration && (
                <p className="text-xs mt-1 opacity-75">
                  Duration: {Math.round(message.duration)}s
                </p>
              )}
            </div>
          )}

          {/* Message Text - Show for text messages or as description for file/voice messages */}
          {message.text && message.type === 'text' && (
            <p className="break-words whitespace-pre-wrap">{message.text}</p>
          )}
          {message.text && message.type !== 'text' && (
            <p className="text-xs mt-1 opacity-75">
              {message.text}
            </p>
          )}
        </div>

        {/* Message Meta (Time) */}
        <div 
          className="flex items-center gap-1 text-xs mt-0.5 ml-auto"
          style={{ color: isUserMessage ? '#e0e0e0' : 'var(--secondary)' }}
        >
          {timeString}
        </div>
      </div>
    </div>
  );
};

export default Message;

