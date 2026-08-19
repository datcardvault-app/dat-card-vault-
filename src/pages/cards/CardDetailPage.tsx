import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Tag, QrCode, Trash2, TrendingUp, Calendar } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FullSpinner } from "@/components/ui/Spinner";
import { formatCurrency, getImageUrl, generateQrValue } from "@/lib/utils";
import { toast } from "sonner";
import type { Card as CardType, Label } from "@/lib/types";

export function CardDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currency = user?.currency || "GBP";
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const { data: card, isLoading } = useQuery({
    queryKey: ["card", id],
    queryFn: async () => {
      const { data } = await supabase.from("cards").select("*").eq("id", id).maybeSingle();
      return data as CardType | null;
    },
    enabled: !!id,
  });

  const { data: labels } = useQuery({
    queryKey: ["card-labels", id],
    queryFn: async () => {
      const { data } = await supabase.from("labels").select("*").eq("card_id", id);
      return (data || []) as Label[];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (card) {
      const qrValue = generateQrValue(card.id);
      QRCode.toDataURL(qrValue, { width: 200, margin: 1, color: { dark: "#000000", light: "#ffffff" } })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [card]);

  if (isLoading || !card) return <FullSpinner />;

  const imgUrl = getImageUrl(card.image_storage_id);
  const profit = card.market_value - card.purchase_price;

  const handleDelete = async () => {
    if (!confirm("Delete this card? This cannot be undone.")) return;
    const { error } = await supabase.from("cards").delete().eq("id", card.id);
    if (error) toast.error("Failed to delete");
    else {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Card deleted");
      navigate("/cards");
    }
  };

  const handleCreateLabel = async () => {
    const labelData = {
      cardName: card.name,
      game: card.game,
      set: card.set_name,
      condition: card.condition,
      grade: card.grade,
      language: card.language,
      price: card.market_value,
      rarity: card.rarity,
      cardNumber: card.card_number,
      notes: card.notes,
    };
    const { error } = await supabase.from("labels").insert({
      user_id: user!.id,
      card_id: card.id,
      qr_value: generateQrValue(card.id),
      label_data: labelData,
      currency,
      width_mm: 56,
      height_mm: 35,
    });
    if (error) toast.error("Failed to create label");
    else {
      toast.success("Label created");
      queryClient.invalidateQueries({ queryKey: ["card-labels", id] });
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    }
  };

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-app-tertiary">
          <ArrowLeft className="w-5 h-5 text-app" />
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(`/cards/${card.id}/edit`)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="danger" size="icon" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden mb-4">
        <div className="w-full h-56 bg-app-tertiary flex items-center justify-center">
          {imgUrl ? (
            <img src={imgUrl} alt={card.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-app-muted text-sm">No image</div>
          )}
        </div>
      </Card>

      <div className="mb-4">
        <h1 className="font-display font-bold text-xl text-app">{card.name}</h1>
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          <Badge variant="primary">{card.game}</Badge>
          <Badge variant="default">{card.condition}</Badge>
          {card.grade && <Badge variant="accent">{card.grade}</Badge>}
          {card.sold && <Badge variant="success">Sold</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4">
          <p className="text-xs text-app-muted mb-1">Market Value</p>
          <p className="font-display font-bold text-xl text-app">{formatCurrency(card.market_value, currency)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-app-muted mb-1">Purchase Price</p>
          <p className="font-display font-bold text-xl text-app">{formatCurrency(card.purchase_price, currency)}</p>
        </Card>
      </div>

      {profit !== 0 && (
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${profit > 0 ? "text-success-500" : "text-error-500"}`} />
            <div>
              <p className="text-xs text-app-muted">{profit > 0 ? "Profit" : "Loss"}</p>
              <p className={`font-bold text-lg ${profit > 0 ? "text-success-500" : "text-error-500"}`}>
                {formatCurrency(Math.abs(profit), currency)}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 mb-4">
        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          {card.set_name && <div><p className="text-xs text-app-muted">Set</p><p className="text-sm text-app">{card.set_name}</p></div>}
          {card.card_number && <div><p className="text-xs text-app-muted">Card #</p><p className="text-sm text-app">{card.card_number}</p></div>}
          {card.rarity && <div><p className="text-xs text-app-muted">Rarity</p><p className="text-sm text-app">{card.rarity}</p></div>}
          {card.language && <div><p className="text-xs text-app-muted">Language</p><p className="text-sm text-app">{card.language}</p></div>}
          {card.sold_date && <div><p className="text-xs text-app-muted">Sold Date</p><p className="text-sm text-app">{card.sold_date}</p></div>}
          {card.notes && <div className="col-span-2"><p className="text-xs text-app-muted">Notes</p><p className="text-sm text-app">{card.notes}</p></div>}
        </div>
      </Card>

      {qrDataUrl && (
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-4">
            <img src={qrDataUrl} alt="QR Code" className="w-24 h-24 rounded-lg" />
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <QrCode className="w-4 h-4 text-primary-500" />
                <p className="text-sm font-medium text-app">QR Code</p>
              </div>
              <p className="text-xs text-app-muted mb-2">Scan to view this card</p>
              <Button size="sm" variant="outline" onClick={handleCreateLabel}>
                <Tag className="w-3.5 h-3.5" /> Create Label
              </Button>
            </div>
          </div>
        </Card>
      )}

      {labels && labels.length > 0 && (
        <Card className="p-4 mb-4">
          <h3 className="font-display font-semibold text-sm text-app mb-3">Labels ({labels.length})</h3>
          <div className="space-y-2">
            {labels.map((label) => (
              <div key={label.id} className="flex items-center justify-between py-2 border-b border-app last:border-0">
                <div>
                  <p className="text-sm text-app">{label.width_mm}×{label.height_mm}mm</p>
                  <p className="text-xs text-app-muted">Printed {label.print_count} times</p>
                </div>
                {label.printed && <Badge variant="success">Printed</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
