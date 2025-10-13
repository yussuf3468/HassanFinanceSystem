// @ts-nocheck
export {};
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Update last login time in profiles table
  async function updateLastLogin(userId: string) {
    try {
      // Disabled in backup file
      return;
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  }

  useEffect(() => {
    let mounted = true;

    // Check active session with timeout
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Session error:", error);
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);

        // Only update last login if user exists and we're mounted
        if (session?.user && mounted) {
          // updateLastLogin(session.user.id).catch(console.error);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error checking session:", error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn("Session check timed out");
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event, session?.user?.email);

      setUser(session?.user ?? null);

      // Update last login time when user signs in (debounced)
      if (event === "SIGNED_IN" && session?.user && mounted) {
        try {
          await updateLastLogin(session.user.id);
        } catch (error) {
          console.error("Error updating last login:", error);
        }
      }

      setLoading(false);
    });

    // Cleanup function
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signOut,
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
