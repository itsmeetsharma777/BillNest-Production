import { X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <Sidebar />

        {mobileMenuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation"
            />

            <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-card lg:hidden">
              <div className="flex h-16 items-center justify-between border-b px-5">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                    B
                  </div>

                  <span className="font-semibold">BillNest</span>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  aria-label="Close navigation"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="flex-1 p-4">
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Navigation
                </p>

                <a
                  href="/shopkeeper"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  Dashboard
                </a>

                <a
                  href="/shopkeeper/customers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  Customers
                </a>

                <a
                  href="/shopkeeper/invoices"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  Invoices
                </a>

                <a
                  href="/shopkeeper/warranties"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  Warranties
                </a>

                <a
                  href="/shopkeeper/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  Reports
                </a>
              </nav>
            </aside>
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setMobileMenuOpen(true)} />

          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}