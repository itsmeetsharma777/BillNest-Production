import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Loader2,
  Mail,
  MapPin,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters."),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .or(z.literal("")),

  phone: z
    .string()
    .trim()
    .max(20, "Phone number cannot exceed 20 characters.")
    .or(z.literal("")),

  line1: z
    .string()
    .trim()
    .max(150, "Address cannot exceed 150 characters.")
    .or(z.literal("")),

  line2: z
    .string()
    .trim()
    .max(150, "Address cannot exceed 150 characters.")
    .or(z.literal("")),

  city: z
    .string()
    .trim()
    .max(80, "City cannot exceed 80 characters.")
    .or(z.literal("")),

  state: z
    .string()
    .trim()
    .max(80, "State cannot exceed 80 characters.")
    .or(z.literal("")),

  postalCode: z
    .string()
    .trim()
    .max(20, "Postal code cannot exceed 20 characters.")
    .or(z.literal("")),

  country: z
    .string()
    .trim()
    .max(80, "Country cannot exceed 80 characters.")
    .or(z.literal("")),
});

export type CustomerFormValues = z.infer<
  typeof customerFormSchema
>;

interface CustomerFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  isSubmitting?: boolean;
  initialValues?: Partial<CustomerFormValues>;
  mode?: "create" | "edit";
}

/* =========================================================
   POSTAL API TYPES
   ========================================================= */

interface IndiaPostOffice {
  Name?: string;
  District?: string;
  State?: string;
  Country?: string;
  Pincode?: string;
}

interface IndiaPostResponse {
  Message?: string;
  Status?: string;
  PostOffice?: IndiaPostOffice[] | null;
}

interface GitHubPostalOffice {
  officeName?: string;
  officeType?: string;
  deliveryStatus?: string;
  circleName?: string;
  regionName?: string;
  divisionName?: string;
  latitude?: number;
  longitude?: number;
}

interface GitHubPostalResponse {
  state?: string;
  district?: string;
  offices?: GitHubPostalOffice[];
}

/* =========================================================
   CONSTANTS
   ========================================================= */

const INDIA_POST_API =
  "https://api.postalpincode.in/pincode";

const FALLBACK_POSTAL_API =
  "https://aniket-thapa.github.io/india-pincode-api/pincodes";

const POSTAL_REQUEST_TIMEOUT = 7000;

/* =========================================================
   DEFAULT VALUES
   ========================================================= */

const defaultValues: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

/* =========================================================
   CUSTOMER FORM
   ========================================================= */

export function CustomerForm({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialValues,
  mode = "create",
}: CustomerFormProps) {
  const [isLookingUpPostalCode, setIsLookingUpPostalCode] =
    useState(false);

  const [postalCodeMessage, setPostalCodeMessage] =
    useState("");

  /*
   * Used to cancel an older request when the user
   * changes the PIN before the previous lookup finishes.
   */
  const postalLookupControllerRef =
    useRef<AbortController | null>(null);

  /*
   * Keeps track of the latest PIN request.
   * This prevents an older API response from
   * overwriting a newer PIN.
   */
  const postalLookupRequestRef = useRef(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),

    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
  });

  /* =======================================================
     RESET FORM WHEN MODAL OPENS
     ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      ...defaultValues,
      ...initialValues,
    });

    setPostalCodeMessage("");
    setIsLookingUpPostalCode(false);
  }, [open, initialValues, reset]);

  /* =======================================================
     CLEANUP API REQUESTS
     ======================================================= */

  useEffect(() => {
    return () => {
      postalLookupControllerRef.current?.abort();
    };
  }, []);

  /* =======================================================
     ESCAPE KEY
     ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !isSubmitting &&
        !isLookingUpPostalCode
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    open,
    isSubmitting,
    isLookingUpPostalCode,
    onClose,
  ]);

  /* =======================================================
     FETCH WITH TIMEOUT
     ======================================================= */

  async function fetchWithTimeout(
    url: string,
    timeout = POSTAL_REQUEST_TIMEOUT,
  ): Promise<Response> {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      return response;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  /* =======================================================
     INDIA POST LOOKUP
     ======================================================= */

  async function lookupIndiaPost(
    postalCode: string,
  ): Promise<{
    city: string;
    state: string;
    country: string;
  } | null> {
    const response = await fetchWithTimeout(
      `${INDIA_POST_API}/${postalCode}`,
    );

    if (!response.ok) {
      throw new Error(
        `India Post returned HTTP ${response.status}`,
      );
    }

    const result =
      (await response.json()) as IndiaPostResponse[];

    const postalData = result?.[0];

    if (
      !postalData ||
      postalData.Status !== "Success" ||
      !postalData.PostOffice ||
      postalData.PostOffice.length === 0
    ) {
      return null;
    }

    const firstPostOffice =
      postalData.PostOffice[0];

    const city =
      firstPostOffice?.District?.trim() ?? "";

    const state =
      firstPostOffice?.State?.trim() ?? "";

    const country =
      firstPostOffice?.Country?.trim() || "India";

    if (!city && !state) {
      return null;
    }

    return {
      city,
      state,
      country,
    };
  }

  /* =======================================================
     FALLBACK LOOKUP
     ======================================================= */

  async function lookupFallbackPostalApi(
    postalCode: string,
  ): Promise<{
    city: string;
    state: string;
    country: string;
  } | null> {
    const response = await fetchWithTimeout(
      `${FALLBACK_POSTAL_API}/${postalCode}.json`,
    );

    if (!response.ok) {
      throw new Error(
        `Fallback postal API returned HTTP ${response.status}`,
      );
    }

    const result =
      (await response.json()) as GitHubPostalResponse;

    const city =
      result?.district?.trim() ?? "";

    const state =
      result?.state?.trim() ?? "";

    if (!city && !state) {
      return null;
    }

    return {
      city,
      state,
      country: "India",
    };
  }

  /* =======================================================
     MAIN POSTAL LOOKUP
     ======================================================= */

  async function lookupPostalCode(
    postalCode: string,
  ) {
    const normalizedPostalCode =
      postalCode.replace(/\D/g, "");

    if (normalizedPostalCode.length !== 6) {
      setPostalCodeMessage("");
      setIsLookingUpPostalCode(false);

      return;
    }

    /*
     * Cancel previous request.
     */
    postalLookupControllerRef.current?.abort();

    const requestId =
      ++postalLookupRequestRef.current;

    setIsLookingUpPostalCode(true);
    setPostalCodeMessage("");

    /*
     * Clear previous location before
     * looking up the new PIN.
     */
    setValue("city", "", {
      shouldDirty: true,
      shouldValidate: false,
    });

    setValue("state", "", {
      shouldDirty: true,
      shouldValidate: false,
    });

    try {
      let postalData:
        | {
            city: string;
            state: string;
            country: string;
          }
        | null = null;

      /* ---------------------------------------------------
         PRIMARY API
         --------------------------------------------------- */

      try {
        postalData =
          await lookupIndiaPost(
            normalizedPostalCode,
          );
      } catch (error) {
        /*
         * India Post API can occasionally be unavailable,
         * blocked, or slow from the browser.
         *
         * We intentionally fall back instead of
         * leaving the user stuck on a spinner.
         */

        console.warn(
          "India Post PIN lookup failed:",
          error,
        );
      }

      /* ---------------------------------------------------
         FALLBACK API
         --------------------------------------------------- */

      if (!postalData) {
        try {
          postalData =
            await lookupFallbackPostalApi(
              normalizedPostalCode,
            );
        } catch (error) {
          console.warn(
            "Fallback PIN lookup failed:",
            error,
          );
        }
      }

      /*
       * Ignore response if it belongs to an older
       * PIN request.
       */
      if (
        requestId !==
        postalLookupRequestRef.current
      ) {
        return;
      }

      if (!postalData) {
        setValue("city", "");
        setValue("state", "");

        setPostalCodeMessage(
          "Postal code not found. You can enter the city and state manually.",
        );

        return;
      }

      /* ---------------------------------------------------
         UPDATE CITY
         --------------------------------------------------- */

      if (postalData.city) {
        setValue(
          "city",
          postalData.city,
          {
            shouldDirty: true,
            shouldValidate: true,
          },
        );
      }

      /* ---------------------------------------------------
         UPDATE STATE
         --------------------------------------------------- */

      if (postalData.state) {
        setValue(
          "state",
          postalData.state,
          {
            shouldDirty: true,
            shouldValidate: true,
          },
        );
      }

      /* ---------------------------------------------------
         UPDATE COUNTRY
         --------------------------------------------------- */

      if (postalData.country) {
        setValue(
          "country",
          postalData.country,
          {
            shouldDirty: true,
            shouldValidate: true,
          },
        );
      }

      clearErrors([
        "city",
        "state",
      ]);

      if (
        postalData.city &&
        postalData.state
      ) {
        setPostalCodeMessage(
          "City and state filled automatically.",
        );
      } else if (postalData.state) {
        setPostalCodeMessage(
          "State filled automatically. Please enter the city.",
        );
      } else {
        setPostalCodeMessage(
          "Postal code found. Please enter the city.",
        );
      }
    } catch (error) {
      /*
       * Ignore aborts caused by a newer PIN request.
       */
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(
        "Postal code lookup failed:",
        error,
      );

      setPostalCodeMessage(
        "Unable to look up this postal code. You can enter the city and state manually.",
      );
    } finally {
      /*
       * Only the newest request is allowed to
       * turn off the loader.
       */
      if (
        requestId ===
        postalLookupRequestRef.current
      ) {
        setIsLookingUpPostalCode(false);
      }
    }
  }

  /* =======================================================
     POSTAL INPUT CHANGE
     ======================================================= */

  function handlePostalCodeChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const normalizedValue =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    setValue(
      "postalCode",
      normalizedValue,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );

    setPostalCodeMessage("");

    /*
     * Cancel previous lookup when user changes
     * the PIN.
     */
    if (normalizedValue.length !== 6) {
      postalLookupControllerRef.current?.abort();

      ++postalLookupRequestRef.current;

      setIsLookingUpPostalCode(false);

      setValue("city", "");
      setValue("state", "");

      return;
    }

    /*
     * Start lookup when exactly 6 digits exist.
     */
    void lookupPostalCode(
      normalizedValue,
    );
  }

  /* =======================================================
     MODAL CLOSED
     ======================================================= */

  if (!open) {
    return null;
  }

  const submitLabel =
    mode === "edit"
      ? "Save Changes"
      : "Add Customer";

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-form-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSubmitting &&
          !isLookingUpPostalCode
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
        {/* =================================================
            HEADER
            ================================================= */}

        <div className="flex shrink-0 items-center justify-between border-b px-5 py-4 sm:px-6">
          <div>
            <h2
              id="customer-form-title"
              className="text-lg font-semibold tracking-tight"
            >
              {mode === "edit"
                ? "Edit Customer"
                : "Add Customer"}
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {mode === "edit"
                ? "Update the customer's information."
                : "Add a customer to your BillNest records."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* =================================================
            FORM
            ================================================= */}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto"
        >
          <div className="space-y-6 p-5 sm:p-6">
            {/* =================================================
                BASIC INFORMATION
                ================================================= */}

            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserRound className="size-4" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    Basic information
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    Customer's primary details
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Full name"
                  required
                  error={errors.name?.message}
                  className="sm:col-span-2"
                >
                  <input
                    {...register("name")}
                    autoFocus
                    placeholder="e.g. Rahul Sharma"
                    className={inputClass(
                      Boolean(errors.name),
                    )}
                  />
                </FormField>

                <FormField
                  label="Email"
                  error={errors.email?.message}
                >
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      {...register("email")}
                      type="email"
                      placeholder="customer@example.com"
                      className={`${inputClass(
                        Boolean(errors.email),
                      )} pl-9`}
                    />
                  </div>
                </FormField>

                <FormField
                  label="Phone"
                  error={errors.phone?.message}
                >
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      {...register("phone")}
                      type="tel"
                      inputMode="tel"
                      placeholder="+91 98765 43210"
                      className={`${inputClass(
                        Boolean(errors.phone),
                      )} pl-9`}
                    />
                  </div>
                </FormField>
              </div>
            </section>

            {/* =================================================
                ADDRESS
                ================================================= */}

            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    Address
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    Optional customer address
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* ADDRESS LINE 1 */}

                <FormField
                  label="Address line 1"
                  error={errors.line1?.message}
                  className="sm:col-span-2"
                >
                  <input
                    {...register("line1")}
                    placeholder="House / building / street"
                    className={inputClass(
                      Boolean(errors.line1),
                    )}
                  />
                </FormField>

                {/* ADDRESS LINE 2 */}

                <FormField
                  label="Address line 2"
                  error={errors.line2?.message}
                  className="sm:col-span-2"
                >
                  <input
                    {...register("line2")}
                    placeholder="Area / landmark (optional)"
                    className={inputClass(
                      Boolean(errors.line2),
                    )}
                  />
                </FormField>

                {/* CITY */}

                <FormField
                  label="City"
                  error={errors.city?.message}
                >
                  <input
                    {...register("city")}
                    placeholder="Enter postal code"
                    className={`${inputClass(
                      Boolean(errors.city),
                    )} bg-muted/30`}
                  />
                </FormField>

                {/* STATE */}

                <FormField
                  label="State"
                  error={errors.state?.message}
                >
                  <input
                    {...register("state")}
                    placeholder="Enter postal code"
                    className={`${inputClass(
                      Boolean(errors.state),
                    )} bg-muted/30`}
                  />
                </FormField>

                {/* POSTAL CODE */}

                <FormField
                  label="Postal code"
                  error={errors.postalCode?.message}
                >
                  <div className="relative">
                    <input
                      {...register(
                        "postalCode",
                        {
                          onChange:
                            handlePostalCodeChange,
                        },
                      )}
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="postal-code"
                      placeholder="6-digit PIN code"
                      className={`${inputClass(
                        Boolean(
                          errors.postalCode,
                        ),
                      )} pr-10`}
                    />

                    {isLookingUpPostalCode && (
                      <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" />
                    )}
                  </div>

                  {postalCodeMessage && (
                    <p
                      className={`mt-1.5 text-xs ${
                        postalCodeMessage.includes(
                          "automatically",
                        )
                          ? "text-primary"
                          : "text-destructive"
                      }`}
                    >
                      {postalCodeMessage}
                    </p>
                  )}
                </FormField>

                {/* COUNTRY */}

                <FormField
                  label="Country"
                  error={errors.country?.message}
                >
                  <input
                    {...register("country")}
                    placeholder="Country"
                    className={inputClass(
                      Boolean(errors.country),
                    )}
                  />
                </FormField>
              </div>
            </section>
          </div>

          {/* =================================================
              FOOTER
              ================================================= */}

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/20 p-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLookingUpPostalCode
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {isSubmitting
                ? mode === "edit"
                  ? "Saving..."
                  : "Adding..."
                : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   FORM FIELD
   ========================================================= */

function FormField({
  label,
  required,
  error,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium">
        {label}

        {required && (
          <span className="ml-1 text-destructive">
            *
          </span>
        )}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   INPUT STYLE
   ========================================================= */

function inputClass(hasError: boolean) {
  return [
    "h-10 w-full rounded-xl border bg-background px-3 text-sm",
    "outline-none transition-colors",
    "placeholder:text-muted-foreground",
    "focus:border-primary focus:ring-2 focus:ring-primary/20",
    hasError
      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
      : "",
  ].join(" ");
}

export default CustomerForm;