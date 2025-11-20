import { useEffect, useRef, useCallback } from 'react';
import { useChatContext } from '../context/ChatContext';
import { doc, setDoc, getDoc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { isAIAssistant } from '../utils/constants';

const VideoCall = () => {
  const {
    userId,
    db,
    selectedRecipientId,
    callState,
    setCallState,
    localStream,
    setLocalStream,
    remoteStream,
    setRemoteStream,
    peerConnection,
    setPeerConnection
  } = useChatContext();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const signalingUnsubscribeRef = useRef(null);
  const callDocRef = useRef(null);

  // Check if recipient is AI (no video calls with AI)
  const isAI = isAIAssistant(selectedRecipientId);

  // Get call document ID (consistent for both users)
  const getCallDocId = () => {
    if (!userId || !selectedRecipientId) return null;
    const participants = [userId, selectedRecipientId].sort();
    return `call_${participants[0]}_${participants[1]}`;
  };

  // End call function (defined early for use in other functions)
  const endCall = useCallback(async () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    // Clear remote stream
    setRemoteStream(null);

    // Update call status in Firestore
    if (callDocRef.current) {
      try {
        await setDoc(callDocRef.current, {
          status: 'ended',
          endedAt: serverTimestamp()
        }, { merge: true });
        
        // Delete call document after a delay
        setTimeout(async () => {
          try {
            await deleteDoc(callDocRef.current);
          } catch (error) {
            console.error('Error deleting call document:', error);
          }
        }, 1000);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }

    // Unsubscribe from signaling
    if (signalingUnsubscribeRef.current) {
      signalingUnsubscribeRef.current();
      signalingUnsubscribeRef.current = null;
    }

    setCallState('idle');
    callDocRef.current = null;
  }, [localStream, peerConnection, setLocalStream, setPeerConnection, setRemoteStream, setCallState]);

  // Setup WebRTC peer connection
  const setupPeerConnection = useCallback(async () => {
    if (!db || !userId || !selectedRecipientId) return null;

    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    
    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && callDocRef.current) {
        try {
          await setDoc(callDocRef.current, {
            [`iceCandidates.${userId}`]: {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid,
              timestamp: serverTimestamp()
            }
          }, { merge: true });
        } catch (error) {
          console.error('Error sending ICE candidate:', error);
        }
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Peer connection state:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall();
      }
    };

    return pc;
  }, [db, userId, selectedRecipientId, localStream, setRemoteStream, endCall]);

  // Get user media (camera and microphone)
  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access camera/microphone. Please check permissions.');
      return null;
    }
  };

  // Listen for signaling (SDP offers/answers and ICE candidates)
  // Moved before startCall and answerCall to avoid initialization error
  const listenForSignaling = useCallback((pcToUse = null) => {
    const pc = pcToUse || peerConnection;
    if (!db || !callDocRef.current || !pc) return;

    signalingUnsubscribeRef.current = onSnapshot(callDocRef.current, async (snapshot) => {
      if (!snapshot.exists()) return;

      const callData = snapshot.data();
      const isCaller = callData.callerId === userId;

      // Handle answer (for caller)
      if (isCaller && callData.answer && !pc.remoteDescription) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(callData.answer));
          setCallState('in-call');
        } catch (error) {
          console.error('Error setting remote description (answer):', error);
        }
      }

      // Handle offer (for callee)
      if (!isCaller && callData.offer && !pc.remoteDescription) {
        setCallState('ringing');
      }

      // Handle ICE candidates
      if (callData.iceCandidates) {
        const otherUserId = isCaller ? callData.calleeId : callData.callerId;
        const candidate = callData.iceCandidates[otherUserId];
        
        if (candidate && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate({
              candidate: candidate.candidate,
              sdpMLineIndex: candidate.sdpMLineIndex,
              sdpMid: candidate.sdpMid
            }));
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        }
      }

      // Handle call ended
      if (callData.status === 'ended') {
        endCall();
      }
    });
  }, [db, userId, peerConnection, setCallState, endCall]);

  // Start a call (initiate)
  const startCall = useCallback(async () => {
    if (!db || !userId || !selectedRecipientId) return;

    const callDocId = getCallDocId();
    if (!callDocId) return;

    callDocRef.current = doc(db, `calls/${callDocId}`);

    // Get user media
    const stream = await getUserMedia();
    if (!stream) {
      setCallState('idle');
      return;
    }

    // Setup peer connection (will use the stream we just got)
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    
    // Add local stream tracks to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && callDocRef.current) {
        try {
          await setDoc(callDocRef.current, {
            [`iceCandidates.${userId}`]: {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid,
              timestamp: serverTimestamp()
            }
          }, { merge: true });
        } catch (error) {
          console.error('Error sending ICE candidate:', error);
        }
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Peer connection state:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall();
      }
    };

    setPeerConnection(pc);

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Save offer to Firestore
    await setDoc(callDocRef.current, {
      callerId: userId,
      calleeId: selectedRecipientId,
      offer: {
        type: offer.type,
        sdp: offer.sdp
      },
      answer: null,
      iceCandidates: {},
      status: 'ringing',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Listen for answer - pass the local pc variable directly
    listenForSignaling(pc);
  }, [db, userId, selectedRecipientId, setPeerConnection, setRemoteStream, endCall, listenForSignaling]);

  // Answer a call
  const answerCall = useCallback(async () => {
    if (!db || !userId || !selectedRecipientId || !callDocRef.current) return;

    // Get user media
    const stream = await getUserMedia();
    if (!stream) {
      setCallState('idle');
      return;
    }

    // Get offer from Firestore
    const callDoc = await getDoc(callDocRef.current);
    const callData = callDoc.data();
    if (!callData || !callData.offer) {
      setCallState('idle');
      return;
    }

    // Setup peer connection
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    
    // Add local stream tracks to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && callDocRef.current) {
        try {
          await setDoc(callDocRef.current, {
            [`iceCandidates.${userId}`]: {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid,
              timestamp: serverTimestamp()
            }
          }, { merge: true });
        } catch (error) {
          console.error('Error sending ICE candidate:', error);
        }
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Peer connection state:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall();
      }
    };

    setPeerConnection(pc);

    // Set remote description (offer)
    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

    // Create answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Save answer to Firestore
    await setDoc(callDocRef.current, {
      answer: {
        type: answer.type,
        sdp: answer.sdp
      },
      status: 'in-call',
      updatedAt: serverTimestamp()
    }, { merge: true });

    setCallState('in-call');

    // Process any existing ICE candidates
    if (callData.iceCandidates && callData.iceCandidates[callData.callerId]) {
      const candidate = callData.iceCandidates[callData.callerId];
      try {
        await pc.addIceCandidate(new RTCIceCandidate({
          candidate: candidate.candidate,
          sdpMLineIndex: candidate.sdpMLineIndex,
          sdpMid: candidate.sdpMid
        }));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }

    // Listen for signaling - pass the local pc variable directly
    listenForSignaling(pc);
  }, [db, userId, selectedRecipientId, setPeerConnection, setRemoteStream, setCallState, endCall, listenForSignaling]);

  // Handle call state changes
  useEffect(() => {
    if (!db || !userId || !selectedRecipientId || isAI) return;

    const callDocId = getCallDocId();
    if (!callDocId) return;

    const callDoc = doc(db, `calls/${callDocId}`);
    callDocRef.current = callDoc;

    // If callState is 'calling', start the call (only if not already in progress)
    if (callState === 'calling' && !peerConnection) {
      startCall();
      return;
    }

    // Listen for incoming calls
    const unsubscribe = onSnapshot(callDoc, (snapshot) => {
      if (!snapshot.exists()) {
        if (callState === 'ringing') {
          setCallState('idle');
        }
        return;
      }

      const callData = snapshot.data();
      const isCaller = callData.callerId === userId;

      // If we're the callee and call is ringing
      if (!isCaller && callData.status === 'ringing' && callState === 'idle') {
        setCallState('ringing');
      }
    });

    return () => {
      unsubscribe();
      if (signalingUnsubscribeRef.current) {
        signalingUnsubscribeRef.current();
      }
    };
  }, [db, userId, selectedRecipientId, callState, peerConnection, startCall]);

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
      if (signalingUnsubscribeRef.current) {
        signalingUnsubscribeRef.current();
      }
    };
  }, []);

  // Don't render anything if AI is selected or call is idle
  if (isAI || callState === 'idle') {
    return null;
  }

  // Render video call UI
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="w-full h-full flex flex-col">
        {/* Remote video (main view) */}
        <div className="flex-grow relative bg-gray-900">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-pulse mb-4">
                  <span className="material-icons text-6xl">videocam</span>
                </div>
                <p className="text-lg">
                  {callState === 'calling' ? 'Calling...' : callState === 'ringing' ? 'Incoming call...' : 'Connecting...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        {localStream && (
          <div className="absolute bottom-16 md:bottom-4 right-2 md:right-4 w-24 h-20 md:w-48 md:h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg z-10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Call controls */}
        <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-4">
          {callState === 'ringing' && (
            <>
              <button
                onClick={answerCall}
                className="p-3 md:p-4 bg-green-600 hover:bg-green-700 rounded-full text-white shadow-lg transition duration-150"
                title="Answer Call"
              >
                <span className="material-icons text-xl md:text-2xl">call</span>
              </button>
              <button
                onClick={endCall}
                className="p-3 md:p-4 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg transition duration-150"
                title="Decline Call"
              >
                      <span className="material-icons text-xl md:text-2xl">close</span>
              </button>
            </>
          )}
          {(callState === 'calling' || callState === 'in-call') && (
            <button
              onClick={endCall}
              className="p-3 md:p-4 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg transition duration-150"
              title="End Call"
            >
              <span className="material-icons text-xl md:text-2xl">call</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;

