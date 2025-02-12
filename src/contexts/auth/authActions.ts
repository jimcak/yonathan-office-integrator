
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const signIn = async (email: string, password: string) => {
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

export const signUp = async (
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

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: any) {
    console.error("Sign out error:", error);
    toast.error(error.message || "Error saat logout");
    throw error;
  }
};
