import { Timestamp } from "firebase-admin/firestore";

export interface Product {
  id?: string;
  name: string;
  sku: string;
  categoryId: string;
  supplierId: string;
  quantity: number;
  unitPrice: number;
  reorderThreshold: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}