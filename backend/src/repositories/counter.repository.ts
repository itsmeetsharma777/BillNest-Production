import { Types } from "mongoose";
import { CounterModel } from "../models/counter.model";

export async function getNextSequence(
  shopId: string,
  key: string,
) {
  const counter = await CounterModel.findOneAndUpdate(
    {
      shopId: new Types.ObjectId(shopId),
      key,
    },
    {
      $inc: {
        sequence: 1,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  if (!counter) {
    throw new Error("COUNTER_UPDATE_FAILED");
  }

  return counter.sequence;
}