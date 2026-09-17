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

/**
 * Find an active customer profile that:
 * - matches the supplied email
 * - is not yet linked to a customer account
 *
 * We return a result only when exactly one
 * matching unlinked customer exists.
 *
 * This prevents automatically linking an account
 * to an ambiguous customer profile.
 */
export async function findSingleUnlinkedCustomerByEmail(
  email: string,
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const customers =
    await CustomerModel.find({
      email: normalizedEmail,
      isActive: true,
      $or: [
        {
          userId: {
            $exists: false,
          },
        },
        {
          userId: null,
        },
      ],
    })
      .sort({
        createdAt: -1,
      })
      .limit(2);

  if (customers.length !== 1) {
    return null;
  }

  return customers[0];
}

/**
 * Attach an existing customer profile to
 * a customer user account.
 *
 * The update only succeeds when the customer
 * is still unlinked.
 */
export async function linkCustomerToUser(
  customerId: string,
  userId: string,
) {
  return CustomerModel.findOneAndUpdate(
    {
      _id: customerId,
      isActive: true,
      $or: [
        {
          userId: {
            $exists: false,
          },
        },
        {
          userId: null,
        },
      ],
    },
    {
      $set: {
        userId: new Types.ObjectId(userId),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
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