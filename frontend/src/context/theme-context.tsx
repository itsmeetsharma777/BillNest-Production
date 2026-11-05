import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
export interface CustomTheme { id: string; name: string; mode: "light" | "dark"; primary: string; background: string; surface: string; }
interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  customThemes: CustomTheme[];
  activeCustomThemeId: string | null;
  saveCustomTheme: (theme: Omit<CustomTheme, "id">) => CustomTheme;
  applyCustomTheme: (id: string | null) => void;
  deleteCustomTheme: (id: string) => void;
}
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "billnest-theme";
const CUSTOM_THEMES_KEY = "billnest-custom-themes";
const ACTIVE_CUSTOM_KEY = "billnest-active-custom-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}
function readCustomThemes(): CustomTheme[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_THEMES_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CustomTheme =>
      item && typeof item.id === "string" && typeof item.name === "string" &&
      (item.mode === "light" || item.mode === "dark") &&
      /^#[0-9a-f]{6}$/i.test(item.primary) &&
      /^#[0-9a-f]{6}$/i.test(item.background) &&
      /^#[0-9a-f]{6}$/i.test(item.surface)
    );
  } catch { return []; }
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(readCustomThemes);
  const [activeCustomThemeId, setActiveCustomThemeId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem(ACTIVE_CUSTOM_KEY)
  );
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => { localStorage.setItem(STORAGE_KEY, theme); }, [theme]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handle = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? "dark" : "light");
    setSystemTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", handle);
    return () => media.removeEventListener("change", handle);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    const active = customThemes.find((item) => item.id === activeCustomThemeId);
    const mode = active?.mode ?? resolvedTheme;
    root.classList.remove("light", "dark");
    root.classList.add(mode);
    root.style.colorScheme = mode;
    if (active) {
      root.style.setProperty("--primary", active.primary);
      root.style.setProperty("--ring", active.primary);
      root.style.setProperty("--background", active.background);
      root.style.setProperty("--card", active.surface);
      root.style.setProperty("--popover", active.surface);
      root.style.setProperty("--secondary", active.surface);
      root.style.setProperty("--accent", active.surface);
    } else {
      ["--primary", "--ring", "--background", "--card", "--popover", "--secondary", "--accent"].forEach((key) => root.style.removeProperty(key));
    }
  }, [resolvedTheme, customThemes, activeCustomThemeId]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: (next) => { setActiveCustomThemeId(null); localStorage.removeItem(ACTIVE_CUSTOM_KEY); setThemeState(next); },
    resolvedTheme,
    customThemes,
    activeCustomThemeId,
    saveCustomTheme: (input) => {
      const item: CustomTheme = { ...input, id: `custom-${Date.now().toString(36)}` };
      setCustomThemes((current) => {
        const next = [...current, item];
        localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(next));
        return next;
      });
      setActiveCustomThemeId(item.id);
      localStorage.setItem(ACTIVE_CUSTOM_KEY, item.id);
      return item;
    },
    applyCustomTheme: (id) => {
      setActiveCustomThemeId(id);
      if (id) localStorage.setItem(ACTIVE_CUSTOM_KEY, id);
      else localStorage.removeItem(ACTIVE_CUSTOM_KEY);
    },
    deleteCustomTheme: (id) => {
      setCustomThemes((current) => {
        const next = current.filter((item) => item.id !== id);
        localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(next));
        return next;
      });
      if (activeCustomThemeId === id) {
        setActiveCustomThemeId(null);
        localStorage.removeItem(ACTIVE_CUSTOM_KEY);
      }
    },
  }), [theme, resolvedTheme, customThemes, activeCustomThemeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
