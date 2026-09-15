import { ShopModel } from "../models/shop.model";

export async function findShopById(shopId: string) {
  return ShopModel.findById(shopId);
}

export async function findShopByOwnerId(ownerId: string) {
  return ShopModel.findOne({ ownerId });
}

export async function createShop(data: {
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
}) {
  return ShopModel.create(data);
}

export async function updateShopById(
  shopId: string,
  data: Partial<{
    name: string;
    phone: string;
    email: string;
    address: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    taxId: string;
    logoUrl: string;
    isActive: boolean;
  }>,
) {
  return ShopModel.findByIdAndUpdate(
    shopId,
    { $set: data },
    {
      new: true,
      runValidators: true,
    },
  );
}