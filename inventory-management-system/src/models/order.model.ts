export interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id?: string;

  buyerId: string;
  buyerName?: string;

  // Buyer details snapshotted at the time of order
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;

  items: OrderItem[];

  totalAmount: number;

  status?: "completed" | "cancelled";

  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}