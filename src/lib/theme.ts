import { useEffect } from "react";
import { useAuth } from "./auth";

export function useAppTheme() {
  const { user } = useAuth();

  useEffect(() => {
    const theme = user?.theme_mode || localStorage.getItem("dcv_theme") || "dark";
    applyTheme(theme);
  }, [user?.theme_mode]);
}

export function applyTheme(theme: string) {
  localStorage.setItem("dcv_theme", theme);
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
