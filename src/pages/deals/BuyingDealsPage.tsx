import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ShoppingBag, Trash2, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FullSpinner } from "@/components/ui/Spinner";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { toast } from "sonner";
import type { BuyingDeal } from "@/lib/types";

export function BuyingDealsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currency = user?.currency || "GBP";
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [cardCount, setCardCount] = useState("1");
  const [cardPrice, setCardPrice] = useState("");
  const [pct, setPct] = useState("80");
  const [note, setNote] = useState("");

  const { data: deals, isLoading } = useQuery({
    queryKey: ["deals", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("buying_deals")
        .select("*")
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .order("date", { ascending: false });
      return (data || []) as BuyingDeal[];
    },
    enabled: !!user?.id,
  });

  const calculatedAmountPaid = ((parseFloat(cardPrice) || 0) * (parseFloat(pct) || 0)) / 100;
  const calculatedYouKeep = (parseFloat(cardPrice) || 0) - calculatedAmountPaid;

  const handleSave = async () => {
    const price = parseFloat(cardPrice) || 0;
    const percentage = parseFloat(pct) || 0;
    const count = parseInt(cardCount) || 1;
    if (price <= 0) { toast.error("Enter a card price"); return; }
    setSaving(true);

    const { error } = await supabase.from("buying_deals").insert({
      user_id: user!.id,
      card_count: count,
      card_price: price,
      amount_paid: (price * percentage) / 100,
      pct: percentage,
      you_keep: price - (price * percentage) / 100,
      note: note.trim() || null,
      date: new Date().toISOString().split("T")[0],
      at: new Date().toISOString(),
    });
    if (error) toast.error("Failed to add deal");
    else {
      toast.success("Deal added");
      setModalOpen(false);
      setCardCount("1"); setCardPrice(""); setPct("80"); setNote("");
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this deal?")) return;
    const { error } = await supabase.from("buying_deals").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["deals"] }); }
  };

  if (isLoading) return <FullSpinner />;

  const totalKeep = (deals || []).reduce((sum, d) => sum + d.you_keep, 0);
  const totalPaid = (deals || []).reduce((sum, d) => sum + d.amount_paid, 0);

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display font-bold text-xl text-app">Buying Deals</h1>
          <p className="text-sm text-app-muted">Consignment and buying tracking</p>
        </div>
        <Button size="icon" onClick={() => setModalOpen(true)}><Plus className="w-5 h-5" /></Button>
      </div>

      {deals && deals.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-4">
            <p className="text-xs text-app-muted mb-1">Total Paid Out</p>
            <p className="font-display font-bold text-xl text-app">{formatCurrency(totalPaid, currency)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-app-muted mb-1">You Keep</p>
            <p className="font-display font-bold text-xl text-success-500">{formatCurrency(totalKeep, currency)}</p>
          </Card>
        </div>
      )}

      {(!deals || deals.length === 0) ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="No deals yet"
          description="Track consignment deals and profit splits when buying cards from others."
          action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Deal</Button>}
        />
      ) : (
        <div className="space-y-2">
          {deals.map((deal) => (
            <Card key={deal.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-app-muted">{formatShortDate(deal.date)}</span>
                    <Badge variant="default">{deal.card_count} card{deal.card_count > 1 ? "s" : ""}</Badge>
                  </div>
                  {deal.note && <p className="text-sm text-app mb-1">{deal.note}</p>}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-app-muted">Value: {formatCurrency(deal.card_price, currency)}</span>
                    <span className="text-app-muted">Paid: {formatCurrency(deal.amount_paid, currency)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-success-500" />
                    <p className="font-semibold text-sm text-success-500">{formatCurrency(deal.you_keep, currency)}</p>
                  </div>
                  <p className="text-xs text-app-muted">{deal.pct}% split</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="mt-1" onClick={() => handleDelete(deal.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Buying Deal">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Card Count" type="number" value={cardCount} onChange={(e) => setCardCount(e.target.value)} />
            <Input label="Card Price" type="number" value={cardPrice} onChange={(e) => setCardPrice(e.target.value)} placeholder="0.00" />
          </div>
          <Input label="Your Percentage" type="number" value={pct} onChange={(e) => setPct(e.target.value)} placeholder="80" />
          <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Optional note..." />

          {parseFloat(cardPrice) > 0 && (
            <Card className="p-3 bg-app-tertiary">
              <div className="flex justify-between text-sm">
                <span className="text-app-muted">You pay seller:</span>
                <span className="font-medium text-app">{formatCurrency(calculatedAmountPaid, currency)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-app-muted">You keep:</span>
                <span className="font-bold text-success-500">{formatCurrency(calculatedYouKeep, currency)}</span>
              </div>
            </Card>
          )}

          <Button size="lg" className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Add Deal"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
