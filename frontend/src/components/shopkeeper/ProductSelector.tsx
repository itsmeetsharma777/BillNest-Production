
import {
  Barcode,
  Check,
  ChevronDown,
  Loader2,
  Search,
  ScanLine,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

export interface Product {
  _id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  brand?: string | null;
  barcode?: string | null;
  unit?: string | null;
  sellingPrice: number;
  stockQuantity: number;
  isActive: boolean;
}

interface ProductsResponse {
  success?: boolean;

  data?: {
    products?: Product[];
  };

  products?: Product[];

  message?: string;
}

interface ProductLookupResponse {
  success?: boolean;

  data?: {
    product?: Product;
  };

  product?: Product;

  message?: string;
}

interface ProductSelectorProps {
  value: string;

  onSelect: (
    product: Product,
  ) => void;

  onClear: () => void;
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

function extractProducts(
  result: ProductsResponse,
) {
  return (
    result.data?.products ??
    result.products ??
    []
  );
}

function extractProduct(
  result: ProductLookupResponse,
) {
  return (
    result.data?.product ??
    result.product ??
    null
  );
}

export default function ProductSelector({
  value,
  onSelect,
  onClear,
}: ProductSelectorProps) {
  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  /*
   * ==========================================================
   * BARCODE SCANNER STATE
   * ==========================================================
   */

  const [
    barcode,
    setBarcode,
  ] = useState("");

  const [
    barcodeLoading,
    setBarcodeLoading,
  ] = useState(false);

  const [
    barcodeError,
    setBarcodeError,
  ] = useState("");

  const containerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /*
   * ==========================================================
   * LOAD ACTIVE PRODUCTS
   * ==========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_URL}/products?limit=100&isActive=true`,
            {
              method: "GET",
              credentials:
                "include",
            },
          );

        const result =
          (await response.json()) as ProductsResponse;

        if (!response.ok) {
          throw new Error(
            result.message ??
              "Unable to load products.",
          );
        }

        const nextProducts =
          extractProducts(
            result,
          );

        if (!cancelled) {
          setProducts(
            nextProducts.filter(
              (product) =>
                product.isActive,
            ),
          );
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ==========================================================
   * CLOSE DROPDOWN WHEN CLICKING OUTSIDE
   * ==========================================================
   */

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  /*
   * ==========================================================
   * NORMAL PRODUCT SEARCH
   * ==========================================================
   */

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(query) ||
          product.sku
            ?.toLowerCase()
            .includes(query) ||
          product.category
            ?.toLowerCase()
            .includes(query) ||
          product.brand
            ?.toLowerCase()
            .includes(query) ||
          product.barcode
            ?.toLowerCase()
            .includes(query),
      );
    }, [
      products,
      search,
    ]);

  const selectedProduct =
    products.find(
      (product) =>
        product.name === value,
    );

  /*
   * ==========================================================
   * NORMAL PRODUCT SELECTION
   * ==========================================================
   */

  function handleSelect(
    product: Product,
  ) {
    onSelect(product);

    setSearch("");

    setBarcode("");

    setBarcodeError("");

    setOpen(false);
  }

  /*
   * ==========================================================
   * CLEAR PRODUCT
   * ==========================================================
   */

  function handleClear() {
    onClear();

    setSearch("");

    setBarcode("");

    setBarcodeError("");

    setOpen(false);
  }

  /*
   * ==========================================================
   * BARCODE LOOKUP
   * ==========================================================
   *
   * This calls the existing backend endpoint:
   *
   * GET /api/products/barcode/:barcode
   *
   * The backend already performs:
   *
   * - tenant isolation
   * - exact barcode matching
   * - product existence validation
   * - active/inactive product lookup
   */

  async function lookupBarcode(
    barcodeValue: string,
  ) {
    const normalizedBarcode =
      barcodeValue.trim();

    setBarcodeError("");

    if (!normalizedBarcode) {
      setBarcodeError(
        "Scan or enter a barcode first.",
      );
      return;
    }

    try {
      setBarcodeLoading(true);

      const response =
        await fetch(
          `${API_URL}/products/barcode/${encodeURIComponent(
            normalizedBarcode,
          )}`,
          {
            method: "GET",
            credentials:
              "include",
          },
        );

      const result =
        (await response.json()) as ProductLookupResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            "No product was found with this barcode.",
        );
      }

      const product =
        extractProduct(
          result,
        );

      if (!product) {
        throw new Error(
          "No product was found with this barcode.",
        );
      }

      if (!product.isActive) {
        throw new Error(
          "This product is inactive and cannot be added to an invoice.",
        );
      }

      if (
        product.stockQuantity <= 0
      ) {
        throw new Error(
          `Product found, but it is out of stock: ${product.name}.`,
        );
      }

      /*
       * Automatically select the product.
       *
       * This means a barcode scanner can:
       *
       * Scan → Enter → Product selected
       */

      onSelect(product);

      setBarcode("");

      setBarcodeError("");

      setSearch("");

      setOpen(false);
    } catch (
      requestError
    ) {
      setBarcodeError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to look up barcode.",
      );
    } finally {
      setBarcodeLoading(
        false,
      );
    }
  }

  /*
   * ==========================================================
   * BARCODE FORM SUBMIT
   * ==========================================================
   *
   * Most USB/Bluetooth barcode scanners behave like keyboards
   * and automatically send Enter after the scanned value.
   *
   * Therefore this form works without special scanner hardware.
   */

  async function handleBarcodeSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    await lookupBarcode(
      barcode,
    );
  }

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        Product
      </span>

      {/* PRODUCT SELECT BUTTON */}
      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
        className="flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 text-left text-sm outline-none transition-colors hover:bg-muted/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <span
          className={
            value
              ? "truncate text-foreground"
              : "truncate text-muted-foreground"
          }
        >
          {value ||
            "Select a product"}
        </span>

        <ChevronDown
          className={[
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open
              ? "rotate-180"
              : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-xl">
          {/* =================================================
              BARCODE SCANNER
          ================================================= */}

          <form
            onSubmit={
              handleBarcodeSubmit
            }
            className="border-b bg-primary/[0.03] p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ScanLine className="size-3.5" />
              </div>

              <div>
                <p className="text-xs font-semibold">
                  Scan barcode
                </p>

                <p className="text-[10px] text-muted-foreground">
                  Scan and press Enter
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  type="text"
                  value={
                    barcode
                  }
                  onChange={(
                    event,
                  ) => {
                    setBarcode(
                      event.target
                        .value,
                    );

                    setBarcodeError(
                      "",
                    );
                  }}
                  onKeyDown={(
                    event,
                  ) => {
                    /*
                     * Some scanners send Enter as the final
                     * character. Submit the form naturally.
                     */
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();

                      void lookupBarcode(
                        barcode,
                      );
                    }
                  }}
                  autoFocus
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="Scan or type barcode..."
                  className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="submit"
                disabled={
                  barcodeLoading
                }
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {barcodeLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}

                <span className="hidden sm:inline">
                  Lookup
                </span>
              </button>
            </div>

            {barcodeError && (
              <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] leading-5 text-destructive">
                {barcodeError}
              </div>
            )}
          </form>

          {/* =================================================
              NORMAL SEARCH
          ================================================= */}

          <div className="border-b p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search product, SKU, category, brand or barcode..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* =================================================
              PRODUCT LIST
          ================================================= */}

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading products...
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {/* CLEAR */}
              {value && (
                <button
                  type="button"
                  onClick={
                    handleClear
                  }
                  className="flex w-full items-center gap-2 border-b px-3 py-2.5 text-left text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  <X className="size-3.5" />
                  Clear product
                  selection
                </button>
              )}

              {/* EMPTY */}
              {filteredProducts.length ===
              0 ? (
                <div className="p-5 text-center text-sm text-muted-foreground">
                  {search
                    ? "No matching products found."
                    : "No active products available."}
                </div>
              ) : (
                filteredProducts.map(
                  (
                    product,
                  ) => {
                    const isSelected =
                      selectedProduct?._id ===
                      product._id;

                    const outOfStock =
                      product.stockQuantity <=
                      0;

                    return (
                      <button
                        key={
                          product._id
                        }
                        type="button"
                        disabled={
                          outOfStock
                        }
                        onClick={() =>
                          handleSelect(
                            product,
                          )
                        }
                        className={[
                          "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors",
                          isSelected
                            ? "bg-primary/10"
                            : outOfStock
                              ? "cursor-not-allowed opacity-50"
                              : "hover:bg-muted",
                        ].join(
                          " ",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">
                              {
                                product.name
                              }
                            </p>

                            {isSelected && (
                              <Check className="size-4 shrink-0 text-primary" />
                            )}
                          </div>

                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                            {product.sku && (
                              <span>
                                SKU:{" "}
                                {
                                  product.sku
                                }
                              </span>
                            )}

                            {product.barcode && (
                              <span className="font-mono">
                                {
                                  product.barcode
                                }
                              </span>
                            )}

                            {product.category && (
                              <span>
                                {
                                  product.category
                                }
                              </span>
                            )}

                            {product.brand && (
                              <span>
                                {
                                  product.brand
                                }
                              </span>
                            )}

                            <span
                              className={
                                outOfStock
                                  ? "font-medium text-destructive"
                                  : ""
                              }
                            >
                              Stock:{" "}
                              {
                                product.stockQuantity
                              }
                            </span>
                          </div>
                        </div>

                        <span className="shrink-0 text-sm font-semibold">
                          {formatCurrency(
                            product.sellingPrice,
                          )}
                        </span>
                      </button>
                    );
                  },
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}