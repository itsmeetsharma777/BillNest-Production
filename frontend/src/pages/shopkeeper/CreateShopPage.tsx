import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Store,
} from "lucide-react";
import {
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";

import { ThemeSelector } from "@/components/common/theme-selector";
import { useAuth } from "@/context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

interface CreateShopResponse {
  success?: boolean;
  message?: string;
  data?: {
    shop?: {
      _id?: string;
      name?: string;
    };
  };
  code?: string;
}

interface ShopForm {
  name: string;
  phone: string;
  email: string;
  taxId: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const INITIAL_FORM: ShopForm = {
  name: "",
  phone: "",
  email: "",
  taxId: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

const inputClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";

function getErrorMessage(
  result: CreateShopResponse | null,
) {
  return (
    result?.message ??
    "Unable to create your shop. Please try again."
  );
}

export default function CreateShopPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] =
    useState<ShopForm>(INITIAL_FORM);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  function updateField(
    field: keyof ShopForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const shopName = form.name.trim();

    if (!shopName) {
      setError("Please enter your shop name.");
      return;
    }

    if (shopName.length < 2) {
      setError(
        "Shop name must be at least 2 characters.",
      );
      return;
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      setError(
        "Please enter a valid shop email address.",
      );
      return;
    }

    if (
      form.postalCode.trim() &&
      form.postalCode.trim().length > 20
    ) {
      setError(
        "Postal code cannot exceed 20 characters.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const body = {
        name: shopName,

        ...(form.phone.trim() && {
          phone: form.phone.trim(),
        }),

        ...(form.email.trim() && {
          email: form.email
            .trim()
            .toLowerCase(),
        }),

        ...(form.taxId.trim() && {
          taxId: form.taxId.trim(),
        }),

        address: {
          ...(form.line1.trim() && {
            line1: form.line1.trim(),
          }),

          ...(form.line2.trim() && {
            line2: form.line2.trim(),
          }),

          ...(form.city.trim() && {
            city: form.city.trim(),
          }),

          ...(form.state.trim() && {
            state: form.state.trim(),
          }),

          ...(form.postalCode.trim() && {
            postalCode:
              form.postalCode.trim(),
          }),

          country:
            form.country.trim() || "India",
        },
      };

      const response = await fetch(
        `${API_URL}/shops`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify(body),
        },
      );

      const result =
        (await response
          .json()
          .catch(() => null)) as
          | CreateShopResponse
          | null;

      if (
        !response.ok ||
        result?.success === false
      ) {
        throw new Error(
          getErrorMessage(result),
        );
      }

      setSuccess(true);

      /*
       * Give the success state a short moment so
       * the user gets clear confirmation before
       * entering the dashboard.
       */
      window.setTimeout(() => {
        navigate("/shopkeeper", {
          replace: true,
        });
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your shop. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <div className="w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-xl">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-8" />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            Your shop is ready
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Welcome to BillNest,{" "}
            {user?.name?.split(" ")[0] ??
              "Shopkeeper"}
            . Your business workspace has been
            created successfully.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Opening your dashboard...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/[0.04] blur-[150px] dark:bg-blue-500/[0.08]" />

        <div className="absolute bottom-[-220px] right-[-180px] size-[500px] rounded-full bg-violet-500/[0.025] blur-[140px] dark:bg-violet-500/[0.05]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-[1050px] flex-col px-5 py-5 sm:px-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500 text-lg font-bold text-white shadow-lg shadow-blue-500/20">
              B
            </div>

            <div>
              <p className="text-base font-bold">
                BillNest
              </p>

              <p className="text-[10px] text-muted-foreground">
                Every bill. One organized home.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <ThemeSelector />
          </div>
        </header>

        {/* Main */}
        <div className="flex flex-1 items-center justify-center py-8">
          <section className="w-full max-w-[760px] rounded-3xl border border-blue-500/30 bg-card/95 p-6 shadow-2xl shadow-blue-500/[0.06] backdrop-blur-xl sm:p-8">
            {/* Heading */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                  <Store className="size-6" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
                    First step
                  </p>

                  <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                    Create your shop
                  </h1>

                  <p className="mt-2 max-w-[540px] text-sm leading-6 text-muted-foreground">
                    Before you can use the
                    shopkeeper dashboard, tell us a
                    little about your business.
                  </p>
                </div>
              </div>

              <div className="hidden shrink-0 items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-[10px] font-medium text-blue-500 sm:flex">
                <Building2 className="size-3.5" />
                Business setup
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-7"
            >
              {/* Business */}
              <div>
                <div className="mb-3">
                  <h2 className="text-sm font-semibold">
                    Business information
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Basic information shown across
                    your BillNest workspace.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="shop-name"
                      className="mb-1.5 block text-xs font-medium"
                    >
                      Shop name{" "}
                      <span className="text-destructive">
                        *
                      </span>
                    </label>

                    <div className="relative">
                      <Store className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                      <input
                        id="shop-name"
                        value={form.name}
                        onChange={(event) =>
                          updateField(
                            "name",
                            event.target.value,
                          )
                        }
                        placeholder="e.g. Sharma Electronics"
                        disabled={isLoading}
                        autoFocus
                        className={`${inputClassName} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="shop-phone"
                      className="mb-1.5 block text-xs font-medium"
                    >
                      Phone number
                    </label>

                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                      <input
                        id="shop-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(event) =>
                          updateField(
                            "phone",
                            event.target.value,
                          )
                        }
                        placeholder="Shop phone number"
                        disabled={isLoading}
                        className={`${inputClassName} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="shop-email"
                      className="mb-1.5 block text-xs font-medium"
                    >
                      Shop email
                    </label>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                      <input
                        id="shop-email"
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          updateField(
                            "email",
                            event.target.value,
                          )
                        }
                        placeholder="shop@example.com"
                        disabled={isLoading}
                        className={`${inputClassName} pl-10`}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="shop-tax"
                      className="mb-1.5 block text-xs font-medium"
                    >
                      GSTIN / Tax ID{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </label>

                    <input
                      id="shop-tax"
                      value={form.taxId}
                      onChange={(event) =>
                        updateField(
                          "taxId",
                          event.target.value,
                        )
                      }
                      placeholder="Enter GSTIN or tax identification number"
                      disabled={isLoading}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-7">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold">
                    Shop address
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    You can complete or update these
                    details later from Settings.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="address-line1"
                      className="mb-1.5 block text-xs font-medium"
                    >
                      Address
                    </label>

                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />

                      <input
                        id="address-line1"
                        value={form.line1}
                        onChange={(event) =>
                          updateField(
                            "line1",
                            event.target.value,
                          )
                        }
                        placeholder="Street / building / area"
                        disabled={isLoading}
                        className={`${inputClassName} pl-10`}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="address-line2"
                      className="mb-1.5 block text-xs font-medium"
                    >
                      Address line 2
                    </label>

                    <input
                      id="address-line2"
                      value={form.line2}
                      onChange={(event) =>
                        updateField(
                          "line2",
                          event.target.value,
                        )
                      }
                      placeholder="Landmark / apartment / additional details"
                      disabled={isLoading}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="city"
                      className="mb-1.5 block text-xs font-medium"
                    >
                      City
                    </label>

                    <input
                      id="city"
                      value={form.city}
                      onChange={(event) =>
                        updateField(
                          "city",
                          event.target.value,
                        )
                      }
                      placeholder="City"
                      disabled={isLoading}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="state"
                      className="mb-1.5 block text-xs font-medium"
                    >
                      State
                    </label>

                    <input
                      id="state"
                      value={form.state}
                      onChange={(event) =>
                        updateField(
                          "state",
                          event.target.value,
                        )
                      }
                      placeholder="State"
                      disabled={isLoading}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="postal-code"
                      className="mb-1.5 block text-xs font-medium"
                    >
                      Postal code
                    </label>

                    <input
                      id="postal-code"
                      value={form.postalCode}
                      onChange={(event) =>
                        updateField(
                          "postalCode",
                          event.target.value,
                        )
                      }
                      placeholder="Postal / PIN code"
                      disabled={isLoading}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="country"
                      className="mb-1.5 block text-xs font-medium"
                    >
                      Country
                    </label>

                    <input
                      id="country"
                      value={form.country}
                      onChange={(event) =>
                        updateField(
                          "country",
                          event.target.value,
                        )
                      }
                      disabled={isLoading}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="border-t pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium">
                      Almost there
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                      You can change these details
                      anytime from Shop Settings.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-500 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Creating shop...
                      </>
                    ) : (
                      <>
                        Create shop
                        <ArrowRight className="ml-2 size-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>

        <footer className="py-3 text-center text-[10px] text-muted-foreground">
          © 2026 BillNest. Your business, organized.
        </footer>
      </div>
    </main>
  );
}