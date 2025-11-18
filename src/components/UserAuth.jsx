import { useState } from 'react';
import { useChatContext } from '../context/ChatContext';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Helper function to generate random user_id (string of random numbers)
const generateUserId = () => {
  // Generate a random number string (10 digits)
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// USER AUTHENTICATION SCREEN (Now the main view when logged out)
const UserAuth = () => {
  const { auth, db } = useChatContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  // Set initial state to SIGN UP to emphasize registration
  const [isSigningUp, setIsSigningUp] = useState(true); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSigningUp && !nickname.trim()) {
      setError('Nickname is required for sign-up.');
      setLoading(false);
      return;
    }

    try {
      if (isSigningUp) {
        // Sign Up is handled via Firebase's createUserWithEmailAndPassword
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: nickname.trim()
        });
        
        // Save user to Firestore with specified fields
        if (db) {
          const userDocRef = doc(db, `users/${userCredential.user.uid}`);
          const userId = generateUserId();
          // Get user's timezone (default to system timezone)
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          // SECURITY WARNING: Storing passwords in plain text is a security risk.
          // In production, passwords should never be stored. Firebase Auth handles password hashing securely.
          // This is only implemented as requested - consider removing password field in production.
          await setDoc(userDocRef, {
            user_id: userId,
            user_name: nickname.trim(),
            time_zone: timeZone,
            user_email: email,
            password: password, // WARNING: Plain text password storage - security risk!
            uid: userCredential.user.uid, // Keep Firebase UID for reference
            displayName: nickname.trim(), // Keep for backward compatibility
            email: email, // Keep for backward compatibility
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        // onAuthStateChanged will handle the UI update
      } else {
        // Log In
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error("Auth Error:", err);
      // Firebase error codes can be parsed for user-friendly messages
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  // NEW: Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Use signInWithPopup to authenticate with Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Save/update user to Firestore with specified fields
      if (db) {
        const userDocRef = doc(db, `users/${user.uid}`);
        // Check if user already exists
        const existingDoc = await getDoc(userDocRef);
        const userId = existingDoc.exists() && existingDoc.data().user_id 
          ? existingDoc.data().user_id 
          : generateUserId();
        const timeZone = existingDoc.exists() && existingDoc.data().time_zone
          ? existingDoc.data().time_zone
          : Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        await setDoc(userDocRef, {
          user_id: userId,
          user_name: user.displayName || user.email || 'User',
          time_zone: timeZone,
          user_email: user.email || '',
          password: '', // Google users don't have passwords
          uid: user.uid, // Keep Firebase UID for reference
          displayName: user.displayName || user.email || 'User', // Keep for backward compatibility
          email: user.email || '', // Keep for backward compatibility
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true }); // Use merge to update if exists
      }
      // If successful, onAuthStateChanged handles the rest
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Updated styling for a centered login screen instead of an overlay modal
    <div className="flex items-center justify-center w-full h-full p-4 md:p-6"> 
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-4 md:p-8 transform transition-transform duration-300">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 text-sky-800 text-center">DM Chat</h1>
        <p className="text-center text-sm md:text-base text-sky-600 mb-4 md:mb-6">Sign up or log in to start messaging!</p>
        
        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full p-3 mb-4 border border-sky-300 bg-white text-sky-700 font-semibold rounded-lg shadow-md hover:bg-sky-50 transition duration-150 disabled:bg-sky-100 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              {/* Google Icon SVG (Inline) */}
              <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg"><path d="M533.5 244.3c0-18.06-1.57-35.12-4.5-51.4H272.08v98.03h147.1c-6.1 32.8-24.3 60.6-49.8 79.5l77.7 60.1c45.4-41.9 71.5-103 71.5-177.3z" fill="#4285f4"/><path d="M272.08 544.3c73.92 0 135.25-24.3 180.3-66l-77.7-60.1c-21.4 14.3-48.4 23-83.3 23-64.2 0-118.6-43.2-137.9-101.4H53.1v64.6c36.7 68.3 109.1 113.6 218.9 113.6z" fill="#34a853"/><path d="M134.18 325.2c-3.1-9.1-4.8-18.9-4.8-29.2s1.7-20.1 4.8-29.2V195.4H53.1c-19.1 38.4-29.4 82.5-29.4 125.6s10.3 87.2 29.4 125.6h81.08z" fill="#fbbc05"/><path d="M272.08 153.2c39.6 0 75.8 14.1 103.9 40.5L445 140c-27.9-26.3-64.3-40.5-117.9-40.5-62.8 0-117.8 28-156.9 72.8l81.08 64.6c19.3-58.2 73.7-101.4 137.9-101.4z" fill="#ea4335"/></svg>
              Sign In with Google
            </>
          )}
        </button>

        <div className="flex items-center space-x-2 my-4">
          <div className="flex-grow border-t border-sky-300"></div>
          <span className="text-sm text-sky-600">OR</span>
          <div className="flex-grow border-t border-sky-300"></div>
        </div>
        
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-sky-700 text-center">
          {isSigningUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <form onSubmit={handleAuth} className="space-y-3 md:space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full p-2.5 md:p-3 text-sm md:text-base border border-sky-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition duration-150 shadow-inner"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (Min 6 characters)"
            required
            className="w-full p-2.5 md:p-3 text-sm md:text-base border border-sky-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition duration-150 shadow-inner"
          />
          {isSigningUp && (
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nickname"
              required
              className="w-full p-2.5 md:p-3 text-sm md:text-base border border-sky-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition duration-150 shadow-inner"
            />
          )}

          {error && <div className="text-red-600 text-sm text-center font-medium p-2 bg-red-50 rounded-lg border border-red-200">{error}</div>}

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
                {isSigningUp ? 'Signing Up...' : 'Logging In...'}
              </span>
            ) : (
              isSigningUp ? 'Sign Up' : 'Log In'
            )}
          </button>
        </form>
        
        <button
          onClick={() => setIsSigningUp(!isSigningUp)}
          className="w-full mt-4 text-sm text-sky-700 hover:text-sky-900 transition duration-150 font-medium"
        >
          {isSigningUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  );
};

export default UserAuth;

