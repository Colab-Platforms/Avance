import { z } from "zod";
import { objectIdSchema } from "../../common/validation/objectId";

export const tabIdParamSchema = z.object({
  id: objectIdSchema,
});

export const createTabSchema = z.object({
  title: z.string().trim().min(1).max(120),
  order: z.number().int().optional(),
});

export const updateTabSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    order: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });

export type CreateTabInput = z.infer<typeof createTabSchema>;
export type UpdateTabInput = z.infer<typeof updateTabSchema>;
