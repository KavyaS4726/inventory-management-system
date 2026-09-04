import { z } from "zod";

export const createBuyerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().min(7).regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
  address: z.string().optional(),
});

export const updateBuyerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().min(7).regex(/^[0-9+\-\s()]+$/).optional(),
  address: z.string().optional(),
});