import {
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

const PINCODE_API_URL =
  "https://api.postalpincode.in/pincode";

const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

interface ShopAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Shop {
  _id: string;
  ownerId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  taxId?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ShopForm {
  name: string;
  phone: string;
  email: string;
  taxId: string;
  address: ShopAddress;
}

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

const EMPTY_FORM: ShopForm = {
  name: "",
  phone: "",
  email: "",
  taxId: "",
  address: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  },
};

function normalizePhoneForInput(
  phone?: string,
) {
  if (!phone) {
    return "";
  }

  const normalized = phone.trim();

  if (normalized.startsWith("+91")) {
    return normalized
      .slice(3)
      .replace(/\D/g, "")
      .slice(0, 10);
  }

  if (
    normalized.startsWith("91") &&
    normalized.length > 10
  ) {
    return normalized
      .slice(2)
      .replace(/\D/g, "")
      .slice(0, 10);
  }

  return normalized
    .replace(/\D/g, "")
    .slice(0, 10);
}

function normalizeShop(
  shop: Shop,
): ShopForm {
  return {
    name: shop.name ?? "",
    phone: normalizePhoneForInput(
      shop.phone,
    ),
    email: shop.email ?? "",
    taxId: shop.taxId ?? "",
    address: {
      line1: shop.address?.line1 ?? "",
      line2: shop.address?.line2 ?? "",
      city: shop.address?.city ?? "",
      state: shop.address?.state ?? "",
      postalCode:
        shop.address?.postalCode ?? "",
      country:
        shop.address?.country ?? "India",
    },
  };
}

function getErrorMessage(
  result: unknown,
  fallback: string,
): string {
  if (
    typeof result === "object" &&
    result !== null &&
    "message" in result &&
    typeof result.message === "string"
  ) {
    return result.message;
  }

  return fallback;
}

const inputClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

export default function SettingsPage() {
  const [form, setForm] =
    useState<ShopForm>(EMPTY_FORM);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [hasShop, setHasShop] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isPincodeLoading, setIsPincodeLoading] =
    useState(false);

  const [pincodeMessage, setPincodeMessage] =
    useState("");

  const pincodeRequestRef =
    useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadShop() {
      try {
        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        const response = await fetch(
          `${API_URL}/shops/me`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        let result: unknown = null;

        try {
          result = await response.json();
        } catch {
          result = null;
        }

        /*
         * A shopkeeper may legitimately have no shop
         * yet. Treat SHOP_NOT_FOUND as an empty
         * first-time setup state instead of an error.
         */
        if (
          response.status === 404 &&
          typeof result === "object" &&
          result !== null &&
          "code" in result &&
          result.code === "SHOP_NOT_FOUND"
        ) {
          if (!mounted) {
            return;
          }

          setForm({
            ...EMPTY_FORM,
            address: {
              ...EMPTY_FORM.address,
            },
          });

          setHasShop(false);
          setError("");

          return;
        }

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              result,
              "Unable to load your shop details.",
            ),
          );
        }

        const shop =
          typeof result === "object" &&
          result !== null &&
          "data" in result &&
          typeof result.data === "object" &&
          result.data !== null &&
          "shop" in result.data
            ? (result.data.shop as
                | Shop
                | null
                | undefined)
            : undefined;

        if (!mounted) {
          return;
        }

        if (shop) {
          setForm(normalizeShop(shop));
          setHasShop(true);
        } else {
          setForm({
            ...EMPTY_FORM,
            address: {
              ...EMPTY_FORM.address,
            },
          });

          setHasShop(false);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your shop details.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadShop();

    return () => {
      mounted = false;
      pincodeRequestRef.current?.abort();
    };
  }, []);

  const updateField = <
    K extends keyof ShopForm,
  >(
    field: K,
    value: ShopForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccessMessage("");
    setError("");
  };

  const updateAddress = <
    K extends keyof ShopAddress,
  >(
    field: K,
    value: ShopAddress[K],
  ) => {
    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
    }));

    setSuccessMessage("");
    setError("");
  };

  const lookupPincode = async (
    pincode: string,
  ) => {
    const cleanedPincode = pincode
      .replace(/\D/g, "")
      .slice(0, 6);

    if (cleanedPincode.length < 6) {
      setIsPincodeLoading(false);
      setPincodeMessage("");
      return;
    }

    pincodeRequestRef.current?.abort();

    const controller =
      new AbortController();

    pincodeRequestRef.current =
      controller;

    try {
      setIsPincodeLoading(true);
      setPincodeMessage("");
      setError("");

      const response = await fetch(
        `${PINCODE_API_URL}/${cleanedPincode}`,
        {
          method: "GET",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(
          "Unable to lookup this postal code.",
        );
      }

      const result =
        (await response.json()) as PincodeResponse[];

      const data = result?.[0];

      if (
        !data ||
        data.Status?.toLowerCase() !==
          "success" ||
        !data.PostOffice ||
        data.PostOffice.length === 0
      ) {
        setPincodeMessage(
          "Postal code not found. Please check the PIN code.",
        );

        return;
      }

      const postOffice =
        data.PostOffice[0];

      const district =
        postOffice.District?.trim() ?? "";

      const state =
        postOffice.State?.trim() ?? "";

      const country =
        postOffice.Country?.trim() ||
        "India";

      setForm((current) => ({
        ...current,
        address: {
          ...current.address,
          city: district,
          state,
          country,
          postalCode: cleanedPincode,
        },
      }));

      setPincodeMessage(
        district
          ? `City found: ${district}`
          : "Postal code found.",
      );
    } catch (err) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        return;
      }

      setPincodeMessage(
        "Could not find this postal code. You can enter the city manually.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsPincodeLoading(false);
      }
    }
  };

  const handleTextChange =
    (field: keyof ShopForm) =>
    (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      updateField(
        field,
        event.target.value,
      );
    };

  const handlePhoneChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const digitsOnly =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 10);

    updateField(
      "phone",
      digitsOnly,
    );
  };

  const handleAddressChange =
    (field: keyof ShopAddress) =>
    (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      updateAddress(
        field,
        event.target.value,
      );
    };

  const handlePostalCodeChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const digitsOnly =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    updateAddress(
      "postalCode",
      digitsOnly,
    );

    setPincodeMessage("");

    if (digitsOnly.length === 6) {
      void lookupPincode(digitsOnly);
    }
  };

  const handleStateChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    updateAddress(
      "state",
      event.target.value,
    );
  };

  const validateForm = (): string => {
    const name =
      form.name.trim();

    if (name.length < 2) {
      return "Shop name must contain at least 2 characters.";
    }

    if (name.length > 150) {
      return "Shop name cannot exceed 150 characters.";
    }

    if (form.phone.trim()) {
      if (form.phone.length !== 10) {
        return "Please enter a valid 10-digit Indian mobile number.";
      }
    }

    if (form.email.trim()) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          form.email.trim(),
        )
      ) {
        return "Please provide a valid shop email address.";
      }
    }

    if (
      form.taxId.trim().length > 50
    ) {
      return "GST Number cannot exceed 50 characters.";
    }

    if (
      form.address.line1.trim()
        .length > 200
    ) {
      return "Address Line 1 cannot exceed 200 characters.";
    }

    if (
      form.address.line2.trim()
        .length > 200
    ) {
      return "Address Line 2 cannot exceed 200 characters.";
    }

    if (
      form.address.city.trim()
        .length > 100
    ) {
      return "City cannot exceed 100 characters.";
    }

    if (
      form.address.state.trim()
        .length > 100
    ) {
      return "State cannot exceed 100 characters.";
    }

    if (
      form.address.postalCode.trim() &&
      form.address.postalCode.trim()
        .length !== 6
    ) {
      return "Postal code must contain 6 digits.";
    }

    if (
      form.address.country.trim()
        .length > 100
    ) {
      return "Country cannot exceed 100 characters.";
    }

    return "";
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSaving(true);

      const phoneDigits =
        form.phone
          .replace(/\D/g, "")
          .slice(0, 10);

      const payload = {
        name: form.name.trim(),

        phone: phoneDigits
          ? `+91${phoneDigits}`
          : undefined,

        email:
          form.email.trim() ||
          undefined,

        taxId:
          form.taxId.trim() ||
          undefined,

        address: {
          line1:
            form.address.line1.trim() ||
            undefined,

          line2:
            form.address.line2.trim() ||
            undefined,

          city:
            form.address.city.trim() ||
            undefined,

          state:
            form.address.state.trim() ||
            undefined,

          postalCode:
            form.address.postalCode.trim() ||
            undefined,

          country:
            form.address.country.trim() ||
            "India",
        },
      };

      const creatingShop = !hasShop;

      const response = await fetch(
        `${API_URL}/shops/me`,
        {
          method: creatingShop
            ? "POST"
            : "PATCH",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload,
          ),
        },
      );

      let result: unknown = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            "Unable to save your shop details.",
          ),
        );
      }

      const savedShop =
        typeof result === "object" &&
        result !== null &&
        "data" in result &&
        typeof result.data === "object" &&
        result.data !== null &&
        "shop" in result.data
          ? (result.data.shop as
              | Shop
              | undefined)
          : undefined;

      if (savedShop) {
        setForm(
          normalizeShop(
            savedShop,
          ),
        );
      }

      setHasShop(true);

      setSuccessMessage(
        creatingShop
          ? "Shop details saved successfully."
          : "Shop details updated successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your shop details.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center p-6 lg:p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading shop settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Badge
          variant="secondary"
          className="mb-3"
        >
          Business Settings
        </Badge>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Shop Settings
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manage the business information
          that appears across your invoices,
          warranties and customer records.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

          <span>
            {successMessage}
          </span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </div>

              <div>
                <CardTitle>
                  Business information
                </CardTitle>

                <CardDescription>
                  Basic details about your
                  shop.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label
                htmlFor="shop-name"
                className="text-sm font-medium"
              >
                Shop Name{" "}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <input
                id="shop-name"
                value={form.name}
                onChange={handleTextChange(
                  "name",
                )}
                placeholder="Enter your shop name"
                maxLength={150}
                required
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="shop-gst"
                className="text-sm font-medium"
              >
                GST Number (GSTIN)
              </label>

              <input
                id="shop-gst"
                value={form.taxId}
                onChange={handleTextChange(
                  "taxId",
                )}
                placeholder="Enter GSTIN"
                maxLength={50}
                className={inputClassName}
              />

              <p className="text-xs text-muted-foreground">
                Your GSTIN is stored as the
                shop tax ID.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="shop-phone"
                className="text-sm font-medium"
              >
                Phone Number
              </label>

              <div className="flex h-10 w-full overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring">
                <div className="flex items-center gap-2 border-r bg-muted/40 px-3 text-sm font-medium text-foreground">
                  <Phone className="size-4 text-muted-foreground" />
                  +91
                </div>

                <input
                  id="shop-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={form.phone}
                  onChange={
                    handlePhoneChange
                  }
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label
                htmlFor="shop-email"
                className="text-sm font-medium"
              >
                Business Email
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="shop-email"
                  type="email"
                  value={form.email}
                  onChange={
                    handleTextChange(
                      "email",
                    )
                  }
                  placeholder="Enter business email"
                  maxLength={254}
                  className={`${inputClassName} pl-9`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-5" />
              </div>

              <div>
                <CardTitle>
                  Business address
                </CardTitle>

                <CardDescription>
                  Address information for your
                  shop and invoices.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label
                htmlFor="address-line1"
                className="text-sm font-medium"
              >
                Address Line 1
              </label>

              <input
                id="address-line1"
                value={
                  form.address.line1
                }
                onChange={
                  handleAddressChange(
                    "line1",
                  )
                }
                placeholder="Enter address line 1"
                maxLength={200}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label
                htmlFor="address-line2"
                className="text-sm font-medium"
              >
                Address Line 2
              </label>

              <input
                id="address-line2"
                value={
                  form.address.line2
                }
                onChange={
                  handleAddressChange(
                    "line2",
                  )
                }
                placeholder="Enter address line 2 (optional)"
                maxLength={200}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="address-city"
                className="text-sm font-medium"
              >
                City
              </label>

              <input
                id="address-city"
                value={
                  form.address.city
                }
                onChange={
                  handleAddressChange(
                    "city",
                  )
                }
                placeholder={
                  isPincodeLoading
                    ? "Finding city..."
                    : "Enter city"
                }
                maxLength={100}
                className={inputClassName}
              />

              {isPincodeLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Looking up postal code...
                </div>
              )}

              {!isPincodeLoading &&
                pincodeMessage && (
                  <p
                    className={`text-xs ${
                      pincodeMessage.startsWith(
                        "City found:",
                      )
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {pincodeMessage}
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="address-state"
                className="text-sm font-medium"
              >
                State / UT
              </label>

              <select
                id="address-state"
                value={
                  form.address.state
                }
                onChange={
                  handleStateChange
                }
                className={
                  selectClassName
                }
              >
                <option value="">
                  Select state / UT
                </option>

                {INDIAN_STATES_AND_UTS.map(
                  (state) => (
                    <option
                      key={state}
                      value={state}
                    >
                      {state}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="address-postal"
                className="text-sm font-medium"
              >
                Postal Code
              </label>

              <input
                id="address-postal"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                value={
                  form.address
                    .postalCode
                }
                onChange={
                  handlePostalCodeChange
                }
                placeholder="Enter 6-digit PIN code"
                maxLength={6}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="address-country"
                className="text-sm font-medium"
              >
                Country
              </label>

              <input
                id="address-country"
                value={
                  form.address.country
                }
                onChange={
                  handleAddressChange(
                    "country",
                  )
                }
                placeholder="Country"
                maxLength={100}
                className={inputClassName}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  Keep your business information
                  up to date
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  These details can be used
                  across your invoices and
                  business records.
                </p>
              </div>

              <Button
                type="submit"
                isDisabled={isSaving}
                className="sm:min-w-36"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}