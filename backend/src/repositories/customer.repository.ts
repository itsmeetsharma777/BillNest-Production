import { CustomerModel } from "../models/customer.model";

/*
 * =========================================================
 * BASIC CUSTOMER LOOKUPS
 * =========================================================
 */

/**
 * Find a customer by MongoDB ID.
 *
 * Customer is now global, so there is NO shopId
 * condition here.
 */
export async function findCustomerById(
  customerId: string,
) {
  return CustomerModel.findById(
    customerId,
  );
}

/**
 * Find an active customer by MongoDB ID.
 */
export async function findActiveCustomerById(
  customerId: string,
) {
  return CustomerModel.findOne({
    _id: customerId,
    isActive: true,
  });
}

/**
 * Find customer by normalized phone.
 *
 * Phone is the global customer identifier.
 */
export async function findCustomerByPhone(
  phone: string,
) {
  return CustomerModel.findOne({
    phone,
    isActive: true,
  });
}

/**
 * Find customer by email.
 *
 * Email is useful as an additional lookup,
 * but it is NOT the primary identity.
 */
export async function findCustomerByEmail(
  email: string,
) {
  return CustomerModel.findOne({
    email,
    isActive: true,
  });
}

/*
 * =========================================================
 * USER ACCOUNT LOOKUPS
 * =========================================================
 */

/**
 * Find one active customer linked to a
 * BillNest customer account.
 *
 * This remains for compatibility with
 * existing customer-account functionality.
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
 * Find all active customer records linked
 * to a BillNest customer account.
 *
 * After the migration there should normally
 * be one global customer record.
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

/**
 * Find all customers that are not yet linked
 * to a BillNest customer account.
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
 * Link a global customer to a BillNest account.
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

/*
 * =========================================================
 * CUSTOMER LIST
 * =========================================================
 */

/**
 * Find GLOBAL customers.
 *
 * IMPORTANT:
 *
 * There is deliberately NO shopId filter.
 *
 * Therefore every shopkeeper can see the
 * same global customer directory.
 */
export async function findCustomers(
  options?: {
    skip?: number;
    limit?: number;
    search?: string;
  },
) {
  const skip =
    options?.skip ?? 0;

  const limit =
    options?.limit ?? 20;

  const search =
    options?.search?.trim();

  const filter: Record<
    string,
    unknown
  > = {
    isActive: true,
  };

  /*
   * Optional global customer search.
   *
   * Search can match:
   *
   * name
   * email
   * phone
   */
  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  return CustomerModel.find(
    filter,
  )
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit);
}

/*
 * =========================================================
 * CUSTOMER CREATION
 * =========================================================
 */

/**
 * Find multiple GLOBAL customers by MongoDB IDs.
 * No shopId filter is used because customers are global.
 */
export async function findCustomersByIds(
  customerIds: string[],
) {
  if (!customerIds.length) {
    return [];
  }

  return CustomerModel.find({
    _id: { $in: customerIds },
    isActive: true,
  });
}

export async function createCustomer(
  data: {
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

/*
 * =========================================================
 * CUSTOMER UPDATE
 * =========================================================
 */

/**
 * Update a GLOBAL customer.
 *
 * There is intentionally no shopId.
 */
export async function updateCustomerById(
  customerId: string,
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

/*
 * =========================================================
 * SOFT DELETE
 * =========================================================
 */

/**
 * Deactivate a GLOBAL customer.
 *
 * Historical invoices remain untouched.
 */
export async function deactivateCustomerById(
  customerId: string,
) {
  return CustomerModel.findOneAndUpdate(
    {
      _id: customerId,
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

/*
 * =========================================================
 * MIGRATION SUPPORT
 * =========================================================
 *
 * These functions will be used in Step 2.
 */

/**
 * Find customers by phone regardless
 * of active state.
 */
export async function findCustomersByPhoneForMigration(
  phone: string,
) {
  return CustomerModel.find({
    phone,
  }).sort({
    createdAt: 1,
  });
}

/**
 * Find all customers that currently have
 * a phone number.
 */
export async function findCustomersWithPhone() {
  return CustomerModel.find({
    phone: {
      $exists: true,
      $ne: "",
    },
  }).sort({
    createdAt: 1,
  });
}

/**
 * Update phone during migration.
 */
export async function updateCustomerPhone(
  customerId: string,
  phone: string,
) {
  return CustomerModel.findByIdAndUpdate(
    customerId,
    {
      $set: {
        phone,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
}