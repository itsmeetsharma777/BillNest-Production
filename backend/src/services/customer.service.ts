import {
  createCustomer,
  findCustomerByIdForShop,
  findCustomersByShopId,
  updateCustomerByIdForShop,
  deleteCustomerByIdForShop,
} from "../repositories/customer.repository";
import { getShopForOwner } from "./shop.service";
import { ApiError } from "../utils/api-error";

interface CustomerAddress {
  street?: string;
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
  const shop = await getShopForOwner(ownerId);

  const name = input.name.trim();

  if (!name) {
    throw new ApiError(
      400,
      "Customer name is required.",
      "INVALID_CUSTOMER_NAME",
    );
  }

  const customer = await createCustomer({
    shopId: shop._id.toString(),
    name,
    ...(input.email?.trim() && {
      email: input.email.trim().toLowerCase(),
    }),
    ...(input.phone?.trim() && {
      phone: input.phone.trim(),
    }),
    ...(input.address && {
      address: input.address,
    }),
    ...(input.notes?.trim() && {
      notes: input.notes.trim(),
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
  const shop = await getShopForOwner(ownerId);

  const page = Math.max(options?.page ?? 1, 1);
  const limit = Math.min(
    Math.max(options?.limit ?? 20, 1),
    100,
  );

  const skip = (page - 1) * limit;

  const customers = await findCustomersByShopId(
    shop._id.toString(),
    {
      skip,
      limit,
    },
  );

  return {
    customers,
    pagination: {
      page,
      limit,
      hasMore: customers.length === limit,
    },
  };
}

export async function getCustomerForOwner(
  ownerId: string,
  customerId: string,
) {
  const shop = await getShopForOwner(ownerId);

  const customer = await findCustomerByIdForShop(
    customerId,
    shop._id.toString(),
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

export async function updateCustomerForOwner(
  ownerId: string,
  customerId: string,
  input: UpdateCustomerInput,
) {
  const shop = await getShopForOwner(ownerId);

  const existingCustomer =
    await findCustomerByIdForShop(
      customerId,
      shop._id.toString(),
    );

  if (!existingCustomer) {
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

  const updateData: UpdateCustomerInput = {};

  if (input.name !== undefined) {
    updateData.name = input.name.trim();
  }

  if (input.email !== undefined) {
    updateData.email = input.email.trim().toLowerCase();
  }

  if (input.phone !== undefined) {
    updateData.phone = input.phone.trim();
  }

  if (input.address !== undefined) {
    updateData.address = input.address;
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes.trim();
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
  const shop = await getShopForOwner(ownerId);

  const customer =
    await findCustomerByIdForShop(
      customerId,
      shop._id.toString(),
    );

  if (!customer) {
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