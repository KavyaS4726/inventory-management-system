import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { Link } from "react-router-dom";

interface Movement {
  id: string;
  productId: string;
  type: "IN" | "OUT";
  quantity: number;
  note: string;
  performedBy: {
    uid: string;
    email: string;
  };
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
}

interface LowStockItem {
  id?: string;
  name?: string;
  productName?: string;
  stock?: number;
  quantity?: number;
  currentStock?: number;
  reorderLevel?: number;
  category?: string;
}

interface DashboardSummary {
  totalProducts: number;
  totalStockValue: number;
  lowStockItems: LowStockItem[];
  recentMovements: Movement[];
  productsByCategory: Record<string, number>;
}

export default function Dashboard() {
  const { token } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await apiRequest(
          "/dashboard/summary",
          { method: "GET" },
          token
        );

        setSummary(res);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [token]);

  const formatDate = (seconds: number) =>
    new Date(seconds * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4">
        {error}
      </div>
    );
  }

  if (!summary) return null;

  const categories = Object.entries(summary.productsByCategory);

  const getProductName = (item: LowStockItem) =>
    item.productName ?? item.name ?? "Unknown Product";

  const getCurrentStock = (item: LowStockItem) =>
    item.currentStock ?? item.stock ?? item.quantity ?? 0;

  const getMovementTitle = (movement: Movement) => {
    if (movement.note) return movement.note;

    return movement.type === "IN"
      ? "Stock Received"
      : "Stock Issued";
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Dashboard
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Welcome back
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 shadow-sm">
          {today}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* Total Products */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Products
              </p>

              <p className="text-3xl font-bold text-slate-800 mt-3">
                {summary.totalProducts}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <span className="text-blue-600 text-xl">📦</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Products currently tracked
          </p>
        </div>

        {/* Stock Value */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Stock Value
              </p>

              <p className="text-2xl font-bold text-slate-800 mt-3">
                ₹{summary.totalStockValue.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
              <span className="text-green-600 text-xl font-bold">
                ₹
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Current inventory value
          </p>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Low Stock Items
              </p>

              <p className="text-3xl font-bold text-slate-800 mt-3">
                {summary.lowStockItems.length}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <span className="text-amber-600 text-xl">
                ⚠
              </span>
            </div>
          </div>

          <p className="text-xs text-amber-600 mt-4">
            Requires attention
          </p>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Categories
              </p>

              <p className="text-3xl font-bold text-slate-800 mt-3">
                {categories.length}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
              <span className="text-purple-600 text-xl">
                ▦
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Product categories
          </p>
        </div>
      </div>

      {/* Category + Movements */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Inventory by Category */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">
              Inventory by Category
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Number of products in each category
            </p>
          </div>

          <div className="p-6 space-y-6">
            {categories.length === 0 ? (
              <p className="text-sm text-slate-400">
                No category data available.
              </p>
            ) : (
              categories.map(([category, count]) => {
                const maxCount = Math.max(
                  ...categories.map(([, value]) => value),
                  1
                );

                const percentage = (count / maxCount) * 100;

                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        {category}
                      </span>

                      <span className="text-sm font-semibold text-slate-800">
                        {count}
                      </span>
                    </div>

                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B1F3A] rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
             <div>
              <h2 className="text-lg font-semibold text-slate-800">
                 Recent Stock Movements
               </h2>
                <p className="text-xs text-slate-400 mt-1">
                Latest inventory activity
               </p>
               </div>

              <Link to="/stock-movements" className="text-sm text-blue-600 font-medium hover:underline">
               View all
              </Link>
               </div>
          <div className="divide-y divide-slate-100">
            {summary.recentMovements.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-slate-400">
                  No stock movements yet.
                </p>
              </div>
            ) : (
              summary.recentMovements.slice(0, 5).map((movement) => (
                <div
                  key={movement.id}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">

                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        movement.type === "IN"
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {movement.type === "IN" ? "↑" : "↓"}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {getMovementTitle(movement)}
                      </p>

                      <p className="text-xs text-slate-400 mt-1 truncate">
                       {movement.performedBy?.email || "System"} ·{" "}
                        {formatDate(movement.createdAt._seconds)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-semibold ${
                      movement.type === "IN"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {movement.type === "IN" ? "+" : "−"}
                    {movement.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Low Stock Items */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">
              Low Stock Items
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Products that need attention
            </p>
          </div>

          {summary.lowStockItems.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-3xl text-green-500 mb-2">
                ✓
              </div>

              <p className="text-sm font-medium text-slate-700">
                Stock levels are healthy
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">
                      Product
                    </th>

                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">
                      Stock
                    </th>

                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">
                      Reorder
                    </th>

                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {summary.lowStockItems.slice(0, 5).map((item, index) => (
                    <tr
                      key={item.id ?? index}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-700">
                          {getProductName(item)}
                        </p>

                        {item.category && (
                          <p className="text-xs text-slate-400 mt-1">
                            {item.category}
                          </p>
                        )}
                      </td>

                      <td className="text-center px-4 py-4 font-semibold text-slate-700">
                        {getCurrentStock(item)}
                      </td>

                      <td className="text-center px-4 py-4 text-slate-500">
                        {item.reorderLevel ?? "—"}
                      </td>

                      <td className="text-right px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                          Low
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stock Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">
              Stock Activity
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Incoming and outgoing inventory
            </p>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4">

            {/* Received */}
            <div className="rounded-xl bg-green-50 border border-green-100 p-5">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-green-600 text-xl">
                ↑
              </div>

              <p className="text-sm text-slate-500 mt-4">
                Stock Received
              </p>

              <p className="text-2xl font-bold text-slate-800 mt-1">
                +
                {summary.recentMovements
                  .filter((m) => m.type === "IN")
                  .reduce((total, m) => total + m.quantity, 0)}
              </p>

              <p className="text-xs text-green-600 mt-1">
                Recent incoming stock
              </p>
            </div>

            {/* Issued */}
            <div className="rounded-xl bg-red-50 border border-red-100 p-5">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-red-600 text-xl">
                ↓
              </div>

              <p className="text-sm text-slate-500 mt-4">
                Stock Issued
              </p>

              <p className="text-2xl font-bold text-slate-800 mt-1">
                −
                {summary.recentMovements
                  .filter((m) => m.type === "OUT")
                  .reduce((total, m) => total + m.quantity, 0)}
              </p>

              <p className="text-xs text-red-600 mt-1">
                Recent outgoing stock
              </p>
            </div>

          </div>

          <div className="px-6 pb-6">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs text-slate-400">
                Current Inventory Value
              </p>

              <p className="text-xl font-bold text-slate-800 mt-1">
                ₹{summary.totalStockValue.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}