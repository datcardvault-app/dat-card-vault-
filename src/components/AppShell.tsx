import { type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Hop as Home, CreditCard, ScanLine, Package, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/cards", label: "Cards", icon: CreditCard },
  { path: "/scan", label: "Scan", icon: ScanLine, center: true },
  { path: "/sealed", label: "Sealed", icon: Package },
  { path: "/settings", label: "Settings", icon: Settings },
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-app flex flex-col">
      <main className="flex-1 pb-20 max-w-2xl mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-app safe-bottom">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            if (item.center) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div className="w-12 h-12 -mt-6 rounded-full bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30 transition-transform active:scale-95">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-primary-600">{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                  active ? "text-primary-600" : "text-app-muted"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
