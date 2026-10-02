import {
  createCustomer,
  deactivateCustomerById,
  findActiveCustomerById,
  findCustomerByPhone,
  findCustomers,
  updateCustomerById,
} from "../repositories/customer.repository";

import {
  findUserByEmail,
} from "../repositories/user.repository";

import { ApiError } from "../utils/api-error";

import {
  normalizePhone,
} from "../utils/phone";

interface CustomerAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface CreateCustomerInput {
  name: string;
  email?: string;
  phone: string;
  address?: CustomerAddress;
  notes?: string;
}

interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: CustomerAddress;
  notes?: string;
}

/*
 * =========================================================
 * ADDRESS NORMALIZATION
 * =========================================================
 */

function normalizeAddress(
  address?: CustomerAddress,
) {
  if (!address) {
    return undefined;
  }

  return {
    ...(address.line1?.trim() && {
      line1:
        address.line1.trim(),
    }),

    ...(address.line2?.trim() && {
      line2:
        address.line2.trim(),
    }),

    ...(address.city?.trim() && {
      city:
        address.city.trim(),
    }),

    ...(address.state?.trim() && {
      state:
        address.state.trim(),
    }),

    ...(address.postalCode?.trim() && {
      postalCode:
        address.postalCode.trim(),
    }),

    ...(address.country?.trim() && {
      country:
        address.country.trim(),
    }),
  };
}

/*
 * =========================================================
 * CREATE GLOBAL CUSTOMER
 * =========================================================
 */

export async function createCustomerForOwner(
  ownerId: string,
  input: CreateCustomerInput,
) {
  /*
   * ownerId is intentionally retained in the
   * service signature because the route is still
   * authenticated as a shopkeeper.
   *
   * At this stage it is used to ensure the
   * authenticated shopkeeper is the caller.
   *
   * The customer itself is NOT attached to
   * the shop.
   *
   * We intentionally do not store shopId.
   */

  if (!ownerId) {
    throw new ApiError(
      401,
      "Authenticated shopkeeper is required.",
      "UNAUTHORIZED",
    );
  }

  const name =
    input.name.trim();

  if (!name) {
    throw new ApiError(
      400,
      "Customer name is required.",
      "INVALID_CUSTOMER_NAME",
    );
  }

  /*
   * Normalize phone.
   */
  const phone =
    normalizePhone(
      input.phone,
    );

  if (!phone) {
    throw new ApiError(
      400,
      "A valid customer phone number is required.",
      "INVALID_CUSTOMER_PHONE",
    );
  }

  /*
   * IMPORTANT:
   *
   * Before creating a new customer we search
   * the GLOBAL customer directory.
   *
   * This is the core change.
   */
  const existingCustomer =
    await findCustomerByPhone(
      phone,
    );

  if (existingCustomer) {
    /*
     * Customer already exists globally.
     *
     * We DO NOT create another customer.
     *
     * Instead, return the existing customer.
     */
    return existingCustomer;
  }

  /*
   * Normalize email.
   */
  const email =
    input.email
      ?.trim()
      .toLowerCase();

  let linkedUserId:
    | string
    | undefined;

  /*
   * If a BillNest customer account already
   * exists with this email, link the new global
   * customer to that account.
   */
  if (email) {
    const existingUser =
      await findUserByEmail(
        email,
      );

    if (existingUser) {
      /*
       * Only customer accounts may be linked
       * to a customer profile.
       */
      if (
        existingUser.role !==
        "customer"
      ) {
        throw new ApiError(
          400,
          "This email belongs to a shopkeeper account and cannot be linked as a customer.",
          "INVALID_CUSTOMER_ACCOUNT",
        );
      }

      if (
        !existingUser.isActive
      ) {
        throw new ApiError(
          400,
          "This customer account is inactive.",
          "CUSTOMER_ACCOUNT_INACTIVE",
        );
      }

      linkedUserId =
        existingUser._id.toString();
    }
  }

  /*
   * Create ONE GLOBAL customer.
   *
   * Notice:
   *
   * NO shopId.
   */
  const customer =
    await createCustomer({
      ...(linkedUserId && {
        userId:
          linkedUserId,
      }),

      name,

      ...(email && {
        email,
      }),

      phone,

      ...(input.address && {
        address:
          normalizeAddress(
            input.address,
          ),
      }),

      ...(input.notes?.trim() && {
        notes:
          input.notes.trim(),
      }),
    });

  return customer;
}

/*
 * =========================================================
 * GLOBAL CUSTOMER LIST
 * =========================================================
 */

export async function getCustomersForOwner(
  ownerId: string,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
  },
) {
  if (!ownerId) {
    throw new ApiError(
      401,
      "Authenticated shopkeeper is required.",
      "UNAUTHORIZED",
    );
  }

  const page =
    Math.max(
      options?.page ?? 1,
      1,
    );

  const limit =
    Math.min(
      Math.max(
        options?.limit ?? 20,
        1,
      ),
      100,
    );

  const skip =
    (page - 1) * limit;

  /*
   * Ask repository for one extra record
   * so we can determine hasMore.
   */
  const customers =
    await findCustomers({
      skip,
      limit: limit + 1,
      search:
        options?.search,
    });

  const hasMore =
    customers.length >
    limit;

  if (hasMore) {
    customers.pop();
  }

  return {
    customers,

    pagination: {
      page,
      limit,
      hasMore,
    },
  };
}

/*
 * =========================================================
 * GET ONE GLOBAL CUSTOMER
 * =========================================================
 */

export async function getCustomerForOwner(
  ownerId: string,
  customerId: string,
) {
  if (!ownerId) {
    throw new ApiError(
      401,
      "Authenticated shopkeeper is required.",
      "UNAUTHORIZED",
    );
  }

  const customer =
    await findActiveCustomerById(
      customerId,
    );

  if (!customer) {
    throw new ApiError(
      404,
      "Customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  return customer;
}

/*
 * =========================================================
 * FIND CUSTOMER BY PHONE
 * =========================================================
 *
 * This function will later be used directly
 * by invoice creation.
 */

export async function getCustomerByPhoneForOwner(
  ownerId: string,
  rawPhone: string,
) {
  if (!ownerId) {
    throw new ApiError(
      401,
      "Authenticated shopkeeper is required.",
      "UNAUTHORIZED",
    );
  }

  const phone =
    normalizePhone(
      rawPhone,
    );

  if (!phone) {
    throw new ApiError(
      400,
      "Please provide a valid customer phone number.",
      "INVALID_CUSTOMER_PHONE",
    );
  }

  const customer =
    await findCustomerByPhone(
      phone,
    );

  if (!customer) {
    throw new ApiError(
      404,
      "No customer was found with this phone number.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  return customer;
}

/*
 * =========================================================
 * UPDATE GLOBAL CUSTOMER
 * =========================================================
 */

export async function updateCustomerForOwner(
  ownerId: string,
  customerId: string,
  input: UpdateCustomerInput,
) {
  if (!ownerId) {
    throw new ApiError(
      401,
      "Authenticated shopkeeper is required.",
      "UNAUTHORIZED",
    );
  }

  const existingCustomer =
    await findActiveCustomerById(
      customerId,
    );

  if (!existingCustomer) {
    throw new ApiError(
      404,
      "Customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  /*
   * Name validation.
   */
  if (
    input.name !==
      undefined &&
    !input.name.trim()
  ) {
    throw new ApiError(
      400,
      "Customer name cannot be empty.",
      "INVALID_CUSTOMER_NAME",
    );
  }

  const updateData:
    UpdateCustomerInput = {};

  /*
   * Name.
   */
  if (
    input.name !==
    undefined
  ) {
    updateData.name =
      input.name.trim();
  }

  /*
   * Email.
   */
  if (
    input.email !==
    undefined
  ) {
    updateData.email =
      input.email
        .trim()
        .toLowerCase();
  }

  /*
   * Phone.
   *
   * Always normalize before storing.
   */
  if (
    input.phone !==
    undefined
  ) {
    const phone =
      normalizePhone(
        input.phone,
      );

    if (!phone) {
      throw new ApiError(
        400,
        "Please provide a valid customer phone number.",
        "INVALID_CUSTOMER_PHONE",
      );
    }

    /*
     * If the normalized phone belongs
     * to another customer, do not merge
     * automatically.
     *
     * Migration is responsible for
     * historical duplicate merging.
     */
    const customerWithPhone =
      await findCustomerByPhone(
        phone,
      );

    if (
      customerWithPhone &&
      customerWithPhone._id.toString() !==
        customerId
    ) {
      throw new ApiError(
        409,
        "This phone number already belongs to another customer.",
        "CUSTOMER_PHONE_ALREADY_EXISTS",
      );
    }

    updateData.phone =
      phone;
  }

  /*
   * Address.
   */
  if (
    input.address !==
    undefined
  ) {
    updateData.address =
      normalizeAddress(
        input.address,
      );
  }

  /*
   * Notes.
   */
  if (
    input.notes !==
    undefined
  ) {
    updateData.notes =
      input.notes.trim();
  }

  const updatedCustomer =
    await updateCustomerById(
      customerId,
      updateData,
    );

  if (!updatedCustomer) {
    throw new ApiError(
      404,
      "Customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  return updatedCustomer;
}

/*
 * =========================================================
 * DEACTIVATE GLOBAL CUSTOMER
 * =========================================================
 */

export async function deactivateCustomerForOwner(
  ownerId: string,
  customerId: string,
) {
  if (!ownerId) {
    throw new ApiError(
      401,
      "Authenticated shopkeeper is required.",
      "UNAUTHORIZED",
    );
  }

  const customer =
    await findActiveCustomerById(
      customerId,
    );

  if (!customer) {
    throw new ApiError(
      404,
      "Customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  const deletedCustomer =
    await deactivateCustomerById(
      customerId,
    );

  if (!deletedCustomer) {
    throw new ApiError(
      404,
      "Customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  return deletedCustomer;
}