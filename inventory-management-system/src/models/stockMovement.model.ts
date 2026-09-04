import { Timestamp } from "firebase-admin/firestore";

export type StockMovementType = "IN" | "OUT";

export interface StockMovement {
  id?: string;
  productId: string;
  type: "IN" | "OUT";
  quantity: number;
  note?: string;
  performedBy: { uid: string; email: string };
  createdAt: Timestamp;
  // stock-in only
  supplierId?: string;
  categoryId?: string;
  unitPrice?: number;
  totalPrice?: number;
}
