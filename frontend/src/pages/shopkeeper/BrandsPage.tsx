import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  Globe,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

interface Brand {
  _id: string;
  name: string;
  description?: string | null;
  manufacturer?: string | null;
  website?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface BrandForm {
  name: string;
  manufacturer: string;
  website: string;
  description: string;
}

const emptyForm: BrandForm = {
  name: "",
  manufacturer: "",
  website: "",
  description: "",
};

export default function BrandsPage() {
  const [brands, setBrands] =
    useState<Brand[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingBrand, setEditingBrand] =
    useState<Brand | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Brand | null>(null);

  const [form, setForm] =
    useState<BrandForm>(emptyForm);

  const [formError, setFormError] =
    useState("");

  async function loadBrands(
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
        `${API_URL}/brands?isActive=all`,
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
            "Unable to load brands.",
        );
      }

      const nextBrands =
        Array.isArray(
          data?.data?.brands,
        )
          ? data.data.brands
          : Array.isArray(
              data?.brands,
            )
            ? data.brands
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : [];

      setBrands(nextBrands);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load brands.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadBrands();
  }, []);

  const visibleBrands =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return brands;
      }

      return brands.filter(
        (brand) =>
          brand.name
            .toLowerCase()
            .includes(query) ||
          brand.manufacturer
            ?.toLowerCase()
            .includes(query) ||
          brand.description
            ?.toLowerCase()
            .includes(query),
      );
    }, [brands, search]);

  const activeCount =
    brands.filter(
      (brand) => brand.isActive,
    ).length;

  const inactiveCount =
    brands.length - activeCount;

  function openCreateModal() {
    setEditingBrand(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(
    brand: Brand,
  ) {
    setEditingBrand(brand);

    setForm({
      name: brand.name,
      manufacturer:
        brand.manufacturer ?? "",
      website:
        brand.website ?? "",
      description:
        brand.description ?? "",
    });

    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingBrand(null);
    setForm(emptyForm);
    setFormError("");
  }

  function updateForm(
    field: keyof BrandForm,
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

    const name =
      form.name
        .trim()
        .replace(/\s+/g, " ");

    const manufacturer =
      form.manufacturer
        .trim()
        .replace(/\s+/g, " ");

    const website =
      form.website.trim();

    const description =
      form.description.trim();

    if (!name) {
      setFormError(
        "Brand name is required.",
      );
      return;
    }

    if (name.length > 100) {
      setFormError(
        "Brand name cannot exceed 100 characters.",
      );
      return;
    }

    if (manufacturer.length > 150) {
      setFormError(
        "Manufacturer cannot exceed 150 characters.",
      );
      return;
    }

    if (website.length > 300) {
      setFormError(
        "Website cannot exceed 300 characters.",
      );
      return;
    }

    if (description.length > 500) {
      setFormError(
        "Description cannot exceed 500 characters.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name,
        manufacturer:
          manufacturer || undefined,
        website:
          website || undefined,
        description:
          description || undefined,
      };

      const url =
        editingBrand
          ? `${API_URL}/brands/${editingBrand._id}`
          : `${API_URL}/brands`;

      const method =
        editingBrand
          ? "PATCH"
          : "POST";

      const response =
        await fetch(url, {
          method,
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload,
          ),
        });

      const data =
        await response.json().catch(
          () => null,
        );

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Unable to save brand.",
        );
      }

      setModalOpen(false);
      setEditingBrand(null);
      setForm(emptyForm);
      setFormError("");

      await loadBrands(true);
    } catch (requestError) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save brand.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(
    brand: Brand,
  ) {
    try {
      setDeleting(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/brands/${brand._id}`,
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
            "Unable to deactivate brand.",
        );
      }

      setDeleteTarget(null);

      await loadBrands(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to deactivate brand.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

      {/* ===================================================== */}
      {/* HEADER                                                */}
      {/* ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Brands
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage the brands and manufacturers
              used across your product catalog.
            </p>
          </div>

        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={() =>
              void loadBrands(true)
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
            onClick={
              openCreateModal
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />

            Add brand
          </button>

        </div>

      </div>

      {/* ===================================================== */}
      {/* STATS                                                  */}
      {/* ===================================================== */}

      <div className="grid gap-3 sm:grid-cols-3">

        <StatCard
          icon={
            <Building2 className="size-5" />
          }
          label="Total brands"
          value={brands.length}
        />

        <StatCard
          icon={
            <Building2 className="size-5" />
          }
          label="Active"
          value={activeCount}
        />

        <StatCard
          icon={
            <Building2 className="size-5" />
          }
          label="Inactive"
          value={inactiveCount}
        />

      </div>

      {/* ===================================================== */}
      {/* SEARCH / LIST                                          */}
      {/* ===================================================== */}

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">

        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="font-semibold">
              Product brands
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Keep your catalog manufacturers
              organized and reusable.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">

            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search brands..."
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

          </div>

        </div>

        {error && (
          <div className="m-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading brands...
            </div>
          </div>
        ) : visibleBrands.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Building2 className="size-6" />
            </div>

            <h3 className="mt-4 font-semibold">
              No brands found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {search.trim()
                ? "Try a different search term."
                : "Create your first brand to start organizing your product catalog."}
            </p>

            {!search.trim() && (
              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="size-4" />
                Add brand
              </button>
            )}

          </div>
        ) : (
          <>
            {/* ================================================= */}
            {/* DESKTOP TABLE                                     */}
            {/* ================================================= */}

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full text-sm">

                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">

                    <th className="px-5 py-3 font-medium">
                      Brand
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Manufacturer
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Website
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y">

                  {visibleBrands.map(
                    (brand) => (
                      <tr
                        key={
                          brand._id
                        }
                        className="transition-colors hover:bg-muted/20"
                      >

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Building2 className="size-4" />
                            </div>

                            <div className="min-w-0">

                              <p className="font-semibold">
                                {
                                  brand.name
                                }
                              </p>

                              {brand.description && (
                                <p className="mt-0.5 max-w-sm truncate text-xs text-muted-foreground">
                                  {
                                    brand.description
                                  }
                                </p>
                              )}

                            </div>

                          </div>

                        </td>

                        <td className="px-5 py-4 text-muted-foreground">
                          {
                            brand.manufacturer ||
                            "—"
                          }
                        </td>

                        <td className="px-5 py-4">

                          {brand.website ? (
                            <a
                              href={
                                brand.website
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex max-w-xs items-center gap-1 truncate text-sm text-primary hover:underline"
                            >
                              <Globe className="size-3.5 shrink-0" />
                              <span className="truncate">
                                {
                                  brand.website
                                }
                              </span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">
                              —
                            </span>
                          )}

                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            active={
                              brand.isActive
                            }
                          />
                        </td>

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-1">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  brand,
                                )
                              }
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              title="Edit brand"
                            >
                              <Pencil className="size-4" />
                            </button>

                            {brand.isActive && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget(
                                    brand,
                                  )
                                }
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                title="Deactivate brand"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>
                    ),
                  )}

                </tbody>

              </table>

            </div>

            {/* ================================================= */}
            {/* MOBILE                                             */}
            {/* ================================================= */}

            <div className="divide-y md:hidden">

              {visibleBrands.map(
                (brand) => (
                  <div
                    key={
                      brand._id
                    }
                    className="p-4"
                  >

                    <div className="flex items-start gap-3">

                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <h3 className="truncate font-semibold">
                              {
                                brand.name
                              }
                            </h3>

                            {brand.manufacturer && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {
                                  brand.manufacturer
                                }
                              </p>
                            )}

                          </div>

                          <StatusBadge
                            active={
                              brand.isActive
                            }
                          />

                        </div>

                        {brand.description && (
                          <p className="mt-3 text-sm text-muted-foreground">
                            {
                              brand.description
                            }
                          </p>
                        )}

                        {brand.website && (
                          <a
                            href={
                              brand.website
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Globe className="size-3.5" />
                            <span className="truncate">
                              {
                                brand.website
                              }
                            </span>
                          </a>
                        )}

                        <div className="mt-4 flex gap-2 border-t pt-3">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                brand,
                              )
                            }
                            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-xs font-semibold hover:bg-muted"
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </button>

                          {brand.isActive && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget(
                                  brand,
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
                ),
              )}

            </div>
          </>
        )}

      </section>

      {/* ===================================================== */}
      {/* CREATE / EDIT MODAL                                   */}
      {/* ===================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl border bg-card shadow-2xl">

            <div className="flex items-center justify-between border-b p-5">

              <div>

                <h2 className="text-lg font-semibold">
                  {editingBrand
                    ? "Edit brand"
                    : "Add brand"}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Keep your brand information
                  consistent across your catalog.
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
                  label="Brand name"
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
                  placeholder="e.g. Samsung"
                  className="sm:col-span-2"
                />

                <Field
                  label="Manufacturer"
                  value={
                    form.manufacturer
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "manufacturer",
                      value,
                    )
                  }
                  placeholder="e.g. Samsung Electronics"
                />

                <Field
                  label="Website"
                  type="url"
                  value={
                    form.website
                  }
                  onChange={(
                    value,
                  ) =>
                    updateForm(
                      "website",
                      value,
                    )
                  }
                  placeholder="https://example.com"
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
                          event
                            .target
                            .value,
                        )
                      }
                      rows={4}
                      maxLength={500}
                      placeholder="Optional description..."
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
                  onClick={
                    closeModal
                  }
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

                  {editingBrand
                    ? "Save changes"
                    : "Create brand"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ===================================================== */}
      {/* DEACTIVATE MODAL                                      */}
      {/* ===================================================== */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">

            <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              Deactivate brand?
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">

              <span className="font-medium text-foreground">
                {
                  deleteTarget.name
                }
              </span>{" "}
              will no longer be available as an
              active brand when creating or
              editing products.

              <span className="block mt-2">
                Existing products using this brand
                will remain unchanged.
              </span>

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
      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
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
        className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

    </label>
  );
}