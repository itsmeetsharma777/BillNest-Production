import type { ClientSession } from "mongoose";
import { Types } from "mongoose";

import { CounterModel } from "../models/counter.model";

export async function getNextSequence(
  shopId: string,
  key: string,
  session?: ClientSession,
): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    {
      shopId: new Types.ObjectId(shopId),
      key,
    },
    {
      $setOnInsert: {
        shopId: new Types.ObjectId(shopId),
        key,
      },
      $inc: {
        sequence: 1,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      session,
    },
  );

  if (!counter) {
    throw new Error(
      "Unable to generate the next sequence number.",
    );
  }

  return counter.sequence;
}