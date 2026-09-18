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
    userId,
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

  return CustomerModel.find({ shopId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
}

export async function createCustomer(data: {
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
}) {
  return CustomerModel.create(data);
}

export async function updateCustomerByIdForShop(
  customerId: string,
  shopId: string,
  data: Partial<{
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
    isActive: boolean;
  }>,
) {
  return CustomerModel.findOneAndUpdate(
    {
      _id: customerId,
      shopId,
    },
    { $set: data },
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

/**
 * Find active customer profiles that were created
 * before the customer created a BillNest account.
 *
 * Only profiles without a userId are returned.
 */
export async function findUnlinkedCustomersByEmail(
  email: string,
) {
  return CustomerModel.find({
    email,
    userId: { $exists: false },
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .limit(2);
}

/**
 * Link an existing customer profile to a BillNest
 * customer account.
 */
export async function linkCustomerToUser(
  customerId: string,
  userId: string,
) {
  return CustomerModel.findOneAndUpdate(
    {
      _id: customerId,
      userId: { $exists: false },
      isActive: true,
    },
    {
      $set: {
        userId,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
}