import { useEffect, useState } from "react";
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

const PINCODE_API_URL =
  "https://api.postalpincode.in/pincode";

interface PincodePostOffice {
  Name?: string;
  District?: string;
  State?: string;
  Country?: string;
  Pincode?: string;
}

interface PincodeResponse {
  Message?: string;
  Status?: string;
  PostOffice?: PincodePostOffice[] | null;
}

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

export function CustomerForm({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialValues,
  mode = "create",
}: CustomerFormProps) {
  const [postalLookupMessage, setPostalLookupMessage] =
    useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      ...defaultValues,
      ...initialValues,
    });
  }, [open, initialValues, reset]);

  const postalCode = watch("postalCode");

  useEffect(() => {
    if (!open) {
      return;
    }

    const cleanedPostalCode =
      postalCode.replace(/\D/g, "").slice(0, 6);

    if (cleanedPostalCode.length !== 6) {
      setPostalLookupMessage("");
      return;
    }

    const controller = new AbortController();

    const lookupPostalCode = async () => {
      setPostalLookupMessage("Looking up location...");

      try {
        const response = await fetch(
          \`${PINCODE_API_URL}/${cleanedPostalCode}\`,
          {
            method: "GET",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            "Unable to lookup postal code.",
          );
        }

        const result =
          (await response.json()) as PincodeResponse[];

        const firstResult = result[0];

        if (
          firstResult?.Status !== "Success" ||
          !firstResult.PostOffice?.length
        ) {
          setPostalLookupMessage(
            "Postal code not found.",
          );
          return;
        }

        const postOffice =
          firstResult.PostOffice[0];

        setValue(
          "city",
          postOffice.District ??
            postOffice.Name ??
            "",
          {
            shouldDirty: true,
            shouldValidate: true,
          },
        );

        setValue(
          "state",
          postOffice.State ?? "",
          {
            shouldDirty: true,
            shouldValidate: true,
          },
        );

        setValue(
          "country",
          postOffice.Country ??
            "India",
          {
            shouldDirty: true,
            shouldValidate: true,
          },
        );

        setPostalLookupMessage(
          postOffice.District &&
            postOffice.State
            ? \`Location found: ${postOffice.District}, ${postOffice.State}\`
            : "Location found.",
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setPostalLookupMessage(
          "Unable to lookup this postal code.",
        );
      }
    };

    void lookupPostalCode();

    return () => {
      controller.abort();
    };
  }, [open, postalCode, setValue]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, isSubmitting, onClose]);

  if (!open) {
    return null;
  }

  const submitLabel =
    mode === "edit" ? "Save Changes" : "Add Customer";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-form-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSubmitting
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
        {/* Header */}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto"
        >
          <div className="space-y-6 p-5 sm:p-6">
            {/* Basic information */}
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

            {/* Address */}
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

                <FormField
                  label="City"
                  error={errors.city?.message}
                >
                  <input
                    {...register("city")}
                    placeholder="City"
                    className={inputClass(
                      Boolean(errors.city),
                    )}
                  />
                </FormField>

                <FormField
                  label="State"
                  error={errors.state?.message}
                >
                  <input
                    {...register("state")}
                    placeholder="State"
                    className={inputClass(
                      Boolean(errors.state),
                    )}
                  />
                </FormField>

                <FormField
                  label="Postal code"
                  error={errors.postalCode?.message}
                >
                  <input
                    {...register("postalCode", {
                      onChange: (event) => {
                        const value =
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);

                        event.target.value =
                          value;
                      },
                    })}
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="postal-code"
                    placeholder="Postal code"
                    className={inputClass(
                      Boolean(errors.postalCode),
                    )}
                  />

                  {postalLookupMessage &&
                    !errors.postalCode?.message && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {postalLookupMessage}
                      </p>
                    )}
                </FormField>

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

          {/* Footer */}
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
              disabled={isSubmitting}
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
          <span className="ml-1 text-destructive">*</span>
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