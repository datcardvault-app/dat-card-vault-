import { useQuery } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FullSpinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import type { Label, Card as CardType } from "@/lib/types";

export function LabelsPage() {
  const { user } = useAuth();
  const currency = user?.currency || "GBP";
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["labels", user?.id],
    queryFn: async () => {
      const { data: labels } = await supabase
        .from("labels")
        .select("*, cards!inner(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (labels || []) as (Label & { cards: CardType })[];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!data) return;
    data.forEach((label) => {
      if (label.qr_value && !qrUrls[label.id]) {
        QRCode.toDataURL(label.qr_value, { width: 150, margin: 1, color: { dark: "#000000", light: "#ffffff" } })
          .then((url) => setQrUrls((prev) => ({ ...prev, [label.id]: url })))
          .catch(() => {});
      }
    });
  }, [data, qrUrls]);

  if (isLoading) return <FullSpinner />;

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display font-bold text-xl text-app mb-1">Price Labels</h1>
      <p className="text-sm text-app-muted mb-4">QR labels you've created for your cards</p>

      {(!data || data.length === 0) ? (
        <EmptyState
          icon={<Tag className="w-8 h-8" />}
          title="No labels yet"
          description="Go to a card's detail page and tap 'Create Label' to make a QR price label."
        />
      ) : (
        <div className="space-y-3">
          {data.map((label) => {
            const card = label.cards;
            const labelData = label.label_data as Record<string, unknown>;
            return (
              <Card key={label.id} className="p-4">
                <div className="flex items-start gap-4">
                  {qrUrls[label.id] && <img src={qrUrls[label.id]} alt="QR" className="w-20 h-20 rounded-lg flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-app">{(labelData.cardName as string) || card?.name || "Unknown"}</p>
                    <p className="text-xs text-app-muted">{(labelData.game as string) || card?.game}</p>
                    <p className="font-display font-bold text-lg text-app mt-1">
                      {formatCurrency((labelData.price as number) || card?.market_value || 0, currency)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="default">{label.width_mm}×{label.height_mm}mm</Badge>
                      {label.printed && <Badge variant="success">Printed</Badge>}
                      <span className="text-xs text-app-muted">×{label.print_count}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
