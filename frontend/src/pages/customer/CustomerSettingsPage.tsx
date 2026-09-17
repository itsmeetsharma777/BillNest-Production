import {
  Check,
  Loader2,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

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

interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface AccountData {
  user: {
    id: string;
    name: string;
    email: string;
    role: "customer";
    isActive: boolean;
    emailVerified: boolean;
  };
  customer: {
    id: string;
    phone: string;
    address: Address;
  };
}

interface AccountResponse {
  success: boolean;
  message?: string;
  data?: AccountData;
}

interface PincodePostOffice {
  District?: string;
  State?: string;
  Country?: string;
}

interface PincodeResponse {
  Message?: string;
  Status?: string;
  PostOffice?: PincodePostOffice[] | null;
}

function createEmptyAddress(): Address {
  return {
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  };
}

function getDigits(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 10);
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("91")) {
    return digits.slice(2, 12);
  }

  return digits.slice(0, 10);
}

export default function CustomerSettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [address, setAddress] =
    useState<Address>(createEmptyAddress());

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [pincodeMessage, setPincodeMessage] =
    useState("");

  const [isPincodeLoading, setIsPincodeLoading] =
    useState(false);

  const pincodeRequestRef =
    useRef<AbortController | null>(null);

  useEffect(() => {
    void loadAccount();

    return () => {
      pincodeRequestRef.current?.abort();
    };
  }, []);

  async function loadAccount() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/customer/account`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as AccountResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Unable to load account settings.",
        );
      }

      if (!result.data) {
        throw new Error(
          "Account information was not returned.",
        );
      }

      setName(result.data.user.name);
      setEmail(result.data.user.email);
      setPhone(
        normalizePhone(
          result.data.customer.phone,
        ),
      );

      setAddress({
        line1:
          result.data.customer.address
            ?.line1 ?? "",
        line2:
          result.data.customer.address
            ?.line2 ?? "",
        city:
          result.data.customer.address
            ?.city ?? "",
        state:
          result.data.customer.address
            ?.state ?? "",
        postalCode:
          result.data.customer.address
            ?.postalCode ?? "",
        country:
          result.data.customer.address
            ?.country ?? "India",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load account settings.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateAddress(
    field: keyof Address,
    value: string,
  ) {
    setAddress(
      (currentAddress) => ({
        ...currentAddress,
        [field]: value,
      }),
    );

    setError("");
    setSuccessMessage("");
  }

  async function lookupPincode(
    pincode: string,
  ) {
    const cleanedPincode =
      pincode
        .replace(/\D/g, "")
        .slice(0, 6);

    if (
      cleanedPincode.length !== 6
    ) {
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
          "Unable to lookup postal code.",
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

      const city =
        postOffice.District?.trim() ??
        "";

      const state =
        postOffice.State?.trim() ??
        "";

      const country =
        postOffice.Country?.trim() ||
        "India";

      setAddress(
        (currentAddress) => ({
          ...currentAddress,
          postalCode:
            cleanedPincode,
          city,
          state,
          country,
        }),
      );

      setPincodeMessage(
        city
          ? `City found: ${city}`
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
      if (
        !controller.signal.aborted
      ) {
        setIsPincodeLoading(false);
      }
    }
  }

  function handlePincodeChange(
    value: string,
  ) {
    const digits =
      value
        .replace(/\D/g, "")
        .slice(0, 6);

    updateAddress(
      "postalCode",
      digits,
    );

    setPincodeMessage("");

    if (
      digits.length === 6
    ) {
      void lookupPincode(digits);
    }
  }

  function validateForm() {
    const trimmedName =
      name.trim();

    const trimmedEmail =
      email.trim();

    const trimmedPhone =
      phone.trim();

    if (
      trimmedName.length < 2
    ) {
      return "Name must contain at least 2 characters.";
    }

    if (
      trimmedName.length > 100
    ) {
      return "Name cannot exceed 100 characters.";
    }

    if (!trimmedEmail) {
      return "Email is required.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        trimmedEmail,
      )
    ) {
      return "Please provide a valid email address.";
    }

    if (
      trimmedPhone &&
      trimmedPhone.length !== 10
    ) {
      return "Phone number must contain 10 digits.";
    }

    if (
      address.line1.trim()
        .length > 200
    ) {
      return "Address Line 1 cannot exceed 200 characters.";
    }

    if (
      address.line2.trim()
        .length > 200
    ) {
      return "Address Line 2 cannot exceed 200 characters.";
    }

    if (
      address.city.trim()
        .length > 100
    ) {
      return "City cannot exceed 100 characters.";
    }

    if (
      address.state.trim()
        .length > 100
    ) {
      return "State cannot exceed 100 characters.";
    }

    if (
      address.postalCode.trim() &&
      address.postalCode.trim()
        .length !== 6
    ) {
      return "Postal code must contain 6 digits.";
    }

    if (
      address.country.trim()
        .length > 100
    ) {
      return "Country cannot exceed 100 characters.";
    }

    return "";
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/customer/account`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email
              .trim()
              .toLowerCase(),
            phone: phone.trim()
              ? `+91${phone.trim()}`
              : undefined,
            address: {
              line1:
                address.line1.trim() ||
                undefined,
              line2:
                address.line2.trim() ||
                undefined,
              city:
                address.city.trim() ||
                undefined,
              state:
                address.state.trim() ||
                undefined,
              postalCode:
                address.postalCode.trim() ||
                undefined,
              country:
                address.country.trim() ||
                "India",
            },
          }),
        },
      );

      const result =
        (await response.json()) as AccountResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Unable to save account settings.",
        );
      }

      if (result.data) {
        setName(
          result.data.user.name,
        );

        setEmail(
          result.data.user.email,
        );

        setPhone(
          normalizePhone(
            result.data.customer.phone,
          ),
        );

        setAddress({
          line1:
            result.data.customer.address
              ?.line1 ?? "",
          line2:
            result.data.customer.address
              ?.line2 ?? "",
          city:
            result.data.customer.address
              ?.city ?? "",
          state:
            result.data.customer.address
              ?.state ?? "",
          postalCode:
            result.data.customer.address
              ?.postalCode ?? "",
          country:
            result.data.customer.address
              ?.country ?? "India",
        });
      }

      setSuccessMessage(
        "Your account settings have been saved successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save account settings.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your settings...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Settings
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information and address.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/5 p-4 text-sm text-green-700 dark:text-green-400">
          <Check className="size-4" />
          {successMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Personal Information
              </h2>

              <p className="text-xs text-muted-foreground">
                Update your basic account information.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Full Name
              </span>

              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(
                    event.target.value,
                  );
                  setError("");
                  setSuccessMessage("");
                }}
                placeholder="Enter your name"
                maxLength={100}
                autoComplete="name"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Email Address
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value,
                  );
                  setError("");
                  setSuccessMessage("");
                }}
                placeholder="you@example.com"
                maxLength={254}
                autoComplete="email"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Phone Number
              </span>

              <div className="flex h-11 overflow-hidden rounded-xl border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <div className="flex w-14 shrink-0 items-center justify-center border-r bg-muted/40 text-sm font-medium">
                  +91
                </div>

                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(event) => {
                    setPhone(
                      getDigits(
                        event.target.value,
                      ).slice(0, 10),
                    );
                    setError("");
                    setSuccessMessage("");
                  }}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  autoComplete="tel-national"
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                />
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Address
              </h2>

              <p className="text-xs text-muted-foreground">
                Keep your address up to date for invoices and records.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Address Line 1
              </span>

              <input
                type="text"
                value={address.line1}
                onChange={(event) =>
                  updateAddress(
                    "line1",
                    event.target.value,
                  )
                }
                placeholder="House no., street, area"
                maxLength={200}
                autoComplete="address-line1"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Address Line 2
              </span>

              <input
                type="text"
                value={address.line2}
                onChange={(event) =>
                  updateAddress(
                    "line2",
                    event.target.value,
                  )
                }
                placeholder="Apartment, landmark, etc. (optional)"
                maxLength={200}
                autoComplete="address-line2"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                City
              </span>

              <input
                type="text"
                value={address.city}
                onChange={(event) =>
                  updateAddress(
                    "city",
                    event.target.value,
                  )
                }
                placeholder={
                  isPincodeLoading
                    ? "Finding city..."
                    : "Enter city"
                }
                maxLength={100}
                autoComplete="address-level2"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              {isPincodeLoading && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Looking up PIN code...
                </div>
              )}

              {!isPincodeLoading &&
                pincodeMessage && (
                  <p
                    className={`mt-2 text-xs ${
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
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                State / UT
              </span>

              <select
                value={address.state}
                onChange={(event) =>
                  updateAddress(
                    "state",
                    event.target.value,
                  )
                }
                autoComplete="address-level1"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                PIN Code
              </span>

              <input
                type="text"
                inputMode="numeric"
                value={address.postalCode}
                onChange={(event) =>
                  handlePincodeChange(
                    event.target.value,
                  )
                }
                placeholder="Enter 6-digit PIN code"
                maxLength={6}
                autoComplete="postal-code"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Country
              </span>

              <input
                type="text"
                value={address.country}
                onChange={(event) =>
                  updateAddress(
                    "country",
                    event.target.value,
                  )
                }
                placeholder="Country"
                maxLength={100}
                autoComplete="country-name"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>

          <div className="mt-5 rounded-xl border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
            Enter a 6-digit Indian PIN code to automatically find the city and state. You can still edit the results manually.
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              void loadAccount();
            }}
            disabled={isSaving}
            className="h-11 rounded-xl border px-5 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset Changes
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}