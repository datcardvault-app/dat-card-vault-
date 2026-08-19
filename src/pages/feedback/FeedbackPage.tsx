import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FullSpinner } from "@/components/ui/Spinner";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import type { Feedback } from "@/lib/types";

export function FeedbackPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [type, setType] = useState<"positive" | "negative">("positive");
  const [message, setMessage] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const { data: feedback, isLoading } = useQuery({
    queryKey: ["feedback", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("feedback")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data || []) as Feedback[];
    },
    enabled: !!user?.id,
  });

  const handleSubmit = async () => {
    if (!message.trim()) { toast.error("Please enter a message"); return; }
    setSaving(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user!.id,
      name: name.trim() || null,
      message: message.trim(),
      type,
      approved: false,
    });
    if (error) toast.error("Failed to submit feedback");
    else {
      toast.success("Feedback submitted! Thank you.");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    }
    setSaving(false);
  };

  if (isLoading) return <FullSpinner />;

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display font-bold text-xl text-app mb-1">Feedback</h1>
      <p className="text-sm text-app-muted mb-4">Share your thoughts about DatCARDVault</p>

      <Card className="p-4 mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setType("positive")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${type === "positive" ? "bg-success-500 text-white" : "bg-app-tertiary text-app-secondary"}`}
          >
            <ThumbsUp className="w-4 h-4" /> Positive
          </button>
          <button
            onClick={() => setType("negative")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${type === "negative" ? "bg-error-500 text-white" : "bg-app-tertiary text-app-secondary"}`}
          >
            <ThumbsDown className="w-4 h-4" /> Negative
          </button>
        </div>
        <Input label="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mb-3" />
        <Textarea label="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Tell us what you think..." className="mb-3" />
        <Button size="lg" className="w-full" onClick={handleSubmit} disabled={saving}>
          {saving ? "Submitting..." : <><Send className="w-4 h-4" /> Submit Feedback</>}
        </Button>
      </Card>

      <h2 className="font-display font-semibold text-sm text-app-secondary mb-3">Your Previous Feedback</h2>
      {(!feedback || feedback.length === 0) ? (
        <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="No feedback yet" description="Your submitted feedback will appear here." />
      ) : (
        <div className="space-y-2">
          {feedback.map((f) => (
            <Card key={f.id} className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={f.type === "positive" ? "success" : "error"}>{f.type}</Badge>
                {f.approved ? <Badge variant="primary">Approved</Badge> : <Badge variant="default">Pending</Badge>}
                <span className="text-xs text-app-muted ml-auto">{timeAgo(f.created_at)}</span>
              </div>
              <p className="text-sm text-app">{f.message}</p>
              {f.name && <p className="text-xs text-app-muted mt-1">— {f.name}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
