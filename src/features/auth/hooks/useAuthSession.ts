import { useAuth } from "../../../contexts/AuthContext";

export function useAuthSession() {
  const auth = useAuth();

  return {
    user: auth.user,
    loading: auth.loading,
    signIn: auth.signIn,
    signOut: auth.signOut,
  };
}
