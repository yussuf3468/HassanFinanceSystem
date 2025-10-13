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

  // Simplified last login update with error handling
  async function updateLastLogin(_userId: string) {
    // no-op in this build
    return;
  }

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    // Initialize auth with timeout protection
    const initAuth = async () => {
      try {
        // Set a hard timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn(
              "Auth initialization timeout - continuing without session"
            );
            setLoading(false);
          }
        }, 5000); // Reduced to 5 seconds

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        clearTimeout(timeoutId); // Clear timeout on successful response

        if (!mounted) return;

        if (error) {
          console.error("Session error:", error);
          setUser(null);
        } else {
          setUser(session?.user ?? null);

          // Update last login in background (non-blocking)
          if (session?.user) {
            updateLastLogin(session.user.id).catch(() => {
              // Ignore errors silently
            });
          }
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

    // Setup auth state listener
    const setupAuthListener = () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        console.log("Auth event:", event);

        try {
          setUser(session?.user ?? null);

          // Update last login in background for sign-in events
          if (event === "SIGNED_IN" && session?.user) {
            updateLastLogin(session.user.id).catch(() => {
              // Ignore errors silently
            });
          }
        } catch (error) {
          console.error("Error handling auth state change:", error);
        }

        setLoading(false);
      });

      authSubscription = subscription;
    };

    // Initialize everything
    initAuth();
    setupAuthListener();

    // Cleanup
    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
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
