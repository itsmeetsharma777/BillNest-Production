import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  FileText,
  Loader2,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
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

interface InvoiceItem {
  id?: string;
  _id?: string;
  productName?: string;
  description?: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  lineSubtotal?: number;
  lineTax?: number;
  lineTotal?: number;
  total?: number;
}

interface Invoice {
  id?: string;
  _id?: string;
  invoiceNo?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  status?: string;
  total?: number;
  amountPaid?: number;
  amountDue?: number;

  productNames?: string[];

  customer?: {
    id?: string;
    _id?: string;
    name: string;
    phone?: string;
    email?: string;
  };

  items?: InvoiceItem[];
}

interface InvoicesResponse {
  success: boolean;
  data?: {
    invoices?: Invoice[];
    pagination?: {
      page: number;
      limit: number;
      hasMore: boolean;
    };
  };
  message?: string;
}

interface InvoiceResponse {
  success: boolean;
  data?: {
    invoice?: Invoice;
    items?: InvoiceItem[];
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

function getId(
  value?: string,
  fallback?: string,
) {
  return value ?? fallback ?? "";
}

function formatCurrency(value?: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInvoiceNumber(invoice: Invoice) {
  return (
    invoice.invoiceNo ??
    invoice.invoiceNumber ??
    "Invoice"
  );
}

function getItemName(item: InvoiceItem) {
  return (
    item.productName ??
    item.description ??
    "Item"
  );
}

function getItemId(item: InvoiceItem) {
  return item.id ?? item._id ?? "";
}

function getInvoiceProductNames(invoice: Invoice) {
  const productNames =
    invoice.productNames?.filter(
      (name) =>
        typeof name === "string" &&
        name.trim().length > 0,
    ) ?? [];

  if (productNames.length > 0) {
    return productNames;
  }

  const itemNames =
    invoice.items
      ?.map((item) =>
        getItemName(item).trim(),
      )
      .filter(
        (name) =>
          name.length > 0 &&
          name !== "Item",
      ) ?? [];

  return itemNames;
}

function isUsableInvoice(invoice: Invoice) {
  const status = invoice.status?.toLowerCase();

  return (
    status === "paid" ||
    status === "partially_paid"
  );
}

function getInvoiceCustomerId(invoice: Invoice) {
  return getId(
    invoice.customer?.id,
    invoice.customer?._id,
  );
}
function generateSerialNumber() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  const randomPart = crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 6)
    .toUpperCase();

  return `BN-SN-${year}${month}${day}-${randomPart}`;
}
export default function CreateWarrantyPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>(
    [],
  );

  const [invoices, setInvoices] = useState<Invoice[]>(
    [],
  );

  const [invoiceItems, setInvoiceItems] = useState<
    InvoiceItem[]
  >([]);

  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceItemId, setInvoiceItemId] = useState("");

  const [productName, setProductName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
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

  const [isLoadingCustomers, setIsLoadingCustomers] =
    useState(true);

  const [isLoadingInvoices, setIsLoadingInvoices] =
    useState(false);

  const [isLoadingInvoiceItems, setIsLoadingInvoiceItems] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) =>
          customer.id === customerId,
      ) ?? null,
    [customers, customerId],
  );

  const selectedInvoice = useMemo(
    () =>
      invoices.find(
        (invoice) =>
          getId(
            invoice.id,
            invoice._id,
          ) === invoiceId,
      ) ?? null,
    [invoices, invoiceId],
  );

  const selectedInvoiceItem = useMemo(
    () =>
      invoiceItems.find(
        (item) =>
          getItemId(item) === invoiceItemId,
      ) ?? null,
    [invoiceItems, invoiceItemId],
  );

  /*
   * Load customers.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadCustomers() {
      try {
        setIsLoadingCustomers(true);
        setError("");

        const response = await fetch(
          `${API_URL}/customers?limit=100`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          },
        );

        let result: CustomersResponse;

        try {
          result =
            (await response.json()) as CustomersResponse;
        } catch {
          throw new Error(
            "The server returned an invalid response.",
          );
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ??
              "Failed to load customers.",
          );
        }

        const normalized: Customer[] = (
          result.data?.customers ?? []
        )
          .map(
            (customer): Customer | null => {
              const id =
                customer.id ??
                customer._id;

              if (!id) {
                return null;
              }

              return {
                id,
                name: customer.name,
                ...(customer.phone
                  ? {
                      phone:
                        customer.phone,
                    }
                  : {}),
                ...(customer.email
                  ? {
                      email:
                        customer.email,
                    }
                  : {}),
              };
            },
          )
          .filter(
            (
              customer,
            ): customer is Customer =>
              customer !== null,
          );

        setCustomers(normalized);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load customers.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCustomers(false);
        }
      }
    }

    void loadCustomers();

    return () => {
      controller.abort();
    };
  }, []);

  /*
   * Load paid / partially-paid invoices
   * for the selected customer.
   */
  useEffect(() => {
    if (!customerId) {
      setInvoices([]);
      setInvoiceId("");
      setInvoiceItems([]);
      setInvoiceItemId("");
      setProductName("");
      setSerialNumber("");
      return;
    }

    const controller = new AbortController();

    async function loadInvoices() {
      try {
        setIsLoadingInvoices(true);
        setError("");

        setInvoices([]);
        setInvoiceId("");
        setInvoiceItems([]);
        setInvoiceItemId("");
        setProductName("");
        setSerialNumber("");

        const params = new URLSearchParams({
          customerId,
          page: "1",
          limit: "100",
        });

        const response = await fetch(
          `${API_URL}/invoices?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          },
        );

        let result: InvoicesResponse;

        try {
          result =
            (await response.json()) as InvoicesResponse;
        } catch {
          throw new Error(
            "The server returned an invalid response.",
          );
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ??
              "Failed to load customer invoices.",
          );
        }

        const usableInvoices = (
          result.data?.invoices ?? []
        ).filter(isUsableInvoice);

        setInvoices(usableInvoices);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load customer invoices.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingInvoices(false);
        }
      }
    }

    void loadInvoices();

    return () => {
      controller.abort();
    };
  }, [customerId]);

  /*
   * Load exact invoice items.
   */
  useEffect(() => {
    if (!invoiceId) {
      setInvoiceItems([]);
      setInvoiceItemId("");
      setProductName("");
      setSerialNumber("");
      return;
    }

    const controller = new AbortController();

    async function loadInvoiceItems() {
      try {
        setIsLoadingInvoiceItems(true);
        setError("");

        setInvoiceItems([]);
        setInvoiceItemId("");
        setProductName("");
        setSerialNumber("");

        const response = await fetch(
          `${API_URL}/invoices/${invoiceId}`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          },
        );

        let result: InvoiceResponse;

        try {
          result =
            (await response.json()) as InvoiceResponse;
        } catch {
          throw new Error(
            "The server returned an invalid response.",
          );
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ??
              "Failed to load invoice items.",
          );
        }

        const items =
          result.data?.items ??
          result.data?.invoice?.items ??
          [];

        const validItems = items.filter(
          (item) =>
            Boolean(getItemId(item)),
        );

        setInvoiceItems(validItems);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load invoice items.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingInvoiceItems(false);
        }
      }
    }

    void loadInvoiceItems();

    return () => {
      controller.abort();
    };
  }, [invoiceId]);

  /*
   * Auto-fill product name and serial number
   * from the exact invoice item selected.
   */
useEffect(() => {
  if (!selectedInvoiceItem) {
    setProductName("");
    setSerialNumber("");
    return;
  }

  setProductName(
    getItemName(selectedInvoiceItem),
  );

  setSerialNumber(
    generateSerialNumber(),
  );
}, [selectedInvoiceItem]);

  function handleCustomerChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    setCustomerId(event.target.value);
    setError("");
  }

  function handleInvoiceChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    setInvoiceId(event.target.value);
    setError("");
  }

  function handleInvoiceItemChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const selectedId = event.target.value;

    setInvoiceItemId(selectedId);
    setError("");

    const item = invoiceItems.find(
      (invoiceItem) =>
        getItemId(invoiceItem) ===
        selectedId,
    );

    setProductName(
      item ? getItemName(item) : "",
    );

    setSerialNumber(
      item?.serialNumber?.trim() ?? "",
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    const trimmedProductName =
      productName.trim();

    const trimmedSerialNumber =
      serialNumber.trim();

    const trimmedTerms =
      terms.trim();

    const trimmedNotes =
      notes.trim();

    const months = Number(
      warrantyPeriodMonths,
    );

    if (!customerId) {
      setError(
        "Please select a customer.",
      );
      return;
    }

    if (!invoiceId) {
      setError(
        "Please select an invoice.",
      );
      return;
    }

    if (!invoiceItemId) {
      setError(
        "Please select a purchased product.",
      );
      return;
    }

    if (!selectedInvoice) {
      setError(
        "The selected invoice could not be found. Please select it again.",
      );
      return;
    }

    if (!selectedInvoiceItem) {
      setError(
        "The selected invoice item could not be found. Please select it again.",
      );
      return;
    }

    if (!trimmedProductName) {
      setError(
        "Product name is required.",
      );
      return;
    }

    if (trimmedProductName.length > 200) {
      setError(
        "Product name cannot exceed 200 characters.",
      );
      return;
    }

    if (trimmedSerialNumber.length > 150) {
      setError(
        "Serial number cannot exceed 150 characters.",
      );
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
      setError(
        "Warranty start date is required.",
      );
      return;
    }

    const parsedStartDate = new Date(
      `${startDate}T00:00:00`,
    );

    if (
      Number.isNaN(
        parsedStartDate.getTime(),
      )
    ) {
      setError(
        "Please enter a valid start date.",
      );
      return;
    }

    if (trimmedTerms.length > 5000) {
      setError(
        "Warranty terms cannot exceed 5000 characters.",
      );
      return;
    }

    if (trimmedNotes.length > 2000) {
      setError(
        "Notes cannot exceed 2000 characters.",
      );
      return;
    }

    const invoiceCustomerId =
      getInvoiceCustomerId(
        selectedInvoice,
      );

    if (
      invoiceCustomerId &&
      invoiceCustomerId !== customerId
    ) {
      setError(
        "The selected invoice does not belong to the selected customer.",
      );
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
            invoiceId,
            invoiceItemId,
            productName:
              trimmedProductName,
            ...(trimmedSerialNumber
              ? {
                  serialNumber:
                    trimmedSerialNumber,
                }
              : {}),
            warrantyPeriodMonths:
              months,
            startDate:
              parsedStartDate.toISOString(),
            ...(trimmedTerms
              ? {
                  terms: trimmedTerms,
                }
              : {}),
            ...(trimmedNotes
              ? {
                  notes: trimmedNotes,
                }
              : {}),
          }),
        },
      );

      let result: WarrantyResponse;

      try {
        result =
          (await response.json()) as WarrantyResponse;
      } catch {
        throw new Error(
          "The server returned an invalid response.",
        );
      }

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
          {
            replace: true,
          },
        );

        return;
      }

      navigate(
        "/shopkeeper/warranties",
        {
          replace: true,
        },
      );
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

  const previewExpiry = useMemo(() => {
    if (
      !startDate ||
      !warrantyPeriodMonths
    ) {
      return null;
    }

    const months = Number(
      warrantyPeriodMonths,
    );

    if (
      !Number.isInteger(months) ||
      months < 0
    ) {
      return null;
    }

    const expiry = new Date(
      `${startDate}T00:00:00`,
    );

    if (
      Number.isNaN(expiry.getTime())
    ) {
      return null;
    }

    expiry.setMonth(
      expiry.getMonth() + months,
    );

    return expiry;
  }, [
    startDate,
    warrantyPeriodMonths,
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/shopkeeper/warranties",
            )
          }
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
              Link warranty coverage to a real
              customer purchase.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Customer & Purchase */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold">
              Purchase
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Select the customer and the
              invoice for the purchased product.
            </p>
          </div>

          <div className="grid gap-5">
            {/* Customer */}
            <div>
              <label
                htmlFor="customer"
                className="mb-2 block text-sm font-medium"
              >
                Customer{" "}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <select
                  id="customer"
                  value={customerId}
                  onChange={
                    handleCustomerChange
                  }
                  disabled={
                    isLoadingCustomers ||
                    isSubmitting
                  }
                  className="h-11 w-full appearance-none rounded-xl border bg-background pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {isLoadingCustomers
                      ? "Loading customers..."
                      : "Select a customer"}
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name}
                        {customer.phone
                          ? ` — ${customer.phone}`
                          : ""}
                      </option>
                    ),
                  )}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              {!isLoadingCustomers &&
                customers.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    No customers found.
                    Create a customer first.
                  </p>
                )}
            </div>

            {/* Invoice */}
            <div>
              <label
                htmlFor="invoice"
                className="mb-2 block text-sm font-medium"
              >
                Invoice{" "}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <select
                  id="invoice"
                  value={invoiceId}
                  onChange={
                    handleInvoiceChange
                  }
                  disabled={
                    !customerId ||
                    isLoadingInvoices ||
                    isSubmitting
                  }
                  className="h-11 w-full appearance-none rounded-xl border bg-background pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {!customerId
                      ? "Select a customer first"
                      : isLoadingInvoices
                        ? "Loading invoices..."
                        : "Select an invoice"}
                  </option>

                  {invoices.map(
                    (invoice) => {
                      const id = getId(
                        invoice.id,
                        invoice._id,
                      );

                      const productNames =
                        getInvoiceProductNames(
                          invoice,
                        );

                      const productText =
                        productNames.length > 0
                          ? productNames.join(
                              ", ",
                            )
                          : "No products";

                      return (
                        <option
                          key={id}
                          value={id}
                        >
                          {getInvoiceNumber(
                            invoice,
                          )}{" "}
                          —{" "}
                          {productText}{" "}
                          —{" "}
                          {formatDate(
                            invoice.invoiceDate,
                          )}{" "}
                          —{" "}
                          {formatCurrency(
                            invoice.total,
                          )}
                        </option>
                      );
                    },
                  )}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              {customerId &&
                !isLoadingInvoices &&
                invoices.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    No paid or partially paid
                    invoices were found for this
                    customer.
                  </p>
                )}
            </div>

            {/* Selected summary */}
            {(selectedCustomer ||
              selectedInvoice) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedCustomer && (
                  <div className="rounded-xl bg-muted/40 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Customer
                    </p>

                    <p className="mt-1 font-medium">
                      {selectedCustomer.name}
                    </p>

                    {selectedCustomer.phone && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {selectedCustomer.phone}
                      </p>
                    )}
                  </div>
                )}

                {selectedInvoice && (
                  <div className="rounded-xl bg-muted/40 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Invoice
                    </p>

                    <p className="mt-1 font-medium">
                      {getInvoiceNumber(
                        selectedInvoice,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {getInvoiceProductNames(
                        selectedInvoice,
                      ).join(", ") ||
                        "No products"}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(
                        selectedInvoice.invoiceDate,
                      )}{" "}
                      ·{" "}
                      {formatCurrency(
                        selectedInvoice.total,
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Product & Warranty */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold">
              Product & Warranty
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Select the exact product from the
              invoice and enter its warranty
              coverage details.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Invoice Item */}
            <div className="sm:col-span-2">
              <label
                htmlFor="invoiceItem"
                className="mb-2 block text-sm font-medium"
              >
                Purchased Product{" "}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <select
                  id="invoiceItem"
                  value={invoiceItemId}
                  onChange={
                    handleInvoiceItemChange
                  }
                  disabled={
                    !invoiceId ||
                    isLoadingInvoiceItems ||
                    isSubmitting
                  }
                  className="h-11 w-full appearance-none rounded-xl border bg-background pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {!invoiceId
                      ? "Select an invoice first"
                      : isLoadingInvoiceItems
                        ? "Loading products..."
                        : "Select purchased product"}
                  </option>

                  {invoiceItems.map(
                    (item) => {
                      const id =
                        getItemId(item);

                      return (
                        <option
                          key={id}
                          value={id}
                        >
                          {getItemName(item)} — Qty{" "}
                          {item.quantity} —{" "}
                          {formatCurrency(
                            item.unitPrice,
                          )}
                          {item.serialNumber
                            ? ` — S/N: ${item.serialNumber}`
                            : ""}
                        </option>
                      );
                    },
                  )}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              {invoiceId &&
                !isLoadingInvoiceItems &&
                invoiceItems.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    No invoice items were found.
                  </p>
                )}
            </div>

            {/* Product name */}
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
                placeholder="Select a purchased product"
                maxLength={200}
                disabled={
                  !invoiceItemId ||
                  isSubmitting
                }
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />

              {selectedInvoiceItem &&
                selectedInvoice && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    From invoice:{" "}
                    {getInvoiceNumber(
                      selectedInvoice,
                    )}
                  </p>
                )}
            </div>

            {/* Serial number */}
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
                placeholder={
                  selectedInvoiceItem?.serialNumber
                    ? "Auto-filled from invoice"
                    : "Optional"
                }
                maxLength={150}
                disabled={
                  !invoiceItemId ||
                  isSubmitting
                }
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />

              {selectedInvoiceItem?.serialNumber && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Auto-filled from the selected
                  invoice item.
                </p>
              )}
            </div>

            {/* Warranty period */}
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
                  value={
                    warrantyPeriodMonths
                  }
                  onChange={(event) =>
                    setWarrantyPeriodMonths(
                      event.target.value.replace(
                        /[^\d]/g,
                        "",
                      ),
                    )
                  }
                  placeholder="12"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-xl border bg-background px-3 pr-20 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  months
                </span>
              </div>
            </div>

            {/* Start date */}
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
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Warranty preview */}
            {startDate &&
              warrantyPeriodMonths &&
              previewExpiry && (
                <div className="rounded-xl bg-primary/5 p-4 sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Warranty coverage
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {formatDate(
                      new Date(
                        `${startDate}T00:00:00`,
                      ).toISOString(),
                    )}{" "}
                    →{" "}
                    {formatDate(
                      previewExpiry.toISOString(),
                    )}
                  </p>
                </div>
              )}
          </div>
        </section>

        {/* Terms */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold">
              Warranty Terms
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Add coverage terms and additional
              notes.
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
                disabled={isSubmitting}
                className="w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-1 text-right text-xs text-muted-foreground">
                {terms.length}/5000
              </p>
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
                maxLength={2000}
                disabled={isSubmitting}
                className="w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-1 text-right text-xs text-muted-foreground">
                {notes.length}/2000
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/shopkeeper/warranties",
              )
            }
            disabled={isSubmitting}
            className="h-11 rounded-xl border px-5 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingCustomers ||
              isLoadingInvoices ||
              isLoadingInvoiceItems ||
              customers.length === 0 ||
              !customerId ||
              !invoiceId ||
              !invoiceItemId
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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