import { z } from "zod";
import { objectIdSchema } from "../../common/validation/objectId";

export const sectionIdParamSchema = z.object({
  id: objectIdSchema,
});

export const createSectionSchema = z.object({
  heading: z.string().trim().min(1).max(120),
  order: z.number().int().optional(),
});

export const updateSectionSchema = z
  .object({
    heading: z.string().trim().min(1).max(120).optional(),
    order: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
