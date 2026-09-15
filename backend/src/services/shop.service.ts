import {
  createShop,
  findShopByOwnerId,
  updateShopById,
} from "../repositories/shop.repository";
import { ApiError } from "../utils/api-error";

interface CreateShopInput {
  name: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  taxId?: string;
  logoUrl?: string;
}

interface UpdateShopInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  taxId?: string;
  logoUrl?: string;
}

export async function createShopForOwner(
  ownerId: string,
  input: CreateShopInput,
) {
  const existingShop = await findShopByOwnerId(ownerId);

  if (existingShop) {
    throw new ApiError(
      409,
      "You already have a shop.",
      "SHOP_ALREADY_EXISTS",
    );
  }

  const name = input.name.trim();

  if (!name) {
    throw new ApiError(
      400,
      "Shop name is required.",
      "INVALID_SHOP_NAME",
    );
  }

  const shop = await createShop({
    ownerId,
    name,
    ...(input.phone?.trim() && {
      phone: input.phone.trim(),
    }),
    ...(input.email?.trim() && {
      email: input.email.trim().toLowerCase(),
    }),
    ...(input.address && {
      address: input.address,
    }),
    ...(input.taxId?.trim() && {
      taxId: input.taxId.trim(),
    }),
    ...(input.logoUrl?.trim() && {
      logoUrl: input.logoUrl.trim(),
    }),
  });

  return shop;
}

export async function getShopForOwner(ownerId: string) {
  const shop = await findShopByOwnerId(ownerId);

  if (!shop) {
    throw new ApiError(
      404,
      "Shop not found.",
      "SHOP_NOT_FOUND",
    );
  }

  return shop;
}

export async function updateShopForOwner(
  ownerId: string,
  input: UpdateShopInput,
) {
  const shop = await findShopByOwnerId(ownerId);

  if (!shop) {
    throw new ApiError(
      404,
      "Shop not found.",
      "SHOP_NOT_FOUND",
    );
  }

  if (
    input.name !== undefined &&
    !input.name.trim()
  ) {
    throw new ApiError(
      400,
      "Shop name cannot be empty.",
      "INVALID_SHOP_NAME",
    );
  }

  const updateData: UpdateShopInput = {};

  if (input.name !== undefined) {
    updateData.name = input.name.trim();
  }

  if (input.phone !== undefined) {
    updateData.phone = input.phone.trim();
  }

  if (input.email !== undefined) {
    updateData.email = input.email.trim().toLowerCase();
  }

  if (input.address !== undefined) {
    updateData.address = input.address;
  }

  if (input.taxId !== undefined) {
    updateData.taxId = input.taxId.trim();
  }

  if (input.logoUrl !== undefined) {
    updateData.logoUrl = input.logoUrl.trim();
  }

  const updatedShop = await updateShopById(
    shop._id.toString(),
    updateData,
  );

  if (!updatedShop) {
    throw new ApiError(
      404,
      "Shop not found.",
      "SHOP_NOT_FOUND",
    );
  }

  return updatedShop;
}