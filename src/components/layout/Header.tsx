
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed left-0 right-0 top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 pl-[5rem] md:pl-[17rem]">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-700">
          Dashboard
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/profile")}
        >
          <User className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            // Handle logout
          }}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
