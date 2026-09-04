import { Timestamp } from "firebase-admin/firestore";

export interface Supplier {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}