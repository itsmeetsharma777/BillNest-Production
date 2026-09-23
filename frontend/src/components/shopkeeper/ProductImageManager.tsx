import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Check,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

export interface ProductImage {
  _id: string;
  url: string;
  publicId: string;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductWithImages {
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
}

interface ProductImageManagerProps {
  product: ProductWithImages;
  onProductUpdated?: (
    product: ProductWithImages,
  ) => void;
  disabled?: boolean;
}

function extractProduct(
  data: unknown,
): ProductWithImages | null {
  const typed = data as {
    data?: {
      product?: ProductWithImages;
    };
    product?: ProductWithImages;
  };

  if (typed?.data?.product) {
    return typed.data.product;
  }

  if (typed?.product) {
    return typed.product;
  }

  return null;
}

async function readResponse(
  response: Response,
) {
  return response
    .json()
    .catch(() => null);
}

export default function ProductImageManager({
  product,
  onProductUpdated,
  disabled = false,
}: ProductImageManagerProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [primaryId, setPrimaryId] =
    useState<string | null>(null);

  const [preview, setPreview] =
    useState<ProductImage | null>(null);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const images = Array.isArray(product.images)
    ? product.images
    : [];

  useEffect(() => {
    setError("");
    setNotice("");
    setPreview(null);
  }, [product._id]);

  function openFilePicker() {
    if (
      disabled ||
      uploading ||
      images.length >= 5
    ) {
      return;
    }

    fileInputRef.current?.click();
  }

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setNotice("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG and WebP images are supported.",
      );

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Each product image must be 5 MB or smaller.",
      );

      return;
    }

    if (images.length >= 5) {
      setError(
        "A product can have a maximum of 5 images.",
      );

      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      /*
       * Backend expects the multipart field name:
       * "image"
       */
      formData.append(
        "image",
        file,
      );

      const response =
        await fetch(
          `${API_URL}/products/${product._id}/images`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          },
        );

      const data =
        await readResponse(
          response,
        );

      if (!response.ok) {
        throw new Error(
          data?.message ??
          "Unable to upload product image.",
        );
      }

      const updatedProduct =
        extractProduct(data);

      if (!updatedProduct) {
        throw new Error(
          "Image uploaded, but the updated product could not be read.",
        );
      }

      onProductUpdated?.(
        updatedProduct,
      );

      setNotice(
        "Product image uploaded successfully.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to upload product image.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSetPrimary(
    image: ProductImage,
  ) {
    if (
      disabled ||
      uploading ||
      primaryId ||
      image.isPrimary
    ) {
      return;
    }

    setError("");
    setNotice("");
    setPrimaryId(image._id);

    try {
      const response =
        await fetch(
          `${API_URL}/products/${product._id}/images/${image._id}/primary`,
          {
            method: "PATCH",
            credentials: "include",
          },
        );

      const data =
        await readResponse(
          response,
        );

      if (!response.ok) {
        throw new Error(
          data?.message ??
          "Unable to set primary image.",
        );
      }

      const updatedProduct =
        extractProduct(data);

      if (!updatedProduct) {
        throw new Error(
          "Primary image was updated, but the updated product could not be read.",
        );
      }

      onProductUpdated?.(
        updatedProduct,
      );

      setNotice(
        "Primary product image updated.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to set primary image.",
      );
    } finally {
      setPrimaryId(null);
    }
  }

  async function handleDelete(
    image: ProductImage,
  ) {
    if (
      disabled ||
      uploading ||
      deletingId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        image.isPrimary
          ? "Delete the primary product image? Another image will become primary automatically if available."
          : "Delete this product image?",
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setNotice("");
    setDeletingId(image._id);

    try {
      const response =
        await fetch(
          `${API_URL}/products/${product._id}/images/${image._id}`,
          {
            method: "DELETE",
            credentials: "include",
          },
        );

      const data =
        await readResponse(
          response,
        );

      if (!response.ok) {
        throw new Error(
          data?.message ??
          "Unable to delete product image.",
        );
      }

      const updatedProduct =
        extractProduct(data);

      if (!updatedProduct) {
        throw new Error(
          "Image was deleted, but the updated product could not be read.",
        );
      }

      if (
        preview?._id === image._id
      ) {
        setPreview(null);
      }

      onProductUpdated?.(
        updatedProduct,
      );

      setNotice(
        "Product image deleted.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete product image.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">
            Product images
          </h3>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Add up to 5 JPG, PNG or WebP images.
          </p>
        </div>

        <span className="text-xs font-medium text-muted-foreground">
          {images.length}/5 images
        </span>
      </div>

      {/* =====================================================
          HIDDEN FILE INPUT
      ====================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
        disabled={
          disabled ||
          uploading ||
          images.length >= 5
        }
      />

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {images.length === 0 ? (
        <button
          type="button"
          onClick={openFilePicker}
          disabled={
            disabled ||
            uploading
          }
          className="mt-4 flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="size-7 animate-spin text-primary" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ImagePlus className="size-6" />
            </div>
          )}

          <span className="mt-3 text-sm font-semibold">
            {uploading
              ? "Uploading image..."
              : "Add product image"}
          </span>

          <span className="mt-1 text-xs text-muted-foreground">
            JPG, PNG or WebP · Maximum 5 MB
          </span>
        </button>
      ) : (
        /* ===================================================
           IMAGE GRID
        ==================================================== */

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {images.map((image) => {
            const isDeleting =
              deletingId === image._id;

            const isSettingPrimary =
              primaryId === image._id;

            return (
              <div
                key={image._id}
                className="group relative overflow-hidden rounded-2xl border bg-muted/20"
              >
                {/* =================================================
                    IMAGE
                ================================================== */}

                <button
                  type="button"
                  onClick={() =>
                    setPreview(image)
                  }
                  className="block aspect-square w-full overflow-hidden"
                  title="Preview image"
                >
                  <img
                    src={image.url}
                    alt={`${product.name} product image`}
                    className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                </button>

                {/* =================================================
                    PRIMARY BADGE
                    TOP LEFT
                ================================================== */}

                {image.isPrimary && (
                  <span className="absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-black/75 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-md">
                    <Star className="size-3 fill-amber-400 text-amber-400" />

                    Primary
                  </span>
                )}

                {/* =================================================
                    DELETE BUTTON
                    TOP RIGHT
                ================================================== */}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();

                    void handleDelete(
                      image,
                    );
                  }}
                  disabled={
                    disabled ||
                    Boolean(
                      deletingId,
                    ) ||
                    Boolean(
                      primaryId,
                    )
                  }
                  className="absolute right-2 top-2 z-30 inline-flex size-9 items-center justify-center rounded-full border border-white/20 bg-red-600 text-white shadow-xl opacity-100 transition-all duration-200 hover:scale-105 hover:bg-red-700 hover:shadow-red-500/30 disabled:cursor-not-allowed disabled:opacity-60 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                  title="Delete image"
                  aria-label="Delete image"
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
                {/* =================================================
                    BOTTOM CONTROL AREA
                ================================================== */}

                <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 pt-10 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  {!image.isPrimary ? (
                    <button
                      type="button"
                      onClick={() =>
                        void handleSetPrimary(
                          image,
                        )
                      }
                      disabled={
                        disabled ||
                        Boolean(
                          primaryId,
                        ) ||
                        Boolean(
                          deletingId,
                        )
                      }
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-background/90 px-3 text-[11px] font-semibold text-foreground shadow-lg backdrop-blur hover:bg-background disabled:opacity-60"
                    >
                      {isSettingPrimary ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Star className="size-3.5" />
                      )}

                      Set primary
                    </button>
                  ) : (
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-3 text-[11px] font-semibold text-white shadow-lg backdrop-blur">
                      <Check className="size-3.5 text-emerald-400" />

                      Primary image
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* =====================================================
              ADD IMAGE TILE
          ====================================================== */}

          {images.length < 5 && (
            <button
              type="button"
              onClick={openFilePicker}
              disabled={
                disabled ||
                uploading
              }
              className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="size-6 animate-spin text-primary" />
              ) : (
                <Upload className="size-6" />
              )}

              <span className="mt-2 text-xs font-semibold">
                {uploading
                  ? "Uploading"
                  : "Add image"}
              </span>
            </button>
          )}
        </div>
      )}

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs font-medium text-destructive">
          {error}
        </div>
      )}

      {/* =====================================================
          SUCCESS NOTICE
      ====================================================== */}

      {notice && !error && (
        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {notice}
        </div>
      )}

      {/* =====================================================
          IMAGE PREVIEW MODAL
      ====================================================== */}

      {preview && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Product image preview"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPreview(null);
            }
          }}
        >
          <div className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-2xl">
            <button
              type="button"
              onClick={() =>
                setPreview(null)
              }
              className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg hover:bg-background"
              title="Close preview"
            >
              <X className="size-5" />
            </button>

            <img
              src={preview.url}
              alt={`${product.name} product preview`}
              className="max-h-[85vh] max-w-full object-contain"
            />

            <div className="flex items-center justify-between gap-3 border-t bg-card px-4 py-3">
              <span className="truncate text-sm font-medium">
                {product.name}
              </span>

              {preview.isPrimary && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <Star className="size-3.5 fill-current" />

                  Primary
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}