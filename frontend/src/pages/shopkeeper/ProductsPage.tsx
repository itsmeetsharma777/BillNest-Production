import {
  useEffect,
  useMemo,
  useState,
} from "react";
import ProductUnitSelect from "@/components/shopkeeper/ProductUnitSelect";
import ProductImageManager from "@/components/shopkeeper/ProductImageManager";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Barcode,
  BarChart3,
  Boxes,
  Check,
  Download,
  Edit3,
  Loader2,
  Package,
  Plus,
  SlidersHorizontal,
  Upload,
  RefreshCw,
  Search,
  ScanLine,
  Trash2,
  X,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */
interface ProductImage {
  _id: string;
  url: string;
  publicId: string;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Product {
  _id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  brand?: string | null;
  barcode?: string | null;
  unit?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  warrantyPeriodMonths: number;
  description?: string | null;
  images?: ProductImage[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  profitAmount?: number;
  profitMarginPercent?: number;
  markupPercent?: number;
}

interface Category {
  _id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Brand {
  _id: string;
  name: string;
  manufacturer?: string | null;
  description?: string | null;
  website?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  brand: string;
  barcode: string;
  unit: string;
  purchasePrice: string;
  sellingPrice: string;
  stockQuantity: string;
  lowStockThreshold: string;
  warrantyPeriodMonths: string;
  description: string;
}

/*
 * ============================================================
 * FORM DEFAULTS
 * ============================================================
 */

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  category: "",
  brand: "",
  barcode: "",
  unit: "",
  purchasePrice: "0",
  sellingPrice: "0",
  stockQuantity: "0",
  lowStockThreshold: "5",
  warrantyPeriodMonths: "0",
  description: "",
};

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

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

/*
 * GTIN check-digit validation.
 *
 * Numeric barcodes with standard GTIN lengths are validated:
 *
 * GTIN-8
 * GTIN-12 / UPC-A
 * GTIN-13 / EAN-13
 * GTIN-14
 *
 * Non-numeric barcode formats are allowed because businesses
 * can use Code 128, Code 39, internal labels, etc.
 */
function calculateProfit(
  purchasePrice: number,
  sellingPrice: number,
) {
  return (
    Math.round(
      (
        sellingPrice -
        purchasePrice +
        Number.EPSILON
      ) * 100,
    ) / 100
  );
}

function calculateMargin(
  purchasePrice: number,
  sellingPrice: number,
) {
  if (sellingPrice <= 0) {
    return 0;
  }

  return (
    Math.round(
      (
        (calculateProfit(
          purchasePrice,
          sellingPrice,
        ) /
          sellingPrice) *
          100 +
        Number.EPSILON
      ) * 100,
    ) / 100
  );
}

function calculateMarkup(
  purchasePrice: number,
  sellingPrice: number,
) {
  if (purchasePrice <= 0) {
    return 0;
  }

  return (
    Math.round(
      (
        (calculateProfit(
          purchasePrice,
          sellingPrice,
        ) /
          purchasePrice) *
          100 +
        Number.EPSILON
      ) * 100,
    ) / 100
  );
}

function pricingStatus(
  purchasePrice: number,
  sellingPrice: number,
) {
  const profit = calculateProfit(
    purchasePrice,
    sellingPrice,
  );

  if (profit > 0) {
    return "profit";
  }

  if (profit < 0) {
    return "loss";
  }

  return "break-even";
}

function isValidGtin(
  value: string,
) {
  if (!/^\d+$/.test(value)) {
    return true;
  }

  if (
    ![8, 12, 13, 14].includes(
      value.length,
    )
  ) {
    return false;
  }

  const digits =
    value.split("").map(Number);

  const checkDigit =
    digits.pop();

  if (
    checkDigit === undefined
  ) {
    return false;
  }

  let sum = 0;
  let multiplier = 3;

  for (
    let index =
      digits.length - 1;
    index >= 0;
    index--
  ) {
    sum +=
      digits[index] *
      multiplier;

    multiplier =
      multiplier === 3
        ? 1
        : 3;
  }

  const calculated =
    (10 - (sum % 10)) % 10;

  return (
    calculated === checkDigit
  );
}

function createForm(
  product: Product,
): ProductForm {
  return {
    name: product.name,
    sku: product.sku ?? "",
    category:
      product.category ?? "",
    brand: product.brand ?? "",
    barcode:
      product.barcode ?? "",
    unit: product.unit ?? "",
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

function isLowStock(
  product: Product,
) {
  return (
    product.isActive &&
    product.stockQuantity <=
    product.lowStockThreshold
  );
}

function extractCategories(
  data: unknown,
): Category[] {
  const typed =
    data as {
      data?: {
        categories?: Category[];
      };
      categories?: Category[];
    };

  if (
    Array.isArray(
      typed?.data?.categories,
    )
  ) {
    return typed.data.categories;
  }

  if (
    Array.isArray(
      typed?.categories,
    )
  ) {
    return typed.categories;
  }

  if (Array.isArray(data)) {
    return data as Category[];
  }

  return [];
}

function extractBrands(
  data: unknown,
): Brand[] {
  const typed =
    data as {
      data?: {
        brands?: Brand[];
      };
      brands?: Brand[];
    };

  if (
    Array.isArray(
      typed?.data?.brands,
    )
  ) {
    return typed.data.brands;
  }

  if (
    Array.isArray(
      typed?.brands,
    )
  ) {
    return typed.brands;
  }

  if (Array.isArray(data)) {
    return data as Brand[];
  }

  return [];
}

function extractProduct(
  data: unknown,
): Product | null {
  const typed =
    data as {
      data?: {
        product?: Product;
      };
      product?: Product;
    };

  if (
    typed?.data?.product
  ) {
    return typed.data.product;
  }

  if (typed?.product) {
    return typed.product;
  }

  return null;
}

/*
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function ProductsPage() {
  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    categories,
    setCategories,
  ] = useState<Category[]>([]);

  const [
    brands,
    setBrands,
  ] = useState<Brand[]>([]);

  const [
    catalogLoading,
    setCatalogLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingProduct,
    setEditingProduct,
  ] = useState<Product | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<ProductForm>(
    emptyForm,
  );

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<Product | null>(
    null,
  );

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  /*
   * ==========================================================
   * BARCODE LOOKUP STATE
   * ==========================================================
   */

  const [
    lookupBarcode,
    setLookupBarcode,
  ] = useState("");

  const [
    lookupLoading,
    setLookupLoading,
  ] = useState(false);

  const [
    lookupError,
    setLookupError,
  ] = useState("");

  const [
    lookupResult,
    setLookupResult,
  ] = useState<Product | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [hasBarcodeFilter, setHasBarcodeFilter] = useState<"all" | "true" | "false">("all");
  const [hasVariantsFilter, setHasVariantsFilter] = useState<"all" | "true" | "false">("all");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "sellingPrice" | "stockQuantity">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [catalogAnalytics, setCatalogAnalytics] = useState<Record<string, number> | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  /*
   * ==========================================================
   * LOAD PRODUCTS
   * ==========================================================
   */

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

      const nextProducts: Product[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 50) {
        const response = await fetch(
          API_URL + "/products?page=" + page + "&limit=100",
          { credentials: "include" },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message ?? "Unable to load products.");
        }

        const batch = Array.isArray(data?.data?.products)
          ? data.data.products
          : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : [];

        nextProducts.push(...batch);
        hasMore = Boolean(data?.data?.pagination?.hasMore);
        page += 1;
      }

      setProducts(
        nextProducts,
      );
    } catch (
    requestError
    ) {
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

  /*
   * ==========================================================
   * LOAD CATEGORIES + BRANDS
   * ==========================================================
   */

  async function loadCatalogData() {
    try {
      setCatalogLoading(true);

      const [
        categoriesResponse,
        brandsResponse,
      ] =
        await Promise.all([
          fetch(
            `${API_URL}/categories?isActive=all`,
            {
              credentials:
                "include",
            },
          ),
          fetch(
            `${API_URL}/brands?isActive=all`,
            {
              credentials:
                "include",
            },
          ),
        ]);

      const [
        categoriesData,
        brandsData,
      ] =
        await Promise.all([
          categoriesResponse
            .json()
            .catch(
              () => null,
            ),
          brandsResponse
            .json()
            .catch(
              () => null,
            ),
        ]);

      if (
        !categoriesResponse.ok
      ) {
        throw new Error(
          categoriesData?.message ??
          "Unable to load categories.",
        );
      }

      if (
        !brandsResponse.ok
      ) {
        throw new Error(
          brandsData?.message ??
          "Unable to load brands.",
        );
      }

      setCategories(
        extractCategories(
          categoriesData,
        ),
      );

      setBrands(
        extractBrands(
          brandsData,
        ),
      );
    } catch (
    requestError
    ) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load catalog data.",
      );
    } finally {
      setCatalogLoading(
        false,
      );
    }
  }

  useEffect(() => {
    void loadProducts();
    void loadCatalogData();
    void loadCatalogAnalytics();
  }, []);

  /*
   * ==========================================================
   * ACTIVE CATALOG OPTIONS
   * ==========================================================
   */

  const activeCategories =
    useMemo(
      () =>
        categories
          .filter(
            (category) =>
              category.isActive,
          )
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name,
              ),
          ),
      [categories],
    );

  const activeBrands =
    useMemo(
      () =>
        brands
          .filter(
            (brand) =>
              brand.isActive,
          )
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name,
              ),
          ),
      [brands],
    );

  /*
   * ==========================================================
   * FILTER PRODUCTS
   * ==========================================================
   */

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const minPrice = minPriceFilter === "" ? undefined : Number(minPriceFilter);
    const maxPrice = maxPriceFilter === "" ? undefined : Number(maxPriceFilter);
    return [...products].filter((product) => {
      const haystack = [product.name, product.sku, product.category, product.brand, product.barcode].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" && product.isActive) || (statusFilter === "inactive" && !product.isActive);
      const matchesCategory = !categoryFilter || product.category === categoryFilter;
      const matchesBrand = !brandFilter || product.brand === brandFilter;
      const matchesBarcode = hasBarcodeFilter === "all" || (hasBarcodeFilter === "true" && Boolean(product.barcode)) || (hasBarcodeFilter === "false" && !product.barcode);
      const hasVariants = Boolean((product as Product & { hasVariants?: boolean }).hasVariants);
      const matchesVariants = hasVariantsFilter === "all" || (hasVariantsFilter === "true" && hasVariants) || (hasVariantsFilter === "false" && !hasVariants);
      const matchesStock = stockFilter === "all" || (stockFilter === "in_stock" && product.stockQuantity > 0) || (stockFilter === "out_of_stock" && product.stockQuantity === 0) || (stockFilter === "low_stock" && isLowStock(product));
      const matchesMin = minPrice === undefined || (Number.isFinite(minPrice) && product.sellingPrice >= minPrice);
      const matchesMax = maxPrice === undefined || (Number.isFinite(maxPrice) && product.sellingPrice <= maxPrice);
      return matchesSearch && matchesStatus && matchesCategory && matchesBrand && matchesBarcode && matchesVariants && matchesStock && matchesMin && matchesMax;
    }).sort((a, b) => {
      const av = sortBy === "name" ? a.name.toLowerCase() : sortBy === "sellingPrice" ? a.sellingPrice : sortBy === "stockQuantity" ? a.stockQuantity : (a.createdAt ?? "");
      const bv = sortBy === "name" ? b.name.toLowerCase() : sortBy === "sellingPrice" ? b.sellingPrice : sortBy === "stockQuantity" ? b.stockQuantity : (b.createdAt ?? "");
      const result = av < bv ? -1 : av > bv ? 1 : 0;
      return sortOrder === "asc" ? result : -result;
    });
  }, [products, search, statusFilter, categoryFilter, brandFilter, hasBarcodeFilter, hasVariantsFilter, stockFilter, minPriceFilter, maxPriceFilter, sortBy, sortOrder]);
  const activeCount =
    products.filter(
      (product) =>
        product.isActive,
    ).length;

  const inactiveCount =
    products.length -
    activeCount;

  const lowStockCount =
    products.filter(
      isLowStock,
    ).length;

  const barcodeCount =
    products.filter(
      (product) =>
        Boolean(
          product.barcode,
        ),
    ).length;

  async function loadCatalogAnalytics() {
    try {
      const response = await fetch(API_URL + "/product-catalog/analytics", { credentials: "include" });
      const data = await response.json().catch(() => null);
      if (response.ok) setCatalogAnalytics(data?.data?.analytics ?? null);
    } catch {}
  }

  async function handleBulkStatus(action: "activate" | "deactivate") {
    if (!selectedIds.length) return;
    try {
      setBulkUpdating(true);
      const response = await fetch(API_URL + "/product-catalog/bulk-status", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productIds: selectedIds, action }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Unable to update selected products.");
      setSelectedIds([]);
      await Promise.all([loadProducts(true), loadCatalogAnalytics()]);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to update selected products."); }
    finally { setBulkUpdating(false); }
  }

  function toggleProductSelection(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function exportCatalog() {
    try {
      setExporting(true);
      const response = await fetch(API_URL + "/product-catalog/export", { credentials: "include" });
      if (!response.ok) { const data = await response.json().catch(() => null); throw new Error(data?.message ?? "Unable to export products."); }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "billnest-products.csv"; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to export products."); }
    finally { setExporting(false); }
  }

  async function importCatalog(file: File) {
    try {
      setImporting(true);
      const csv = await file.text();
      const response = await fetch(API_URL + "/product-catalog/import", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv }) });
      const data = await response.json().catch(() => null);
      if (!response.ok && response.status !== 207) throw new Error(data?.message ?? "Unable to import products.");
      const failed = data?.data?.failedCount ?? 0;
      setError(failed ? "Import finished with " + (data?.data?.importedCount ?? 0) + " imported and " + failed + " failed." : "");
      await Promise.all([loadProducts(true), loadCatalogAnalytics()]);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to import products."); }
    finally { setImporting(false); if (importInputRef.current) importInputRef.current.value = ""; }
  }
  /*
   * ==========================================================
   * MODAL
   * ==========================================================
   */

  function openCreateModal() {
    setEditingProduct(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(
    product: Product,
  ) {
    setEditingProduct(
      product,
    );
    setForm(
      createForm(product),
    );
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingProduct(null);
    setFormError("");
  }

  function updateForm(
    field: keyof ProductForm,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  /*
   * ==========================================================
   * SAVE PRODUCT
   * ==========================================================
   */

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

    const barcode =
      form.barcode.trim();

    if (
      barcode &&
      !isValidGtin(barcode)
    ) {
      setFormError(
        "Invalid GTIN barcode. Use a valid GTIN-8, GTIN-12, GTIN-13, GTIN-14, or a non-numeric barcode format.",
      );
      return;
    }

    const purchasePrice =
      Number(
        form.purchasePrice,
      );

    const sellingPrice =
      Number(
        form.sellingPrice,
      );

    const stockQuantity =
      Number(
        form.stockQuantity,
      );

    const lowStockThreshold =
      Number(
        form.lowStockThreshold,
      );

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
      warrantyPeriodMonths <
      0 ||
      warrantyPeriodMonths >
      1200
    ) {
      setFormError(
        "Warranty period must be a whole number between 0 and 1200 months.",
      );
      return;
    }

    if (
      form.category &&
      !categories.some(
        (category) =>
          category.name ===
          form.category,
      )
    ) {
      setFormError(
        "Selected category is no longer available.",
      );
      return;
    }

    if (
      form.brand &&
      !brands.some(
        (brand) =>
          brand.name ===
          form.brand,
      )
    ) {
      setFormError(
        "Selected brand is no longer available.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name:
          form.name.trim(),

        sku:
          form.sku.trim() ||
          undefined,

        category:
          form.category.trim() ||
          undefined,

        brand:
          form.brand.trim() ||
          undefined,

        barcode:
          barcode || undefined,

        unit:
          form.unit.trim() ||
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

      const url =
        editingProduct
          ? `${API_URL}/products/${editingProduct._id}`
          : `${API_URL}/products`;

      const method =
        editingProduct
          ? "PATCH"
          : "POST";

      const response =
        await fetch(
          url,
          {
            method,
            credentials:
              "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(
                payload,
              ),
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
          "Unable to save product.",
        );
      }

      setModalOpen(false);
      setEditingProduct(null);
      setFormError("");

      await loadProducts(true);
    } catch (
    requestError
    ) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save product.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ==========================================================
   * BARCODE LOOKUP
   * ==========================================================
   */

  async function handleBarcodeLookup(
    event?: React.FormEvent,
  ) {
    event?.preventDefault();

    const barcode =
      lookupBarcode.trim();

    setLookupError("");
    setLookupResult(null);

    if (!barcode) {
      setLookupError(
        "Enter a barcode to search.",
      );
      return;
    }

    try {
      setLookupLoading(true);

      const response =
        await fetch(
          `${API_URL}/products/barcode/${encodeURIComponent(barcode)}`,
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
          "No product was found with this barcode.",
        );
      }

      const product =
        extractProduct(data);

      if (!product) {
        throw new Error(
          "The barcode lookup returned no product.",
        );
      }

      setLookupResult(
        product,
      );
    } catch (
    requestError
    ) {
      setLookupError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to look up barcode.",
      );
    } finally {
      setLookupLoading(
        false,
      );
    }
  }

  /*
   * ==========================================================
   * DEACTIVATE
   * ==========================================================
   */

  async function handleDeactivate(
    product: Product,
  ) {
    try {
      setDeleting(true);

      const response =
        await fetch(
          `${API_URL}/products/${product._id}`,
          {
            method: "DELETE",
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
          "Unable to deactivate product.",
        );
      }

      setDeleteTarget(null);

      await loadProducts(true);
    } catch (
    requestError
    ) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to deactivate product.",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadProducts(true), loadCatalogData(), loadCatalogAnalytics()]);
  }

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
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
                pricing, stock, brands,
                barcodes and warranties.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              void refreshAll()
            }
            disabled={
              refreshing ||
              catalogLoading
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw
              className={[
                "size-4",
                refreshing ||
                  catalogLoading
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
            onClick={
              openCreateModal
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Add product
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={
            <Package className="size-5" />
          }
          label="Total products"
          value={
            products.length
          }
        />

        <StatCard
          icon={
            <Check className="size-5" />
          }
          label="Active products"
          value={
            activeCount
          }
        />

        <StatCard
          icon={
            <AlertTriangle className="size-5" />
          }
          label="Low stock"
          value={
            lowStockCount
          }
        />

        <StatCard
          icon={
            <Barcode className="size-5" />
          }
          label="Barcoded"
          value={
            barcodeCount
          }
        />

        <StatCard
          icon={
            <Boxes className="size-5" />
          }
          label="Inactive products"
          value={
            inactiveCount
          }
        />
      </div>

      {/* ERROR */}
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

      {/* SEARCH + BARCODE LOOKUP */}
      <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="search"
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Search by name, SKU, category, brand or barcode..."
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex rounded-xl border bg-muted/30 p-1">
            {(
              [
                ["all", "All"],
                [
                  "active",
                  "Active",
                ],
                [
                  "inactive",
                  "Inactive",
                ],
              ] as const
            ).map(
              ([
                value,
                label,
              ]) => (
                <button
                  key={
                    value
                  }
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
                  ].join(
                    " ",
                  )}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>

        {/* EXACT BARCODE LOOKUP */}
        <form
          onSubmit={
            handleBarcodeLookup
          }
          className="rounded-xl border bg-muted/20 p-3"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 lg:w-52">
              <ScanLine className="size-4 text-primary" />

              <div>
                <p className="text-xs font-semibold">
                  Barcode lookup
                </p>

                <p className="text-[11px] text-muted-foreground">
                  Exact product search
                </p>
              </div>
            </div>

            <div className="relative flex-1">
              <Barcode className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="text"
                value={
                  lookupBarcode
                }
                onChange={(
                  event,
                ) => {
                  setLookupBarcode(
                    event.target
                      .value,
                  );
                  setLookupError(
                    "",
                  );
                  setLookupResult(
                    null,
                  );
                }}
                placeholder="Scan or enter barcode..."
                autoComplete="off"
                className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={
                lookupLoading
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {lookupLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}

              Lookup
            </button>
          </div>

          {lookupError && (
            <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {lookupError}
            </div>
          )}

          {lookupResult && (
            <div className="mt-3 flex flex-col gap-3 rounded-xl border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="size-4" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {
                      lookupResult.name
                    }
                  </p>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>
                      Barcode:{" "}
                      <span className="font-mono text-foreground">
                        {
                          lookupResult.barcode
                        }
                      </span>
                    </span>

                    <span>
                      Stock:{" "}
                      <span className="font-medium text-foreground">
                        {
                          lookupResult.stockQuantity
                        }
                      </span>
                    </span>

                    <span>
                      Price:{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(
                          lookupResult.sellingPrice,
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  openEditModal(
                    lookupResult,
                  )
                }
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold hover:bg-muted"
              >
                <Edit3 className="size-3.5" />
                Edit product
              </button>
            </div>
          )}
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setShowAdvancedFilters((value) => !value)} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold hover:bg-muted"><SlidersHorizontal className="size-3.5" />{showAdvancedFilters ? "Hide filters" : "Advanced filters"}</button>
          <button type="button" onClick={() => void exportCatalog()} disabled={exporting} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold hover:bg-muted disabled:opacity-60"><Download className="size-3.5" />{exporting ? "Exporting..." : "Export CSV"}</button>
          <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCatalog(file); }} />
          <button type="button" onClick={() => importInputRef.current?.click()} disabled={importing} className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold hover:bg-muted disabled:opacity-60"><Upload className="size-3.5" />{importing ? "Importing..." : "Import CSV"}</button>
        </div>

        {showAdvancedFilters && <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <SelectField label="Category" value={categoryFilter} onChange={setCategoryFilter} options={activeCategories.map((category) => ({ value: category.name, label: category.name }))} currentValue={categoryFilter} placeholder="All categories" emptyLabel="All categories" />
          <SelectField label="Brand" value={brandFilter} onChange={setBrandFilter} options={activeBrands.map((brand) => ({ value: brand.name, label: brand.name }))} currentValue={brandFilter} placeholder="All brands" emptyLabel="All brands" />
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Stock</span><select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="all">All stock</option><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option></select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Barcode</span><select value={hasBarcodeFilter} onChange={(e) => setHasBarcodeFilter(e.target.value as typeof hasBarcodeFilter)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="all">Any</option><option value="true">Has barcode</option><option value="false">No barcode</option></select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Variants</span><select value={hasVariantsFilter} onChange={(e) => setHasVariantsFilter(e.target.value as typeof hasVariantsFilter)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="all">Any</option><option value="true">Has variants</option><option value="false">No variants</option></select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Min price</span><input value={minPriceFilter} onChange={(e) => setMinPriceFilter(e.target.value)} type="number" min="0" className="h-10 w-full rounded-xl border bg-background px-3 text-sm" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Max price</span><input value={maxPriceFilter} onChange={(e) => setMaxPriceFilter(e.target.value)} type="number" min="0" className="h-10 w-full rounded-xl border bg-background px-3 text-sm" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Sort</span><select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="createdAt">Newest</option><option value="name">Name</option><option value="sellingPrice">Selling price</option><option value="stockQuantity">Stock</option></select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Direction</span><select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="desc">Descending</option><option value="asc">Ascending</option></select></label>
          <button type="button" onClick={() => { setCategoryFilter(""); setBrandFilter(""); setStockFilter("all"); setHasBarcodeFilter("all"); setHasVariantsFilter("all"); setMinPriceFilter(""); setMaxPriceFilter(""); setSortBy("createdAt"); setSortOrder("desc"); }} className="h-10 self-end rounded-xl border px-3 text-xs font-semibold hover:bg-muted">Clear filters</button>
        </div>}
      </section>

      {selectedIds.length > 0 && <div className="sticky top-3 z-20 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-lg sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-semibold">{selectedIds.length} product(s) selected</span><div className="flex gap-2"><button type="button" onClick={() => void handleBulkStatus("activate")} disabled={bulkUpdating} className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-60">Activate selected</button><button type="button" onClick={() => void handleBulkStatus("deactivate")} disabled={bulkUpdating} className="h-9 rounded-lg border px-3 text-xs font-semibold hover:bg-muted disabled:opacity-60">Deactivate selected</button><button type="button" onClick={() => setSelectedIds([])} className="h-9 rounded-lg border px-3 text-xs font-semibold hover:bg-muted">Clear</button></div></div>}

      {/* PRODUCTS */}
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
              {products.length ===
                0
                ? "No products yet"
                : "No products found"}
            </h2>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {products.length ===
                0
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
            {/* DESKTOP */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1150px] text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="w-10 px-3 py-3"></th>
                    <th className="px-5 py-3 font-semibold">
                      Product
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Barcode
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Category
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Brand
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
                          <td className="w-10 px-3 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(product._id)}
                              onChange={() => toggleProductSelection(product._id)}
                              aria-label={"Select " + product.name}
                            />
                          </td>
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

                          <td className="px-5 py-4">
                            {product.barcode ? (
                              <div className="flex items-center gap-2">
                                <Barcode className="size-4 text-muted-foreground" />

                                <span className="font-mono text-xs">
                                  {
                                    product.barcode
                                  }
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-muted-foreground">
                            {product.category ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-muted-foreground">
                            {product.brand ||
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
                              <Link
                                to={`/shopkeeper/products/${product._id}/variants`}
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                title="Manage variants"
                              >
                                <Boxes className="size-4" />
                              </Link>
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

            {/* MOBILE */}
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
                      <div className="mb-3 flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={selectedIds.includes(product._id)} onChange={() => toggleProductSelection(product._id)} aria-label={"Select " + product.name} />
                        <span className="text-muted-foreground">Select product</span>
                      </div>
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
                              label="Barcode"
                              value={
                                product.barcode ||
                                "—"
                              }
                              mono={
                                Boolean(
                                  product.barcode,
                                )
                              }
                            />

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
                              label="Brand"
                              value={
                                product.brand ||
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

      {/* CREATE / EDIT MODAL */}
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
                onClick={
                  closeModal
                }
                disabled={saving}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="max-h-[calc(90vh-80px)] overflow-y-auto"
            >
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field
                  label="Product name"
                  required
                  value={
                    form.name
                  }
                  onChange={(
                    value,
                  ) =>
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
                  value={
                    form.sku
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "sku",
                      value,
                    )
                  }
                  placeholder="e.g. KB-001"
                />

                <Field
                  label="Barcode / GTIN"
                  value={
                    form.barcode
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "barcode",
                      value,
                    )
                  }
                  placeholder="e.g. 8901234567890"
                  inputMode="numeric"
                  icon={
                    <Barcode className="size-4" />
                  }
                />

                <p className="sm:col-span-2 -mt-2 text-[11px] leading-5 text-muted-foreground">
                  Optional. GTIN-8,
                  GTIN-12,
                  GTIN-13 and
                  GTIN-14 numeric
                  barcodes are
                  check-digit
                  validated.
                  Non-numeric
                  barcode formats
                  are also
                  supported.
                </p>

                {/* CATEGORY */}
                <SelectField
                  label="Category"
                  value={
                    form.category
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "category",
                      value,
                    )
                  }
                  disabled={
                    catalogLoading
                  }
                  options={activeCategories.map(
                    (
                      category,
                    ) => ({
                      value:
                        category.name,
                      label:
                        category.name,
                    }),
                  )}
                  currentValue={
                    form.category
                  }
                  placeholder={
                    catalogLoading
                      ? "Loading categories..."
                      : activeCategories.length ===
                        0
                        ? "No active categories"
                        : "Select category"
                  }
                  emptyLabel="No category"
                />

                {/* BRAND */}
                <SelectField
                  label="Brand"
                  value={
                    form.brand
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "brand",
                      value,
                    )
                  }
                  disabled={
                    catalogLoading
                  }
                  options={activeBrands.map(
                    (
                      brand,
                    ) => ({
                      value:
                        brand.name,
                      label:
                        brand.manufacturer
                          ? `${brand.name} · ${brand.manufacturer}`
                          : brand.name,
                    }),
                  )}
                  currentValue={
                    form.brand
                  }
                  placeholder={
                    catalogLoading
                      ? "Loading brands..."
                      : activeBrands.length ===
                        0
                        ? "No active brands"
                        : "Select brand"
                  }
                  emptyLabel="No brand"
                />

                <ProductUnitSelect
                  value={form.unit}
                  onChange={(value) =>
                    updateForm(
                      "unit",
                      value,
                    )
                  }
                  disabled={saving}
                />

                <Field
                  label="Purchase price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.purchasePrice
                  }
                  onChange={(
                    value,
                  ) =>
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
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "sellingPrice",
                      value,
                    )
                  }
                  prefix="₹"
                />

                <div className="sm:col-span-2 rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Pricing summary
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Automatically calculated from purchase and selling price.
                      </p>
                    </div>

                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        pricingStatus(
                          Number(form.purchasePrice) || 0,
                          Number(form.sellingPrice) || 0,
                        ) === "profit"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : pricingStatus(
                              Number(form.purchasePrice) || 0,
                              Number(form.sellingPrice) || 0,
                            ) === "loss"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {pricingStatus(
                        Number(form.purchasePrice) || 0,
                        Number(form.sellingPrice) || 0,
                      ) === "profit"
                        ? "Profit"
                        : pricingStatus(
                            Number(form.purchasePrice) || 0,
                            Number(form.sellingPrice) || 0,
                          ) === "loss"
                          ? "Loss"
                          : "Break-even"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border bg-background p-3">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        Profit / loss per unit
                      </p>
                      <p
                        className={[
                          "mt-1 text-base font-bold",
                          calculateProfit(
                            Number(form.purchasePrice) || 0,
                            Number(form.sellingPrice) || 0,
                          ) >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive",
                        ].join(" ")}
                      >
                        {formatCurrency(
                          calculateProfit(
                            Number(form.purchasePrice) || 0,
                            Number(form.sellingPrice) || 0,
                          ),
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-background p-3">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        Profit margin
                      </p>
                      <p className="mt-1 text-base font-bold">
                        {calculateMargin(
                          Number(form.purchasePrice) || 0,
                          Number(form.sellingPrice) || 0,
                        ).toFixed(2)}%
                      </p>
                    </div>

                    <div className="rounded-xl border bg-background p-3">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        Markup
                      </p>
                      <p className="mt-1 text-base font-bold">
                        {calculateMarkup(
                          Number(form.purchasePrice) || 0,
                          Number(form.sellingPrice) || 0,
                        ).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {pricingStatus(
                    Number(form.purchasePrice) || 0,
                    Number(form.sellingPrice) || 0,
                  ) === "loss" && (
                    <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs font-medium text-destructive">
                      Selling price is below purchase price. Saving is allowed, but this product currently has a loss per unit.
                    </div>
                  )}
                </div>

                <Field
                  label="Stock quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.stockQuantity
                  }
                  onChange={(
                    value,
                  ) =>
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
                  onChange={(
                    value,
                  ) =>
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
                  onChange={(
                    value,
                  ) =>
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
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          "description",
                          event.target
                            .value,
                        )
                      }
                      rows={4}
                      maxLength={
                        2000
                      }
                      placeholder="Optional product description..."
                      className="w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                </div>
                {editingProduct && (
                  <div className="sm:col-span-2">
                    <ProductImageManager
                      product={editingProduct}
                      onProductUpdated={(updatedProduct) => {
                        setEditingProduct(
                          updatedProduct,
                        );

                        setProducts(
                          (currentProducts) =>
                            currentProducts.map(
                              (currentProduct) =>
                                currentProduct._id ===
                                  updatedProduct._id
                                  ? {
                                    ...currentProduct,
                                    ...updatedProduct,
                                  }
                                  : currentProduct,
                            ),
                        );
                      }}
                      disabled={saving}
                    />
                  </div>
                )}
                {formError && (
                  <div className="sm:col-span-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    {formError}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t bg-muted/20 p-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="h-10 rounded-xl border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
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

      {/* DEACTIVATE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              Deactivate
              product?
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">
                {
                  deleteTarget.name
                }
              </span>{" "}
              will no longer
              appear as an
              active catalog
              product.
              Existing
              invoices remain
              unchanged.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(
                    null,
                  )
                }
                disabled={
                  deleting
                }
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
                disabled={
                  deleting
                }
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

/*
 * ============================================================
 * SMALL UI COMPONENTS
 * ============================================================
 */

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
      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}

function InfoItem({
  label,
  value,
  warning = false,
  mono = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">
        {label}
      </p>

      <p
        className={[
          "mt-0.5 text-sm font-medium",
          warning
            ? "font-semibold text-amber-600 dark:text-amber-400"
            : "",
          mono
            ? "font-mono text-xs"
            : "",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  emptyLabel,
  currentValue,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
  placeholder: string;
  emptyLabel: string;
  currentValue: string;
  disabled?: boolean;
}) {
  const currentValueExists =
    !currentValue ||
    options.some(
      (option) =>
        option.value ===
        currentValue,
    );

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        disabled={disabled}
        className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">
          {options.length > 0
            ? emptyLabel
            : placeholder}
        </option>

        {!currentValueExists &&
          currentValue && (
            <option
              value={
                currentValue
              }
            >
              {currentValue}{" "}
              (currently assigned)
            </option>
          )}

        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          ),
        )}
      </select>

      {!disabled &&
        options.length ===
        0 && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Create an active{" "}
            {label.toLowerCase()}{" "}
            from its management
            page first.
          </p>
        )}
    </label>
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
  icon,
  inputMode,
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
  icon?: React.ReactNode;
  inputMode?:
  | "none"
  | "text"
  | "tel"
  | "url"
  | "email"
  | "numeric"
  | "decimal"
  | "search";
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
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}

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
          placeholder={
            placeholder
          }
          required={required}
          min={min}
          max={max}
          step={step}
          inputMode={
            inputMode
          }
          autoComplete={
            label
              .toLowerCase()
              .includes(
                "barcode",
              )
              ? "off"
              : undefined
          }
          className={[
            "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
            prefix ||
              icon
              ? "pl-9"
              : "",
            suffix
              ? "pr-16"
              : "",
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

