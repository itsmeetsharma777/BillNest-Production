import { useState } from "react";

import {
  Bell,
  CreditCard,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  ShieldCheck,
  Store,
  UserCircle,
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import BillNestLogo from "@/components/branding/BillNestLogo";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/common/theme-selector";
import { useAuth } from "@/context/AuthContext";

const navigation = [
  {
    label: "Dashboard",
    href: "/customer",
    icon: LayoutDashboard,
  },
  {
    label: "My Purchases",
    href: "/customer/invoices",
    icon: Receipt,
  },
  {
    label: "Payments",
    href: "/customer/payments",
    icon: CreditCard,
  },
  {
    label: "Warranties",
    href: "/customer/warranties",
    icon: ShieldCheck,
  },
  {
    label: "Settings",
    href: "/customer/settings",
    icon: Settings,
  },
];

export function CustomerLayout() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  async function handleLogout() {
    const role =
      user?.role;

    try {
      await logout();
    } finally {
      if (
        role ===
        "customer"
      ) {
        window.location.replace(
          "/customer/login",
        );

        return;
      }

      window.location.replace(
        "/customer/login",
      );
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">

      <div className="flex min-h-screen">

        {/* =====================================================
            DESKTOP SIDEBAR
        ===================================================== */}

        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 hidden shrink-0",
            "border-r bg-card",
            "lg:flex lg:flex-col",
            "transition-[width] duration-300 ease-in-out",
            sidebarCollapsed
              ? "w-20"
              : "w-64",
          ].join(" ")}
        >

          {/* =================================================
              SIDEBAR HEADER
          ================================================= */}

          <div
            className={[
              "flex h-16 shrink-0 items-center border-b",
              sidebarCollapsed
                ? "justify-center px-3"
                : "gap-3 px-5",
            ].join(" ")}
          >

            <div className="flex size-10 shrink-0 items-center justify-center">
              <BillNestLogo
                variant="icon"
                size={40}
                className="h-10 w-10"
              />
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0">

                <p className="truncate font-bold tracking-tight">
                  BillNest
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  Customer Portal
                </p>

              </div>
            )}

          </div>

          {/* =================================================
              NAVIGATION

              No overflow-y-auto.
              Sidebar remains fixed and does not scroll.
          ================================================= */}

          <nav
            className={[
              "min-h-0 flex-1 overflow-hidden py-4",
              sidebarCollapsed
                ? "px-2"
                : "px-4",
            ].join(" ")}
          >

            <div className="space-y-1">

              {navigation.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      end={
                        item.href ===
                        "/customer"
                      }
                      title={
                        sidebarCollapsed
                          ? item.label
                          : undefined
                      }
                      className={({ isActive }) =>
                        [
                          "flex items-center rounded-xl",
                          "py-2.5",
                          "text-sm font-medium",
                          "transition-all duration-200",
                          sidebarCollapsed
                            ? "justify-center px-2"
                            : "gap-3 px-3",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        ].join(" ")
                      }
                    >

                      <Icon className="size-[18px] shrink-0" />

                      {!sidebarCollapsed && (
                        <span className="truncate">
                          {item.label}
                        </span>
                      )}

                    </NavLink>
                  );
                },
              )}

            </div>

          </nav>

          {/* =================================================
              SIDEBAR FOOTER

              Always stays at bottom.
          ================================================= */}

          <div className="shrink-0 border-t p-3">

            {/* Customer Profile */}

            <div
              className={[
                "mb-2 flex items-center rounded-xl bg-muted/60 p-2",
                sidebarCollapsed
                  ? "justify-center"
                  : "gap-3",
              ].join(" ")}
            >

              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCircle className="size-5" />
              </div>

              {!sidebarCollapsed && (
                <div className="min-w-0">

                  <p className="truncate text-sm font-medium">
                    {user?.name ??
                      "Customer"}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email ?? ""}
                  </p>

                </div>
              )}

            </div>

            {/* Collapse Button */}

            <button
              type="button"
              onClick={() =>
                setSidebarCollapsed(
                  (current) =>
                    !current,
                )
              }
              title={
                sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              className={[
                "mb-1 flex w-full items-center rounded-lg",
                "py-2 text-xs font-medium",
                "text-muted-foreground",
                "transition-colors",
                "hover:bg-muted hover:text-foreground",
                sidebarCollapsed
                  ? "justify-center px-2"
                  : "justify-start gap-3 px-3",
              ].join(" ")}
            >

              {sidebarCollapsed ? (
                <PanelLeftOpen className="size-4 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="size-4 shrink-0" />

                  <span>
                    Collapse sidebar
                  </span>
                </>
              )}

            </button>

            {/* Sign Out */}

            <Button
              variant="ghost"
              className={[
                "w-full text-muted-foreground",
                "hover:text-foreground",
                sidebarCollapsed
                  ? "justify-center px-2"
                  : "justify-start gap-3",
              ].join(" ")}
              onClick={
                handleLogout
              }

            >

              <LogOut className="size-4 shrink-0" />

              {!sidebarCollapsed && (
                <span>
                  Sign out
                </span>
              )}

            </Button>

          </div>

        </aside>

        {/* =====================================================
            MAIN AREA

            Padding changes when sidebar collapses.
        ===================================================== */}

        <div
          className={[
            "flex min-h-screen min-w-0 flex-1 flex-col",
            "transition-[padding] duration-300 ease-in-out",
            sidebarCollapsed
              ? "lg:pl-20"
              : "lg:pl-64",
          ].join(" ")}
        >

          {/* =================================================
              TOP HEADER
          ================================================= */}

          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">

            {/* Mobile logo */}

            <div className="flex items-center gap-3 lg:hidden">

              <div className="flex size-10 items-center justify-center">
                <BillNestLogo
                  variant="icon"
                  size={40}
                  className="h-10 w-10"
                />
              </div>

              <div>

                <p className="font-bold tracking-tight">
                  BillNest
                </p>

                <p className="text-[11px] text-muted-foreground">
                  Customer Portal
                </p>

              </div>

            </div>

            {/* Desktop label */}

            <div className="hidden items-center gap-2 lg:flex">

              <Store className="size-4 text-muted-foreground" />

              <span className="text-sm text-muted-foreground">
                Customer account
              </span>

            </div>

            {/* Header actions */}

            <div className="flex items-center gap-2">

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={() =>
                  navigate(
                    "/customer/notifications",
                  )
                }
              >

                <Bell className="size-4" />

                <span className="sr-only">
                  Notifications
                </span>

              </Button>

              <ThemeSelector />

            </div>

          </header>

          {/* =================================================
              MOBILE NAVIGATION
          ================================================= */}

          <div className="shrink-0 border-b bg-card px-4 py-2 lg:hidden">

            <nav className="flex gap-1 overflow-x-auto">

              {navigation.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      end={
                        item.href ===
                        "/customer"
                      }
                      className={({ isActive }) =>
                        [
                          "flex shrink-0 items-center gap-2 rounded-lg",
                          "px-3 py-2 text-sm font-medium",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted",
                        ].join(" ")
                      }
                    >

                      <Icon className="size-4" />

                      {item.label}

                    </NavLink>
                  );
                },
              )}

            </nav>

          </div>

          {/* =================================================
              PAGE CONTENT
          ================================================= */}

          <main className="min-h-0 flex-1">
            <Outlet />
          </main>

        </div>

      </div>

    </div>
  );
}

export default CustomerLayout;