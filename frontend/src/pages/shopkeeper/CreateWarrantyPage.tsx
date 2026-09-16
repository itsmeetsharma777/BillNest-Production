import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface ApiCustomer {
  _id?: string;
  id?: string;
  name: string;
  phone?: string;
  email?: string;
}

interface CustomersResponse {
  success: boolean;
  data?: {
    customers?: ApiCustomer[];
  };
  message?: string;
}

interface WarrantyResponse {
  success: boolean;
  data?: {
    warranty?: {
      _id?: string;
      id?: string;
    };
  };
  message?: string;
}

export default function CreateWarrantyPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<
    Customer[]
  >([]);

  const [isLoadingCustomers, setIsLoadingCustomers] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState("");

  const [productName, setProductName] =
    useState("");

  const [serialNumber, setSerialNumber] =
    useState("");

  const [warrantyPeriodMonths, setWarrantyPeriodMonths] =
    useState("12");

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1,
    ).padStart(2, "0");
    const day = String(
      date.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        setIsLoadingCustomers(true);

        const response = await fetch(
          `${API_URL}/customers?limit=100`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const result =
          (await response.json()) as CustomersResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ??
              "Failed to load customers.",
          );
        }

        const normalized: Customer[] = (
          result.data?.customers ?? []
        )
          .filter(
            (customer) =>
              Boolean(
                customer.id ?? customer._id,
              ),
          )
          .map((customer) => ({
            id:
              customer.id ??
              customer._id!,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
          }));

        setCustomers(normalized);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load customers.",
        );
      } finally {
        setIsLoadingCustomers(false);
      }
    }

    void loadCustomers();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const trimmedProductName =
      productName.trim();

    const months = Number(
      warrantyPeriodMonths,
    );

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    if (!trimmedProductName) {
      setError("Product name is required.");
      return;
    }

    if (
      !Number.isInteger(months) ||
      months < 0 ||
      months > 1200
    ) {
      setError(
        "Warranty period must be a whole number between 0 and 1200 months.",
      );
      return;
    }

    if (!startDate) {
      setError("Warranty start date is required.");
      return;
    }

    const parsedStartDate = new Date(
      `${startDate}T00:00:00`,
    );

    if (Number.isNaN(parsedStartDate.getTime())) {
      setError("Please enter a valid start date.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `${API_URL}/warranties`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId,
            productName: trimmedProductName,
            ...(serialNumber.trim() && {
              serialNumber:
                serialNumber.trim(),
            }),
            warrantyPeriodMonths: months,
            startDate: parsedStartDate.toISOString(),
            ...(terms.trim() && {
              terms: terms.trim(),
            }),
            ...(notes.trim() && {
              notes: notes.trim(),
            }),
          }),
        },
      );

      const result =
        (await response.json()) as WarrantyResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Failed to create warranty.",
        );
      }

      const warrantyId =
        result.data?.warranty?.id ??
        result.data?.warranty?._id;

      if (warrantyId) {
        navigate(
          `/shopkeeper/warranties/${warrantyId}`,
          { replace: true },
        );
      } else {
        navigate("/shopkeeper/warranties", {
          replace: true,
        });
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create warranty.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() =>
            navigate("/shopkeeper/warranties")
          }
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to warranties
        </button>

        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="size-5 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Create Warranty
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Add warranty coverage for a customer
              purchase.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Customer */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold">
              Customer
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Select the customer who owns the warranty.
            </p>
          </div>

          <div>
            <label
              htmlFor="customer"
              className="mb-2 block text-sm font-medium"
            >
              Customer <span className="text-destructive">*</span>
            </label>

            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <select
                id="customer"
                value={customerId}
                onChange={(event) =>
                  setCustomerId(
                    event.target.value,
                  )
                }
                disabled={isLoadingCustomers}
                className="h-11 w-full appearance-none rounded-xl border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              >
                <option value="">
                  {isLoadingCustomers
                    ? "Loading customers..."
                    : "Select a customer"}
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name}
                    {customer.phone
                      ? ` — ${customer.phone}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {!isLoadingCustomers &&
              customers.length === 0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  No customers found. Create a
                  customer first.
                </p>
              )}
          </div>
        </section>

        {/* Product */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold">
              Product & Warranty
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Enter the product and warranty coverage
              details.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="productName"
                className="mb-2 block text-sm font-medium"
              >
                Product Name{" "}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <input
                id="productName"
                type="text"
                value={productName}
                onChange={(event) =>
                  setProductName(
                    event.target.value,
                  )
                }
                placeholder="e.g. Samsung Galaxy S25"
                maxLength={200}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="serialNumber"
                className="mb-2 block text-sm font-medium"
              >
                Serial Number
              </label>

              <input
                id="serialNumber"
                type="text"
                value={serialNumber}
                onChange={(event) =>
                  setSerialNumber(
                    event.target.value,
                  )
                }
                placeholder="Optional"
                maxLength={200}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="warrantyPeriod"
                className="mb-2 block text-sm font-medium"
              >
                Warranty Period{" "}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <div className="relative">
                <input
                  id="warrantyPeriod"
                  type="text"
                  inputMode="numeric"
                  value={warrantyPeriodMonths}
                  onChange={(event) =>
                    setWarrantyPeriodMonths(
                      event.target.value.replace(
                        /[^\d]/g,
                        "",
                      ),
                    )
                  }
                  placeholder="12"
                  className="h-11 w-full rounded-xl border bg-background px-3 pr-20 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  months
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="startDate"
                className="mb-2 block text-sm font-medium"
              >
                Start Date{" "}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Terms */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold">
              Warranty Terms
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Add coverage terms and additional notes.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="terms"
                className="mb-2 block text-sm font-medium"
              >
                Terms
              </label>

              <textarea
                id="terms"
                value={terms}
                onChange={(event) =>
                  setTerms(event.target.value)
                }
                placeholder="Describe what is covered and what is not..."
                rows={5}
                maxLength={5000}
                className="w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-medium"
              >
                Notes
              </label>

              <textarea
                id="notes"
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="Internal notes..."
                rows={4}
                maxLength={5000}
                className="w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              navigate("/shopkeeper/warranties")
            }
            disabled={isSubmitting}
            className="h-11 rounded-xl border px-5 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingCustomers ||
              customers.length === 0
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Create Warranty
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}