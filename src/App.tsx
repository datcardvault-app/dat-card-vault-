import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useAppTheme } from "@/lib/theme";
import { AuthPage } from "@/pages/auth/AuthPage";
import { OnboardingPage } from "@/pages/onboarding/OnboardingPage";
import { AppShell } from "@/components/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { CardsPage } from "@/pages/cards/CardsPage";
import { CardDetailPage } from "@/pages/cards/CardDetailPage";
import { AddCardPage } from "@/pages/cards/AddCardPage";
import { ScanPage } from "@/pages/scan/ScanPage";
import { SealedProductsPage } from "@/pages/sealed/SealedProductsPage";
import { LabelsPage } from "@/pages/labels/LabelsPage";
import { BuyingDealsPage } from "@/pages/deals/BuyingDealsPage";
import { CalendarPage } from "@/pages/calendar/CalendarPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { FeedbackPage } from "@/pages/feedback/FeedbackPage";
import { FullSpinner } from "@/components/ui/Spinner";

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  useAppTheme();

  if (loading) return <FullSpinner />;
  if (!user) return <AuthPage />;
  if (!user.onboarding_complete) return <OnboardingPage />;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/cards/:id" element={<CardDetailPage />} />
        <Route path="/cards/add" element={<AddCardPage />} />
        <Route path="/cards/:id/edit" element={<AddCardPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/sealed" element={<SealedProductsPage />} />
        <Route path="/labels" element={<LabelsPage />} />
        <Route path="/deals" element={<BuyingDealsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}
