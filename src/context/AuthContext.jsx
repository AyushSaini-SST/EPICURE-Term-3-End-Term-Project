import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign Up
  function signup(email, password) {
    if (!isFirebaseConfigured) return Promise.reject(new Error("Firebase is not configured"));
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Login
  function login(email, password) {
    if (!isFirebaseConfigured) return Promise.reject(new Error("Firebase is not configured"));
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout
  function logout() {
    if (!isFirebaseConfigured) return Promise.resolve();
    return signOut(auth);
  }

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
