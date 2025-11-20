import { useChatContext } from '../context/ChatContext';
import { AI_ASSISTANT } from '../utils/constants';

// User List Component: Communicates selection choice via Context
const UserList = ({ onClose }) => {
  // Access selectedRecipientId and the setter function from Context
  const { selectedRecipientId, setSelectedRecipientId, userId, registeredUsers, onlineUsers, currentUserName } = useChatContext();
  
  // Handle user selection and close mobile menu
  const handleUserSelect = (userId) => {
    setSelectedRecipientId(userId);
    if (onClose) {
      onClose();
    }
  };
  
  // Helper function to check if a user is online
  const isUserOnline = (userUid) => {
    if (!userUid) return false;
    return onlineUsers.has(userUid);
  };
  
  // Format registered users
  const formattedRegisteredUsers = registeredUsers
    .filter(user => {
      const userUid = user.uid || user.id;
      return userUid && userUid !== userId;
    }) // Exclude current user
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
  
  const allUsers = formattedRegisteredUsers;
  
  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get current user's initials
  const currentUserInitials = getUserInitials(currentUserName || 'User');
  
  return (
    <div 
      className="w-[280px] sm:w-[280px] md:w-[280px] lg:w-[320px] h-full bg-white border-r flex flex-col transition-all duration-300 relative z-[2]"
      style={{ borderColor: '#E1E4E8' }}
    >
      {/* Sidebar Header */}
      <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: '#E1E4E8' }}>
        <div className="flex items-center gap-2.5 font-bold text-base" style={{ color: 'var(--primary)' }}>
          <div 
            className="w-7 h-7 rounded-md flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            💬
          </div>
          <span>CorporateSync</span>
        </div>
      </div>

      {/* Contact List */}
      <div 
        className="flex-1 overflow-y-auto py-2.5"
        style={{ 
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* AI Assistant Section - Always at the top */}
        <div
          onClick={() => handleUserSelect(AI_ASSISTANT.id)}
          className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-all duration-300 border-l-3 relative
            ${selectedRecipientId === AI_ASSISTANT.id 
              ? 'bg-[var(--primary-light)] border-l-[var(--primary)]' 
              : 'border-l-transparent hover:bg-[var(--primary-light)]'
            }`}
        >
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-base relative"
            style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
          >
            🤖
            <span 
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
              style={{ backgroundColor: 'var(--success)' }}
            ></span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm flex items-center justify-between" style={{ color: 'var(--dark)' }}>
              <span className="truncate">{AI_ASSISTANT.name}</span>
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--secondary)' }}>
              Powered by Google Gemini
            </div>
          </div>
        </div>

        {allUsers.length === 0 ? (
          <div className="p-4 text-center text-sm" style={{ color: 'var(--secondary)' }}>
            No other contacts available
          </div>
        ) : (
          <>
            {/* Registered Users Section */}
            {formattedRegisteredUsers.map(user => {
              const isOnline = isUserOnline(user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className={`px-3 md:px-4 py-2 md:py-2.5 flex items-center gap-2 md:gap-3 cursor-pointer transition-all duration-300 border-l-3 relative
                    ${selectedRecipientId === user.id 
                      ? 'bg-[var(--primary-light)] border-l-[var(--primary)]' 
                      : 'border-l-transparent hover:bg-[var(--primary-light)]'
                    }`}
                >
                  <div 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-xs md:text-base relative flex-shrink-0"
                    style={{ backgroundColor: 'var(--light)', color: 'var(--dark)' }}
                  >
                    {getUserInitials(user.name)}
                    <span 
                      className={`absolute bottom-0 right-0 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full border-2 border-white ${
                        isOnline ? '' : 'bg-[var(--secondary)]'
                      }`}
                      style={isOnline ? { backgroundColor: 'var(--success)' } : {}}
                    ></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs md:text-sm flex items-center justify-between" style={{ color: 'var(--dark)' }}>
                      <span className="truncate">{user.name}</span>
                    </div>
                    {user.email && (
                      <div className="text-[10px] md:text-xs truncate" style={{ color: 'var(--secondary)' }}>
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Sidebar Footer */}
      <div 
        className="px-3 md:px-4 py-3 md:py-4 border-t flex items-center gap-2 md:gap-2.5"
        style={{ borderColor: '#E1E4E8' }}
      >
        {/* User Avatar */}
        <div 
          className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-semibold text-xs md:text-sm flex-shrink-0"
          style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
        >
          {currentUserInitials}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0 hidden sm:block">
          <div className="font-medium text-xs" style={{ color: 'var(--dark)' }}>
            {currentUserName || 'User'}
          </div>
          <div className="text-[10px] md:text-[11px]" style={{ color: 'var(--secondary)' }}>
            Online
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserList;

