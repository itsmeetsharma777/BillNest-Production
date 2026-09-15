import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type Theme } from "@/context/theme-context";

const options: {
  value: Theme;
  label: string;
  icon: typeof Sun;
}[] = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
  },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl border bg-card p-1 shadow-sm"
      role="group"
      aria-label="Theme selection"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-label={`Use ${option.label} theme`}
            aria-pressed={isActive}
            className={[
              "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            ].join(" ")}
          >
            <Icon className="size-4" />

            <span className="hidden sm:inline">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}