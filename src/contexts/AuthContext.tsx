/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  getAuthSession,
  onAuthStateChange,
  signInWithPassword,
  signOutUser,
  signUpWithPassword,
} from "../api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initAuth = async () => {
      try {
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn("Auth session timeout");
            setLoading(false);
          }
        }, 5000);

        const {
          data: { session },
          error,
        } = await getAuthSession();

        clearTimeout(timeoutId);

        if (!mounted) return;

        if (error) {
          console.error("Session error:", error);
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    const setupAuthListener = () => {
      const {
        data: { subscription },
      } = onAuthStateChange(async (_, session) => {
        if (!mounted) return;

        try {
          setUser(session?.user ?? null);
        } catch (error) {
          console.error("Error handling auth state change:", error);
        }

        setLoading(false);
      });

      authSubscription = subscription;
    };

    initAuth();
    setupAuthListener();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithPassword(email, password);

      // Profiles last_login update skipped in this build
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await signUpWithPassword(email, password, fullName);
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signOut,
    signIn,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
