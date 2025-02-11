
export type UserRole = "super_admin" | "admin" | "employee";

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  photo_url: string | null;
}
