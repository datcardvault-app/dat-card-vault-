import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, Save, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { GAMES, CONDITIONS, LANGUAGES, GRADES } from "@/lib/types";
import { toast } from "sonner";

export function AddCardPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [name, setName] = useState("");
  const [game, setGame] = useState("Pokémon");
  const [setNameVal, setSetNameVal] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [condition, setCondition] = useState("Near Mint");
  const [rarity, setRarity] = useState("");
  const [grade, setGrade] = useState("");
  const [language, setLanguage] = useState("English");
  const [marketValue, setMarketValue] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [notes, setNotes] = useState("");
  const [sold, setSold] = useState(false);
  const [soldDate, setSoldDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageStorageId, setImageStorageId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("cards").select("*").eq("id", id).maybeSingle();
      if (data) {
        setName(data.name || "");
        setGame(data.game || "Pokémon");
        setSetNameVal(data.set_name || "");
        setCardNumber(data.card_number || "");
        setCondition(data.condition || "Near Mint");
        setRarity(data.rarity || "");
        setGrade(data.grade || "");
        setLanguage(data.language || "English");
        setMarketValue(data.market_value?.toString() || "");
        setPurchasePrice(data.purchase_price?.toString() || "");
        setNotes(data.notes || "");
        setSold(data.sold || false);
        setSoldDate(data.sold_date || "");
        setImageStorageId(data.image_storage_id || null);
      }
      setFetching(false);
    })();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageStorageId;
    const fileId = crypto.randomUUID();
    const ext = imageFile.name.split(".").pop() || "jpg";
    const path = `${fileId}.${ext}`;
    const { error } = await supabase.storage.from("cards").upload(path, imageFile);
    if (error) {
      toast.error("Failed to upload image");
      return imageStorageId;
    }
    return path;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Card name is required");
      return;
    }
    setLoading(true);

    const storageId = await uploadImage();

    const payload = {
      user_id: user!.id,
      name: name.trim(),
      game,
      set_name: setNameVal.trim() || null,
      card_number: cardNumber.trim() || null,
      condition,
      rarity: rarity.trim() || null,
      grade: grade || null,
      language,
      market_value: parseFloat(marketValue) || 0,
      purchase_price: parseFloat(purchasePrice) || 0,
      notes: notes.trim() || null,
      sold,
      sold_date: sold ? (soldDate || new Date().toISOString().split("T")[0]) : null,
      image_storage_id: storageId,
    };

    if (isEdit) {
      const { error } = await supabase.from("cards").update(payload).eq("id", id);
      if (error) toast.error("Failed to update card");
      else {
        toast.success("Card updated");
        navigate(`/cards/${id}`);
      }
    } else {
      const { data, error } = await supabase.from("cards").insert(payload).select().single();
      if (error) toast.error("Failed to add card");
      else {
        toast.success("Card added");
        navigate(`/cards/${data.id}`);
      }
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Delete this card? This cannot be undone.")) return;
    const { error } = await supabase.from("cards").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Card deleted");
      navigate("/cards");
    }
  };

  if (fetching) return <div className="flex justify-center pt-20"><Spinner size={32} /></div>;

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-app-tertiary">
          <ArrowLeft className="w-5 h-5 text-app" />
        </button>
        <h1 className="font-display font-bold text-xl text-app">{isEdit ? "Edit Card" : "Add Card"}</h1>
      </div>

      <div className="space-y-4">
        <Card className="p-4">
          <label className="block">
            <div className="relative w-full h-40 rounded-lg bg-app-tertiary border-2 border-dashed border-app flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              {imagePreview || imageStorageId ? (
                <img
                  src={imagePreview || `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/cards/${imageStorageId}`}
                  alt="Card"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Camera className="w-8 h-8 text-app-muted mx-auto mb-1" />
                  <span className="text-sm text-app-muted">Add card photo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </label>
        </Card>

        <Input label="Card Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pikachu" />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Game" value={game} onChange={(e) => setGame(e.target.value)}>
            {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
          <Input label="Set" value={setNameVal} onChange={(e) => setSetNameVal(e.target.value)} placeholder="e.g. Base Set" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="e.g. 25/102" />
          <Select label="Condition" value={condition} onChange={(e) => setCondition(e.target.value)}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Rarity" value={rarity} onChange={(e) => setRarity(e.target.value)} placeholder="e.g. Rare Holo" />
          <Select label="Grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
            {GRADES.map((g) => <option key={g} value={g}>{g || "None"}</option>)}
          </Select>
        </div>

        <Select label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Market Value"
            type="number"
            value={marketValue}
            onChange={(e) => setMarketValue(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Purchase Price"
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any extra details..." />

        <Card className="p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-app">Mark as Sold</p>
              <p className="text-xs text-app-muted">Toggle if this card has been sold</p>
            </div>
            <button
              type="button"
              onClick={() => setSold(!sold)}
              className={`relative w-11 h-6 rounded-full transition-colors ${sold ? "bg-success-500" : "bg-app-tertiary"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${sold ? "translate-x-5" : ""}`} />
            </button>
          </label>
          {sold && (
            <Input
              label="Sold Date"
              type="date"
              value={soldDate}
              onChange={(e) => setSoldDate(e.target.value)}
              className="mt-3"
            />
          )}
        </Card>

        <div className="flex gap-3">
          {isEdit && (
            <Button variant="danger" size="lg" onClick={handleDelete} disabled={loading}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button size="lg" className="flex-1" onClick={handleSave} disabled={loading}>
            {loading ? <Spinner size={20} /> : <><Save className="w-4 h-4" /> {isEdit ? "Save Changes" : "Add Card"}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
