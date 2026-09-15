import { Bell, Menu, Search } from "lucide-react";

import { ThemeSelector } from "@/components/common/theme-selector";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="mr-3 inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <div className="hidden flex-1 md:block">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="search"
            placeholder="Search..."
            className="h-9 w-full rounded-lg border bg-muted/30 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-4.5" />

          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
        </button>

        <ThemeSelector />

        <div className="ml-1 flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          MS
        </div>
      </div>
    </header>
  );
}