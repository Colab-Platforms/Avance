import { z } from "zod";
import { objectIdSchema } from "../../common/validation/objectId";

export const documentIdParamSchema = z.object({
  id: objectIdSchema,
});

export const listDocumentsQuerySchema = z.object({
  tabId: objectIdSchema.optional(),
  sectionId: objectIdSchema.optional(),
});

export const createDocumentSchema = z.object({
  tabId: objectIdSchema,
  title: z.string().trim().min(1).max(300),
  url: z.string().trim().url(),
  sectionHeading: z.string().trim().min(1).max(120).optional(),
  order: z.number().int().optional(),
});

export const updateDocumentSchema = z
  .object({
    tabId: objectIdSchema.optional(),
    title: z.string().trim().min(1).max(300).optional(),
    url: z.string().trim().url().optional(),
    sectionHeading: z.string().trim().min(1).max(120).nullable().optional(),
    order: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
