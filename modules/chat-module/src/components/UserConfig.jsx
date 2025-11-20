import { useState, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import { updateProfile, updateEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// User Configuration Component - Appears as a separate modal window
const UserConfig = ({ isOpen, onClose }) => {
  const { auth, db, userId, currentUserName, setCurrentUserName } = useChatContext();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load current user data when component opens
  useEffect(() => {
    if (isOpen && auth?.currentUser) {
      setDisplayName(auth.currentUser.displayName || currentUserName || '');
      setEmail(auth.currentUser.email || '');
      
      // Load timezone from Firestore
      if (db && userId) {
        loadTimezone();
      }
    }
  }, [isOpen, auth, db, userId, currentUserName]);

  const loadTimezone = async () => {
    if (!db || !userId) return;
    
    try {
      const userDocRef = doc(db, `users/${userId}`);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Check for time_zone (new format) or timezone (old format)
        setTimezone(userData.time_zone || userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      } else {
        // Default to user's system timezone
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
    } catch (error) {
      console.error("Error loading timezone:", error);
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const user = auth?.currentUser;
      if (!user) {
        setError('No user is currently logged in.');
        setLoading(false);
        return;
      }

      // Update display name if changed
      if (displayName.trim() && displayName.trim() !== user.displayName) {
        await updateProfile(user, {
          displayName: displayName.trim()
        });
        // Update the context immediately
        setCurrentUserName(displayName.trim());
        
        // Update Firestore user document with new format
        if (db && user.uid) {
          const userDocRef = doc(db, `users/${user.uid}`);
          await setDoc(userDocRef, {
            user_name: displayName.trim(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      // Update email if changed and user has email
      if (email.trim() && email !== user.email && user.email) {
        try {
          await updateEmail(user, email.trim());
          
          // Update Firestore user document with new email format
          if (db && user.uid) {
            const userDocRef = doc(db, `users/${user.uid}`);
            await setDoc(userDocRef, {
              user_email: email.trim(),
              email: email.trim(), // Keep for backward compatibility
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        } catch (emailError) {
          // Email update might require re-authentication
          if (emailError.code === 'auth/requires-recent-login') {
            setError('Please sign out and sign in again to change your email address.');
            setLoading(false);
            return;
          }
          throw emailError;
        }
      }

      // Save timezone to Firestore (using new format: time_zone)
      if (db && userId && timezone) {
        const userDocRef = doc(db, `users/${userId}`);
        await setDoc(userDocRef, {
          time_zone: timezone,
          timezone: timezone, // Keep for backward compatibility
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      setSuccess('Profile updated successfully!');
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get list of common timezones
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-transform duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-sky-800">User Configuration</h2>
          <button
            onClick={onClose}
            className="text-sky-600 hover:text-sky-900 transition duration-150"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name Field */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-sky-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full p-3 border border-sky-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition duration-150 shadow-inner"
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-sky-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 border border-sky-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition duration-150 shadow-inner"
            />
            <p className="text-xs text-sky-600 mt-1">
              Note: Changing email may require re-authentication
            </p>
          </div>

          {/* Timezone Field */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-sky-700 mb-1">
              Time Zone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full p-3 border border-sky-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition duration-150 shadow-inner bg-white"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            {timezone && (
              <p className="text-xs text-sky-600 mt-1">
                Current time: {new Date().toLocaleString('en-US', { timeZone: timezone })}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm text-center font-medium p-2 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="text-green-600 text-sm text-center font-medium p-2 bg-green-50 rounded-lg border border-green-200">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-sky-600 text-white font-semibold rounded-lg shadow-lg hover:bg-sky-700 transition duration-150 disabled:bg-sky-300 transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserConfig;

