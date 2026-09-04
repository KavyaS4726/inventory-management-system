import type { Timestamp } from "firebase/firestore";

// ---------- Firestore Timestamp JSON ----------

export interface SerializedTimestamp {
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
}

// ---------- API Response ----------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// ---------- Buyer ----------

export interface Buyer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt?:
    | Timestamp
    | Date
    | string
    | number
    | SerializedTimestamp;
  updatedAt?:
    | Timestamp
    | Date
    | string
    | number
    | SerializedTimestamp;
}

// ---------- Order ----------

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
  items: OrderItem[];
  totalAmount: number;
  status?: "completed" | "cancelled";
  createdAt?:
    | Timestamp
    | Date
    | string
    | number
    | SerializedTimestamp;
  updatedAt?:
    | Timestamp
    | Date
    | string
    | number
    | SerializedTimestamp;
}

// ---------- Date Helper ----------

export function toDate(
  ts?:
    | Timestamp
    | Date
    | string
    | number
    | SerializedTimestamp
    | null
): Date | null {
  if (ts == null) {
    return null;
  }

  // JavaScript Date
  if (ts instanceof Date) {
    return Number.isNaN(ts.getTime()) ? null : ts;
  }

  // String or number returned by API
  if (typeof ts === "string" || typeof ts === "number") {
    const date = new Date(ts);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Firebase Timestamp
  if (
    typeof ts === "object" &&
    "toDate" in ts &&
    typeof ts.toDate === "function"
  ) {
    const date = ts.toDate();

    return date instanceof Date &&
      !Number.isNaN(date.getTime())
      ? date
      : null;
  }

  // Serialized Firestore Timestamp
  if (typeof ts === "object") {
    const raw = ts as unknown as Record<string, unknown>;

    const seconds =
      typeof raw.seconds === "number"
        ? raw.seconds
        : typeof raw._seconds === "number"
        ? raw._seconds
        : null;

    if (seconds !== null) {
      const date = new Date(seconds * 1000);

      return Number.isNaN(date.getTime())
        ? null
        : date;
    }
  }

  return null;
}

// ---------- Buyer Order Summary ----------

export interface BuyerOrderSummary {
  id: string;
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  orders: Order[];
}