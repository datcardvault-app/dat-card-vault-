import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, MessageSquare, Target, Calendar, ShoppingBag, Tag, Bell, Volume2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { applyTheme } from "@/lib/theme";
import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/types";
import { toast } from "sonner";

export function SettingsPage() {
  const { user, signOut, updateUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saleTarget, setSaleTarget] = useState(user?.sale_target?.toString() || "");

  const handleTheme = async (theme: string) => {
    await updateUser({ theme_mode: theme });
    applyTheme(theme);
    toast.success("Theme updated");
  };

  const handleCurrency = async (currency: string) => {
    await updateUser({ currency });
    toast.success("Currency updated");
  };

  const handleSaveTarget = async () => {
    setSaving(true);
    await updateUser({
      sale_target: parseFloat(saleTarget) || null,
      sale_target_set_at: new Date().toISOString().split("T")[0],
    });
    toast.success("Sale target updated");
    setSaving(false);
  };

  const handleToggleEvent = async () => {
    await updateUser({ event_active: !user?.event_active });
    toast.success(user?.event_active ? "Event ended" : "Event started");
  };

  const handleToggleScanSound = async () => {
    await updateUser({ scan_sound: !user?.scan_sound });
  };

  const handleToggleHaptics = async () => {
    await updateUser({ scan_haptics: !user?.scan_haptics });
  };

  const menuItems = [
    { icon: Tag, label: "Price Labels", path: "/labels" },
    { icon: ShoppingBag, label: "Buying Deals", path: "/deals" },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
    { icon: MessageSquare, label: "Feedback", path: "/feedback" },
  ];

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display font-bold text-xl text-app mb-6">Settings</h1>

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary-600/10 flex items-center justify-center">
            <User className="w-7 h-7 text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-app">{user?.business_name || user?.name || "Vendor"}</p>
            <p className="text-xs text-app-muted">{user?.email}</p>
            {user?.username && <Badge variant="primary" className="mt-1">@{user.username}</Badge>}
          </div>
        </div>
      </Card>

      <h2 className="font-display font-semibold text-sm text-app-secondary mb-3">Profile</h2>
      <Card className="p-4 mb-4 space-y-3">
        <Input label="Business Name" defaultValue={user?.business_name || ""} onBlur={(e) => updateUser({ business_name: e.target.value })} placeholder="Your business name" />
        <Input label="Username" defaultValue={user?.username || ""} onBlur={(e) => updateUser({ username: e.target.value, username_last_changed: new Date().toISOString() })} placeholder="@username" />
        <Input label="Instagram" defaultValue={user?.instagram || ""} onBlur={(e) => updateUser({ instagram: e.target.value })} placeholder="@your_instagram" />
        <Input label="Website" defaultValue={user?.website || ""} onBlur={(e) => updateUser({ website: e.target.value })} placeholder="www.yoursite.com" />
      </Card>

      <h2 className="font-display font-semibold text-sm text-app-secondary mb-3">Theme</h2>
      <Card className="p-4 mb-4">
        <div className="flex gap-2">
          {[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
            { value: "grey", label: "Grey" },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => handleTheme(t.value)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${user?.theme_mode === t.value ? "bg-primary-600 text-white" : "bg-app-tertiary text-app-secondary"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <h2 className="font-display font-semibold text-sm text-app-secondary mb-3">Currency</h2>
      <Card className="p-4 mb-4">
        <Select value={user?.currency || "GBP"} onChange={(e) => handleCurrency(e.target.value)}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c]})</option>)}
        </Select>
      </Card>

      <h2 className="font-display font-semibold text-sm text-app-secondary mb-3">Sale Target</h2>
      <Card className="p-4 mb-4">
        <div className="flex gap-2">
          <Input type="number" value={saleTarget} onChange={(e) => setSaleTarget(e.target.value)} placeholder="0" />
          <Button onClick={handleSaveTarget} disabled={saving}>Save</Button>
        </div>
        <p className="text-xs text-app-muted mt-2">Set a weekly earning target to track on your dashboard</p>
      </Card>

      <h2 className="font-display font-semibold text-sm text-app-secondary mb-3">Scan Settings</h2>
      <Card className="p-4 mb-4 space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-app-muted" />
            <span className="text-sm text-app">Scan Sound</span>
          </div>
          <button type="button" onClick={handleToggleScanSound} className={`relative w-11 h-6 rounded-full transition-colors ${user?.scan_sound ? "bg-primary-600" : "bg-app-tertiary"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${user?.scan_sound ? "translate-x-5" : ""}`} />
          </button>
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-app-muted" />
            <span className="text-sm text-app">Haptics</span>
          </div>
          <button type="button" onClick={handleToggleHaptics} className={`relative w-11 h-6 rounded-full transition-colors ${user?.scan_haptics ? "bg-primary-600" : "bg-app-tertiary"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${user?.scan_haptics ? "translate-x-5" : ""}`} />
          </button>
        </label>
      </Card>

      <h2 className="font-display font-semibold text-sm text-app-secondary mb-3">Event Mode</h2>
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-app">Event Mode</p>
            <p className="text-xs text-app-muted">Show an "Event Live" badge on your dashboard</p>
          </div>
          <button type="button" onClick={handleToggleEvent} className={`relative w-11 h-6 rounded-full transition-colors ${user?.event_active ? "bg-success-500" : "bg-app-tertiary"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${user?.event_active ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </Card>

      <h2 className="font-display font-semibold text-sm text-app-secondary mb-3">More</h2>
      <Card className="p-0 mb-4 overflow-hidden">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-app-tertiary transition-colors ${i !== menuItems.length - 1 ? "border-b border-app" : ""}`}
            >
              <Icon className="w-4 h-4 text-app-muted" />
              <span className="text-sm text-app flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </Card>

      <Button variant="danger" size="lg" className="w-full" onClick={signOut}>
        <LogOut className="w-4 h-4" /> Sign Out
      </Button>

      <p className="text-center text-xs text-app-muted mt-6">DatCARDVault v1.0 · Scan · Store · Label</p>
    </div>
  );
}
