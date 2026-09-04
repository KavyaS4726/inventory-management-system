
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { getAllBuyers, createOrder } from "../api/buyerOrders";
import type { Buyer } from "../api/type";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  PackageSearch,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice?: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface Movement {
  id: string;
  productId: string;
  type: "IN" | "OUT";
  quantity: number;
  note?: string;
  performedBy?: {
    uid: string;
    email: string;
  };
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  supplierId?: string;
  unitPrice?: number;
  totalPrice?: number;
  orderId?: string;
  buyerId?: string;
  buyerName?: string;
}

export default function StockMovementsSection() {
  const { token, user } = useAuth();

  /*
   * Dynamic permissions.
   *
   * Permissions come from the role assigned to the logged-in user.
   * Nothing here depends on Admin/Staff.
   */
  const canView =
    user?.permissions?.stockMovements?.view === true;

  const canCreate =
    user?.permissions?.stockMovements?.create === true;

  const [mode, setMode] = useState<"in" | "out">("in");

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [history, setHistory] = useState<Movement[]>([]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const [supplierId, setSupplierId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  const [buyerId, setBuyerId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchProducts() {
    if (!token) return;

    try {
      const res = await apiRequest(
        "/products",
        { method: "GET" },
        token
      );

      setProducts(res.data?.items || res.data || []);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  }

  async function fetchSuppliers() {
    if (!token) return;

    try {
      const res = await apiRequest(
        "/suppliers",
        { method: "GET" },
        token
      );

      setSuppliers(res.data?.items || res.data || []);
    } catch (err) {
      console.error("Failed to load suppliers", err);
    }
  }

  async function fetchBuyers() {
    if (!token) return;

    try {
      const data = await getAllBuyers(token);

      setBuyers(data);
    } catch (err) {
      console.error("Failed to load buyers", err);
    }
  }

  async function fetchAllMovements() {
    if (!token || !canView) return;

    setLoadingHistory(true);

    try {
      const res = await apiRequest(
        "/stock-movements",
        { method: "GET" },
        token
      );

      setHistory(res.data?.items || res.data || []);
    } catch (err: any) {
      setError(
        err.message || "Failed to load movements"
      );
    } finally {
      setLoadingHistory(false);
    }
  }

  async function fetchHistory(productId: string) {
    if (!token || !canView) return;

    setLoadingHistory(true);

    try {
      const res = await apiRequest(
        `/stock-movements/history/${productId}`,
        { method: "GET" },
        token
      );

      setHistory(res.data?.items || res.data || []);
    } catch (err: any) {
      setError(
        err.message || "Failed to load history"
      );
    } finally {
      setLoadingHistory(false);
    }
  }

  /*
   * Load supporting data only when the user can view
   * stock movements.
   */
  useEffect(() => {
    if (!canView || !token) {
      return;
    }

    fetchProducts();
    fetchSuppliers();
    fetchBuyers();
  }, [token, canView]);

  /*
   * Load movement history only when the user has
   * stockMovements.view permission.
   */
  useEffect(() => {
    if (!canView || !token) {
      return;
    }

    if (selectedProductId) {
      fetchHistory(selectedProductId);
    } else {
      fetchAllMovements();
    }
  }, [selectedProductId, token, canView]);

  function resetForm() {
    setSelectedProductId("");
    setQuantity("");
    setNote("");
    setSupplierId("");
    setUnitPrice("");
    setBuyerId("");
  }

  async function handleStockIn() {
    setError("");
    setSuccess("");

    if (!canCreate) {
      setError(
        "You do not have permission to create stock movements."
      );
      return;
    }

    if (!token) {
      setError("Authentication required.");
      return;
    }

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    const qty = Number(quantity);
    const price = Number(unitPrice);

    if (!quantity || qty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    if (!unitPrice || price < 0) {
      setError("Please enter a valid unit price.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest(
        "/stock-movements/in",
        {
          method: "POST",
          body: JSON.stringify({
            productId: selectedProductId,
            quantity: qty,
            note,
            supplierId,
            unitPrice: price,
          }),
        },
        token
      );

      setSuccess(
        "Stock In recorded successfully."
      );

      resetForm();

      await fetchProducts();
      await fetchAllMovements();
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to record Stock In."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStockOut() {
    setError("");
    setSuccess("");

    if (!canCreate) {
      setError(
        "You do not have permission to create stock movements."
      );
      return;
    }

    if (!token) {
      setError("Authentication required.");
      return;
    }

    if (!buyerId) {
      setError("Please select a buyer.");
      return;
    }

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    const qty = Number(quantity);

    const product = products.find(
      (p) => p.id === selectedProductId
    );

    if (!quantity || qty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (!product) {
      setError("Product not found.");
      return;
    }

    if (qty > product.quantity) {
      setError(
        `Only ${product.quantity} units are available. You cannot sell ${qty}.`
      );
      return;
    }

    if ((product.unitPrice ?? 0) <= 0) {
      setError(
        "This product does not have a valid selling price."
      );
      return;
    }

    setSaving(true);

    try {
      await createOrder(
        {
          buyerId,
          items: [
            {
              productId: selectedProductId,
              quantity: qty,
            },
          ],
        },
        token
      );

      setSuccess(
        "Sale completed successfully."
      );

      resetForm();

      await fetchProducts();
      await fetchAllMovements();
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to complete sale."
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedProduct = products.find(
    (p) => p.id === selectedProductId
  );

  const selectedBuyer = buyers.find(
    (b) => b.id === buyerId
  );

  const stockInTotal =
    (Number(unitPrice) || 0) *
    (Number(quantity) || 0);

  const stockOutPrice =
    selectedProduct?.unitPrice ?? 0;

  const stockOutTotal =
    stockOutPrice *
    (Number(quantity) || 0);

  function productLabel(productId: string) {
    const p = products.find(
      (pr) => pr.id === productId
    );

    return p
      ? `${p.name} (${p.sku})`
      : "Unknown product";
  }

  function supplierLabel(id?: string) {
    if (!id) return "";

    const s = suppliers.find(
      (sp) => sp.id === id
    );

    return s
      ? s.name
      : "Unknown supplier";
  }

  const formatDate = (seconds: number) =>
    new Date(
      seconds * 1000
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  /*
   * No view permission.
   *
   * Do not render stock movement data.
   */
  if (!canView) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
        <PackageSearch
          size={28}
          className="mx-auto text-slate-300 mb-2"
        />

        <p className="text-slate-500 text-sm">
          You do not have permission to view
          stock movements.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Stock Movements
      </h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
          {success}
        </p>
      )}

      {/* Mode buttons */}
      {canCreate && (
        <div className="flex gap-3 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("in");
              setError("");
              setSuccess("");
              resetForm();
            }}
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition ${
              mode === "in"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <ArrowUpCircle size={16} />
            Stock In
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("out");
              setError("");
              setSuccess("");
              resetForm();
            }}
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition ${
              mode === "out"
                ? "bg-orange-600 text-white"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100"
            }`}
          >
            <ArrowDownCircle size={16} />
            Stock Out
          </button>
        </div>
      )}

      {/* ================= STOCK IN ================= */}
      {canCreate && mode === "in" && (
        <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">
            Add Stock
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Product
              </label>

              <select
                value={selectedProductId}
                onChange={(e) =>
                  setSelectedProductId(
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">
                  Select product
                </option>

                {products.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                  >
                    {p.name} ({p.sku}) — Qty:{" "}
                    {p.quantity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Supplier
              </label>

              <select
                value={supplierId}
                onChange={(e) =>
                  setSupplierId(
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">
                  Select supplier
                </option>

                {suppliers.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                  >
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Quantity
              </label>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Unit Price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) =>
                  setUnitPrice(
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Note
              </label>

              <input
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
                placeholder="Optional"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="font-semibold text-slate-700">
              Total: ₹
              {stockInTotal.toFixed(2)}
            </p>

            <button
              type="button"
              onClick={handleStockIn}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
            >
              {saving
                ? "Saving..."
                : "Add Stock"}
            </button>
          </div>
        </div>
      )}

      {/* ================= STOCK OUT ================= */}
      {canCreate && mode === "out" && (
        <div className="border border-orange-100 bg-orange-50/30 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">
            Sell Product
          </h3>

          {/* Buyer */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Buyer{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <select
              value={buyerId}
              onChange={(e) =>
                setBuyerId(e.target.value)
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">
                Select buyer
              </option>

              {buyers.map((buyer) => (
                <option
                  key={buyer.id}
                  value={buyer.id}
                >
                  {buyer.name} —{" "}
                  {buyer.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Buyer information */}
          {selectedBuyer && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-slate-800 mb-2">
                Buyer Information
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                <div>
                  <span className="font-medium">
                    Email
                  </span>
                  <p>
                    {selectedBuyer.email}
                  </p>
                </div>

                <div>
                  <span className="font-medium">
                    Contact
                  </span>
                  <p>
                    {selectedBuyer.phone}
                  </p>
                </div>

                <div>
                  <span className="font-medium">
                    Address
                  </span>
                  <p>
                    {selectedBuyer.address}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Product */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Product{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <select
              value={selectedProductId}
              onChange={(e) =>
                setSelectedProductId(
                  e.target.value
                )
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">
                Select product
              </option>

              {products.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.name} ({p.sku}) —
                  Available: {p.quantity}
                </option>
              ))}
            </select>
          </div>

          {/* Product information */}
          {selectedProduct && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">
                    Available Stock
                  </p>

                  <p className="font-semibold text-slate-800">
                    {
                      selectedProduct.quantity
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Selling Price
                  </p>

                  <p className="font-semibold text-slate-800">
                    ₹
                    {stockOutPrice.toFixed(
                      2
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Date
                  </p>

                  <p className="font-semibold text-slate-800">
                    {new Date().toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Quantity{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="number"
              min="1"
              max={
                selectedProduct?.quantity ??
                undefined
              }
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  e.target.value
                )
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Enter quantity"
            />

            {selectedProduct && (
              <p className="text-xs text-slate-400 mt-1">
                Maximum available:{" "}
                {selectedProduct.quantity}
              </p>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-orange-100 pt-4">
            <div>
              <p className="text-xs text-slate-500">
                Total Sale Price
              </p>

              <p className="text-xl font-bold text-slate-800">
                ₹
                {stockOutTotal.toFixed(
                  2
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={handleStockOut}
              disabled={saving}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
            >
              <ArrowDownCircle
                size={17}
              />

              {saving
                ? "Processing..."
                : "Sell Product"}
            </button>
          </div>
        </div>
      )}

      {/* ================= HISTORY ================= */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          {selectedProductId
            ? `History for ${
                selectedProduct?.name ||
                "selected product"
              }`
            : "All Stock Movements"}
        </h3>

        {loadingHistory ? (
          <p className="text-slate-500 text-sm">
            Loading...
          </p>
        ) : history.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center">
            <PackageSearch
              size={28}
              className="mx-auto text-slate-300 mb-2"
            />

            <p className="text-slate-500 text-sm">
              No movements recorded yet.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100" />

            <div className="space-y-4">
              {history.map((m) => {
                const isIn =
                  m.type === "IN";

                return (
                  <div
                    key={m.id}
                    className="relative flex items-start gap-3 pl-0"
                  >
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isIn
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      {isIn ? (
                        <ArrowUpCircle
                          size={16}
                        />
                      ) : (
                        <ArrowDownCircle
                          size={16}
                        />
                      )}
                    </div>

                    <div className="flex-1 flex justify-between items-start pb-1">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {productLabel(
                            m.productId
                          )}
                        </p>

                        {isIn &&
                          m.supplierId && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              From{" "}
                              {supplierLabel(
                                m.supplierId
                              )}
                            </p>
                          )}

                        {!isIn && (
                          <>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Sold to:{" "}
                              <span className="font-medium">
                                {m.buyerName ||
                                  "Buyer"}
                              </span>
                            </p>

                            {m.orderId && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                Order:{" "}
                                {m.orderId}
                              </p>
                            )}

                            {m.unitPrice !==
                              undefined && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                ₹
                                {
                                  m.unitPrice
                                }{" "}
                                ×{" "}
                                {
                                  m.quantity
                                }{" "}
                                = ₹
                                {(
                                  m.unitPrice *
                                  m.quantity
                                ).toFixed(
                                  2
                                )}
                              </p>
                            )}
                          </>
                        )}

                        {m.note && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {m.note}
                          </p>
                        )}

                        <p className="text-xs text-slate-400 mt-0.5">
                          {m.performedBy
                            ?.email ||
                            "Unknown"}{" "}
                          ·{" "}
                          {m.createdAt
                            ? formatDate(
                                m
                                  .createdAt
                                  ._seconds
                              )
                            : "Unknown date"}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ml-3 ${
                          isIn
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {isIn
                          ? "+"
                          : "−"}
                        {
                          m.quantity
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

