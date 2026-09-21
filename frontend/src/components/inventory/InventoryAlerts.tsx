import {
  AlertTriangle,
  ArrowDownToLine,
  Boxes,
  CircleDollarSign,
  PackageCheck,
  Plus,
  TrendingUp,
  XCircle,
} from "lucide-react";

interface InventoryAlertProduct {
  _id: string;
  name: string;
  sku?: string | null;
  purchasePrice?: number;
  sellingPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
}

interface InventoryAlertsProps {
  products: InventoryAlertProduct[];
  onAdjust: (
    type: "in" | "out",
    productId?: string,
  ) => void;
}

function isOutOfStock(
  product: InventoryAlertProduct,
) {
  return product.stockQuantity <= 0;
}

function isLowStock(
  product: InventoryAlertProduct,
) {
  return (
    product.stockQuantity > 0 &&
    product.stockQuantity <=
      product.lowStockThreshold
  );
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(value);
}

export default function InventoryAlerts({
  products,
  onAdjust,
}: InventoryAlertsProps) {
  const activeProducts =
    products.filter(
      (product) =>
        product.isActive,
    );

  /*
   * ============================================================
   * INVENTORY DASHBOARD
   * ============================================================
   */

  const totalStockUnits =
    activeProducts.reduce(
      (total, product) =>
        total +
        Math.max(
          0,
          product.stockQuantity,
        ),
      0,
    );

  const inventoryCostValue =
    activeProducts.reduce(
      (total, product) =>
        total +
        Math.max(
          0,
          product.stockQuantity,
        ) *
          Math.max(
            0,
            product.purchasePrice ?? 0,
          ),
      0,
    );

  const inventoryRetailValue =
    activeProducts.reduce(
      (total, product) =>
        total +
        Math.max(
          0,
          product.stockQuantity,
        ) *
          Math.max(
            0,
            product.sellingPrice ?? 0,
          ),
      0,
    );

  const potentialProfit =
    inventoryRetailValue -
    inventoryCostValue;

  const outOfStockProducts =
    activeProducts.filter(
      isOutOfStock,
    );

  const lowStockProducts =
    activeProducts.filter(
      isLowStock,
    );

  const alertProducts = [
    ...outOfStockProducts.map(
      (product) => ({
        product,
        type: "out" as const,
      }),
    ),

    ...lowStockProducts.map(
      (product) => ({
        product,
        type: "low" as const,
      }),
    ),
  ];

  const hasAlerts =
    alertProducts.length > 0;

  return (
    <section className="space-y-6">
      {/* ====================================================== */}
      {/* INVENTORY DASHBOARD */}
      {/* ====================================================== */}

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Inventory dashboard
          </h2>

          <p className="text-sm text-muted-foreground">
            A quick overview of your current inventory,
            stock value, and potential profit.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            icon={
              <Boxes className="size-5" />
            }
            label="Total stock units"
            value={totalStockUnits.toLocaleString(
              "en-IN",
            )}
            description={`${activeProducts.length} active products`}
            tone="blue"
          />

          <DashboardCard
            icon={
              <CircleDollarSign className="size-5" />
            }
            label="Inventory cost value"
            value={formatCurrency(
              inventoryCostValue,
            )}
            description="Current stock at purchase cost"
            tone="purple"
          />

          <DashboardCard
            icon={
              <PackageCheck className="size-5" />
            }
            label="Retail value"
            value={formatCurrency(
              inventoryRetailValue,
            )}
            description="Current stock at selling price"
            tone="green"
          />

          <DashboardCard
            icon={
              <TrendingUp className="size-5" />
            }
            label="Potential profit"
            value={formatCurrency(
              potentialProfit,
            )}
            description="Retail value minus cost value"
            tone="amber"
          />
        </div>
      </div>

      {/* ====================================================== */}
      {/* ALERT SUMMARY */}
      {/* ====================================================== */}

      <div className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Inventory alerts
            </h2>

            <p className="text-sm text-muted-foreground">
              Products that need your attention based on
              their current stock thresholds.
            </p>
          </div>

          {hasAlerts && (
            <span className="inline-flex w-fit items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
              {alertProducts.length}{" "}
              {alertProducts.length === 1
                ? "alert"
                : "alerts"}
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AlertSummaryCard
            icon={
              <AlertTriangle className="size-5" />
            }
            label="Low stock"
            value={
              lowStockProducts.length
            }
            description="Above zero, but at or below the alert threshold."
            tone="warning"
          />

          <AlertSummaryCard
            icon={
              <XCircle className="size-5" />
            }
            label="Out of stock"
            value={
              outOfStockProducts.length
            }
            description="Active products with zero available units."
            tone="danger"
          />
        </div>
      </div>

      {/* ====================================================== */}
      {/* ALERT PRODUCTS */}
      {/* ====================================================== */}

      {hasAlerts ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {alertProducts.map(
            ({
              product,
              type,
            }) => (
              <div
                key={
                  product._id
                }
                className={[
                  "rounded-2xl border bg-card p-4 shadow-sm",
                  type === "out"
                    ? "border-red-500/20"
                    : "border-amber-500/20",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      type === "out"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    ].join(" ")}
                  >
                    {type === "out" ? (
                      <XCircle className="size-5" />
                    ) : (
                      <AlertTriangle className="size-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {
                            product.name
                          }
                        </h3>

                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {product.sku
                            ? `SKU: ${product.sku}`
                            : "No SKU"}
                        </p>
                      </div>

                      <span
                        className={[
                          "inline-flex w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          type === "out"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        ].join(" ")}
                      >
                        {type === "out"
                          ? "Out of stock"
                          : "Low stock"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Current stock
                        </p>

                        <p
                          className={[
                            "mt-1 text-lg font-bold",
                            type === "out"
                              ? "text-red-600 dark:text-red-400"
                              : "text-amber-600 dark:text-amber-400",
                          ].join(" ")}
                        >
                          {
                            product.stockQuantity
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Alert at
                        </p>

                        <p className="mt-1 text-lg font-bold">
                          {
                            product.lowStockThreshold
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        {type === "out"
                          ? "Add stock before this product can be sold from inventory."
                          : `${
                              product.lowStockThreshold -
                              product.stockQuantity
                            } units below the threshold.`}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          onAdjust(
                            "in",
                            product._id,
                          )
                        }
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Plus className="size-3.5" />
                        Add stock
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownToLine className="size-5" />
            </div>

            <h3 className="mt-3 font-semibold">
              Inventory looks healthy
            </h3>

            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              No active products are currently low on
              stock or out of stock.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function DashboardCard({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  tone:
    | "blue"
    | "purple"
    | "green"
    | "amber";
}) {
  const toneClasses = {
    blue:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400",

    purple:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400",

    green:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",

    amber:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div
          className={[
            "flex size-10 items-center justify-center rounded-xl",
            toneClasses[tone],
          ].join(" ")}
        >
          {icon}
        </div>

        <p className="max-w-[75%] truncate text-right text-lg font-bold">
          {value}
        </p>
      </div>

      <p className="mt-3 text-sm font-semibold">
        {label}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function AlertSummaryCard({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  tone:
    | "warning"
    | "danger";
}) {
  const toneClasses =
    tone === "danger"
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : "bg-amber-500/10 text-amber-600 dark:text-amber-400";

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div
          className={[
            "flex size-10 items-center justify-center rounded-xl",
            toneClasses,
          ].join(" ")}
        >
          {icon}
        </div>

        <p className="text-2xl font-bold">
          {value}
        </p>
      </div>

      <p className="mt-3 text-sm font-semibold">
        {label}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}