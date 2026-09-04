import { z } from "zod";

export const stockMovementSchema = z.object({
  productId: z.string().trim().min(1, "productId is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  note: z.string().trim().optional(),
  supplierId: z.string().trim().optional(),
  unitPrice: z.number().min(0, "Unit price cannot be negative").optional(),
});