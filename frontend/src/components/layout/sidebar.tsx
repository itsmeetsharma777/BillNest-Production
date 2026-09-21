import {
  Bell,
  FileText,
  LayoutDashboard,
  PackageCheck,
  Settings,
  Users,
  BarChart3,
  Receipt,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import BillNestLogo from "@/components/branding/BillNestLogo";

const navigation = [
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
    icon: Receipt,
  },
  {
    label: "Warranties",
    href: "/shopkeeper/warranties",
    icon: PackageCheck,
  },
  {
    label: "Reports",
    href: "/shopkeeper/reports",
    icon: BarChart3,
  },
];

const secondaryNavigation = [
  {
    label: "Documents",
    href: "/shopkeeper/documents",
    icon: FileText,
  },
  {
    label: "Notifications",
    href: "/shopkeeper/notifications",
    icon: Bell,
  },
  {
    label: "Settings",
    href: "/shopkeeper/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">

      <div className="flex h-16 items-center border-b px-6">

        <NavLink
          to="/shopkeeper"
          className="flex items-center gap-3"
        >
          <div className="flex size-10 items-center justify-center">
            <BillNestLogo
              variant="icon"
              size={40}
              className="h-10 w-10"
            />
          </div>

          <div>
            <p className="font-semibold tracking-tight">
              BillNest
            </p>

            <p className="text-xs text-muted-foreground">
              Business workspace
            </p>
          </div>
        </NavLink>

      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto p-4">

        <div>

          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>

          <div className="space-y-1">

            {navigation.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({
                      isActive,
                    }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                        "transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      ].join(" ")
                    }
                  >
                    <Icon className="size-4.5" />

                    <span>
                      {item.label}
                    </span>
                  </NavLink>
                );
              },
            )}

          </div>
        </div>

        <div>

          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Manage
          </p>

          <div className="space-y-1">

            {secondaryNavigation.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({
                      isActive,
                    }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                        "transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      ].join(" ")
                    }
                  >
                    <Icon className="size-4.5" />

                    <span>
                      {item.label}
                    </span>
                  </NavLink>
                );
              },
            )}

          </div>
        </div>

      </nav>

      <div className="border-t p-4">

        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">

          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            MS
          </div>

          <div className="min-w-0">

            <p className="truncate text-sm font-medium">
              Shopkeeper
            </p>

            <p className="truncate text-xs text-muted-foreground">
              Business account
            </p>

          </div>

        </div>

      </div>

    </aside>
  );
}