import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{7,15}$/, "Phone must be a valid phone number"),
  email: z.string().trim().email("Invalid email format"),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
});

export const updateSupplierSchema = createSupplierSchema.partial();