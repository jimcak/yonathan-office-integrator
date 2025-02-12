import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserRole } from "@/types/auth";
import { toast } from "sonner";

interface AuthState {
  user: {
    id: string;
    email: string;
  } | null;
  profile: UserProfile | null;
  roles: UserRole[];
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    roles: [],
    isLoading: true,
  });

  // Memoize fetchUserData untuk menghindari re-render yang tidak perlu
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      console.log("Fetching user data for ID:", userId);
      
      // Gunakan Promise.all untuk fetch profile dan roles secara parallel
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
      ]);

      if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error);
        return { profile: null, roles: [] };
      }

      if (rolesResult.error) {
        console.error("Error fetching roles:", rolesResult.error);
        return { profile: profileResult.data, roles: [] };
      }

      const roles = rolesResult.data?.map((r) => r.role as UserRole) || [];
      return { profile: profileResult.data, roles };
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      return { profile: null, roles: [] };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    const initializeAuth = async () => {
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
        
        if (sessionError) {
          throw sessionError;
        }

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

            // Hanya redirect ke dashboard jika user berada di halaman login
            if (location.pathname === '/login') {
              navigate('/dashboard');
            }
          }
        } else {
          if (isMounted) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
            // Redirect ke login jika tidak ada session dan bukan di halaman login
            if (location.pathname !== '/login') {
              navigate('/login');
            }
          }
        }
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        retryCount++;
        
        if (isMounted) {
          // Jika masih ada retry tersisa, coba lagi setelah delay
          if (retryCount < MAX_RETRIES) {
            console.log("Retrying in", RETRY_DELAY, "ms...");
            setTimeout(initializeAuth, RETRY_DELAY);
          } else {
            setAuthState(prev => ({ ...prev, isLoading: false }));
            toast.error("Terjadi kesalahan saat memuat data");
          }
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
          setAuthState({
            user: null,
            profile: null,
            roles: [],
            isLoading: false,
          });
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
  }, [navigate, location.pathname, fetchUserData]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(error.message || "Error saat login");
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("Email sudah terdaftar. Silakan login.");
        } else {
          toast.error(error.message || "Error saat mendaftar");
        }
        throw error;
      }
      toast.success("Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.");
    } catch (error: any) {
      console.error("Sign up error:", error);
      if (!error.message.includes("User already registered")) {
        toast.error(error.message || "Error saat mendaftar");
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Error saat logout");
      throw error;
    }
  };

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
