import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  limit, 
  serverTimestamp,
  onSnapshot,
  getDocs,
  doc,
  setDoc,
  orderBy
} from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ChatContext } from '../context/ChatContext';
import { firestore, authInstance, initialAuthToken, storage } from '../utils/firebase';
import LOCAL_FALLBACK_CONFIG from '../firebase_config';
import { getChatId, isAIAssistant, AI_ASSISTANT } from '../utils/constants';
import { sendToGemini, isGeminiAvailable, validateGeminiAPI } from '../utils/gemini';

// CHAT PROVIDER (Holds state and Firebase logic)
const ChatProvider = ({ children }) => {
  // State for Firebase instances and user details
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // States for User Profile 
  const [currentUserName, setCurrentUserName] = useState('Guest');
  
  // State for User Configuration Window
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // State for registered users (from Firestore)
  const [registeredUsers, setRegisteredUsers] = useState([]);
  
  // State for online status tracking
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // State for video calling
  const [callState, setCallState] = useState('idle'); // 'idle', 'calling', 'ringing', 'in-call', 'ended'
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  
  // State for Component Communication: Tracks the selected user
  // Default to AI assistant
  const [selectedRecipientId, setSelectedRecipientId] = useState(
    AI_ASSISTANT.id
  );

  // State for chat functionality
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref for debouncing storage saves
  const saveTimeoutRef = useRef(null);
  // Ref for fallback query unsubscribe
  const fallbackUnsubscribeRef = useRef(null);

  // 1. Firebase Initialization and Authentication
  useEffect(() => {
    try {
      if (!LOCAL_FALLBACK_CONFIG.apiKey || LOCAL_FALLBACK_CONFIG.apiKey === "YOUR_API_KEY") {
        console.error("Firebase Initialization Skipped: Configuration is missing or placeholder.");
        setIsLoading(false);
        // Keep auth and db null to prevent operations
        return; 
      }
      console.log(LOCAL_FALLBACK_CONFIG);
      

      setDb(firestore);
      setAuth(authInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          // Get display name from user object (set by updateProfile or Google Auth)
          setCurrentUserName(user.displayName || user.email || `User-${user.uid.slice(0, 5)}`); 
          
          // Set user as online in Firestore
          if (firestore) {
            try {
              const userDocRef = doc(firestore, `users/${user.uid}`);
              await setDoc(userDocRef, {
                isOnline: true,
                lastSeen: serverTimestamp(),
                updatedAt: serverTimestamp()
              }, { merge: true });
            } catch (error) {
              console.error("Error setting online status:", error);
            }
          }
        } else {
          // Only sign in anonymously if there's truly no user (no persisted session)
          // Don't automatically sign in anonymously - let user choose to log in
          setUserId(null);
          setCurrentUserName('Guest');
        }
        setIsAuthReady(true);
      });

      // Attempt to sign in with the custom token if provided (Canvas environment)
      if (initialAuthToken) {
        signInWithCustomToken(authInstance, initialAuthToken).catch(error => {
          console.error("Custom token sign-in failed, proceeding with fallback auth.", error);
        });
      }

      return () => unsubscribe();
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setIsLoading(false);
    }
  }, []);

  // Fetch all registered users from Firestore and track online status
  useEffect(() => {
    if (!db || !isAuthReady) return;

    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRegisteredUsers(usersList);
        
        // Initialize online users set
        const onlineSet = new Set();
        usersList.forEach(user => {
          if (user.isOnline === true) {
            const userUid = user.uid || user.id;
            if (userUid) {
              onlineSet.add(userUid);
            }
          }
        });
        setOnlineUsers(onlineSet);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();

    // Set up real-time listener for users collection
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegisteredUsers(usersList);
      
      // Update online users set
      const onlineSet = new Set();
      usersList.forEach(user => {
        if (user.isOnline === true) {
          const userUid = user.uid || user.id;
          if (userUid) {
            onlineSet.add(userUid);
          }
        }
      });
      setOnlineUsers(onlineSet);
    });

    return () => unsubscribe();
  }, [db, isAuthReady]);
  
  // Heartbeat: Update lastSeen timestamp periodically for current user
  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;
    
    // Update lastSeen every 30 seconds to keep user online
    const heartbeatInterval = setInterval(async () => {
      try {
        const userDocRef = doc(db, `users/${userId}`);
        await setDoc(userDocRef, {
          isOnline: true,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error("Error updating heartbeat:", error);
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(heartbeatInterval);
  }, [db, userId, isAuthReady]);
  
  // Handle page unload - set user offline
  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;
    
    const handleBeforeUnload = async () => {
      try {
        const userDocRef = doc(db, `users/${userId}`);
        await setDoc(userDocRef, {
          isOnline: false,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error("Error setting offline status on unload:", error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also set offline when component unmounts
      if (db && userId) {
        setDoc(doc(db, `users/${userId}`), {
          isOnline: false,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(error => {
          console.error("Error setting offline status on unmount:", error);
        });
      }
    };
  }, [db, userId, isAuthReady]);

  // 4. Save Chat History to Firebase Storage (Optional - disabled if CORS issues)
  const saveChatHistoryToStorage = useCallback(async (chatId, messagesToSave) => {
    // Disable storage backup to avoid CORS issues
    // Chat history is already stored in Firestore, so this is redundant
    return;
    
    // Original code kept for reference but disabled
    /*
    if (!storage || !userId || !selectedRecipientId) return;
    
    if (!messagesToSave || messagesToSave.length === 0) return;

    try {
      // Prepare chat history data
      const chatHistory = {
        chatId: chatId,
        userId: userId,
        recipientId: selectedRecipientId,
        timestamp: new Date().toISOString(),
        messageCount: messagesToSave.length,
        messages: messagesToSave.map(msg => ({
          id: msg.id,
          text: msg.text,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
          color: msg.color
        }))
      };

      // Create a JSON string
      const historyJson = JSON.stringify(chatHistory, null, 2);
      
      // Create storage reference
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const storagePath = `chat-history/${chatId}/${timestamp}.json`;
      const storageRef = ref(storage, storagePath);

      // Upload to Firebase Storage
      await uploadString(storageRef, historyJson, 'raw');
      console.log("Chat history saved to Firebase Storage:", storagePath);
    } catch (error) {
      // Silently fail - this is a background operation
      // CORS errors are expected if Storage bucket isn't configured properly
      if (error.code !== 'storage/unauthorized' && !error.message?.includes('CORS')) {
        console.error("Error saving chat history to Storage:", error);
      }
    }
    */
  }, [userId, selectedRecipientId]);

  // 2. Real-time Message Listener (Firestore onSnapshot)
  useEffect(() => {
    // Only run if Firebase is initialized and auth state is ready
    if (!db || !isAuthReady || !userId || !selectedRecipientId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Clear any existing fallback unsubscribe
    if (fallbackUnsubscribeRef.current) {
      fallbackUnsubscribeRef.current();
      fallbackUnsubscribeRef.current = null;
    }

    const chatId = getChatId(userId, selectedRecipientId);
    if (!chatId) return;

    // Store chats in Firestore "chats" collection
    // Structure: chats/{chatId}/messages/{messageId}
    const chatDocRef = doc(db, `chats/${chatId}`);
    
    // Ensure chat document exists with metadata (async operation)
    setDoc(chatDocRef, {
      chatId: chatId,
      participant1: userId,
      participant2: selectedRecipientId,
      participants: [userId, selectedRecipientId].sort(),
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true }).catch(error => {
      console.error("Error creating chat document:", error);
    });

    // Get messages from subcollection - fetch all past conversations
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    
    // Query all messages ordered by creation time (ascending - oldest first)
    // Increased limit to 500 to show more conversation history
    // Try with orderBy first, fallback to no ordering if index doesn't exist
    let q;
    try {
      q = query(
        messagesRef,
        orderBy('createdAt', 'asc'),
        limit(500)
      );
    } catch (error) {
      console.warn("Error creating ordered query, trying without orderBy:", error);
      // Fallback: query without ordering (we'll sort manually)
      q = query(
      messagesRef, 
        limit(500)
    );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        if (snapshot.empty) {
          // No messages yet - this is a new conversation
          setMessages([]);
          setIsLoading(false);
          return;
        }

        const fetchedMessages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
        id: doc.id,
            type: data.type || 'text', // 'text', 'file', or 'voice'
            text: data.text || '',
            senderId: data.senderId || '',
            receiverId: data.receiverId || '',
            color: data.color || '',
            createdAt: data.createdAt?.toDate() || new Date(0),
            // File message fields
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileType: data.fileType,
            fileURL: data.fileURL,
            storagePath: data.storagePath,
            // Voice message fields
            duration: data.duration
          };
        });
        
        // Sort by creation time (oldest first) to display chronologically
        // Always sort manually to ensure correct order even if query doesn't have orderBy
        fetchedMessages.sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return timeA - timeB;
        });
        
        console.log(`Loaded ${fetchedMessages.length} messages for chat ${chatId}`);
      setMessages(fetchedMessages);
      setIsLoading(false);
        
        // Chat history storage disabled to avoid CORS issues
        // Messages are already stored in Firestore, so storage backup is not needed
        // if (fetchedMessages.length > 0 && storage) {
        //   // Clear previous timeout
        //   if (saveTimeoutRef.current) {
        //     clearTimeout(saveTimeoutRef.current);
        //   }
        //   
        //   // Debounce: only save after a short delay to avoid too frequent saves
        //   saveTimeoutRef.current = setTimeout(() => {
        //     saveChatHistoryToStorage(chatId, fetchedMessages);
        //   }, 2000); // Save 2 seconds after last message update
        // }
      } catch (error) {
        console.error("Error processing messages:", error);
        setIsLoading(false);
        setMessages([]);
      }
    }, (error) => {
      console.error("Error fetching messages from Firestore:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // If it's a missing index error, try querying without orderBy
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.log("Index missing, attempting to fetch messages without ordering...");
        // Set up fallback query without orderBy
        const fallbackQuery = query(messagesRef, limit(500));
        fallbackUnsubscribeRef.current = onSnapshot(fallbackQuery, (snapshot) => {
          try {
            if (snapshot.empty) {
              setMessages([]);
              setIsLoading(false);
              return;
            }
            
            const fetchedMessages = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                type: data.type || 'text',
                text: data.text || '',
                senderId: data.senderId || '',
                receiverId: data.receiverId || '',
                color: data.color || '',
                createdAt: data.createdAt?.toDate() || new Date(0),
                fileName: data.fileName,
                fileSize: data.fileSize,
                fileType: data.fileType,
                fileURL: data.fileURL,
                storagePath: data.storagePath,
                duration: data.duration
              };
            });
            
            fetchedMessages.sort((a, b) => {
              const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
              const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
              return timeA - timeB;
            });
            
            console.log(`Loaded ${fetchedMessages.length} messages (fallback query)`);
            setMessages(fetchedMessages);
            setIsLoading(false);
          } catch (processError) {
            console.error("Error processing fallback messages:", processError);
            setIsLoading(false);
            setMessages([]);
          }
        }, (fallbackError) => {
          console.error("Fallback query also failed:", fallbackError);
          setIsLoading(false);
          setMessages([]);
        });
      }
      
      setIsLoading(false);
      setMessages([]);
    });

    return () => {
      unsubscribe();
      if (fallbackUnsubscribeRef.current) {
        fallbackUnsubscribeRef.current();
        fallbackUnsubscribeRef.current = null;
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [db, isAuthReady, userId, selectedRecipientId]);

  // 2.5. Validate Gemini API when AI assistant is selected
  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;
    
    const isAI = isAIAssistant(selectedRecipientId);
    if (!isAI) return;

    // Validate API key and model when AI assistant is selected
    const validateAPI = async () => {
      const validation = await validateGeminiAPI();
      
      if (!validation.valid) {
        // Save validation error message to chat
        const chatId = getChatId(userId, AI_ASSISTANT.id);
        if (!chatId) return;
        
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const chatDocRef = doc(db, `chats/${chatId}`);
        
        // Check if we already have a validation error message (to avoid duplicates)
        try {
          const existingMessages = await getDocs(query(messagesRef, limit(1), orderBy('createdAt', 'desc')));
          const lastMessage = existingMessages.docs[0]?.data();
          
          // Only add error message if the last message is not already a validation error
          if (!lastMessage || !lastMessage.text?.includes('API') || lastMessage.senderId !== AI_ASSISTANT.id) {
            const errorMessagePayload = {
              type: 'text',
              text: `⚠️ ${validation.error}`,
              createdAt: serverTimestamp(),
              senderId: AI_ASSISTANT.id,
              receiverId: userId,
              color: '4A90E2',
            };
            
            await addDoc(messagesRef, errorMessagePayload);
            
            // Update chat document
            await setDoc(chatDocRef, {
              lastMessageAt: serverTimestamp(),
              lastMessage: errorMessagePayload.text,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        } catch (error) {
          // If query fails, still try to add the error message
          console.error('Error checking existing messages:', error);
          const errorMessagePayload = {
            type: 'text',
            text: `⚠️ ${validation.error}`,
            createdAt: serverTimestamp(),
            senderId: AI_ASSISTANT.id,
            receiverId: userId,
            color: '4A90E2',
          };
          
          await addDoc(messagesRef, errorMessagePayload);
          
          await setDoc(chatDocRef, {
            lastMessageAt: serverTimestamp(),
            lastMessage: errorMessagePayload.text,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }
    };

    validateAPI();
  }, [db, userId, isAuthReady, selectedRecipientId]);

  // 3. Send Message Handler
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !db || !selectedRecipientId) return;

    const chatId = getChatId(userId, selectedRecipientId);
    if (!chatId) return;
    
    const senderColor = userId.slice(0, 6);
    const messageText = newMessage.trim(); // Save message text before clearing
    const isAI = isAIAssistant(selectedRecipientId);

    const messagePayload = {
      type: 'text',
      text: messageText,
      createdAt: serverTimestamp(),
      senderId: userId, 
      receiverId: selectedRecipientId,
      color: senderColor,
    };

    try {
      // Store message in chats collection
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      await addDoc(messagesRef, messagePayload);
      
      // Update chat document with last message timestamp
      const chatDocRef = doc(db, `chats/${chatId}`);
      await setDoc(chatDocRef, {
        lastMessageAt: serverTimestamp(),
        lastMessage: messageText,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setNewMessage('');
      
      // If sending to AI assistant, get AI response
      if (isAI) {
        if (!isGeminiAvailable()) {
          // Save error message if Gemini is not configured
          const errorMessagePayload = {
            type: 'text',
            text: 'Gemini AI is not configured. Please set the VITE_GEMINI_API_KEY environment variable.',
            createdAt: serverTimestamp(),
            senderId: AI_ASSISTANT.id,
            receiverId: userId,
            color: '4A90E2',
          };
          await addDoc(messagesRef, errorMessagePayload);
          return;
        }
        
        try {
          // Prepare chat history for context
          // Include current message and previous messages from this chat
          const currentUserMessage = {
            role: 'user',
            text: messageText
          };
          
          const previousMessages = messages
            .filter(msg => msg.text && (msg.senderId === userId || msg.senderId === AI_ASSISTANT.id))
            .slice(-9) // Last 9 messages (plus current = 10 total)
            .map(msg => ({
              role: msg.senderId === userId ? 'user' : 'model',
              text: msg.text
            }));
          
          const chatHistory = [...previousMessages, currentUserMessage];

          console.log('Sending to Gemini with chat history:', chatHistory.length, 'messages');
          // Get AI response
          const aiResponse = await sendToGemini(messageText, chatHistory);

          // Save AI response as a message
          const aiMessagePayload = {
            type: 'text',
            text: aiResponse,
            createdAt: serverTimestamp(),
            senderId: AI_ASSISTANT.id,
            receiverId: userId,
            color: '4A90E2', // Blue color for AI
          };

          await addDoc(messagesRef, aiMessagePayload);

          // Update chat document with AI response
          await setDoc(chatDocRef, {
            lastMessageAt: serverTimestamp(),
            lastMessage: aiResponse,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (aiError) {
          console.error("Error getting AI response:", aiError);
          // Save error message
          const errorMessagePayload = {
            type: 'text',
            text: 'Sorry, I encountered an error. Please make sure the Gemini API key is configured correctly.',
            createdAt: serverTimestamp(),
            senderId: AI_ASSISTANT.id,
            receiverId: userId,
            color: '4A90E2',
          };
          await addDoc(messagesRef, errorMessagePayload);
        }
      }
      
      // Chat history storage disabled to avoid CORS issues
      // Messages are already stored in Firestore, so storage backup is not needed
      // setTimeout(async () => {
      //   const currentMessages = messages;
      //   const newMessageData = {
      //     id: 'temp',
      //     type: 'text',
      //     text: messageText,
      //     senderId: userId,
      //     receiverId: selectedRecipientId,
      //     createdAt: new Date(),
      //     color: senderColor
      //   };
      //   await saveChatHistoryToStorage(chatId, [...currentMessages, newMessageData]);
      // }, 500);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  // 4. Send File Handler
  const sendFile = async (file) => {
    if (!file || !userId || !db || !selectedRecipientId) {
      console.error("Cannot upload file: missing required parameters", { file: !!file, userId: !!userId, db: !!db, selectedRecipientId: !!selectedRecipientId });
      alert("Cannot upload file. Please ensure you're logged in and have selected a recipient.");
      return;
    }

    if (!storage) {
      console.error("Firebase Storage is not initialized");
      alert("File storage is not available. Please check your Firebase configuration.");
      return;
    }

    const chatId = getChatId(userId, selectedRecipientId);
    if (!chatId) {
      console.error("Cannot generate chatId");
      return;
    }
    
    const senderColor = userId.slice(0, 6);
    const fileId = `${Date.now()}_${file.name}`;
    const filePath = `chats/${chatId}/files/${fileId}`;
    const storageRef = ref(storage, filePath);

    try {
      console.log("Starting file upload:", file.name, "Size:", file.size, "Type:", file.type);
      
      // Upload file to Firebase Storage
      await uploadBytes(storageRef, file);
      console.log("File uploaded to Storage, getting download URL...");
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Download URL obtained:", downloadURL);

      // Store file metadata in Firestore
      const messagePayload = {
        type: 'file',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileURL: downloadURL,
        storagePath: filePath,
        text: `📎 ${file.name}`,
        createdAt: serverTimestamp(),
        senderId: userId,
        receiverId: selectedRecipientId,
        color: senderColor,
      };

      // Store file metadata in Firestore
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      const docRef = await addDoc(messagesRef, messagePayload);
      console.log("File message added to Firestore with ID:", docRef.id);

      // Update chat document
      const chatDocRef = doc(db, `chats/${chatId}`);
      await setDoc(chatDocRef, {
        lastMessageAt: serverTimestamp(),
        lastMessage: `📎 ${file.name}`,
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log("File uploaded successfully:", file.name);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Failed to upload file: ${error.message}`);
    }
  };

  // 5. Send Voice Message Handler
  const sendVoiceMessage = async (audioBlob, duration) => {
    if (!audioBlob || !userId || !db || !selectedRecipientId) {
      console.error("Cannot upload voice message: missing required parameters", { audioBlob: !!audioBlob, userId: !!userId, db: !!db, selectedRecipientId: !!selectedRecipientId });
      alert("Cannot upload voice message. Please ensure you're logged in and have selected a recipient.");
      return;
    }

    if (!storage) {
      console.error("Firebase Storage is not initialized");
      alert("Voice message storage is not available. Please check your Firebase configuration.");
      return;
    }

    const chatId = getChatId(userId, selectedRecipientId);
    if (!chatId) {
      console.error("Cannot generate chatId");
      return;
    }
    
    const senderColor = userId.slice(0, 6);
    const voiceId = `voice_${Date.now()}.webm`;
    const voicePath = `chats/${chatId}/voice/${voiceId}`;
    const storageRef = ref(storage, voicePath);

    try {
      console.log("Starting voice message upload, duration:", duration, "Size:", audioBlob.size);
      
      // Upload voice recording to Firebase Storage
      await uploadBytes(storageRef, audioBlob);
      console.log("Voice message uploaded to Storage, getting download URL...");
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Download URL obtained:", downloadURL);

      // Store voice message metadata in Firestore
      const messagePayload = {
        type: 'voice',
        fileName: voiceId,
        fileSize: audioBlob.size,
        fileType: 'audio/webm',
        fileURL: downloadURL,
        storagePath: voicePath,
        duration: duration, // Duration in seconds
        text: `🎤 Voice message (${Math.round(duration)}s)`,
        createdAt: serverTimestamp(),
        senderId: userId,
        receiverId: selectedRecipientId,
        color: senderColor,
      };

      // Store voice message metadata in Firestore
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      const docRef = await addDoc(messagesRef, messagePayload);
      console.log("Voice message added to Firestore with ID:", docRef.id);

      // Update chat document
      const chatDocRef = doc(db, `chats/${chatId}`);
      await setDoc(chatDocRef, {
        lastMessageAt: serverTimestamp(),
        lastMessage: `🎤 Voice message`,
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log("Voice message uploaded successfully");
    } catch (error) {
      console.error("Error uploading voice message:", error);
      alert(`Failed to upload voice message: ${error.message}`);
    }
  };

  
  const handleSignOut = async () => {
    if (auth && db && userId) {
      try {
        // Set user offline before signing out
        const userDocRef = doc(db, `users/${userId}`);
        await setDoc(userDocRef, {
          isOnline: false,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error("Error setting offline status on sign out:", error);
      }
      
      signOut(auth).catch(error => console.error("Sign out failed:", error));
    }
  };

  // Value object provided to consumers
  const contextValue = {
    userId,
    db,
    auth, 
    isAuthReady,
    currentUserName,
    setCurrentUserName,
    messages,
    isLoading,
    selectedRecipientId,
    setSelectedRecipientId,
    newMessage,
    setNewMessage,
    sendMessage,
    sendFile,
    sendVoiceMessage,
    registeredUsers,
    onlineUsers,
    callState,
    setCallState,
    localStream,
    setLocalStream,
    remoteStream,
    setRemoteStream,
    peerConnection,
    setPeerConnection,
    handleSignOut,
    isConfigOpen,
    setIsConfigOpen,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;

