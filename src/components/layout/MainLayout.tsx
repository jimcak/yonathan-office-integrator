
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main className="animate-fade-in pt-24 pl-24 md:pl-72">
        <div className="container mx-auto px-4 pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
