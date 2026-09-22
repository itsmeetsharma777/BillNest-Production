import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FolderTree,
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

interface Category {
  _id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryForm {
  name: string;
  description: string;
}

const emptyForm: CategoryForm = {
  name: "",
  description: "",
};

export default function CategoriesPage() {
  const [
    categories,
    setCategories,
  ] = useState<Category[]>(
    [],
  );

  const [
    search,
    setSearch,
  ] = useState("");

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
    deleting,
    setDeleting,
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
    editingCategory,
    setEditingCategory,
  ] = useState<Category | null>(
    null,
  );

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<Category | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<CategoryForm>(
    emptyForm,
  );

  const [
    formError,
    setFormError,
  ] = useState("");

  async function loadCategories(
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
        "isActive",
        "all",
      );

      if (search.trim()) {
        params.set(
          "search",
          search.trim(),
        );
      }

      const response =
        await fetch(
          `${API_URL}/categories?${params.toString()}`,
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
            "Unable to load categories.",
        );
      }

      const nextCategories =
        Array.isArray(
          data?.data?.categories,
        )
          ? data.data.categories
          : [];

      setCategories(
        nextCategories,
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Unable to load categories.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  const visibleCategories =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return categories;
      }

      return categories.filter(
        (category) =>
          category.name
            .toLowerCase()
            .includes(query) ||
          category.description
            ?.toLowerCase()
            .includes(query),
      );
    }, [
      categories,
      search,
    ]);

  const activeCount =
    categories.filter(
      (category) =>
        category.isActive,
    ).length;

  const inactiveCount =
    categories.length -
    activeCount;

  function openCreateModal() {
    setEditingCategory(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(
    category: Category,
  ) {
    setEditingCategory(
      category,
    );

    setForm({
      name: category.name,
      description:
        category.description ??
        "",
    });

    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingCategory(null);
    setFormError("");
  }

  function updateForm(
    field: keyof CategoryForm,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
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

    if (!name) {
      setFormError(
        "Category name is required.",
      );

      return;
    }

    if (name.length > 100) {
      setFormError(
        "Category name cannot exceed 100 characters.",
      );

      return;
    }

    if (
      form.description.trim()
        .length > 500
    ) {
      setFormError(
        "Description cannot exceed 500 characters.",
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        name,

        description:
          form.description.trim() ||
          undefined,
      };

      const url =
        editingCategory
          ? `${API_URL}/categories/${editingCategory._id}`
          : `${API_URL}/categories`;

      const method =
        editingCategory
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
            "Unable to save category.",
        );
      }

      setModalOpen(false);
      setEditingCategory(null);
      setForm(emptyForm);
      setFormError("");

      await loadCategories(
        true,
      );
    } catch (
      requestError
    ) {
      setFormError(
        requestError instanceof
          Error
          ? requestError.message
          : "Unable to save category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(
    category: Category,
  ) {
    try {
      setDeleting(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/categories/${category._id}`,
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
            "Unable to deactivate category.",
        );
      }

      setDeleteTarget(null);

      await loadCategories(
        true,
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof
          Error
          ? requestError.message
          : "Unable to deactivate category.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FolderTree className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Categories
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Organize your product catalog
              with reusable categories.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              void loadCategories(
                true,
              )
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

            Add category
          </button>
        </div>
      </div>

      {/* Stats */}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total categories"
          value={
            categories.length
          }
        />

        <StatCard
          label="Active"
          value={activeCount}
        />

        <StatCard
          label="Inactive"
          value={
            inactiveCount
          }
        />
      </div>

      {/* Search */}

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Product categories
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Create and maintain the
              categories used by your
              catalog.
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
              placeholder="Search categories..."
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
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : visibleCategories.length ===
          0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FolderTree className="size-6" />
            </div>

            <h3 className="mt-4 font-semibold">
              No categories found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {search.trim()
                ? "Try a different search term."
                : "Create your first category to start organizing your products."}
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
                Add category
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">
                      Category
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Description
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
                  {visibleCategories.map(
                    (category) => (
                      <tr
                        key={
                          category._id
                        }
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <FolderTree className="size-4" />
                            </div>

                            <span className="font-semibold">
                              {
                                category.name
                              }
                            </span>
                          </div>
                        </td>

                        <td className="max-w-md px-5 py-4 text-muted-foreground">
                          <span className="line-clamp-2">
                            {category.description ||
                              "No description"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            active={
                              category.isActive
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  category,
                                )
                              }
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              title="Edit category"
                            >
                              <Pencil className="size-4" />
                            </button>

                            {category.isActive && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget(
                                    category,
                                  )
                                }
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                title="Deactivate category"
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

            {/* Mobile */}

            <div className="divide-y md:hidden">
              {visibleCategories.map(
                (category) => (
                  <div
                    key={
                      category._id
                    }
                    className="p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FolderTree className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">
                              {
                                category.name
                              }
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {category.description ||
                                "No description"}
                            </p>
                          </div>

                          <StatusBadge
                            active={
                              category.isActive
                            }
                          />
                        </div>

                        <div className="mt-4 flex gap-2 border-t pt-3">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                category,
                              )
                            }
                            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-xs font-semibold hover:bg-muted"
                          >
                            <Pencil className="size-3.5" />

                            Edit
                          </button>

                          {category.isActive && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget(
                                  category,
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

      {/* Create/Edit modal */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingCategory
                    ? "Edit category"
                    : "Add category"}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Keep your catalog
                  organization clean and
                  consistent.
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
            >
              <div className="space-y-4 p-5">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Category name
                    <span className="ml-1 text-destructive">
                      *
                    </span>
                  </span>

                  <input
                    value={form.name}
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "name",
                        event.target
                          .value,
                      )
                    }
                    placeholder="e.g. Electronics"
                    maxLength={
                      100
                    }
                    autoFocus
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

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
                      500
                    }
                    placeholder="Optional description for this category..."
                    className="w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                {formError && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
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

                  {editingCategory
                    ? "Save changes"
                    : "Create category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate modal */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              Deactivate category?
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">
                {
                  deleteTarget.name
                }
              </span>{" "}
              will no longer be available
              as an active catalog
              category.
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
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
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