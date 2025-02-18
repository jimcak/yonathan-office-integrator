
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarClock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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

type Attendance = {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  notes: string | null;
};

const AttendancePage = () => {
  const { user } = useAuth();
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const queryClient = useQueryClient();

  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as Attendance[];
    },
  });

  const { data: todayAttendance } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", today)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as Attendance | null;
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async () => {
      setIsClockingIn(true);
      const now = new Date().toISOString();
      const today = now.split("T")[0];

      const { error } = await supabase.from("attendance").insert({
        employee_id: user?.id,
        date: today,
        clock_in: now,
        status: "present",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Berhasil clock in");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal clock in");
    },
    onSettled: () => {
      setIsClockingIn(false);
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      setIsClockingOut(true);
      const now = new Date().toISOString();

      if (!todayAttendance?.id) throw new Error("Belum clock in hari ini");

      const { error } = await supabase
        .from("attendance")
        .update({
          clock_out: now,
        })
        .eq("id", todayAttendance.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Berhasil clock out");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal clock out");
    },
    onSettled: () => {
      setIsClockingOut(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Absensi</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => clockInMutation.mutate()}
            disabled={isClockingIn || todayAttendance?.clock_in !== null}
          >
            {isClockingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CalendarClock className="mr-2 h-4 w-4" />
            Clock In
          </Button>
          <Button
            onClick={() => clockOutMutation.mutate()}
            disabled={
              isClockingOut ||
              !todayAttendance?.clock_in ||
              todayAttendance?.clock_out !== null
            }
          >
            {isClockingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CalendarClock className="mr-2 h-4 w-4" />
            Clock Out
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceRecords?.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {format(new Date(record.date), "dd MMMM yyyy", {
                    locale: id,
                  })}
                </TableCell>
                <TableCell>
                  {record.clock_in
                    ? format(new Date(record.clock_in), "HH:mm", {
                        locale: id,
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  {record.clock_out
                    ? format(new Date(record.clock_out), "HH:mm", {
                        locale: id,
                      })
                    : "-"}
                </TableCell>
                <TableCell>{record.status}</TableCell>
                <TableCell>{record.notes || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AttendancePage;
