
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case "/dashboard":
      return "Dashboard";
    case "/employees":
      return "Karyawan";
    case "/attendance":
      return "Absensi";
    case "/time-report":
      return "Laporan Waktu";
    case "/leave-requests":
      return "Pengajuan Cuti";
    case "/loan-requests":
      return "Pengajuan Pinjaman";
    case "/clients":
      return "Klien";
    case "/audit-budget":
      return "Anggaran Audit";
    case "/invoices":
      return "Faktur";
    case "/project-profit":
      return "Profit Proyek";
    default:
      return "Dashboard";
  }
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 pl-[5rem] md:pl-[17rem]">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-700">
          {getPageTitle(location.pathname)}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/profile")}
          title={`${profile?.first_name} ${profile?.last_name}`}
        >
          <User className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
