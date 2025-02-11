
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const roles = roleData?.map((r) => r.role as UserRole) || [];

      return { profile, roles };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { profile: null, roles: [] };
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id).then(({ profile, roles }) => {
          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email!,
            },
            profile,
            roles,
            isLoading: false,
          });
          
          // Redirect to dashboard if on login page
          if (location.pathname === '/login') {
            navigate('/dashboard');
          }
        });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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
    });

    return () => {
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
