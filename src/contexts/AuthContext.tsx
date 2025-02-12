
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

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (roleError) {
        console.error("Error fetching roles:", roleError);
        return { profile, roles: [] };
      }

      const roles = roleData?.map((r) => r.role as UserRole) || [];
      console.log("Fetched user data:", { profile, roles });
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

        console.log("Session state:", { session });
        
        if (session?.user && isMounted) {
          console.log("User found in session, fetching additional data...");
          const { profile, roles } = await fetchUserData(session.user.id);
          
          if (isMounted) {
            console.log("Setting auth state with fetched data");
            setAuthState({
              user: {
                id: session.user.id,
                email: session.user.email!,
              },
              profile,
              roles,
              isLoading: false,
            });
          }
          
          if (location.pathname === '/login') {
            console.log("Redirecting from login to dashboard");
            navigate('/dashboard');
          }
        } else if (isMounted) {
          console.log("No session found, setting isLoading to false");
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        if (isMounted) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", { event, session });
      
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        console.log("User signed in, fetching user data...");
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
        console.log("User signed out, clearing auth state");
        setAuthState({
          user: null,
          profile: null,
          roles: [],
          isLoading: false,
        });
        navigate('/login');
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
