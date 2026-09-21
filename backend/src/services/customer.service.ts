import {
  createCustomer,
  findCustomerByIdForShop,
  findCustomerByUserIdAndShop,
  findCustomersByShopId,
  updateCustomerByIdForShop,
  deleteCustomerByIdForShop,
} from "../repositories/customer.repository";

import {
  findUserByEmail,
} from "../repositories/user.repository";

import { getShopForOwner } from "./shop.service";

import { ApiError } from "../utils/api-error";

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
  phone?: string;
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

export async function createCustomerForOwner(
  ownerId: string,
  input: CreateCustomerInput,
) {
  const shop =
    await getShopForOwner(ownerId);

  const name =
    input.name.trim();

  if (!name) {
    throw new ApiError(
      400,
      "Customer name is required.",
      "INVALID_CUSTOMER_NAME",
    );
  }

  const email =
    input.email
      ?.trim()
      .toLowerCase();

  let linkedUserId:
    | string
    | undefined;

  if (email) {
    const existingUser =
      await findUserByEmail(email);

    if (existingUser) {
      /*
       * Only customer accounts can be linked
       * to customer profiles.
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

      if (!existingUser.isActive) {
        throw new ApiError(
          400,
          "This customer account is inactive.",
          "CUSTOMER_ACCOUNT_INACTIVE",
        );
      }

      /*
       * IMPORTANT:
       *
       * We check the customer profile ONLY
       * inside the CURRENT shop.
       *
       * Therefore:
       *
       * Shop A -> profile exists
       * Shop B -> profile does not exist
       *
       * Shop B is allowed to create another
       * customer profile linked to the same user.
       */
      const existingCustomerInThisShop =
        await findCustomerByUserIdAndShop(
          existingUser._id.toString(),
          shop._id.toString(),
        );

      if (
        existingCustomerInThisShop
      ) {
        throw new ApiError(
          409,
          "A customer with this account already exists in your shop.",
          "CUSTOMER_ALREADY_EXISTS",
        );
      }

      /*
       * Same customer account can now be linked
       * to multiple shops.
       */
      linkedUserId =
        existingUser._id.toString();
    }
  }

  const customer =
    await createCustomer({
      shopId:
        shop._id.toString(),

      ...(linkedUserId && {
        userId:
          linkedUserId,
      }),

      name,

      ...(email && {
        email,
      }),

      ...(input.phone?.trim() && {
        phone:
          input.phone.trim(),
      }),

      ...(input.address && {
        address: {
          ...(input.address.line1?.trim() && {
            line1:
              input.address.line1.trim(),
          }),

          ...(input.address.line2?.trim() && {
            line2:
              input.address.line2.trim(),
          }),

          ...(input.address.city?.trim() && {
            city:
              input.address.city.trim(),
          }),

          ...(input.address.state?.trim() && {
            state:
              input.address.state.trim(),
          }),

          ...(input.address.postalCode?.trim() && {
            postalCode:
              input.address.postalCode.trim(),
          }),

          ...(input.address.country?.trim() && {
            country:
              input.address.country.trim(),
          }),
        },
      }),

      ...(input.notes?.trim() && {
        notes:
          input.notes.trim(),
      }),
    });

  return customer;
}

export async function getCustomersForOwner(
  ownerId: string,
  options?: {
    page?: number;
    limit?: number;
  },
) {
  const shop =
    await getShopForOwner(ownerId);

  const page = Math.max(
    options?.page ?? 1,
    1,
  );

  const limit = Math.min(
    Math.max(
      options?.limit ?? 20,
      1,
    ),
    100,
  );

  const skip =
    (page - 1) * limit;

  const customers =
    await findCustomersByShopId(
      shop._id.toString(),
      {
        skip,
        limit: limit + 1,
      },
    );

  const hasMore =
    customers.length > limit;

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

export async function getCustomerForOwner(
  ownerId: string,
  customerId: string,
) {
  const shop =
    await getShopForOwner(ownerId);

  const customer =
    await findCustomerByIdForShop(
      customerId,
      shop._id.toString(),
    );

  if (
    !customer ||
    !customer.isActive
  ) {
    throw new ApiError(
      404,
      "Customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  return customer;
}

export async function updateCustomerForOwner(
  ownerId: string,
  customerId: string,
  input: UpdateCustomerInput,
) {
  const shop =
    await getShopForOwner(ownerId);

  const existingCustomer =
    await findCustomerByIdForShop(
      customerId,
      shop._id.toString(),
    );

  if (
    !existingCustomer ||
    !existingCustomer.isActive
  ) {
    throw new ApiError(
      404,
      "Customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  if (
    input.name !== undefined &&
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

  if (
    input.name !==
    undefined
  ) {
    updateData.name =
      input.name.trim();
  }

  if (
    input.email !==
    undefined
  ) {
    updateData.email =
      input.email
        .trim()
        .toLowerCase();
  }

  if (
    input.phone !==
    undefined
  ) {
    updateData.phone =
      input.phone.trim();
  }

  if (
    input.address !==
    undefined
  ) {
    updateData.address = {
      ...(input.address.line1 !==
        undefined && {
        line1:
          input.address.line1.trim(),
      }),

      ...(input.address.line2 !==
        undefined && {
        line2:
          input.address.line2.trim(),
      }),

      ...(input.address.city !==
        undefined && {
        city:
          input.address.city.trim(),
      }),

      ...(input.address.state !==
        undefined && {
        state:
          input.address.state.trim(),
      }),

      ...(input.address.postalCode !==
        undefined && {
        postalCode:
          input.address.postalCode.trim(),
      }),

      ...(input.address.country !==
        undefined && {
        country:
          input.address.country.trim(),
      }),
    };
  }

  if (
    input.notes !==
    undefined
  ) {
    updateData.notes =
      input.notes.trim();
  }

  const updatedCustomer =
    await updateCustomerByIdForShop(
      customerId,
      shop._id.toString(),
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

export async function deactivateCustomerForOwner(
  ownerId: string,
  customerId: string,
) {
  const shop =
    await getShopForOwner(ownerId);

  const customer =
    await findCustomerByIdForShop(
      customerId,
      shop._id.toString(),
    );

  if (
    !customer ||
    !customer.isActive
  ) {
    throw new ApiError(
      404,
      "Customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  const deletedCustomer =
    await deleteCustomerByIdForShop(
      customerId,
      shop._id.toString(),
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