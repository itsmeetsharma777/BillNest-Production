import { z } from "zod";

export const reportQuerySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine(
    (value) => {
      if (!value.startDate || !value.endDate) {
        return true;
      }

      return value.startDate <= value.endDate;
    },
    {
      message: "Start date cannot be after end date.",
      path: ["startDate"],
    },
  );