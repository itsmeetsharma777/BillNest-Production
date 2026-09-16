import {
  Types,
  type ClientSession,
} from "mongoose";

import { CounterModel } from "../models/counter.model";

export async function getNextSequence(
  shopId: string,
  key: string,
  session?: ClientSession,
) {
  const counter =
    await CounterModel.findOneAndUpdate(
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
        session,
      },
    );

  if (!counter) {
    throw new Error(
      "COUNTER_UPDATE_FAILED",
    );
  }

  return counter.sequence;
}