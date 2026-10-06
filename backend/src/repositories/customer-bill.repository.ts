import { CustomerBillModel } from "../models/customer-bill.model";

export async function createCustomerBill(
  data: Record<string, unknown>,
) {
  return CustomerBillModel.create(data);
}

export async function findCustomerBillByHash(
  customerId: string,
  contentHash: string,
) {
  return CustomerBillModel.findOne({
    customerId,
    contentHash,
    isActive: true,
  }).lean();
}

export async function findCustomerBills(
  customerId: string,
) {
  return CustomerBillModel.find({
    customerId,
    isActive: true,
  })
    .sort({
      createdAt: -1,
    })
    .lean();
}

export async function findCustomerBillById(
  customerId: string,
  billId: string,
) {
  return CustomerBillModel.findOne({
    _id: billId,
    customerId,
    isActive: true,
  }).lean();
}
