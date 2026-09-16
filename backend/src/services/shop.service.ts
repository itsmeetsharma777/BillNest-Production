import {
  createShop,
  findShopByOwnerId,
  updateShopById,
} from "../repositories/shop.repository";

import { ApiError } from "../utils/api-error";

interface ShopAddressInput {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface CreateShopInput {
  name: string;
  phone?: string;
  email?: string;
  address?: ShopAddressInput;
  taxId?: string;
  logoUrl?: string;
}

interface UpdateShopInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: ShopAddressInput;
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
      address: {
        ...(input.address.line1?.trim() && {
          line1: input.address.line1.trim(),
        }),

        ...(input.address.line2?.trim() && {
          line2: input.address.line2.trim(),
        }),

        ...(input.address.city?.trim() && {
          city: input.address.city.trim(),
        }),

        ...(input.address.state?.trim() && {
          state: input.address.state.trim(),
        }),

        ...(input.address.postalCode?.trim() && {
          postalCode: input.address.postalCode.trim(),
        }),

        ...(input.address.country?.trim() && {
          country: input.address.country.trim(),
        }),
      },
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

  if (!shop.isActive) {
    throw new ApiError(
      403,
      "This shop is inactive.",
      "SHOP_INACTIVE",
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

  if (!shop.isActive) {
    throw new ApiError(
      403,
      "This shop is inactive.",
      "SHOP_INACTIVE",
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

  const updateData: {
    name?: string;
    phone?: string;
    email?: string;
    address?: ShopAddressInput;
    taxId?: string;
    logoUrl?: string;
  } = {};

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
    updateData.address = {
      ...(input.address.line1 !== undefined && {
        line1: input.address.line1.trim(),
      }),

      ...(input.address.line2 !== undefined && {
        line2: input.address.line2.trim(),
      }),

      ...(input.address.city !== undefined && {
        city: input.address.city.trim(),
      }),

      ...(input.address.state !== undefined && {
        state: input.address.state.trim(),
      }),

      ...(input.address.postalCode !== undefined && {
        postalCode: input.address.postalCode.trim(),
      }),

      ...(input.address.country !== undefined && {
        country: input.address.country.trim(),
      }),
    };
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