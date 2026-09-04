import { Timestamp } from "firebase-admin/firestore";

export interface Category {
  id?: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}