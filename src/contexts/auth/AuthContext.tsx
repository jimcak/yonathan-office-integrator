
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthContextType, AuthState } from "./types";
import { useUserData } from "./useUserData";
import { signIn, signOut, signUp } from "./authActions";
import { UserRole } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INITIAL_STATE: AuthState = {
  user: null,
  profile: null,
  roles: [],
  isLoading: true,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authState, setAuthState] = useState<AuthState>(INITIAL_STATE);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const fetchUserData = useUserData();

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 2000; // Increased to 2 seconds

    const initializeAuth = async () => {
      if (!isMounted || initializationAttempted) return;

      try {
        if (retryCount >= MAX_RETRIES) {
          console.error("Max retries reached, stopping auth initialization");
          if (isMounted) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
            toast.error("Gagal memuat data. Silakan refresh halaman.");
          }
          return;
        }

        console.log("Initializing auth... (attempt", retryCount + 1, "of", MAX_RETRIES, ")");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (!isMounted) return;

        if (session?.user) {
          const { profile, roles } = await fetchUserData(session.user.id);
          
          if (isMounted) {
            setAuthState({
              user: {
                id: session.user.id,
                email: session.user.email!,
              },
              profile,
              roles,
              isLoading: false,
            });

            if (location.pathname === '/login') {
              navigate('/dashboard');
            }
          }
        } else {
          if (isMounted) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
            if (location.pathname !== '/login') {
              navigate('/login');
            }
          }
        }

        setInitializationAttempted(true);
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        retryCount++;
        
        if (isMounted && retryCount < MAX_RETRIES) {
          console.log("Retrying in", RETRY_DELAY, "ms...");
          setTimeout(initializeAuth, RETRY_DELAY);
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          setInitializationAttempted(true);
          toast.error("Terjadi kesalahan saat memuat data");
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (!isMounted) return;

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          const { profile, roles } = await fetchUserData(session.user.id);
          
          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email!,
            },
            profile,
            roles,
            isLoading: false,
          });
          
          navigate('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          setAuthState(INITIAL_STATE);
          setAuthState(prev => ({ ...prev, isLoading: false }));
          navigate('/login');
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
        toast.error("Terjadi kesalahan saat memproses autentikasi");
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => {
      console.log("Cleaning up auth effect");
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, fetchUserData, initializationAttempted]);

  const hasRole = (role: UserRole) => {
    return authState.roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signUp,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
