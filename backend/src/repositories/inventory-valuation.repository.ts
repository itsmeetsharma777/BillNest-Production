import {
  Types,
} from "mongoose";

import {
  ProductModel,
} from "../models/product.model";

export interface InventoryValuationResult {
  totalProducts: number;
  totalStockUnits: number;
  inventoryCostValue: number;
  inventoryRetailValue: number;
  potentialProfit: number;
}

export async function getInventoryValuationByShopId(
  shopId: string,
): Promise<InventoryValuationResult> {
  const shopObjectId =
    new Types.ObjectId(shopId);

  const [result] =
    await ProductModel.aggregate<{
      totalProducts: number;
      totalStockUnits: number;
      inventoryCostValue: number;
      inventoryRetailValue: number;
    }>([
      {
        $match: {
          shopId: shopObjectId,
          isActive: true,
        },
      },

      {
        $group: {
          _id: null,

          totalProducts: {
            $sum: 1,
          },

          totalStockUnits: {
            $sum: {
              $max: [
                {
                  $ifNull: [
                    "$stockQuantity",
                    0,
                  ],
                },
                0,
              ],
            },
          },

          inventoryCostValue: {
            $sum: {
              $multiply: [
                {
                  $max: [
                    {
                      $ifNull: [
                        "$stockQuantity",
                        0,
                      ],
                    },
                    0,
                  ],
                },
                {
                  $max: [
                    {
                      $ifNull: [
                        "$purchasePrice",
                        0,
                      ],
                    },
                    0,
                  ],
                },
              ],
            },
          },

          inventoryRetailValue: {
            $sum: {
              $multiply: [
                {
                  $max: [
                    {
                      $ifNull: [
                        "$stockQuantity",
                        0,
                      ],
                    },
                    0,
                  ],
                },
                {
                  $max: [
                    {
                      $ifNull: [
                        "$sellingPrice",
                        0,
                      ],
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
    ]);

  if (!result) {
    return {
      totalProducts: 0,
      totalStockUnits: 0,
      inventoryCostValue: 0,
      inventoryRetailValue: 0,
      potentialProfit: 0,
    };
  }

  const inventoryCostValue =
    Number(
      result.inventoryCostValue ?? 0,
    );

  const inventoryRetailValue =
    Number(
      result.inventoryRetailValue ?? 0,
    );

  return {
    totalProducts:
      Number(
        result.totalProducts ?? 0,
      ),

    totalStockUnits:
      Number(
        result.totalStockUnits ?? 0,
      ),

    inventoryCostValue,

    inventoryRetailValue,

    potentialProfit:
      inventoryRetailValue -
      inventoryCostValue,
  };
}