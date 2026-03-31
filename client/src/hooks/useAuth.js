import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export const useAuth = () => {
  const { isSignedIn, isLoaded, signOut } = useClerkAuth();
  const { user } = useUser();
  const { userData } = useContext(AppContext); // ✅ fix: use userData

  return {
    isSignedIn,
    isLoaded,
    user,        // Clerk's user object
    userData,    // Your backend-synced user data
    signOut,
    isAuthenticated: isSignedIn && isLoaded,
    isLoading: !isLoaded,
  };
};
