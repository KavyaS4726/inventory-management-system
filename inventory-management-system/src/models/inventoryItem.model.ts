import { z } from "zod";

export interface InventoryItem {
  id?: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  reorderLevel: number;
  supplier?: string;
  description?: string;
  createdAt?: FirebaseFirestore.Timestamp | Date;
  updatedAt?: FirebaseFirestore.Timestamp | Date;
}

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.number().int().nonnegative().default(0),
  unitPrice: z.number().nonnegative(),
  reorderLevel: z.number().int().nonnegative().default(0),
  supplier: z.string().optional(),
  description: z.string().optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
