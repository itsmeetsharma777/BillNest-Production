import { useEffect, useRef, useState } from "react";

import {
  Bell,
  Boxes,
  Building2,
  ChevronDown,
  FileText,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import BillNestLogo from "@/components/branding/BillNestLogo";
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
    label: "Products",
    href: "/shopkeeper/products",
    icon: Boxes,
  },
  {
    label: "Categories",
    href: "/shopkeeper/categories",
    icon: FolderTree,
  },
  {
    label: "Brands",
    href: "/shopkeeper/brands",
    icon: Building2,
  },
  {
    label: "Inventory",
    href: "/shopkeeper/inventory/history",
    icon: PackageSearch,
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
  {
    label: "AI OCR",
    href: "/shopkeeper/ocr",
    icon: ScanLine,
  },
  {
    label: "Audit Logs",
    href: "/shopkeeper/audit-logs",
    icon: ShieldCheck,
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
    .map(
      (part) =>
        part[0]?.toUpperCase() ??
        "",
    )
    .join("");
}

export function ShopkeeperLayout() {
  const {
    user,
    logout,
  } = useAuth();

  const {
    theme,
    setTheme,
  } = useTheme();

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; type: "product" | "customer" | "invoice" | "warranty"; title: string; subtitle: string; href: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchRequestRef = useRef(0);
  useEffect(() => {
    const query = globalSearch.trim();
    if (query.length < 2) { setSearchResults([]); setSearchLoading(false); return; }
    const requestId = ++searchRequestRef.current;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const apiUrl = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL ?? "http://localhost:5001/api");
        const response = await fetch(apiUrl + "/search?q=" + encodeURIComponent(query), { credentials: "include" });
        const payload = await response.json();
        if (requestId !== searchRequestRef.current) return;
        setSearchResults(response.ok && payload?.success === true && Array.isArray(payload.data?.results) ? payload.data.results : []);
      } catch { if (requestId === searchRequestRef.current) setSearchResults([]); }
      finally { if (requestId === searchRequestRef.current) setSearchLoading(false); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [globalSearch]);
  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => { if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) setSearchOpen(false); };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);


  const firstName =
    user?.name?.split(" ")[0] ??
    "Shopkeeper";

  const initials =
    getInitials(
      user?.name ??
        "Shopkeeper",
    );

  const isActiveRoute = (
    href: string,
  ) => {
    if (
      href ===
      "/shopkeeper"
    ) {
      return (
        location.pathname ===
        href
      );
    }

    return (
      location.pathname ===
        href ||
      location.pathname.startsWith(
        `${href}/`,
      )
    );
  };

  const handleLogout =
    async () => {
      setProfileOpen(false);
      setMobileOpen(false);

      await logout();

      navigate(
        "/register",
        {
          replace: true,
        },
      );
    };

  const cycleTheme = () => {
    if (
      theme ===
      "light"
    ) {
      setTheme("dark");

      return;
    }

    if (
      theme ===
      "dark"
    ) {
      setTheme("system");

      return;
    }

    setTheme("light");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ===================================================== */}
      {/* MOBILE OVERLAY                                        */}
      {/* ===================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() =>
            setMobileOpen(
              false,
            )
          }
        />
      )}

      {/* ===================================================== */}
      {/* SIDEBAR                                               */}
      {/* ===================================================== */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r",
          "bg-card transition-all duration-300",
          "lg:translate-x-0",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed
            ? "lg:w-20"
            : "lg:w-64",
          "w-72",
        ].join(" ")}
      >

        {/* =================================================== */}
        {/* LOGO                                                 */}
        {/* =================================================== */}

        <div className="flex h-16 shrink-0 items-center border-b px-4">

          <div className="flex min-w-0 flex-1 items-center gap-3">

            <div className="flex size-10 shrink-0 items-center justify-center">
              <BillNestLogo
                variant="icon"
                size={40}
                className="h-10 w-10"
              />
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

          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                false,
              )
            }
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>

        </div>

        {/* =================================================== */}
        {/* NAVIGATION                                           */}
        {/* =================================================== */}

        <div className="flex-1 overflow-y-auto px-3 py-5">

          <p
            className={[
              "mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground",
              sidebarCollapsed
                ? "lg:hidden"
                : "",
            ].join(" ")}
          >
            Main menu
          </p>

          <nav className="space-y-1">

            {navigationItems.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  isActiveRoute(
                    item.href,
                  );

                return (
                  <NavLink
                    key={
                      item.href
                    }
                    to={
                      item.href
                    }
                    onClick={() =>
                      setMobileOpen(
                        false,
                      )
                    }
                    title={
                      sidebarCollapsed
                        ? item.label
                        : undefined
                    }
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
                        sidebarCollapsed
                          ? "lg:hidden"
                          : "",
                      ].join(" ")}
                    >
                      {
                        item.label
                      }
                    </span>
                  </NavLink>
                );
              },
            )}

          </nav>

          {/* ================================================= */}
          {/* DIVIDER                                             */}
          {/* ================================================= */}

          <div className="my-5 border-t" />

          <p
            className={[
              "mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground",
              sidebarCollapsed
                ? "lg:hidden"
                : "",
            ].join(" ")}
          >
            Preferences
          </p>

          <nav className="space-y-1">

            {secondaryNavigationItems.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  isActiveRoute(
                    item.href,
                  );

                return (
                  <NavLink
                    key={
                      item.href
                    }
                    to={
                      item.href
                    }
                    onClick={() =>
                      setMobileOpen(
                        false,
                      )
                    }
                    title={
                      sidebarCollapsed
                        ? item.label
                        : undefined
                    }
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
                        sidebarCollapsed
                          ? "lg:hidden"
                          : "",
                      ].join(" ")}
                    >
                      {
                        item.label
                      }
                    </span>
                  </NavLink>
                );
              },
            )}

          </nav>

        </div>

        {/* =================================================== */}
        {/* SIDEBAR FOOTER                                       */}
        {/* =================================================== */}

        <div className="border-t p-3">

          <div
            className={[
              "flex items-center rounded-xl bg-muted/50 p-2",
              sidebarCollapsed
                ? "lg:justify-center"
                : "gap-3",
            ].join(" ")}
          >

            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {
                initials
              }
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-medium">
                  {
                    user?.name ??
                    "Shopkeeper"
                  }
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {
                    user?.email ??
                    ""
                  }
                </p>

              </div>
            )}

          </div>

          {/* Collapse sidebar */}

          <button
            type="button"
            onClick={() =>
              setSidebarCollapsed(
                (value) =>
                  !value,
              )
            }
            className="mt-2 hidden w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
          >

            {sidebarCollapsed ? (
              <>
                <PanelLeftOpen className="size-4" />

                <span className="sr-only">
                  Expand sidebar
                </span>
              </>
            ) : (
              <>
                <PanelLeftClose className="size-4" />

                <span>
                  Collapse sidebar
                </span>
              </>
            )}

          </button>

        </div>

      </aside>

      {/* ===================================================== */}
      {/* MAIN AREA                                             */}
      {/* ===================================================== */}

      <div
        className={[
          "min-h-screen transition-[padding] duration-300",
          sidebarCollapsed
            ? "lg:pl-20"
            : "lg:pl-64",
        ].join(" ")}
      >

        {/* =================================================== */}
        {/* TOP BAR                                              */}
        {/* =================================================== */}

        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">

          {/* Mobile menu */}

          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                true,
              )
            }
            className="mr-3 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>

          {/* Welcome */}

          <div className="min-w-0 flex-1">

            <p className="truncate text-sm text-muted-foreground">

              Welcome back,{" "}

              <span className="font-medium text-foreground">
                {
                  firstName
                }
              </span>

            </p>

          </div>

          <div ref={searchContainerRef} className="relative hidden w-full max-w-xs flex-1 md:block lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input type="search" value={globalSearch} onChange={(event) => { setGlobalSearch(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); if (event.key === "Enter" && searchResults[0]) { setSearchOpen(false); navigate(searchResults[0].href); } }} placeholder="Search customers, invoices, products..." aria-label="Global search" aria-expanded={searchOpen} className="h-9 w-full rounded-lg border bg-muted/30 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
            {searchOpen && globalSearch.trim().length >= 2 && <div className="absolute left-0 right-0 top-full z-[60] mt-2 max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border bg-popover p-1.5 shadow-xl">
              {searchLoading ? <p className="px-3 py-4 text-center text-sm text-muted-foreground">Searching BillNest...</p> : searchResults.length ? searchResults.map((result) => <button key={result.type + ":" + result.id} type="button" onClick={() => { setSearchOpen(false); setGlobalSearch(""); navigate(result.href); }} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-accent"><span className="mt-0.5 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{result.type}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{result.title}</span><span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span></span></button>) : <p className="px-3 py-4 text-center text-sm text-muted-foreground">No matching records found.</p>}
            </div>}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">

            {/* ================================================= */}
            {/* THEME                                               */}
            {/* ================================================= */}

            <button
              type="button"
              onClick={
                cycleTheme
              }
              className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Current theme: ${theme}. Change theme`}
              title={`Theme: ${theme}`}
            >
              {theme ===
              "dark" ? (
                <Moon className="size-[18px]" />
              ) : (
                <Sun className="size-[18px]" />
              )}
            </button>

            {/* ================================================= */}
            {/* NOTIFICATIONS                                       */}
            {/* ================================================= */}

            <NavLink
              to="/shopkeeper/notifications"
              className="relative rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
            </NavLink>

            {/* ================================================= */}
            {/* PROFILE                                             */}
            {/* ================================================= */}

            <div className="relative ml-1">

              <button
                type="button"
                onClick={() =>
                  setProfileOpen(
                    (value) =>
                      !value,
                  )
                }
                className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-muted"
                aria-expanded={
                  profileOpen
                }
                aria-haspopup="menu"
              >

                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {
                    initials
                  }
                </div>

                <ChevronDown
                  className={[
                    "hidden size-4 text-muted-foreground transition-transform sm:block",
                    profileOpen
                      ? "rotate-180"
                      : "",
                  ].join(" ")}
                />

              </button>

              {profileOpen && (
                <>
                  {/* Profile backdrop */}

                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close profile menu"
                    onClick={() =>
                      setProfileOpen(
                        false,
                      )
                    }
                  />

                  {/* Profile menu */}

                  <div
                    className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border bg-popover p-1.5 shadow-lg"
                    role="menu"
                  >

                    <div className="border-b px-3 py-3">

                      <p className="truncate text-sm font-semibold">
                        {
                          user?.name ??
                          "Shopkeeper"
                        }
                      </p>

                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {
                          user?.email ??
                          ""
                        }
                      </p>

                    </div>

                    {/* Settings */}

                    <NavLink
                      to="/shopkeeper/settings"
                      onClick={() =>
                        setProfileOpen(
                          false,
                        )
                      }
                      className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      role="menuitem"
                    >
                      <Settings className="size-4" />

                      Settings
                    </NavLink>

                    {/* Logout */}

                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
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

        {/* =================================================== */}
        {/* PAGE CONTENT                                         */}
        {/* =================================================== */}

        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default ShopkeeperLayout;

