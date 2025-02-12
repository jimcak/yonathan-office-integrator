
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

// Implementasi simple rate limiting
const createRateLimiter = (maxRequests: number, timeWindow: number) => {
  let requests: number[] = [];
  
  return () => {
    const now = Date.now();
    requests = requests.filter(time => now - time < timeWindow);
    
    if (requests.length >= maxRequests) {
      return false;
    }
    
    requests.push(now);
    return true;
  };
};

const rateLimiter = createRateLimiter(5, 1000); // 5 requests per second

export const useUserData = () => {
  return useCallback(async (userId: string) => {
    try {
      if (!rateLimiter()) {
        console.warn("Rate limit exceeded, delaying request...");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log("Fetching user data for ID:", userId);
      
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
};
