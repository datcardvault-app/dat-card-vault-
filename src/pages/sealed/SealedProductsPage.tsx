import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FullSpinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import { GAMES, SEALED_TYPES } from "@/lib/types";
import { toast } from "sonner";
import type { SealedProduct } from "@/lib/types";

export function SealedProductsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currency = user?.currency || "GBP";
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [game, setGame] = useState("Pokémon");
  const [type, setType] = useState("Booster Pack");
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["sealed", user?.id, search],
    queryFn: async () => {
      let q = supabase.from("sealed_products").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (search) q = q.ilike("name", `%${search}%`);
      const { data } = await q;
      return (data || []) as SealedProduct[];
    },
    enabled: !!user?.id,
  });

  const resetForm = () => {
    setName(""); setGame("Pokémon"); setType("Booster Pack"); setBarcode("");
    setQuantity("1"); setPurchasePrice(""); setSellPrice(""); setEditId(null);
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };

  const openEdit = (p: SealedProduct) => {
    setEditId(p.id); setName(p.name); setGame(p.game); setType(p.type);
    setBarcode(p.barcode || ""); setQuantity(p.quantity.toString());
    setPurchasePrice(p.purchase_price.toString()); setSellPrice(p.sell_price.toString());
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = {
      user_id: user!.id,
      name: name.trim(),
      game,
      type,
      barcode: barcode.trim() || null,
      quantity: parseInt(quantity) || 1,
      purchase_price: parseFloat(purchasePrice) || 0,
      sell_price: parseFloat(sellPrice) || 0,
    };
    if (editId) {
      const { error } = await supabase.from("sealed_products").update(payload).eq("id", editId);
      if (error) toast.error("Failed to update");
      else toast.success("Product updated");
    } else {
      const { error } = await supabase.from("sealed_products").insert(payload);
      if (error) toast.error("Failed to add product");
      else toast.success("Product added");
    }
    setSaving(false);
    setModalOpen(false);
    resetForm();
    queryClient.invalidateQueries({ queryKey: ["sealed"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("sealed_products").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["sealed"] }); }
  };

  if (isLoading) return <FullSpinner />;

  const totalValue = (products || []).reduce((sum, p) => sum + p.sell_price * p.quantity, 0);

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display font-bold text-xl text-app">Sealed Products</h1>
          <p className="text-sm text-app-muted">{products?.length || 0} items · {formatCurrency(totalValue, currency)} value</p>
        </div>
        <Button size="icon" onClick={openAdd}><Plus className="w-5 h-5" /></Button>
      </div>

      <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4" />

      {(!products || products.length === 0) ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No sealed products"
          description="Add booster packs, boxes, and other sealed TCG products."
          action={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Product</Button>}
        />
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <Card key={p.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-app truncate">{p.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="primary">{p.game}</Badge>
                    <Badge variant="default">{p.type}</Badge>
                    <span className="text-xs text-app-muted">Qty: {p.quantity}</span>
                  </div>
                  {p.barcode && <p className="text-xs text-app-muted mt-1">Barcode: {p.barcode}</p>}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-app">{formatCurrency(p.sell_price, currency)}</p>
                  {p.purchase_price > 0 && <p className="text-xs text-app-muted">cost {formatCurrency(p.purchase_price, currency)}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /> Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editId ? "Edit Product" : "Add Product"}>
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Scarlet & Violet Booster Box" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Game" value={game} onChange={(e) => setGame(e.target.value)}>
              {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
            <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
              {SEALED_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <Input label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Optional" />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <Input label="Cost" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
            <Input label="Sell Price" type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
          </div>
          <Button size="lg" className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editId ? "Save Changes" : "Add Product"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
