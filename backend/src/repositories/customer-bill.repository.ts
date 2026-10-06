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


export async function updateCustomerBillForCustomer(
  customerId: string,
  billId: string,
  data: {
    documentType?: string;
    extractedData?: Record<string, unknown>;
  },
) {
  return CustomerBillModel.findOneAndUpdate(
    {
      _id: billId,
      customerId,
      isActive: true,
    },
    {
      ...(data.documentType !== undefined
        ? { documentType: data.documentType }
        : {}),
      ...(data.extractedData !== undefined
        ? { extractedData: data.extractedData }
        : {}),
      $set: {
        ocrStatus: "processed",
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();
}
