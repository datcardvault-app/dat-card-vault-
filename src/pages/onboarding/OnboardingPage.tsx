import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanLine, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CURRENCIES } from "@/lib/types";
import { applyTheme } from "@/lib/theme";

export function OnboardingPage() {
  const { user, updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState(user?.business_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [currency, setCurrency] = useState(user?.currency || "GBP");
  const [theme, setTheme] = useState(user?.theme_mode || "dark");
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: "Welcome to DatCARDVault", desc: "Let's get your vendor profile set up. This takes less than a minute." },
    { title: "Business Details", desc: "Tell us about your TCG business." },
    { title: "Preferences", desc: "Customize your experience." },
    { title: "You're all set!", desc: "Your DatCARDVault is ready to go." },
  ];

  const handleFinish = async () => {
    setLoading(true);
    await updateUser({
      business_name: businessName,
      username,
      currency,
      theme_mode: theme,
      onboarding_complete: true,
      username_last_changed: new Date().toISOString(),
    });
    applyTheme(theme);
    await refreshUser();
    navigate("/");
  };

  const handleNext = async () => {
    if (step === 1) {
      setLoading(true);
      await updateUser({ business_name: businessName, username, currency });
      setLoading(false);
    }
    if (step === 2) {
      setLoading(true);
      await updateUser({ theme_mode: theme });
      applyTheme(theme);
      setLoading(false);
    }
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-app px-5 py-10">
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i <= step ? "bg-primary-600 w-8" : "bg-app-tertiary w-4"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        {step === 0 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-primary-600 flex items-center justify-center mb-6 mx-auto shadow-xl shadow-primary-600/30">
              <ScanLine className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display font-black text-2xl text-app mb-2">{steps[step].title}</h1>
            <p className="text-app-muted mb-8">{steps[step].desc}</p>
            <Button size="lg" className="w-full" onClick={handleNext}>
              Get Started
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="w-full animate-slide-up">
            <h1 className="font-display font-bold text-xl text-app mb-1">{steps[step].title}</h1>
            <p className="text-app-muted text-sm mb-6">{steps[step].desc}</p>
            <div className="space-y-4">
              <Input
                label="Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Dat CARD Vault"
              />
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. DatCARDVault_Founder"
              />
              <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <Button size="lg" className="w-full mt-6" onClick={handleNext} disabled={loading}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="w-full animate-slide-up">
            <h1 className="font-display font-bold text-xl text-app mb-1">{steps[step].title}</h1>
            <p className="text-app-muted text-sm mb-6">{steps[step].desc}</p>
            <div className="space-y-3">
              {[
                { value: "dark", label: "Dark", desc: "Easy on the eyes", bg: "bg-neutral-900", text: "text-white" },
                { value: "light", label: "Light", desc: "Bright and clean", bg: "bg-white", text: "text-neutral-900" },
                { value: "grey", label: "Grey", desc: "Subtle and neutral", bg: "bg-neutral-200", text: "text-neutral-900" },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                    theme === t.value ? "border-primary-600" : "border-app"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${t.bg} ${t.text} flex items-center justify-center`}>
                      <ScanLine className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-app">{t.label}</p>
                      <p className="text-xs text-app-muted">{t.desc}</p>
                    </div>
                  </div>
                  {theme === t.value && <Check className="w-5 h-5 text-primary-600" />}
                </button>
              ))}
            </div>
            <Button size="lg" className="w-full mt-6" onClick={handleNext} disabled={loading}>
              Continue
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-success-500 flex items-center justify-center mb-6 mx-auto">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
            <h1 className="font-display font-black text-2xl text-app mb-2">{steps[step].title}</h1>
            <p className="text-app-muted mb-8">{steps[step].desc}</p>
            <Button size="lg" className="w-full" onClick={handleFinish} disabled={loading}>
              Enter DatCARDVault
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
