export const MODULES = [
  "dashboard",
  "products",
  "categories",
  "suppliers",
  "stockMovements",
  "inventoryItems",
  "buyers",
  "orders",
  "users",
  "roles",
] as const;

export type Module = (typeof MODULES)[number];

export const ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
] as const;

export type Action = (typeof ACTIONS)[number];

export interface PermissionDoc {
  id: string;
  module: Module;
  action: Action;
  name: string;
  isActive: boolean;
}

export type PermissionMap = Record<
  Module,
  Partial<Record<Action, boolean>>
>;

export interface RolePermissionDoc {
  roleId: string;
  permissions: PermissionMap;
  updatedAt?: FirebaseFirestore.Timestamp | Date;
}