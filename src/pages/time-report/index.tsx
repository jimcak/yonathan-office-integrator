
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type TimeReportWithProject = {
  id: string;
  date: string;
  project_id: string;
  hours_worked: number;
  description: string;
  projects: {
    name: string;
  } | null;
};

type Project = {
  id: string;
  name: string;
};

const TimeReportPage = () => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [projectId, setProjectId] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const { data: timeReports, isLoading: isLoadingReports } = useQuery({
    queryKey: ["time-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_reports")
        .select(`
          *,
          projects (
            name
          )
        `)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as TimeReportWithProject[];
    },
  });

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("status", "active");

      if (error) throw error;
      return data as Project[];
    },
  });

  const createTimeReportMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("time_reports").insert({
        employee_id: user?.id,
        date,
        project_id: projectId,
        hours_worked: Number(hoursWorked),
        description,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Time report berhasil ditambahkan");
      setIsDialogOpen(false);
      setDate(new Date().toISOString().split("T")[0]);
      setProjectId("");
      setHoursWorked("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["time-reports"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan time report");
    },
  });

  if (isLoadingReports || isLoadingProjects) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Time Report</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Time Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Time Report</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTimeReportMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium">Tanggal</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Project</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                >
                  <option value="">Pilih Project</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Jam Kerja</label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Deskripsi Pekerjaan</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={createTimeReportMutation.isPending}
                className="w-full"
              >
                {createTimeReportMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Jam Kerja</TableHead>
              <TableHead>Deskripsi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeReports?.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  {format(new Date(report.date), "dd MMMM yyyy", {
                    locale: id,
                  })}
                </TableCell>
                <TableCell>{report.projects?.name || "-"}</TableCell>
                <TableCell>{report.hours_worked} jam</TableCell>
                <TableCell>{report.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TimeReportPage;
