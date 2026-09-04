import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
});

export const createOrderSchema = z.object({
  buyerId: z.string().min(1, "buyerId is required"),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});