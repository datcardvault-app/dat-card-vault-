import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { FullSpinner } from "@/components/ui/Spinner";
import { formatShortDate } from "@/lib/utils";
import { toast } from "sonner";
import type { CalendarNote } from "@/lib/types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startDate = new Date(year, month, 1);
  const startDay = (startDate.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const { data: notes, isLoading } = useQuery({
    queryKey: ["calendar-notes", user?.id, year, month],
    queryFn: async () => {
      const start = new Date(year, month, 1).toISOString().split("T")[0];
      const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
      const { data } = await supabase
        .from("calendar_notes")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true });
      return (data || []) as CalendarNote[];
    },
    enabled: !!user?.id,
  });

  const notesByDate: Record<string, CalendarNote[]> = {};
  (notes || []).forEach((n) => {
    if (!notesByDate[n.date]) notesByDate[n.date] = [];
    notesByDate[n.date].push(n);
  });

  const dateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const handleAddNote = async () => {
    if (!selectedDate || !noteText.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("calendar_notes").insert({
      user_id: user!.id,
      date: selectedDate,
      note: noteText.trim(),
    });
    if (error) toast.error("Failed to add note");
    else {
      toast.success("Note added");
      setNoteText("");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["calendar-notes"] });
    }
    setSaving(false);
  };

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase.from("calendar_notes").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else queryClient.invalidateQueries({ queryKey: ["calendar-notes"] });
  };

  if (isLoading) return <FullSpinner />;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display font-bold text-xl text-app mb-4">Calendar</h1>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-app-tertiary">
          <ChevronLeft className="w-5 h-5 text-app" />
        </button>
        <p className="font-display font-semibold text-app">{MONTHS[month]} {year}</p>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-app-tertiary">
          <ChevronRight className="w-5 h-5 text-app" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d) => <div key={d} className="text-center text-xs text-app-muted font-medium">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const ds = dateStr(day);
          const hasNotes = !!notesByDate[ds];
          const isToday = ds === todayStr;
          return (
            <button
              key={day}
              onClick={() => { setSelectedDate(ds); setModalOpen(true); }}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors ${
                isToday ? "bg-primary-600 text-white" : hasNotes ? "bg-primary-600/10 text-app" : "hover:bg-app-tertiary text-app"
              }`}
            >
              <span className="font-medium">{day}</span>
              {hasNotes && !isToday && <span className="w-1 h-1 rounded-full bg-primary-500 mt-0.5" />}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <h2 className="font-display font-semibold text-sm text-app-secondary mb-3">Upcoming Notes</h2>
        {(!notes || notes.length === 0) ? (
          <EmptyState icon={<CalIcon className="w-8 h-8" />} title="No notes this month" description="Tap a date to add a note or event." />
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <Card key={n.id} className="p-3 flex items-start justify-between">
                <div>
                  <p className="text-xs text-primary-500 font-medium mb-0.5">{formatShortDate(n.date)}</p>
                  <p className="text-sm text-app">{n.note}</p>
                </div>
                <button onClick={() => handleDeleteNote(n.id)} className="p-1 text-app-muted hover:text-error-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setNoteText(""); }} title={selectedDate ? formatShortDate(selectedDate) : ""}>
        <div className="space-y-4">
          <Textarea label="Note" value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} placeholder="e.g. Bristol card show" autoFocus />
          <Button size="lg" className="w-full" onClick={handleAddNote} disabled={saving || !noteText.trim()}>
            {saving ? "Saving..." : "Add Note"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
