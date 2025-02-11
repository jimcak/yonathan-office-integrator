
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<div>Dashboard Coming Soon</div>} />
            <Route path="employees" element={<div>Employees Coming Soon</div>} />
            <Route path="attendance" element={<div>Attendance Coming Soon</div>} />
            <Route path="time-report" element={<div>Time Report Coming Soon</div>} />
            <Route path="leave-requests" element={<div>Leave Requests Coming Soon</div>} />
            <Route path="loan-requests" element={<div>Loan Requests Coming Soon</div>} />
            <Route path="clients" element={<div>Clients Coming Soon</div>} />
            <Route path="audit-budget" element={<div>Audit Budget Coming Soon</div>} />
            <Route path="invoices" element={<div>Invoices Coming Soon</div>} />
            <Route path="project-profit" element={<div>Project Profit Coming Soon</div>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
