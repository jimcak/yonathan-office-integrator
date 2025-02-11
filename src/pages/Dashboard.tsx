
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardMetrics {
  totalEmployees: number;
  totalClients: number;
  totalProjects: number;
  pendingLeaveRequests: number;
  pendingLoanRequests: number;
}

const Dashboard = () => {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("super_admin");

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async (): Promise<DashboardMetrics> => {
      const [
        { count: employeeCount },
        { count: clientCount },
        { count: projectCount },
        { count: leaveRequestCount },
        { count: loanRequestCount },
      ] = await Promise.all([
        supabase.from("employees").select("*", { count: "exact" }),
        supabase.from("clients").select("*", { count: "exact" }),
        supabase.from("projects").select("*", { count: "exact" }),
        supabase.from("leave_requests").select("*", { count: "exact" }).eq("status", "pending"),
        supabase.from("loan_requests").select("*", { count: "exact" }).eq("status", "pending"),
      ]);

      return {
        totalEmployees: employeeCount || 0,
        totalClients: clientCount || 0,
        totalProjects: projectCount || 0,
        pendingLeaveRequests: leaveRequestCount || 0,
        pendingLoanRequests: loanRequestCount || 0,
      };
    },
    enabled: isSuperAdmin,
  });

  // Sample data for the chart - in a real app, this would come from the backend
  const attendanceData = [
    { date: "Mon", present: 45 },
    { date: "Tue", present: 42 },
    { date: "Wed", present: 47 },
    { date: "Thu", present: 44 },
    { date: "Fri", present: 46 },
  ];

  if (!isSuperAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Welcome!</h1>
        <p>You don't have access to view the dashboard metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-[150px]" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[100px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalEmployees}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalClients}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalProjects}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Leave Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.pendingLeaveRequests}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Loan Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.pendingLoanRequests}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="present"
                      stroke="#8884d8"
                      name="Present Employees"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
