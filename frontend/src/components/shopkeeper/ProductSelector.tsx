import {
  Check,
  ChevronDown,
  Loader2,
  Search,
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

  const containerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

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
          result.data?.products ??
          result.products ??
          [];

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
            .includes(query),
      );
    }, [products, search]);

  const selectedProduct =
    products.find(
      (product) =>
        product.name === value,
    );

  function handleSelect(
    product: Product,
  ) {
    onSelect(product);
    setSearch("");
    setOpen(false);
  }

  function handleClear() {
    onClear();
    setSearch("");
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        Product
      </span>

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
          <div className="border-b p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                autoFocus
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search product, SKU or category..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading products...
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {value && (
                <button
                  type="button"
                  onClick={
                    handleClear
                  }
                  className="flex w-full items-center gap-2 border-b px-3 py-2.5 text-left text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  <X className="size-3.5" />
                  Clear product selection
                </button>
              )}

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

                    const lowStock =
                      product.stockQuantity <=
                      0;

                    return (
                      <button
                        key={
                          product._id
                        }
                        type="button"
                        onClick={() =>
                          handleSelect(
                            product,
                          )
                        }
                        className={[
                          "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors",
                          isSelected
                            ? "bg-primary/10"
                            : "hover:bg-muted",
                        ].join(" ")}
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

                            {product.category && (
                              <span>
                                {
                                  product.category
                                }
                              </span>
                            )}

                            <span
                              className={
                                lowStock
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