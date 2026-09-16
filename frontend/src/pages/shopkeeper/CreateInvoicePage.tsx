import {
  ArrowLeft,
  Calculator,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Receipt,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

type PaymentMethod =
  | "CASH"
  | "UPI"
  | "CARD"
  | "BANK_TRANSFER"
  | "CREDIT";

type InvoiceStatus =
  | "DRAFT"
  | "PAID"
  | "PARTIALLY_PAID";

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

interface InvoiceItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

interface CreateInvoiceResponse {
  success: boolean;
  data?: {
    invoice?: {
      id: string;
      invoiceNo?: string;
    };
  };
  message?: string;
}

function createItem(): InvoiceItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitPrice: "0",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseAmount(value: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toBackendPaymentMethod(
  value: PaymentMethod,
): "cash" | "upi" | "card" | "bank_transfer" | "credit" {
  return value.toLowerCase() as
    | "cash"
    | "upi"
    | "card"
    | "bank_transfer"
    | "credit";
}

function toBackendStatus(
  value: InvoiceStatus,
): "draft" | "paid" | "partially_paid" {
  switch (value) {
    case "PAID":
      return "paid";

    case "PARTIALLY_PAID":
      return "partially_paid";

    case "DRAFT":
    default:
      return "draft";
  }
}

export default function CreateInvoicePage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] =
    useState(true);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState("");

  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] =
    useState(false);

  const [items, setItems] = useState<InvoiceItem[]>([
    createItem(),
  ]);

  /*
   * Keep numeric inputs as strings while the user is typing.
   *
   * This is important because using number state directly causes:
   *
   * 0 + "1500" -> 01500
   *
   * With string state the input behaves naturally:
   *
   * "0" -> select -> "1500"
   */
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH");

  const [amountPaid, setAmountPaid] = useState("0");

  const [status, setStatus] =
    useState<InvoiceStatus>("PAID");

  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
   * ------------------------------------------------------------
   * Load customers
   * ------------------------------------------------------------
   */

  const loadCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
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

      const apiCustomers = result.data?.customers ?? [];

      const normalizedCustomers: Customer[] = apiCustomers
        .filter((customer) => Boolean(customer.id ?? customer._id))
        .map((customer) => ({
          id: customer.id ?? customer._id!,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        }));

      setCustomers(normalizedCustomers);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers.",
      );
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  /*
   * ------------------------------------------------------------
   * Customer selection
   * ------------------------------------------------------------
   */

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) => customer.id === selectedCustomerId,
      ),
    [customers, selectedCustomerId],
  );

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) =>
      [
        customer.name,
        customer.phone,
        customer.email,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        ),
    );
  }, [customers, customerSearch]);

  /*
   * ------------------------------------------------------------
   * Invoice calculations
   * ------------------------------------------------------------
   */

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const quantity = Math.max(
          0,
          Number(item.quantity) || 0,
        );

        const unitPrice = parseAmount(item.unitPrice);

        return sum + quantity * unitPrice;
      }, 0),
    [items],
  );

  const safeDiscount = Math.min(
    parseAmount(discount),
    subtotal,
  );

  const taxableAmount = Math.max(
    0,
    subtotal - safeDiscount,
  );

  const safeTax = parseAmount(tax);

  const total = roundMoney(
    taxableAmount + safeTax,
  );

  const enteredAmountPaid = parseAmount(amountPaid);

  const safeAmountPaid = Math.min(
    enteredAmountPaid,
    total,
  );

  const balanceDue = roundMoney(
    Math.max(0, total - safeAmountPaid),
  );

  /*
   * ------------------------------------------------------------
   * Item handlers
   * ------------------------------------------------------------
   */

  function updateItem(
    itemId: string,
    field: keyof InvoiceItem,
    value: string,
  ) {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        if (field === "quantity") {
          /*
           * Allow an empty string while editing.
           * Validation happens when submitting.
           */
          if (value === "") {
            return {
              ...item,
              quantity: "",
            };
          }

          /*
           * Quantity should only contain digits.
           */
          if (!/^\d*$/.test(value)) {
            return item;
          }

          return {
            ...item,
            quantity: value,
          };
        }

        if (field === "unitPrice") {
          /*
           * Allow:
           * ""
           * "0"
           * "1500"
           * "1500.50"
           * "0.50"
           */
          if (value === "") {
            return {
              ...item,
              unitPrice: "",
            };
          }

          if (!/^\d*\.?\d{0,2}$/.test(value)) {
            return item;
          }

          return {
            ...item,
            unitPrice: value,
          };
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    );
  }

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      createItem(),
    ]);
  }

  function removeItem(itemId: string) {
    setItems((currentItems) => {
      if (currentItems.length === 1) {
        return currentItems;
      }

      return currentItems.filter(
        (item) => item.id !== itemId,
      );
    });
  }

  /*
   * ------------------------------------------------------------
   * Submit
   * ------------------------------------------------------------
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!selectedCustomerId || !selectedCustomer) {
      setError("Please select a customer.");
      return;
    }

    if (items.length === 0) {
      setError("Add at least one invoice item.");
      return;
    }

    const invalidItem = items.some((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      return (
        !item.description.trim() ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      );
    });

    if (invalidItem) {
      setError(
        "Please complete every invoice item with a valid name, quantity and price.",
      );
      return;
    }

    const parsedDiscount = parseAmount(discount);
    const parsedTax = parseAmount(tax);
    const parsedAmountPaid = parseAmount(amountPaid);

    if (parsedDiscount > subtotal) {
      setError(
        "Discount cannot be greater than the subtotal.",
      );
      return;
    }

    if (parsedAmountPaid > total) {
      setError(
        "Amount paid cannot be greater than the invoice total.",
      );
      return;
    }

    /*
     * Keep the selected status consistent with payment.
     */
    let finalStatus = status;

    if (status === "PAID") {
      if (parsedAmountPaid < total) {
        setError(
          "A paid invoice must have the full invoice amount paid.",
        );
        return;
      }
    }

    if (status === "PARTIALLY_PAID") {
      if (
        parsedAmountPaid <= 0 ||
        parsedAmountPaid >= total
      ) {
        setError(
          "A partially paid invoice must have a payment greater than zero and less than the total.",
        );
        return;
      }
    }

    if (status === "DRAFT") {
      finalStatus = "DRAFT";
    }

    setIsSubmitting(true);

    try {
      /*
       * Backend calculates invoice totals itself.
       *
       * Therefore discount and tax are represented through
       * invoice items instead of sending unsupported top-level
       * discount/tax fields.
       */
      const itemDiscount =
        items.length > 0
          ? parsedDiscount / items.length
          : 0;

      const itemTaxableAmount =
        items.length > 0
          ? Math.max(
              0,
              subtotal - parsedDiscount,
            ) / items.length
          : 0;

      const itemTaxRate =
        itemTaxableAmount > 0
          ? (parsedTax / itemTaxableAmount) * 100
          : 0;

      const response = await fetch(
        `${API_URL}/invoices`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: selectedCustomerId,

            items: items.map((item) => ({
              productName: item.description.trim(),
              quantity: Number(item.quantity),
              unitPrice: roundMoney(
                Number(item.unitPrice),
              ),
              discount: roundMoney(itemDiscount),
              taxRate: Number.isFinite(itemTaxRate)
                ? Number(itemTaxRate.toFixed(4))
                : 0,
            })),

            paymentMethod:
              toBackendPaymentMethod(paymentMethod),

            status: toBackendStatus(finalStatus),

            notes: notes.trim() || undefined,
          }),
        },
      );

      const result =
        (await response.json()) as CreateInvoiceResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Unable to create invoice.",
        );
      }

      setSuccessMessage(
        result.data?.invoice?.invoiceNo
          ? `Invoice ${result.data.invoice.invoiceNo} created successfully.`
          : "Invoice created successfully.",
      );

      setTimeout(() => {
        navigate("/shopkeeper/invoices");
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create invoice.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * Render
   * ------------------------------------------------------------
   */

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() =>
              navigate("/shopkeeper/invoices")
            }
            className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-muted"
            aria-label="Back to invoices"
          >
            <ArrowLeft className="size-4" />
          </button>

          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Receipt className="size-4" />
              <span>Invoices</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Create Invoice
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Create a new invoice for your customer.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/5 p-4 text-sm text-green-700 dark:text-green-400">
          <Check className="size-4" />
          {successMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[1fr_360px]"
      >
        {/* Main */}
        <div className="space-y-6">
          {/* Customer */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Customer
                </h2>

                <p className="text-xs text-muted-foreground">
                  Select the customer for this invoice.
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowCustomerList(
                    (current) => !current,
                  )
                }
                className="flex h-12 w-full items-center justify-between rounded-xl border bg-background px-4 text-left text-sm transition-colors hover:bg-muted/40"
              >
                <span
                  className={
                    selectedCustomer
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {selectedCustomer
                    ? selectedCustomer.name
                    : isLoadingCustomers
                      ? "Loading customers..."
                      : "Select a customer"}
                </span>

                <ChevronDown className="size-4 text-muted-foreground" />
              </button>

              {showCustomerList && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border bg-popover shadow-xl">
                  <div className="border-b p-2">
                    <input
                      type="search"
                      value={customerSearch}
                      onChange={(event) =>
                        setCustomerSearch(
                          event.target.value,
                        )
                      }
                      placeholder="Search customer..."
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto p-1">
                    {filteredCustomers.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        No customers found.
                      </div>
                    ) : (
                      filteredCustomers.map(
                        (customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(customer.id);
                              setCustomerSearch("");
                              setShowCustomerList(false);
                              setError("");
                            }}
                            className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                          >
                            <p className="text-sm font-medium">
                              {customer.name}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {customer.phone ??
                                customer.email ??
                                "No contact information"}
                            </p>
                          </button>
                        ),
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="mt-3 rounded-xl bg-muted/50 p-3">
                <p className="text-sm font-medium">
                  {selectedCustomer.name}
                </p>

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {selectedCustomer.phone && (
                    <span>
                      {selectedCustomer.phone}
                    </span>
                  )}

                  {selectedCustomer.email && (
                    <span>
                      {selectedCustomer.email}
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Items */}
          <section className="rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b p-5 sm:p-6">
              <div>
                <h2 className="font-semibold">
                  Invoice Items
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Add the products or services purchased.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors hover:bg-muted"
              >
                <Plus className="size-4" />
                Add item
              </button>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-xl border bg-background p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Item {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.id)
                      }
                      disabled={items.length === 1}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={`Remove item ${index + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_110px_140px]">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Description
                      </span>

                      <input
                        type="text"
                        value={item.description}
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            "description",
                            event.target.value,
                          )
                        }
                        placeholder="e.g. Wireless Keyboard"
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Quantity
                      </span>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onFocus={(event) =>
                          event.currentTarget.select()
                        }
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            "quantity",
                            event.target.value,
                          )
                        }
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Unit price
                      </span>

                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          ₹
                        </span>

                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.unitPrice}
                          onFocus={(event) =>
                            event.currentTarget.select()
                          }
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "unitPrice",
                              event.target.value,
                            )
                          }
                          placeholder="0.00"
                          className="h-10 w-full rounded-lg border bg-background pl-7 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="mt-3 flex justify-end border-t pt-3">
                    <p className="text-sm font-semibold">
                      {formatCurrency(
                        Math.max(
                          0,
                          Number(item.quantity) || 0,
                        ) *
                          parseAmount(item.unitPrice),
                      )}
                    </p>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="size-4" />
                Add another item
              </button>
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold">
              Notes
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Optional notes to include with the invoice.
            </p>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Add any additional notes..."
              rows={4}
              className="mt-4 w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Calculator className="size-5" />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Invoice Summary
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Review the final amount.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {/* Discount */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Discount
                </span>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ₹
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={discount}
                    onFocus={(event) =>
                      event.currentTarget.select()
                    }
                    onChange={(event) => {
                      const value =
                        event.target.value;

                      if (
                        value === "" ||
                        /^\d*\.?\d{0,2}$/.test(value)
                      ) {
                        setDiscount(value);
                      }
                    }}
                    placeholder="0.00"
                    className="h-10 w-full rounded-lg border bg-background pl-7 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </label>

              {/* Tax */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Tax
                </span>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ₹
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={tax}
                    onFocus={(event) =>
                      event.currentTarget.select()
                    }
                    onChange={(event) => {
                      const value =
                        event.target.value;

                      if (
                        value === "" ||
                        /^\d*\.?\d{0,2}$/.test(value)
                      ) {
                        setTax(value);
                      }
                    }}
                    placeholder="0.00"
                    className="h-10 w-full rounded-lg border bg-background pl-7 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </label>

              {/* Payment */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Payment method
                </label>

                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target
                        .value as PaymentMethod,
                    )
                  }
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="CASH">
                    Cash
                  </option>

                  <option value="UPI">
                    UPI
                  </option>

                  <option value="CARD">
                    Card
                  </option>

                  <option value="BANK_TRANSFER">
                    Bank Transfer
                  </option>

                  <option value="CREDIT">
                    Credit
                  </option>
                </select>
              </div>

              {/* Amount paid */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Amount paid
                </span>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ₹
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountPaid}
                    onFocus={(event) =>
                      event.currentTarget.select()
                    }
                    onChange={(event) => {
                      const value =
                        event.target.value;

                      if (
                        value === "" ||
                        /^\d*\.?\d{0,2}$/.test(value)
                      ) {
                        setAmountPaid(value);
                      }
                    }}
                    placeholder="0.00"
                    className="h-10 w-full rounded-lg border bg-background pl-7 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </label>

              {/* Status */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Invoice status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target
                        .value as InvoiceStatus,
                    )
                  }
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="PAID">
                    Paid
                  </option>

                  <option value="PARTIALLY_PAID">
                    Partially paid
                  </option>

                  <option value="DRAFT">
                    Draft
                  </option>
                </select>
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t pt-5">
                <SummaryRow
                  label="Subtotal"
                  value={formatCurrency(subtotal)}
                />

                <SummaryRow
                  label="Discount"
                  value={`− ${formatCurrency(
                    safeDiscount,
                  )}`}
                />

                <SummaryRow
                  label="Tax"
                  value={formatCurrency(safeTax)}
                />

                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm font-semibold">
                    Total
                  </span>

                  <span className="text-xl font-bold">
                    {formatCurrency(total)}
                  </span>
                </div>

                <SummaryRow
                  label="Amount paid"
                  value={formatCurrency(
                    safeAmountPaid,
                  )}
                />

                <SummaryRow
                  label="Balance due"
                  value={formatCurrency(balanceDue)}
                  emphasized={balanceDue > 0}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating invoice...
                  </>
                ) : (
                  <>
                    <Receipt className="size-4" />
                    Create Invoice
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  navigate("/shopkeeper/invoices")
                }
                className="h-10 w-full rounded-xl border text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span
        className={
          emphasized
            ? "font-semibold text-amber-600 dark:text-amber-400"
            : "font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}