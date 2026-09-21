import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  Boxes,
  Check,
  Edit3,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

interface Product {
  _id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  warrantyPeriodMonths: number;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  purchasePrice: string;
  sellingPrice: string;
  stockQuantity: string;
  lowStockThreshold: string;
  warrantyPeriodMonths: string;
  description: string;
}

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  category: "",
  purchasePrice: "0",
  sellingPrice: "0",
  stockQuantity: "0",
  lowStockThreshold: "5",
  warrantyPeriodMonths: "0",
  description: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function createForm(
  product: Product,
): ProductForm {
  return {
    name: product.name,
    sku: product.sku ?? "",
    category: product.category ?? "",
    purchasePrice: String(
      product.purchasePrice,
    ),
    sellingPrice: String(
      product.sellingPrice,
    ),
    stockQuantity: String(
      product.stockQuantity,
    ),
    lowStockThreshold: String(
      product.lowStockThreshold,
    ),
    warrantyPeriodMonths: String(
      product.warrantyPeriodMonths,
    ),
    description:
      product.description ?? "",
  };
}

function isLowStock(product: Product) {
  return (
    product.isActive &&
    product.stockQuantity <=
    product.lowStockThreshold
  );
}

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<
      "all" | "active" | "inactive"
    >("all");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<ProductForm>(emptyForm);

  const [formError, setFormError] =
    useState("");

  const [deleteTarget, setDeleteTarget] =
    useState<Product | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  async function loadProducts(
    showRefresh = false,
  ) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `${API_URL}/products?limit=100`,
        {
          credentials: "include",
        },
      );

      const data =
        await response.json().catch(
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
          : Array.isArray(data?.products)
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

      setProducts(nextProducts);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load products.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return products.filter(
        (product) => {
          const matchesSearch =
            !normalizedSearch ||
            product.name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            product.sku
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            product.category
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" &&
              product.isActive) ||
            (statusFilter === "inactive" &&
              !product.isActive);

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      products,
      search,
      statusFilter,
    ]);

  const activeCount = products.filter(
    (product) => product.isActive,
  ).length;

  const inactiveCount =
    products.length - activeCount;

  const lowStockCount = products.filter(
    isLowStock,
  ).length;

  function openCreateModal() {
    setEditingProduct(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(
    product: Product,
  ) {
    setEditingProduct(product);
    setForm(createForm(product));
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingProduct(null);
    setFormError("");
  }

  function updateForm(
    field: keyof ProductForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setFormError("");

    if (!form.name.trim()) {
      setFormError(
        "Product name is required.",
      );
      return;
    }

    const purchasePrice =
      Number(form.purchasePrice);

    const sellingPrice =
      Number(form.sellingPrice);

    const stockQuantity =
      Number(form.stockQuantity);

    const lowStockThreshold =
      Number(form.lowStockThreshold);

    const warrantyPeriodMonths =
      Number(
        form.warrantyPeriodMonths,
      );

    if (
      !Number.isFinite(
        purchasePrice,
      ) ||
      purchasePrice < 0
    ) {
      setFormError(
        "Purchase price must be a valid non-negative number.",
      );
      return;
    }

    if (
      !Number.isFinite(
        sellingPrice,
      ) ||
      sellingPrice < 0
    ) {
      setFormError(
        "Selling price must be a valid non-negative number.",
      );
      return;
    }

    if (
      !Number.isFinite(
        stockQuantity,
      ) ||
      stockQuantity < 0
    ) {
      setFormError(
        "Stock quantity must be a valid non-negative number.",
      );
      return;
    }

    if (
      !Number.isFinite(
        lowStockThreshold,
      ) ||
      lowStockThreshold < 0
    ) {
      setFormError(
        "Low-stock threshold must be a valid non-negative number.",
      );
      return;
    }

    if (
      !Number.isInteger(
        warrantyPeriodMonths,
      ) ||
      warrantyPeriodMonths < 0 ||
      warrantyPeriodMonths > 1200
    ) {
      setFormError(
        "Warranty period must be a whole number between 0 and 1200 months.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        category:
          form.category.trim() ||
          undefined,
        purchasePrice,
        sellingPrice,
        stockQuantity,
        lowStockThreshold,
        warrantyPeriodMonths,
        description:
          form.description.trim() ||
          undefined,
      };

      const url = editingProduct
        ? `${API_URL}/products/${editingProduct._id}`
        : `${API_URL}/products`;

      const method = editingProduct
        ? "PATCH"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data =
        await response.json().catch(
          () => null,
        );

      if (!response.ok) {
        throw new Error(
          data?.message ??
          "Unable to save product.",
        );
      }

      setModalOpen(false);
      setEditingProduct(null);
      setFormError("");

      await loadProducts(true);
    } catch (requestError) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save product.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(
    product: Product,
  ) {
    try {
      setDeleting(true);

      const response = await fetch(
        `${API_URL}/products/${product._id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data =
        await response.json().catch(
          () => null,
        );

      if (!response.ok) {
        throw new Error(
          data?.message ??
          "Unable to deactivate product.",
        );
      }

      setDeleteTarget(null);

      await loadProducts(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to deactivate product.",
      );
    } finally {
      setDeleting(false);
    }
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
                Products
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage your product catalog,
                pricing, stock and warranties.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              void loadProducts(true)
            }
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw
              className={[
                "size-4",
                refreshing
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />
            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Add product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="size-5" />}
          label="Total products"
          value={products.length}
        />

        <StatCard
          icon={<Check className="size-5" />}
          label="Active products"
          value={activeCount}
        />

        <StatCard
          icon={
            <AlertTriangle className="size-5" />
          }
          label="Low stock"
          value={lowStockCount}
        />

        <StatCard
          icon={<Boxes className="size-5" />}
          label="Inactive products"
          value={inactiveCount}
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search by name, SKU or category..."
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex rounded-xl border bg-muted/30 p-1">
            {(
              [
                ["all", "All"],
                ["active", "Active"],
                ["inactive", "Inactive"],
              ] as const
            ).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      value,
                    )
                  }
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    statusFilter ===
                      value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading products...
            </div>
          </div>
        ) : filteredProducts.length ===
          0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Package className="size-7" />
            </div>

            <h2 className="mt-4 font-semibold">
              {products.length === 0
                ? "No products yet"
                : "No products found"}
            </h2>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {products.length === 0
                ? "Add your first product to start building your BillNest catalog."
                : "Try changing your search or status filter."}
            </p>

            {products.length ===
              0 && (
                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="size-4" />
                  Add your first product
                </button>
              )}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">
                      Product
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Category
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Selling price
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Stock
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Warranty
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredProducts.map(
                    (product) => {
                      const lowStock =
                        isLowStock(
                          product,
                        );

                      return (
                        <tr
                          key={
                            product._id
                          }
                          className="transition-colors hover:bg-muted/20"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Package className="size-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {
                                    product.name
                                  }
                                </p>

                                {product.sku && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    SKU:{" "}
                                    {
                                      product.sku
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-muted-foreground">
                            {product.category ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 font-medium">
                            {formatCurrency(
                              product.sellingPrice,
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  lowStock
                                    ? "font-semibold text-amber-600 dark:text-amber-400"
                                    : "font-medium"
                                }
                              >
                                {
                                  product.stockQuantity
                                }
                              </span>

                              {lowStock && (
                                <AlertTriangle className="size-4 text-amber-500" />
                              )}
                            </div>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Alert at{" "}
                              {
                                product.lowStockThreshold
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4 text-muted-foreground">
                            {product.warrantyPeriodMonths >
                              0
                              ? `${product.warrantyPeriodMonths} months`
                              : "No warranty"}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              active={
                                product.isActive
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    product,
                                  )
                                }
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                title="Edit product"
                              >
                                <Edit3 className="size-4" />
                              </button>

                              {product.isActive && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget(
                                      product,
                                    )
                                  }
                                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                  title="Deactivate product"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y md:hidden">
              {filteredProducts.map(
                (product) => {
                  const lowStock =
                    isLowStock(
                      product,
                    );

                  return (
                    <div
                      key={
                        product._id
                      }
                      className="p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Package className="size-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold">
                                {
                                  product.name
                                }
                              </h3>

                              {product.sku && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  SKU:{" "}
                                  {
                                    product.sku
                                  }
                                </p>
                              )}
                            </div>

                            <StatusBadge
                              active={
                                product.isActive
                              }
                            />
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <InfoItem
                              label="Selling price"
                              value={formatCurrency(
                                product.sellingPrice,
                              )}
                            />

                            <InfoItem
                              label="Stock"
                              value={`${product.stockQuantity}${lowStock ? " · Low" : ""}`}
                              warning={
                                lowStock
                              }
                            />

                            <InfoItem
                              label="Category"
                              value={
                                product.category ||
                                "—"
                              }
                            />

                            <InfoItem
                              label="Warranty"
                              value={
                                product.warrantyPeriodMonths >
                                  0
                                  ? `${product.warrantyPeriodMonths} months`
                                  : "None"
                              }
                            />
                          </div>

                          <div className="mt-4 flex gap-2 border-t pt-3">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  product,
                                )
                              }
                              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-xs font-semibold hover:bg-muted"
                            >
                              <Edit3 className="size-3.5" />
                              Edit
                            </button>

                            {product.isActive && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget(
                                    product,
                                  )
                                }
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-3.5" />
                                Deactivate
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </>
        )}
      </section>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingProduct
                    ? "Edit product"
                    : "Add product"}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Keep your product catalog
                  information up to date.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(90vh-80px)] overflow-y-auto"
            >
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field
                  label="Product name"
                  required
                  value={form.name}
                  onChange={(value) =>
                    updateForm(
                      "name",
                      value,
                    )
                  }
                  placeholder="e.g. Wireless Keyboard"
                  className="sm:col-span-2"
                />

                <Field
                  label="SKU"
                  value={form.sku}
                  onChange={(value) =>
                    updateForm(
                      "sku",
                      value,
                    )
                  }
                  placeholder="e.g. KB-001"
                />

                <Field
                  label="Category"
                  value={form.category}
                  onChange={(value) =>
                    updateForm(
                      "category",
                      value,
                    )
                  }
                  placeholder="e.g. Accessories"
                />

                <Field
                  label="Purchase price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.purchasePrice
                  }
                  onChange={(value) =>
                    updateForm(
                      "purchasePrice",
                      value,
                    )
                  }
                  prefix="₹"
                />

                <Field
                  label="Selling price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.sellingPrice
                  }
                  onChange={(value) =>
                    updateForm(
                      "sellingPrice",
                      value,
                    )
                  }
                  prefix="₹"
                />

                <Field
                  label="Stock quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.stockQuantity
                  }
                  onChange={(value) =>
                    updateForm(
                      "stockQuantity",
                      value,
                    )
                  }
                />

                <Field
                  label="Low-stock alert"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.lowStockThreshold
                  }
                  onChange={(value) =>
                    updateForm(
                      "lowStockThreshold",
                      value,
                    )
                  }
                />

                <Field
                  label="Warranty period"
                  type="number"
                  min="0"
                  max="1200"
                  step="1"
                  value={
                    form.warrantyPeriodMonths
                  }
                  onChange={(value) =>
                    updateForm(
                      "warrantyPeriodMonths",
                      value,
                    )
                  }
                  suffix="months"
                />

                <div className="sm:col-span-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Description
                    </span>

                    <textarea
                      value={
                        form.description
                      }
                      onChange={(event) =>
                        updateForm(
                          "description",
                          event.target
                            .value,
                        )
                      }
                      rows={4}
                      maxLength={2000}
                      placeholder="Optional product description..."
                      className="w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                </div>

                {formError && (
                  <div className="sm:col-span-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    {formError}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t bg-muted/20 p-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-10 rounded-xl border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 className="size-4 animate-spin" />
                  )}

                  {editingProduct
                    ? "Save changes"
                    : "Create product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              Deactivate product?
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">
                {deleteTarget.name}
              </span>{" "}
              will no longer appear as an active
              catalog product. Existing invoices
              remain unchanged.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(
                    null,
                  )
                }
                disabled={deleting}
                className="h-10 rounded-xl border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDeactivate(
                    deleteTarget,
                  )
                }
                disabled={deleting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
              >
                {deleting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Deactivate
              </button>
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
      <div className="flex items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          {icon}
        </div>

        <span className="text-2xl font-bold">
          {value}
        </span>
      </div>

      <p className="mt-3 text-xs font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        active
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
      ].join(" ")}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function InfoItem({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">
        {label}
      </p>

      <p
        className={
          warning
            ? "mt-0.5 text-sm font-semibold text-amber-600 dark:text-amber-400"
            : "mt-0.5 text-sm font-medium"
        }
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  min,
  max,
  step,
  prefix,
  suffix,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <label
      className={`block ${className}`}
    >
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
        {required && (
          <span className="ml-1 text-destructive">
            *
          </span>
        )}
      </span>

      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          className={[
            "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
            prefix ? "pl-7" : "",
            suffix ? "pr-16" : "",
          ].join(" ")}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}