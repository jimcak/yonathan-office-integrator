
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    // Log untuk debugging
    console.log("ProtectedRoute: ", { user, isLoading });

    // Tampilkan pesan timeout setelah 5 detik loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setShowTimeout(true);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto mb-2" />
          <p className="text-gray-600">
            {showTimeout
              ? "Memuat lebih lama dari biasanya... Mohon tunggu sebentar."
              : "Memuat..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("ProtectedRoute: Redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
