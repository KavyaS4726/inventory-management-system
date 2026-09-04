// src/pages/OrdersSection.tsx

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

import type { Order } from "../api/type";
import { toDate } from "../api/type";
import { getAllOrders } from "../api/buyerOrders";
import { useAuth } from "../context/AuthContext";

type StatusFilter = "all" | "completed" | "cancelled";

export default function OrdersPage() {
  const { token } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [expandedId, setExpandedId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  // --------------------------------------------------
  // LOAD ORDERS
  // --------------------------------------------------

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchData();
  }, [token]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      /*
       * IMPORTANT:
       *
       * We only request /orders now.
       *
       * Previously this page also requested /buyers,
       * which caused:
       *
       * GET /api/v1/buyers 403
       *
       * Orders already contain buyerName, so we don't
       * need the buyers endpoint just to display orders.
       */
      const ordersData = await getAllOrders(token);

      setOrders(ordersData);
    } catch (err) {
      console.error("Failed to load orders:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // FILTER ORDERS
  // --------------------------------------------------

  const filtered = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" ||
        order.status === statusFilter;

      const buyerName =
        order.buyerName ??
        order.buyerId ??
        "";

      const matchesSearch =
        buyerName
          .toLowerCase()
          .includes(searchValue);

      return (
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    orders,
    statusFilter,
    search,
  ]);

  // --------------------------------------------------
  // DATE
  // --------------------------------------------------

  function formatDate(
    ts?: Order["createdAt"]
  ) {
    const date = toDate(ts);

    return date
      ? date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—";
  }

  // --------------------------------------------------
  // STATUS BADGE
  // --------------------------------------------------

  function statusBadge(
    status?: string
  ) {
    const base =
      "px-2 py-0.5 rounded-full text-xs font-medium capitalize";

    if (status === "completed") {
      return `${base} bg-emerald-100 text-emerald-700`;
    }

    if (status === "cancelled") {
      return `${base} bg-red-100 text-red-700`;
    }

    return `${base} bg-amber-100 text-amber-700`;
  }

  // --------------------------------------------------
  // BUYER DISPLAY
  // --------------------------------------------------

  function getBuyerName(
    order: Order
  ) {
    return (
      order.buyerName ??
      order.buyerId ??
      "Unknown Buyer"
    );
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">
          Loading orders...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="p-6">
      {/* PAGE HEADER */}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Orders
          </h1>

          <p className="text-sm text-slate-500 mt-0.5">
            {orders.length} order
            {orders.length !== 1
              ? "s"
              : ""}{" "}
            placed by buyers
          </p>
        </div>

        {/* STATUS FILTER */}

        <div className="flex gap-2">
          {(
            [
              "all",
              "completed",
              "cancelled",
            ] as StatusFilter[]
          ).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() =>
                setStatusFilter(status)
              }
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                statusFilter === status
                  ? "bg-slate-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setError(null)
            }
            className="text-sm text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* SEARCH */}

      <div className="relative mb-5 max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search by buyer name..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
        />
      </div>

      {/* EMPTY STATE */}

      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <ClipboardList
            size={28}
            className="mx-auto text-slate-300 mb-2"
          />

          <p className="text-slate-500 text-sm">
            {orders.length === 0
              ? "No orders yet."
              : "No orders match your filters."}
          </p>
        </div>
      ) : (
        /* ORDERS TABLE */

        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">
                  Buyer
                </th>

                <th className="px-4 py-3 font-medium">
                  Items
                </th>

                <th className="px-4 py-3 font-medium">
                  Total
                </th>

                <th className="px-4 py-3 font-medium">
                  Status
                </th>

                <th className="px-4 py-3 font-medium">
                  Date
                </th>

                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtered.map((order) => {
                const isExpanded =
                  expandedId === order.id;

                return (
                  <>
                    {/* MAIN ORDER ROW */}

                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition"
                    >
                      {/* BUYER */}

                      <td className="px-4 py-3 font-medium text-gray-800">
                        {getBuyerName(order)}
                      </td>

                      {/* ITEMS */}

                      <td className="px-4 py-3 text-gray-600">
                        {order.items.length} item
                        {order.items.length !== 1
                          ? "s"
                          : ""}
                      </td>

                      {/* TOTAL */}

                      <td className="px-4 py-3 text-gray-800">
                        ₹
                        {Number(
                          order.totalAmount ?? 0
                        ).toFixed(2)}
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-3">
                        <span
                          className={statusBadge(
                            order.status
                          )}
                        >
                          {order.status ??
                            "pending"}
                        </span>
                      </td>

                      {/* DATE */}

                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(
                          order.createdAt
                        )}
                      </td>

                      {/* VIEW */}

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              isExpanded
                                ? null
                                : order.id ??
                                    null
                            )
                          }
                          className="flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium ml-auto"
                        >
                          {isExpanded
                            ? "Hide"
                            : "View"}

                          {isExpanded ? (
                            <ChevronUp
                              size={14}
                            />
                          ) : (
                            <ChevronDown
                              size={14}
                            />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED ORDER */}

                    {isExpanded && (
                      <tr key={`${order.id}-details`}>
                        <td
                          colSpan={6}
                          className="px-4 py-4 bg-gray-50"
                        >
                          {/* BUYER INFORMATION */}

                          <div className="mb-4 pb-3 border-b border-gray-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                              Buyer
                            </p>

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
                              <span className="flex items-center gap-1.5">
                                <ClipboardList
                                  size={13}
                                  className="text-slate-400"
                                />

                                {getBuyerName(
                                  order
                                )}
                              </span>

                              {/*
                               * These fields are only shown if
                               * they exist on the order.
                               *
                               * Your current Order model doesn't
                               * require them, so we safely check
                               * them here.
                               */}

                              {"buyerEmail" in
                                order &&
                                typeof (
                                  order as Order & {
                                    buyerEmail?: string;
                                  }
                                ).buyerEmail ===
                                  "string" && (
                                  <span className="flex items-center gap-1.5">
                                    <Mail
                                      size={13}
                                      className="text-slate-400"
                                    />

                                    {
                                      (
                                        order as Order & {
                                          buyerEmail?: string;
                                        }
                                      ).buyerEmail
                                    }
                                  </span>
                                )}

                              {"buyerPhone" in
                                order &&
                                typeof (
                                  order as Order & {
                                    buyerPhone?: string;
                                  }
                                ).buyerPhone ===
                                  "string" && (
                                  <span className="flex items-center gap-1.5">
                                    <Phone
                                      size={13}
                                      className="text-slate-400"
                                    />

                                    {
                                      (
                                        order as Order & {
                                          buyerPhone?: string;
                                        }
                                      ).buyerPhone
                                    }
                                  </span>
                                )}

                              {"buyerAddress" in
                                order &&
                                typeof (
                                  order as Order & {
                                    buyerAddress?: string;
                                  }
                                ).buyerAddress ===
                                  "string" && (
                                  <span className="flex items-center gap-1.5">
                                    <MapPin
                                      size={13}
                                      className="text-slate-400"
                                    />

                                    {
                                      (
                                        order as Order & {
                                          buyerAddress?: string;
                                        }
                                      ).buyerAddress
                                    }
                                  </span>
                                )}
                            </div>
                          </div>

                          {/* ORDER ITEMS */}

                          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                            Order Items
                          </p>

                          <table className="w-full text-xs">
                            <thead className="text-gray-500">
                              <tr>
                                <th className="text-left py-2 font-medium">
                                  Product
                                </th>

                                <th className="text-left py-2 font-medium">
                                  Qty
                                </th>

                                <th className="text-left py-2 font-medium">
                                  Unit Price
                                </th>

                                <th className="text-left py-2 font-medium">
                                  Subtotal
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {order.items.map(
                                (item, index) => (
                                  <tr
                                    key={`${order.id}-${index}`}
                                    className="border-t border-gray-100"
                                  >
                                    <td className="py-2">
                                      {item.productName ??
                                        item.productId}
                                    </td>

                                    <td className="py-2">
                                      {
                                        item.quantity
                                      }
                                    </td>

                                    <td className="py-2">
                                      ₹
                                      {Number(
                                        item.unitPrice ??
                                          0
                                      ).toFixed(
                                        2
                                      )}
                                    </td>

                                    <td className="py-2">
                                      ₹
                                      {Number(
                                        item.subtotal ??
                                          0
                                      ).toFixed(
                                        2
                                      )}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}