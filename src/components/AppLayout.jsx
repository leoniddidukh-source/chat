import { useState } from 'react';
import { useChatContext } from '../context/ChatContext';
import UserAuth from './UserAuth';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import UserConfig from './UserConfig';
import VideoCall from './VideoCall';

// Main Application Layout (Wraps components in the provider)
const AppLayout = () => {
  const { isAuthReady, currentUserName, handleSignOut, auth, isConfigOpen, setIsConfigOpen } = useChatContext();
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  // Check if a user is explicitly logged in (has email or is authenticated via provider, not anonymous)
  // Firebase Auth persists sessions automatically, so if user was logged in before, they'll still be logged in
  const isLoggedIn = auth?.currentUser && (
    auth.currentUser.email || 
    (auth.currentUser.providerData && auth.currentUser.providerData.length > 0 && !auth.currentUser.isAnonymous)
  ); 

  // 1. Show loading screen while Firebase is initializing
  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center" style={{ backgroundColor: 'var(--light)' }}>
        <script src="https://cdn.tailwindcss.com"></script>
        <div className="font-medium text-base flex items-center" style={{ color: 'var(--dark)' }}>
          <svg className="animate-spin -ml-1 mr-3 h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting to Service...
        </div>
      </div>
    );
  }

  // 2. If not explicitly logged in, show the authentication screen
  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full flex items-center justify-center" style={{ backgroundColor: 'var(--light)' }}>
        <script src="https://cdn.tailwindcss.com"></script>
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <UserAuth />
        </div>
      </div>
    );
  }

  // 3. If authenticated, show the main chat interface
  return (
    <div className="h-screen w-screen flex items-stretch overflow-hidden" style={{ backgroundColor: 'var(--light)' }}>
      <script src="https://cdn.tailwindcss.com"></script>
      
      {/* Main Chat Container - Fully Responsive */}
      <div 
        className="w-screen h-full bg-white flex overflow-hidden relative rounded-none md:rounded-[10px] shadow-none md:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      >
        
        {/* Mobile Overlay */}
        {isUserListOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsUserListOpen(false)}
          />
        )}

        {/* User List Sidebar */}
        <div className={`
          fixed md:static inset-y-0 left-0 z-50 md:z-auto h-full
          transform transition-transform duration-300 ease-in-out
          ${isUserListOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <UserList onClose={() => setIsUserListOpen(false)} />
        </div>

        {/* Chat Window Container */}
        <div className="flex flex-col flex-grow min-w-0 bg-white relative z-[1] h-full">
          <ChatWindow onMenuToggle={() => setIsUserListOpen(!isUserListOpen)} />
        </div>
      </div>
      
      {/* User Configuration Modal */}
      <UserConfig 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
      />
      
      {/* Video Call Component */}
      <VideoCall />
    </div>
  );
};

export default AppLayout;

