import { Timestamp } from "firebase-admin/firestore";

export interface Buyer {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}