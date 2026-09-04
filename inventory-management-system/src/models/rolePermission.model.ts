import { z } from "zod";

export interface RolePermissionDoc {
  id?: string;
  roleId: string;
  permissionId: string;
  createdAt?: FirebaseFirestore.Timestamp | Date;
  updatedAt?: FirebaseFirestore.Timestamp | Date;
}

export const createRolePermissionSchema = z.object({
  roleId: z.string().min(1),
  permissionId: z.string().min(1),
});

export type CreateRolePermissionInput = z.infer<
  typeof createRolePermissionSchema
>;