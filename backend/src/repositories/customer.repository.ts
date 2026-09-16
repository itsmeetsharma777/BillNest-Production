import { Types } from "mongoose";

import { CustomerModel } from "../models/customer.model";

export async function findCustomerById(
  customerId: string,
) {
  return CustomerModel.findById(customerId);
}

export async function findCustomerByIdForShop(
  customerId: string,
  shopId: string,
) {
  return CustomerModel.findOne({
    _id: customerId,
    shopId,
  });
}

export async function findCustomerByUserId(
  userId: string,
) {
  return CustomerModel.findOne({
    userId: new Types.ObjectId(userId),
    isActive: true,
  });
}

export async function findCustomersByShopId(
  shopId: string,
  options?: {
    skip?: number;
    limit?: number;
  },
) {
  const skip = options?.skip ?? 0;
  const limit = options?.limit ?? 20;

  return CustomerModel.find({
    shopId,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
}

export async function createCustomer(
  data: {
    shopId: string;
    userId?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    notes?: string;
  },
) {
  return CustomerModel.create(data);
}

export async function updateCustomerByIdForShop(
  customerId: string,
  shopId: string,
  data: Partial<{
    userId: string;
    name: string;
    email: string;
    phone: string;
    address: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    notes: string;
  }>,
) {
  return CustomerModel.findOneAndUpdate(
    {
      _id: customerId,
      shopId,
    },
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    },
  );
}

export async function deleteCustomerByIdForShop(
  customerId: string,
  shopId: string,
) {
  return CustomerModel.findOneAndUpdate(
    {
      _id: customerId,
      shopId,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
      },
    },
    {
      new: true,
    },
  );
}