import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Package,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

type MovementType =
  | "initial_stock"
  | "purchase"
  | "sale"
  | "sale_reversal"
  | "adjustment_in"
  | "adjustment_out"
  | "correction";

type ReferenceType =
  | "invoice"
  | "invoice_cancellation"
  | "product_creation"
  | "stock_adjustment"
  | "manual_correction";

interface Product {
  _id: string;
  name: string;
  sku?: string | null;
  stockQuantity: number;
  isActive: boolean;
}

interface InventoryMovement {
  _id: string;
  productId: string;
  productName: string;
  sku?: string | null;
  movementType: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType?: ReferenceType | null;
  referenceId?: string | null;
  reason?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

type MovementFilter =
  | "all"
  | MovementType;

type ReferenceFilter =
  | "all"
  | ReferenceType;

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function formatShortDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function getMovementLabel(
  type: MovementType,
) {
  switch (type) {
    case "initial_stock":
      return "Initial stock";

    case "purchase":
      return "Purchase";

    case "sale":
      return "Sale";

    case "sale_reversal":
      return "Sale reversal";

    case "adjustment_in":
      return "Stock added";

    case "adjustment_out":
      return "Stock removed";

    case "correction":
      return "Correction";

    default:
      return type;
  }
}

function getReferenceLabel(
  type?: ReferenceType | null,
) {
  switch (type) {
    case "invoice":
      return "Invoice";

    case "invoice_cancellation":
      return "Invoice cancellation";

    case "product_creation":
      return "Product creation";

    case "stock_adjustment":
      return "Stock adjustment";

    case "manual_correction":
      return "Manual correction";

    default:
      return "—";
  }
}

function isIncomingMovement(
  type: MovementType,
) {
  return (
    type === "initial_stock" ||
    type === "purchase" ||
    type === "sale_reversal" ||
    type === "adjustment_in"
  );
}

function getMovementBadgeClass(
  type: MovementType,
) {
  if (
    isIncomingMovement(type)
  ) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }

  return "bg-red-500/10 text-red-600 dark:text-red-400";
}

function getMovementIcon(
  type: MovementType,
) {
  if (
    isIncomingMovement(type)
  ) {
    return (
      <ArrowDownLeft className="size-4" />
    );
  }

  return (
    <ArrowUpRight className="size-4" />
  );
}

function getInitialDate() {
  const date =
    new Date();

  date.setDate(
    date.getDate() - 30,
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function getTodayDate() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

export default function InventoryHistoryPage() {
  const [
    movements,
    setMovements,
  ] = useState<
    InventoryMovement[]
  >([]);

  const [
    products,
    setProducts,
  ] = useState<Product[]>(
    [],
  );

  const [
    pagination,
    setPagination,
  ] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    productFilter,
    setProductFilter,
  ] = useState("all");

  const [
    movementFilter,
    setMovementFilter,
  ] =
    useState<MovementFilter>(
      "all",
    );

  const [
    referenceFilter,
    setReferenceFilter,
  ] =
    useState<ReferenceFilter>(
      "all",
    );

  const [
    startDate,
    setStartDate,
  ] = useState(
    getInitialDate(),
  );

  const [
    endDate,
    setEndDate,
  ] = useState(
    getTodayDate(),
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filtersOpen,
    setFiltersOpen,
  ] = useState(false);

  async function loadProducts() {
    try {
      const response =
        await fetch(
          `${API_URL}/products?limit=100`,
          {
            credentials:
              "include",
          },
        );

      const data =
        await response
          .json()
          .catch(
            () => null,
          );

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Unable to load products.",
        );
      }

      const nextProducts =
        Array.isArray(data)
          ? data
          : Array.isArray(
              data?.products,
            )
            ? data.products
            : Array.isArray(
                data?.data?.products,
              )
              ? data.data.products
              : Array.isArray(
                  data?.data,
                )
                ? data.data
                : [];

      setProducts(
        nextProducts,
      );
    } catch {
      /*
       * Product loading failure does not
       * prevent movement history from loading.
       */
    }
  }

  async function loadMovements(
    showRefresh = false,
  ) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params =
        new URLSearchParams();

      params.set(
        "page",
        String(
          pagination.page,
        ),
      );

      params.set(
        "limit",
        String(
          pagination.limit,
        ),
      );

      if (
        productFilter !==
        "all"
      ) {
        params.set(
          "productId",
          productFilter,
        );
      }

      if (
        movementFilter !==
        "all"
      ) {
        params.set(
          "movementType",
          movementFilter,
        );
      }

      if (
        referenceFilter !==
        "all"
      ) {
        params.set(
          "referenceType",
          referenceFilter,
        );
      }

      if (startDate) {
        params.set(
          "startDate",
          startDate,
        );
      }

      if (endDate) {
        /*
         * Include the complete selected end date.
         */
        const inclusiveEnd =
          new Date(
            `${endDate}T23:59:59.999`,
          );

        params.set(
          "endDate",
          inclusiveEnd.toISOString(),
        );
      }

      const response =
        await fetch(
          `${API_URL}/inventory/movements?${params.toString()}`,
          {
            credentials:
              "include",
          },
        );

      const data =
        await response
          .json()
          .catch(
            () => null,
          );

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Unable to load inventory history.",
        );
      }

      const result =
        data?.data ??
        data;

      setMovements(
        Array.isArray(
          result?.movements,
        )
          ? result.movements
          : [],
      );

      if (
        result?.pagination
      ) {
        setPagination(
          result.pagination,
        );
      }
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Unable to load inventory history.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    void loadMovements();
  }, [
    pagination.page,
    pagination.limit,
    productFilter,
    movementFilter,
    referenceFilter,
    startDate,
    endDate,
  ]);

  const filteredMovements =
    useMemo(() => {
      const normalized =
        search
          .trim()
          .toLowerCase();

      if (!normalized) {
        return movements;
      }

      return movements.filter(
        (movement) =>
          movement.productName
            .toLowerCase()
            .includes(
              normalized,
            ) ||
          movement.sku
            ?.toLowerCase()
            .includes(
              normalized,
            ) ||
          movement.reason
            ?.toLowerCase()
            .includes(
              normalized,
            ),
      );
    }, [
      movements,
      search,
    ]);

  const incomingQuantity =
    useMemo(
      () =>
        movements
          .filter(
            (movement) =>
              isIncomingMovement(
                movement.movementType,
              ),
          )
          .reduce(
            (
              total,
              movement,
            ) =>
              total +
              movement.quantity,
            0,
          ),
      [movements],
    );

  const outgoingQuantity =
    useMemo(
      () =>
        movements
          .filter(
            (movement) =>
              !isIncomingMovement(
                movement.movementType,
              ),
          )
          .reduce(
            (
              total,
              movement,
            ) =>
              total +
              movement.quantity,
            0,
          ),
      [movements],
    );

  const activeFilterCount =
    [
      productFilter !==
        "all",
      movementFilter !==
        "all",
      referenceFilter !==
        "all",
      Boolean(startDate),
      Boolean(endDate),
    ].filter(Boolean)
      .length;

  function resetFilters() {
    setProductFilter("all");
    setMovementFilter("all");
    setReferenceFilter("all");
    setStartDate(
      getInitialDate(),
    );
    setEndDate(
      getTodayDate(),
    );
    setSearch("");

    setPagination(
      (current) => ({
        ...current,
        page: 1,
      }),
    );
  }

  function changePage(
    nextPage: number,
  ) {
    if (
      nextPage < 1 ||
      nextPage ===
        pagination.page
    ) {
      return;
    }

    if (
      nextPage >
        pagination.page &&
      !pagination.hasMore
    ) {
      return;
    }

    setPagination(
      (current) => ({
        ...current,
        page: nextPage,
      }),
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Boxes className="size-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Inventory History
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Track every stock movement
                across your inventory.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadMovements(
              true,
            )
          }
          disabled={
            refreshing
          }
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            className={[
              "size-4",
              refreshing
                ? "animate-spin"
                : "",
            ].join(" ")}
          />

          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={
            <Boxes className="size-5" />
          }
          label="Total movements"
          value={pagination.total}
        />

        <SummaryCard
          icon={
            <ArrowDownLeft className="size-5" />
          }
          label="Stock added"
          value={incomingQuantity}
          positive
        />

        <SummaryCard
          icon={
            <ArrowUpRight className="size-5" />
          }
          label="Stock removed"
          value={outgoingQuantity}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />

          <div className="flex-1">
            <p className="font-medium">
              Something went wrong
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="rounded-md p-1 hover:bg-destructive/10"
            aria-label="Dismiss error"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search product, SKU or reason..."
                className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setFiltersOpen(
                  (value) =>
                    !value,
                )
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium hover:bg-muted sm:hidden"
            >
              <Filter className="size-4" />

              Filters

              {activeFilterCount >
                0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {
                    activeFilterCount
                  }
                </span>
              )}
            </button>
          </div>

          <div
            className={[
              "grid gap-3 sm:grid-cols-2 lg:grid-cols-5",
              filtersOpen
                ? "grid"
                : "hidden sm:grid",
            ].join(" ")}
          >
            <FilterSelect
              label="Product"
              value={
                productFilter
              }
              onChange={(
                value,
              ) => {
                setProductFilter(
                  value,
                );

                setPagination(
                  (current) => ({
                    ...current,
                    page: 1,
                  }),
                );
              }}
            >
              <option value="all">
                All products
              </option>

              {products.map(
                (product) => (
                  <option
                    key={
                      product._id
                    }
                    value={
                      product._id
                    }
                  >
                    {product.name}
                    {product.sku
                      ? ` (${product.sku})`
                      : ""}
                  </option>
                ),
              )}
            </FilterSelect>

            <FilterSelect
              label="Movement"
              value={
                movementFilter
              }
              onChange={(
                value,
              ) => {
                setMovementFilter(
                  value as MovementFilter,
                );

                setPagination(
                  (current) => ({
                    ...current,
                    page: 1,
                  }),
                );
              }}
            >
              <option value="all">
                All movements
              </option>

              <option value="initial_stock">
                Initial stock
              </option>

              <option value="purchase">
                Purchase
              </option>

              <option value="sale">
                Sale
              </option>

              <option value="sale_reversal">
                Sale reversal
              </option>

              <option value="adjustment_in">
                Stock added
              </option>

              <option value="adjustment_out">
                Stock removed
              </option>

              <option value="correction">
                Correction
              </option>
            </FilterSelect>

            <FilterSelect
              label="Source"
              value={
                referenceFilter
              }
              onChange={(
                value,
              ) => {
                setReferenceFilter(
                  value as ReferenceFilter,
                );

                setPagination(
                  (current) => ({
                    ...current,
                    page: 1,
                  }),
                );
              }}
            >
              <option value="all">
                All sources
              </option>

              <option value="invoice">
                Invoice
              </option>

              <option value="invoice_cancellation">
                Invoice cancellation
              </option>

              <option value="product_creation">
                Product creation
              </option>

              <option value="stock_adjustment">
                Stock adjustment
              </option>

              <option value="manual_correction">
                Manual correction
              </option>
            </FilterSelect>

            <DateInput
              label="From"
              value={
                startDate
              }
              onChange={(
                value,
              ) => {
                setStartDate(
                  value,
                );

                setPagination(
                  (current) => ({
                    ...current,
                    page: 1,
                  }),
                );
              }}
            />

            <DateInput
              label="To"
              value={
                endDate
              }
              onChange={(
                value,
              ) => {
                setEndDate(
                  value,
                );

                setPagination(
                  (current) => ({
                    ...current,
                    page: 1,
                  }),
                );
              }}
            />
          </div>

          <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing movements from{" "}
              <span className="font-medium text-foreground">
                {startDate
                  ? formatShortDate(
                      startDate,
                    )
                  : "all dates"}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {endDate
                  ? formatShortDate(
                      endDate,
                    )
                  : "today"}
              </span>
            </p>

            <button
              type="button"
              onClick={
                resetFilters
              }
              className="inline-flex items-center gap-2 self-start text-xs font-semibold text-muted-foreground hover:text-foreground sm:self-auto"
            >
              <X className="size-3.5" />
              Reset filters
            </button>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading inventory history...
            </div>
          </div>
        ) : filteredMovements.length ===
          0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Package className="size-7" />
            </div>

            <h2 className="mt-4 font-semibold">
              No inventory movements found
            </h2>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              No stock movements match
              your current filters.
            </p>

            <button
              type="button"
              onClick={
                resetFilters
              }
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl border px-4 text-sm font-medium hover:bg-muted"
            >
              <X className="size-4" />
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">
                      Date
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Product
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Movement
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Stock
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Source
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Reason
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredMovements.map(
                    (
                      movement,
                    ) => (
                      <tr
                        key={
                          movement._id
                        }
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-medium">
                            {formatDate(
                              movement.createdAt,
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Package className="size-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {
                                  movement.productName
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {movement.sku
                                  ? `SKU: ${movement.sku}`
                                  : "No SKU"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <MovementBadge
                            movement={
                              movement
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {
                                  movement.previousStock
                                }
                              </span>

                              <span>
                                →
                              </span>

                              <span className="font-semibold text-foreground">
                                {
                                  movement.newStock
                                }
                              </span>
                            </div>

                            <p
                              className={[
                                "text-xs font-semibold",
                                isIncomingMovement(
                                  movement.movementType,
                                )
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400",
                              ].join(
                                " ",
                              )}
                            >
                              {isIncomingMovement(
                                movement.movementType,
                              )
                                ? "+"
                                : "-"}
                              {
                                movement.quantity
                              }{" "}
                              units
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-muted px-2.5 py-1 text-xs font-medium">
                            {getReferenceLabel(
                              movement.referenceType,
                            )}
                          </span>
                        </td>

                        <td className="max-w-[300px] px-5 py-4">
                          <p className="truncate text-sm text-muted-foreground">
                            {movement.reason ??
                              "—"}
                          </p>

                          {movement.referenceId && (
                            <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground/70">
                              Ref:{" "}
                              {
                                movement.referenceId
                              }
                            </p>
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y md:hidden">
              {filteredMovements.map(
                (
                  movement,
                ) => (
                  <div
                    key={
                      movement._id
                    }
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Package className="size-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {
                              movement.productName
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {movement.sku
                              ? movement.sku
                              : "No SKU"}
                          </p>
                        </div>
                      </div>

                      <MovementBadge
                        movement={
                          movement
                        }
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Stock
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {
                            movement.previousStock
                          }{" "}
                          →{" "}
                          {
                            movement.newStock
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Change
                        </p>

                        <p
                          className={[
                            "mt-1 text-sm font-semibold",
                            isIncomingMovement(
                              movement.movementType,
                            )
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400",
                          ].join(
                            " ",
                          )}
                        >
                          {isIncomingMovement(
                            movement.movementType,
                          )
                            ? "+"
                            : "-"}
                          {
                            movement.quantity
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">
                          Source
                        </span>

                        <span className="font-medium">
                          {getReferenceLabel(
                            movement.referenceType,
                          )}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3 text-xs">
                        <span className="shrink-0 text-muted-foreground">
                          Reason
                        </span>

                        <span className="text-right text-muted-foreground">
                          {movement.reason ??
                            "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">
                          Date
                        </span>

                        <span>
                          {formatDate(
                            movement.createdAt,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {pagination.total ===
                0
                  ? "No movements"
                  : `Showing page ${pagination.page} of ${Math.max(
                      1,
                      Math.ceil(
                        pagination.total /
                          pagination.limit,
                      ),
                    )} · ${pagination.total} total movements`}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    changePage(
                      pagination.page -
                        1,
                    )
                  }
                  disabled={
                    pagination.page <=
                    1
                  }
                  className="inline-flex size-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <span className="min-w-16 text-center text-xs font-medium">
                  Page{" "}
                  {
                    pagination.page
                  }
                </span>

                <button
                  type="button"
                  onClick={() =>
                    changePage(
                      pagination.page +
                        1,
                    )
                  }
                  disabled={
                    !pagination.hasMore
                  }
                  className="inline-flex size-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  positive = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex size-10 items-center justify-center rounded-xl",
            positive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-primary/10 text-primary",
          ].join(" ")}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            {label}
          </p>

          <p className="mt-0.5 text-xl font-bold">
            {value.toLocaleString(
              "en-IN",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {children}
      </select>
    </label>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">
        {label}
      </span>

      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type="date"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </label>
  );
}

function MovementBadge({
  movement,
}: {
  movement: InventoryMovement;
}) {
  return (
    <div
      className={[
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold",
        getMovementBadgeClass(
          movement.movementType,
        ),
      ].join(" ")}
    >
      {getMovementIcon(
        movement.movementType,
      )}

      {getMovementLabel(
        movement.movementType,
      )}
    </div>
  );
}