import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import CustomerForm from "./CustomerForm";
import type { CustomerFormValues } from "./CustomerForm";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CustomersResponse {
  success: boolean;
  data?: {
    customers?: Customer[];
    total?: number;
  };
  message?: string;
}

interface CustomerResponse {
  success: boolean;
  data?: {
    customer?: Customer;
  };
  message?: string;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function getAddress(customer: Customer) {
  const address = customer.address;

  if (!address) {
    return "No address added";
  }

  return (
    [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postalCode,
    ]
      .filter(Boolean)
      .join(", ") || "No address added"
  );
}

function normalizeCustomer(
  customer: Customer,
): Customer {
  return {
    ...customer,
    id: customer.id,
    name: customer.name,
    email: customer.email || undefined,
    phone: customer.phone || undefined,
    isActive: customer.isActive !== false,
    address: customer.address,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [openMenuId, setOpenMenuId] = useState<string | null>(
    null,
  );

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: "GET",
        credentials: "include",
      });

      const result =
        (await response.json()) as CustomersResponse;

      if (!response.ok) {
        throw new Error(
          result.message ?? "Unable to load customers.",
        );
      }

      const loadedCustomers = (
        result.data?.customers ?? []
      ).map(normalizeCustomer);

      setCustomers(loadedCustomers);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [successMessage]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      if (!showInactive && !customer.isActive) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        customer.name,
        customer.email,
        customer.phone,
        getAddress(customer),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        );
    });
  }, [customers, search, showInactive]);

  const activeCustomerCount = customers.filter(
    (customer) => customer.isActive,
  ).length;

  const inactiveCustomerCount = customers.filter(
    (customer) => !customer.isActive,
  ).length;

  const openCreateForm = () => {
    setEditingCustomer(null);
    setFormError("");
    setFormOpen(true);
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormError("");
    setOpenMenuId(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) {
      return;
    }

    setFormOpen(false);
    setEditingCustomer(null);
    setFormError("");
  };

  const handleCustomerSubmit = async (
    values: CustomerFormValues,
  ) => {
    setIsSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim() || undefined,
        phone: values.phone.trim() || undefined,
        address: {
          line1: values.line1.trim() || undefined,
          line2: values.line2.trim() || undefined,
          city: values.city.trim() || undefined,
          state: values.state.trim() || undefined,
          postalCode:
            values.postalCode.trim() || undefined,
          country:
            values.country.trim() || undefined,
        },
      };

      const isEditing = Boolean(editingCustomer);

      const response = await fetch(
        isEditing
          ? `${API_URL}/customers/${editingCustomer!.id}`
          : `${API_URL}/customers`,
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result =
        (await response.json()) as CustomerResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            (isEditing
              ? "Unable to update customer."
              : "Unable to create customer."),
        );
      }

      const savedCustomer = result.data?.customer;

      if (!savedCustomer) {
        throw new Error(
          "The server did not return the saved customer.",
        );
      }

      const normalized = normalizeCustomer(
        savedCustomer,
      );

      if (isEditing) {
        setCustomers((current) =>
          current.map((customer) =>
            customer.id === normalized.id
              ? normalized
              : customer,
          ),
        );

        setSuccessMessage(
          "Customer updated successfully.",
        );
      } else {
        setCustomers((current) => [
          normalized,
          ...current,
        ]);

        setSuccessMessage(
          "Customer added successfully.",
        );
      }

      setFormOpen(false);
      setEditingCustomer(null);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>Customers</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Your Customers
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer profiles, purchases and
            warranties.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add Customer
        </button>
      </div>

      {/* Success */}
      {successMessage && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />

          <p className="font-medium text-green-700 dark:text-green-400">
            {successMessage}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Users className="size-5" />}
          label="Total customers"
          value={customers.length}
        />

        <StatCard
          icon={<UserRound className="size-5" />}
          label="Active customers"
          value={activeCustomerCount}
        />

        <StatCard
          icon={<UserRound className="size-5" />}
          label="Inactive customers"
          value={inactiveCustomerCount}
        />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by name, email or phone..."
            className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 px-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) =>
              setShowInactive(event.target.checked)
            }
            className="size-4 rounded border-input accent-primary"
          />
          Show inactive
        </label>

        <button
          type="button"
          onClick={() => void loadCustomers()}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Refresh
        </button>
      </div>

      {/* API error */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

          <div className="flex-1">
            <p className="font-semibold text-destructive">
              Couldn't load customers
            </p>

            <p className="mt-1 text-muted-foreground">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadCustomers()}
            className="shrink-0 font-medium text-destructive hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="size-7 animate-spin text-primary" />

            <div>
              <p className="text-sm font-semibold">
                Loading customers
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Fetching your customer records...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {!isLoading &&
        !error &&
        filteredCustomers.length === 0 && (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border bg-card px-6 text-center shadow-sm">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="size-7" />
            </div>

            <h2 className="text-lg font-semibold">
              {search
                ? "No customers found"
                : showInactive
                  ? "No customers to display"
                  : "No customers yet"}
            </h2>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {search
                ? "Try a different name, email address or phone number."
                : "Add your first customer to start keeping track of purchases, invoices and warranties."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="size-4" />
                Add Customer
              </button>
            )}
          </div>
        )}

      {/* Customers */}
      {!isLoading && filteredCustomers.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b bg-muted/40">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3.5">
                      Customer
                    </th>

                    <th className="px-5 py-3.5">
                      Contact
                    </th>

                    <th className="px-5 py-3.5">
                      Address
                    </th>

                    <th className="px-5 py-3.5">
                      Added
                    </th>

                    <th className="px-5 py-3.5">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {getInitials(customer.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {customer.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Customer
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="size-3.5" />
                              <span className="max-w-48 truncate">
                                {customer.email}
                              </span>
                            </div>
                          )}

                          {customer.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="size-3.5" />
                              <span>
                                {customer.phone}
                              </span>
                            </div>
                          )}

                          {!customer.email &&
                            !customer.phone && (
                              <span className="text-xs text-muted-foreground">
                                No contact details
                              </span>
                            )}
                        </div>
                      </td>

                      <td className="max-w-56 px-5 py-4">
                        <p className="truncate text-xs text-muted-foreground">
                          {getAddress(customer)}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">
                        {formatDate(customer.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          active={customer.isActive}
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId((current) =>
                                current === customer.id
                                  ? null
                                  : customer.id,
                              )
                            }
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Actions for ${customer.name}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </button>

                          {openMenuId ===
                            customer.id && (
                            <CustomerActionMenu
                              customer={customer}
                              onClose={() =>
                                setOpenMenuId(null)
                              }
                              onEdit={() =>
                                openEditForm(customer)
                              }
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t px-5 py-3 text-xs text-muted-foreground">
              Showing {filteredCustomers.length} of{" "}
              {customers.length} customers
            </div>
          </div>

          {/* Mobile */}
          <div className="space-y-3 md:hidden">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-2xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {getInitials(customer.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {customer.name}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Added{" "}
                          {formatDate(
                            customer.createdAt,
                          )}
                        </p>
                      </div>

                      <StatusBadge
                        active={customer.isActive}
                      />
                    </div>

                    <div className="mt-4 space-y-2">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {customer.email}
                          </span>
                        </div>
                      )}

                      {customer.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="size-3.5 shrink-0" />
                          <span>
                            {customer.phone}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {getAddress(customer)}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(customer)
                        }
                        className="h-9 flex-1 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        Edit customer
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((current) =>
                              current === customer.id
                                ? null
                                : customer.id,
                            )
                          }
                          className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Actions for ${customer.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </button>

                        {openMenuId ===
                          customer.id && (
                          <CustomerActionMenu
                            customer={customer}
                            onClose={() =>
                              setOpenMenuId(null)
                            }
                            onEdit={() =>
                              openEditForm(customer)
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Customer form */}
      <CustomerForm
        open={formOpen}
        onClose={closeForm}
        onSubmit={handleCustomerSubmit}
        isSubmitting={isSubmitting}
        mode={editingCustomer ? "edit" : "create"}
        initialValues={
          editingCustomer
            ? {
                name: editingCustomer.name,
                email: editingCustomer.email ?? "",
                phone: editingCustomer.phone ?? "",
                line1:
                  editingCustomer.address?.line1 ?? "",
                line2:
                  editingCustomer.address?.line2 ?? "",
                city:
                  editingCustomer.address?.city ?? "",
                state:
                  editingCustomer.address?.state ?? "",
                postalCode:
                  editingCustomer.address?.postalCode ??
                  "",
                country:
                  editingCustomer.address?.country ??
                  "India",
              }
            : undefined
        }
      />

      {formError && formOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-[110] mx-auto max-w-xl rounded-2xl border border-destructive/30 bg-card p-4 shadow-xl sm:left-auto sm:right-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

            <div>
              <p className="text-sm font-semibold text-destructive">
                Unable to save customer
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {formError}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            {label}
          </p>

          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium",
        active
          ? "bg-green-500/10 text-green-700 dark:text-green-400"
          : "bg-muted text-muted-foreground",
      ].join(" ")}
    >
      <span
        className={[
          "mr-1.5 size-1.5 rounded-full",
          active ? "bg-green-500" : "bg-muted-foreground",
        ].join(" ")}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
}

function CustomerActionMenu({
  customer,
  onClose,
  onEdit,
}: {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border bg-popover p-1 shadow-lg">
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
      >
        View customer
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
      >
        Edit customer
      </button>

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
      >
        View invoices
      </button>

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
      >
        View warranties
      </button>

      {customer.isActive && (
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          Deactivate
        </button>
      )}
    </div>
  );
}