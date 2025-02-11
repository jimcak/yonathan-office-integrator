
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Users,
  ClipboardList,
  Clock,
  Calendar,
  CreditCard,
  Building2,
  Calculator,
  FileText,
  PieChart,
  Menu,
  X,
} from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { icon: Users, label: "Karyawan", path: "/employees" },
    { icon: ClipboardList, label: "Absensi", path: "/attendance" },
    { icon: Clock, label: "Time Report", path: "/time-report" },
    { icon: Calendar, label: "Pengajuan Cuti", path: "/leave-requests" },
    { icon: CreditCard, label: "Pengajuan Pinjaman", path: "/loan-requests" },
    { icon: Building2, label: "Database Klien", path: "/clients" },
    { icon: Calculator, label: "Budget Audit", path: "/audit-budget" },
    { icon: FileText, label: "Invoice", path: "/invoices" },
    { icon: PieChart, label: "Laba Rugi Project", path: "/project-profit" },
  ];

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-20 h-full bg-white shadow-lg transition-all duration-300",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-4 rounded-full bg-brand-600 p-1 text-white shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="flex h-16 items-center justify-center border-b">
        <h1
          className={cn(
            "text-xl font-bold text-brand-700 transition-all duration-300",
            isOpen ? "block" : "hidden"
          )}
        >
          KAP Yonathan
        </h1>
      </div>

      <nav className="mt-6 px-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "mb-2 flex items-center rounded-lg p-3 transition-all duration-200",
              location.pathname === item.path
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50",
              !isOpen && "justify-center"
            )}
          >
            <item.icon size={20} />
            <span
              className={cn(
                "ml-3 transition-all duration-300",
                isOpen ? "block" : "hidden"
              )}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
