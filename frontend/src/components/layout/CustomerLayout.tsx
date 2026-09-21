import {
  Bell,
  CreditCard,
  LayoutDashboard,
  LogOut,
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

        {/* Desktop sidebar */}

        <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">

          <div className="flex h-16 items-center gap-3 border-b px-5">

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

              <p className="text-xs text-muted-foreground">
                Customer Portal
              </p>
            </div>

          </div>

          <nav className="flex-1 space-y-1 p-4">

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
                    className={({
                      isActive,
                    }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      ].join(" ")
                    }
                  >
                    <Icon className="size-4.5" />

                    {item.label}
                  </NavLink>
                );
              },
            )}

          </nav>

          <div className="border-t p-4">

            <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted/60 p-3">

              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCircle className="size-5" />
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-medium">
                  {user?.name ??
                    "Customer"}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {user?.email ?? ""}
                </p>

              </div>

            </div>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={
                handleLogout
              }
            >
              <LogOut className="size-4" />

              Sign out
            </Button>

          </div>
        </aside>

        {/* Main area */}

        <div className="flex min-w-0 flex-1 flex-col">

          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">

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

          {/* Mobile navigation */}

          <div className="border-b bg-card px-4 py-2 lg:hidden">

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
                      className={({
                        isActive,
                      }) =>
                        [
                          "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
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

          <main className="flex-1">
            <Outlet />
          </main>

        </div>
      </div>
    </div>
  );
}

export default CustomerLayout;