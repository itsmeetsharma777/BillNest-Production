import { CustomerModel } from "../models/customer.model";

export async function findCustomerById(
  customerId: string,
) {
  return CustomerModel.findById(
    customerId,
  );
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

export async function findCustomersByIdsForShop(
  customerIds: string[],
  shopId: string,
) {
  if (customerIds.length === 0) {
    return [];
  }

  return CustomerModel.find({
    _id: {
      $in: customerIds,
    },
    shopId,
  }).select({
    _id: 1,
    name: 1,
  });
}

/**
 * Find one customer profile linked to a
 * BillNest user account.
 *
 * NOTE:
 * A user can now have MULTIPLE customer
 * profiles because the same customer can
 * belong to multiple shops.
 *
 * This function is retained for places where
 * only one profile is expected.
 */
export async function findCustomerByUserId(
  userId: string,
) {
  return CustomerModel.findOne({
    userId,
    isActive: true,
  });
}

/**
 * Find the customer profile for a specific
 * user + shop combination.
 *
 * This is important because the same user can
 * have one profile in Shop A and another profile
 * in Shop B.
 */
export async function findCustomerByUserIdAndShop(
  userId: string,
  shopId: string,
) {
  return CustomerModel.findOne({
    userId,
    shopId,
    isActive: true,
  });
}

/**
 * Find ALL active customer profiles belonging
 * to the authenticated customer account.
 *
 * One customer account can therefore have:
 *
 * Shop A -> Customer Profile A
 * Shop B -> Customer Profile B
 * Shop C -> Customer Profile C
 */
export async function findCustomersByUserId(
  userId: string,
) {
  return CustomerModel.find({
    userId,
    isActive: true,
  }).sort({
    createdAt: 1,
  });
}

export async function findCustomersByShopId(
  shopId: string,
  options?: {
    skip?: number;
    limit?: number;
  },
) {
  const skip =
    options?.skip ?? 0;

  const limit =
    options?.limit ?? 20;

  return CustomerModel.find({
    shopId,
  })
    .sort({
      createdAt: -1,
    })
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
  return CustomerModel.create(
    data,
  );
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
 * Find ALL active customer profiles that were
 * created before the customer created a
 * BillNest account.
 *
 * IMPORTANT:
 * There is deliberately NO limit here.
 *
 * If the customer already exists in:
 *
 * Shop A
 * Shop B
 * Shop C
 *
 * and then creates their customer account,
 * all three profiles can be linked to the
 * same user account.
 */
export async function findUnlinkedCustomersByEmail(
  email: string,
) {
  return CustomerModel.find({
    email,
    userId: {
      $exists: false,
    },
    isActive: true,
  }).sort({
    createdAt: 1,
  });
}

/**
 * Link one existing customer profile to
 * a BillNest customer account.
 */
export async function linkCustomerToUser(
  customerId: string,
  userId: string,
) {
  return CustomerModel.findOneAndUpdate(
    {
      _id: customerId,

      userId: {
        $exists: false,
      },

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