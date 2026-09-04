import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  description: z.string().trim().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().trim().optional(),
});