
import { createContext, useContext, useEffect, useState } from "react";
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

  const fetchUserData = async (userId: string) => {
    try {
      console.log("Fetching user data for ID:", userId);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return { profile: null, roles: [] };
      }

      console.log("Profile fetched successfully:", profile);

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (roleError) {
        console.error("Error fetching roles:", roleError);
        return { profile, roles: [] };
      }

      console.log("Roles fetched successfully:", roleData);

      const roles = roleData?.map((r) => r.role as UserRole) || [];
      return { profile, roles };
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      return { profile: null, roles: [] };
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          if (isMounted) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
          return;
        }

        if (!isMounted) return;

        if (session?.user) {
          console.log("Session found, user:", session.user.email);
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
          console.log("No session found");
          if (isMounted) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        if (isMounted) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
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
          console.log("User signed in:", session.user.email);
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
          console.log("User signed out");
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
  }, [navigate, location.pathname]);

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
