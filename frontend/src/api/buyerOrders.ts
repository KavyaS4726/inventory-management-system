// src/api/buyerOrders.ts
import { apiRequest } from "./client";
import type { ApiResponse, Buyer, Order, BuyerOrderSummary } from "./type";

interface PaginatedData<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Single-item endpoints: { success, data: {...} }
async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const res = await promise;
  return res.data;
}

// List endpoints are paginated one level deeper: { success, data: { data: [...], pagination } }
async function unwrapList<T>(promise: Promise<ApiResponse<PaginatedData<T>>>): Promise<T[]> {
  const res = await promise;
  return res.data.data;
}

// ---------- Buyers ----------
export const getAllBuyers = (token?: string | null) =>
  unwrapList<Buyer>(apiRequest("/buyers", { method: "GET" }, token));

export const getBuyerById = (id: string, token?: string | null) =>
  unwrap<Buyer>(apiRequest(`/buyers/${id}`, { method: "GET" }, token));

export const createBuyer = (data: Omit<Buyer, "id">, token?: string | null) =>
  unwrap<Buyer>(
    apiRequest("/buyers", { method: "POST", body: JSON.stringify(data) }, token)
  );

export const updateBuyer = (id: string, data: Partial<Buyer>, token?: string | null) =>
  unwrap<Buyer>(
    apiRequest(`/buyers/${id}`, { method: "PUT", body: JSON.stringify(data) }, token)
  );

export const deleteBuyer = (id: string, token?: string | null) =>
  apiRequest(`/buyers/${id}`, { method: "DELETE" }, token);

// ---------- Orders ----------
export const getAllOrders = (token?: string | null) =>
  unwrap<Order[]>(apiRequest("/orders", { method: "GET" }, token));

export const getOrderById = (id: string, token?: string | null) =>
  unwrap<Order>(apiRequest(`/orders/${id}`, { method: "GET" }, token));

export const createOrder = (
  data: {
    buyerId: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  },
  token?: string | null
) =>
  unwrap<Order>(
    apiRequest(
      "/orders",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    )
  );

export const getBuyerOrderSummary = (buyerId: string, token?: string | null) =>
  unwrap<BuyerOrderSummary>(
    apiRequest(`/orders/buyer/${buyerId}`, { method: "GET" }, token)
  );