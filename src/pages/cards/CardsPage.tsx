import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, CreditCard, ListFilter as Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { FullSpinner } from "@/components/ui/Spinner";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { GAMES, CONDITIONS } from "@/lib/types";
import type { Card as CardType } from "@/lib/types";

export function CardsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currency = user?.currency || "GBP";
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: cards, isLoading } = useQuery({
    queryKey: ["cards", user?.id, search, gameFilter, conditionFilter],
    queryFn: async () => {
      let q = supabase.from("cards").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (search) q = q.ilike("name", `%${search}%`);
      if (gameFilter) q = q.eq("game", gameFilter);
      if (conditionFilter) q = q.eq("condition", conditionFilter);
      const { data } = await q;
      return (data || []) as CardType[];
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <FullSpinner />;

  const inventoryValue = (cards || []).filter(c => !c.sold).reduce((sum, c) => sum + c.market_value, 0);

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display font-bold text-xl text-app">My Cards</h1>
          <p className="text-sm text-app-muted">{cards?.length || 0} cards · {formatCurrency(inventoryValue, currency)} value</p>
        </div>
        <Button size="icon" onClick={() => navigate("/cards/add")}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <Input
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-5 h-5" />
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-2 mb-4 animate-slide-up">
          <Select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}>
            <option value="">All Games</option>
            {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
          <Select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)}>
            <option value="">All Conditions</option>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      )}

      {(!cards || cards.length === 0) ? (
        <EmptyState
          icon={<CreditCard className="w-8 h-8" />}
          title="No cards yet"
          description="Add your first trading card to start building your inventory."
          action={<Button onClick={() => navigate("/cards/add")}>
            <Plus className="w-4 h-4" /> Add Card
          </Button>}
        />
      ) : (
        <div className="space-y-2">
          {cards.map((card) => {
            const imgUrl = getImageUrl(card.image_storage_id);
            return (
              <Card
                key={card.id}
                className="p-3 flex items-center gap-3 cursor-pointer hover:bg-card-hover transition-colors"
                onClick={() => navigate(`/cards/${card.id}`)}
              >
                <div className="w-14 h-14 rounded-lg bg-app-tertiary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {imgUrl ? (
                    <img src={imgUrl} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <CreditCard className="w-6 h-6 text-app-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-app truncate">{card.name}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-app-muted">{card.game}</span>
                    {card.set_name && <span className="text-xs text-app-muted">· {card.set_name}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="default">{card.condition}</Badge>
                    {card.grade && <Badge variant="accent">{card.grade}</Badge>}
                    {card.sold && <Badge variant="success">Sold</Badge>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-sm text-app">{formatCurrency(card.market_value, currency)}</p>
                  {card.purchase_price > 0 && (
                    <p className="text-xs text-app-muted">cost {formatCurrency(card.purchase_price, currency)}</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
