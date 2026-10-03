export interface RazorpayOrderResponse {
  success: boolean;
  data?: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    invoiceId: string;
    invoiceNumber: string;
  };
  message?: string;
}

export interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutFailure {
  error?: {
    description?: string;
  };
}

interface RazorpayCheckoutInstance {
  open: () => void;
  on: (
    event: string,
    handler: (
      response: RazorpayCheckoutFailure,
    ) => void,
  ) => void;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler: (
    response: RazorpayCheckoutResponse,
  ) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayConstructor {
  new (
    options: RazorpayCheckoutOptions,
  ): RazorpayCheckoutInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export function loadRazorpayCheckout(): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existing) {
      existing.addEventListener(
        "load",
        () => resolve(),
        { once: true },
      );

      existing.addEventListener(
        "error",
        () =>
          reject(
            new Error(
              "Unable to load Razorpay Checkout.",
            ),
          ),
        { once: true },
      );

      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () =>
      resolve();

    script.onerror = () =>
      reject(
        new Error(
          "Unable to load Razorpay Checkout.",
        ),
      );

    document.body.appendChild(
      script,
    );
  });
}
