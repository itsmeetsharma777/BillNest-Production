import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/theme-context";

interface NavigationItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/shopkeeper",
    icon: LayoutDashboard,
  },
  {
    label: "Customers",
    href: "/shopkeeper/customers",
    icon: Users,
  },
  {
    label: "Invoices",
    href: "/shopkeeper/invoices",
    icon: FileText,
  },
  {
    label: "Warranties",
    href: "/shopkeeper/warranties",
    icon: ShieldCheck,
  },
  {
    label: "Reports",
    href: "/shopkeeper/reports",
    icon: PieChart,
  },
  {
    label: "Notifications",
    href: "/shopkeeper/notifications",
    icon: Bell,
  },
];

const secondaryNavigationItems: NavigationItem[] = [
  {
    label: "Settings",
    href: "/shopkeeper/settings",
    icon: Settings,
  },
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ShopkeeperLayout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "Shopkeeper";
  const initials = getInitials(user?.name ?? "Shopkeeper");

  const isActiveRoute = (href: string) => {
    if (href === "/shopkeeper") {
      return location.pathname === href;
    }

    return (
      location.pathname === href ||
      location.pathname.startsWith(`${href}/`)
    );
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    setMobileOpen(false);
    await logout();
  };

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
      return;
    }

    if (theme === "dark") {
      setTheme("system");
      return;
    }

    setTheme("light");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r",
          "bg-card transition-all duration-300",
          "lg:translate-x-0",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "lg:w-20" : "lg:w-64",
          "w-72",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShoppingCart className="size-5" />
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-base font-bold tracking-tight">
                  BillNest
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Business management
                </p>
              </div>
            )}
          </div>

          {/* Mobile close */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p
            className={[
              "mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground",
              sidebarCollapsed ? "lg:hidden" : "",
            ].join(" ")}
          >
            Main menu
          </p>

          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={[
                    "group flex items-center rounded-xl px-3 py-2.5",
                    "text-sm font-medium transition-all",
                    sidebarCollapsed
                      ? "lg:justify-center lg:px-2"
                      : "gap-3",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="size-[18px] shrink-0" />

                  <span
                    className={[
                      "truncate",
                      sidebarCollapsed ? "lg:hidden" : "",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          <div className="my-5 border-t" />

          <p
            className={[
              "mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground",
              sidebarCollapsed ? "lg:hidden" : "",
            ].join(" ")}
          >
            Preferences
          </p>

          <nav className="space-y-1">
            {secondaryNavigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={[
                    "group flex items-center rounded-xl px-3 py-2.5",
                    "text-sm font-medium transition-all",
                    sidebarCollapsed
                      ? "lg:justify-center lg:px-2"
                      : "gap-3",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="size-[18px] shrink-0" />

                  <span
                    className={[
                      "truncate",
                      sidebarCollapsed ? "lg:hidden" : "",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className="border-t p-3">
          <div
            className={[
              "flex items-center rounded-xl bg-muted/50 p-2",
              sidebarCollapsed ? "lg:justify-center" : "gap-3",
            ].join(" ")}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user?.name ?? "Shopkeeper"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email ?? ""}
                </p>
              </div>
            )}
          </div>

          {/* Desktop collapse */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((value) => !value)}
            className="mt-2 hidden w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
          >
            {sidebarCollapsed ? (
              <>
                <PanelLeftOpen className="size-4" />
                <span className="sr-only">Expand sidebar</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="size-4" />
                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div
        className={[
          "min-h-screen transition-[padding] duration-300",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64",
        ].join(" ")}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          {/* Mobile menu */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="mr-3 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>

          {/* Page context */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted-foreground">
              Welcome back,{" "}
              <span className="font-medium text-foreground">
                {firstName}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme */}
            <button
              type="button"
              onClick={cycleTheme}
              className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Current theme: ${theme}. Change theme`}
              title={`Theme: ${theme}`}
            >
              {theme === "dark" ? (
                <Moon className="size-[18px]" />
              ) : theme === "light" ? (
                <Sun className="size-[18px]" />
              ) : (
                <Sun className="size-[18px]" />
              )}
            </button>

            {/* Notifications */}
            <NavLink
              to="/shopkeeper/notifications"
              className="relative rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
            </NavLink>

            {/* Profile */}
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-muted"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </div>

                <ChevronDown
                  className={[
                    "hidden size-4 text-muted-foreground transition-transform sm:block",
                    profileOpen ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close profile menu"
                    onClick={() => setProfileOpen(false)}
                  />

                  <div
                    className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border bg-popover p-1.5 shadow-lg"
                    role="menu"
                  >
                    <div className="border-b px-3 py-3">
                      <p className="truncate text-sm font-semibold">
                        {user?.name ?? "Shopkeeper"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {user?.email ?? ""}
                      </p>
                    </div>

                    <NavLink
                      to="/shopkeeper/settings"
                      onClick={() => setProfileOpen(false)}
                      className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      role="menuitem"
                    >
                      <Settings className="size-4" />
                      Settings
                    </NavLink>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                      role="menuitem"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default ShopkeeperLayout;