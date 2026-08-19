import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Package, CreditCard, Tag, Calendar, ShoppingBag, ArrowRight, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FullSpinner } from "@/components/ui/Spinner";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import type { Card as CardType, ScanLog, EarningsSnapshot } from "@/lib/types";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currency = user?.currency || "GBP";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      const [cardsRes, scansRes, snapshotsRes, dealsRes] = await Promise.all([
        supabase.from("cards").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("scan_logs").select("*").eq("user_id", user!.id).order("scanned_at", { ascending: false }).limit(5),
        supabase.from("earnings_snapshots").select("*").eq("user_id", user!.id).order("date", { ascending: false }).limit(7),
        supabase.from("buying_deals").select("*").eq("user_id", user!.id).is("deleted_at", null).order("date", { ascending: false }).limit(5),
      ]);

      const cards = (cardsRes.data || []) as CardType[];
      const scans = (scansRes.data || []) as ScanLog[];
      const snapshots = (snapshotsRes.data || []) as EarningsSnapshot[];
      const deals = dealsRes.data || [];

      const inventoryValue = cards.filter(c => !c.sold).reduce((sum, c) => sum + (c.market_value || 0), 0);
      const totalCards = cards.length;
      const unsoldCards = cards.filter(c => !c.sold).length;
      const totalScans = scans.length;
      const weekEarned = snapshots.reduce((sum, s) => sum + (s.total_earned), 0);

      return { cards, scans, snapshots, deals, inventoryValue, totalCards, unsoldCards, totalScans, weekEarned };
    },
    enabled: !!user?.id,
  });

  if (isLoading || !data) return <FullSpinner />;

  const recentCards = data.cards.slice(0, 4);
  const today = new Date();
  const targetProgress = user?.sale_target ? Math.min(100, (data.weekEarned / user.sale_target) * 100) : 0;

  const quickActions = [
    { label: "Add Card", icon: CreditCard, path: "/cards/add", color: "bg-primary-600" },
    { label: "Scan", icon: Package, path: "/scan", color: "bg-accent-600" },
    { label: "Labels", icon: Tag, path: "/labels", color: "bg-success-600" },
    { label: "Deals", icon: ShoppingBag, path: "/deals", color: "bg-warning-600" },
    { label: "Calendar", icon: Calendar, path: "/calendar", color: "bg-primary-800" },
  ];

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-app-muted">Welcome back</p>
          <h1 className="font-display font-bold text-xl text-app">
            {user?.business_name || user?.name || "Vendor"}
          </h1>
        </div>
        {user?.event_active && (
          <Badge variant="success">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 mr-1.5 animate-pulse" />
            Event Live
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-success-500" />
            <span className="text-xs text-app-muted">Inventory Value</span>
          </div>
          <p className="font-display font-bold text-2xl text-app">
            {formatCurrency(data.inventoryValue, currency)}
          </p>
          <p className="text-xs text-app-muted mt-0.5">{data.unsoldCards} cards in stock</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-primary-500" />
            <span className="text-xs text-app-muted">Total Cards</span>
          </div>
          <p className="font-display font-bold text-2xl text-app">{data.totalCards}</p>
          <p className="text-xs text-app-muted mt-0.5">{data.totalScans} scans total</p>
        </Card>
      </div>

      {user?.sale_target && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-app">Weekly Target</span>
            </div>
            <span className="text-sm text-app-muted">
              {formatCurrency(data.weekEarned, currency)} / {formatCurrency(user.sale_target, currency)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-app-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-600 transition-all duration-500"
              style={{ width: `${targetProgress}%` }}
            />
          </div>
        </Card>
      )}

      <h2 className="font-display font-semibold text-sm text-app-secondary mb-3">Quick Actions</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 -mx-4 px-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center shadow-md transition-transform active:scale-95`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-app-secondary">{action.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-sm text-app-secondary">Recent Cards</h2>
        <button onClick={() => navigate("/cards")} className="text-xs text-primary-500 flex items-center gap-0.5">
          View All <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {recentCards.length === 0 ? (
        <Card className="p-6 text-center">
          <CreditCard className="w-8 h-8 text-app-muted mx-auto mb-2" />
          <p className="text-sm text-app-muted">No cards yet. Add your first card!</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {recentCards.map((card) => (
            <Card
              key={card.id}
              className="p-3 flex items-center gap-3 cursor-pointer hover:bg-card-hover transition-colors"
              onClick={() => navigate(`/cards/${card.id}`)}
            >
              <div className="w-12 h-12 rounded-lg bg-app-tertiary flex items-center justify-center flex-shrink-0">
                {card.image_storage_id ? (
                  <img
                    src={`https://${import.meta.env.VITE_SUPABASE_URL.replace("https://", "")}/storage/v1/object/public/cards/${card.image_storage_id}`}
                    alt={card.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <CreditCard className="w-5 h-5 text-app-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-app truncate">{card.name}</p>
                <p className="text-xs text-app-muted">{card.game} · {card.condition}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm text-app">{formatCurrency(card.market_value, currency)}</p>
                {card.sold && <Badge variant="success" className="mt-0.5">Sold</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {data.scans.length > 0 && (
        <>
          <h2 className="font-display font-semibold text-sm text-app-secondary mb-3 mt-6">Recent Scans</h2>
          <Card className="p-3">
            {data.scans.map((scan, i) => (
              <div
                key={scan.id}
                className={`flex items-center gap-3 py-2 ${i !== data.scans.length - 1 ? "border-b border-app" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg bg-primary-600/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-app truncate">{scan.qr_value?.replace("datcardvault://card/", "") || "Unknown"}</p>
                  <p className="text-xs text-app-muted">{formatShortDate(scan.scanned_at)}</p>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
