import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  categoryId: z.string().trim().min(1, "categoryId is required"),
  supplierId: z.string().trim().min(1, "supplierId is required"),
  quantity: z.number().nonnegative("Quantity must be 0 or greater"),
  unitPrice: z.number().nonnegative("Unit price must be 0 or greater"),
  reorderThreshold: z.number().nonnegative("Reorder threshold must be 0 or greater"),
});

export const updateProductSchema = createProductSchema.partial().extend({
  sku: z.string().trim().min(3, "SKU must be at least 3 characters").optional(),
});