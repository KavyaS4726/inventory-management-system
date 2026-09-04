import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import {
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Search,
  Building2,
  ChevronDown,
  ChevronUp,
  PackageSearch,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface SupplierMovement {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
}

interface SupplierDayGroup {
  date: string;
  movements: SupplierMovement[];
  dayTotal: number;
}

interface SupplierHistory {
  movements: SupplierMovement[];
  byDate: SupplierDayGroup[];
  totalSpent: number;
  totalQuantity: number;
}

const AVATAR_COLORS = [
  { bg: "#EAF0FB", text: "#0B1F3A" },
  { bg: "#FDF0E7", text: "#B5502F" },
  { bg: "#EAF7EF", text: "#1E7A46" },
  { bg: "#F3EDFB", text: "#6B3FA0" },
  { bg: "#FEF3E8", text: "#B8791A" },
  { bg: "#E9F5F7", text: "#1B6E7D" },
];

function avatarStyle(name: string) {
  const firstChar = name.trim().charCodeAt(0) || 0;
  const idx = firstChar % AVATAR_COLORS.length;

  return AVATAR_COLORS[idx];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatDateKey(dateKey: string) {
  return new Date(dateKey).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SuppliersSection() {
  const { token, user } = useAuth();

  const canView = user?.permissions?.suppliers?.view === true;
  const canCreate = user?.permissions?.suppliers?.create === true;
  const canEdit = user?.permissions?.suppliers?.edit === true;
  const canDelete = user?.permissions?.suppliers?.delete === true;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [historyCache, setHistoryCache] = useState<
    Record<string, SupplierHistory>
  >({});

  const [historyLoading, setHistoryLoading] = useState<string | null>(null);

  async function fetchSuppliers() {
    if (!token || !canView) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiRequest(
        "/suppliers",
        {
          method: "GET",
        },
        token
      );

      setSuppliers(res.data?.items || res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSuppliers();
  }, [token, canView]);

  async function toggleHistory(supplierId: string) {
    if (!token) return;

    if (expandedId === supplierId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(supplierId);

    if (historyCache[supplierId]) {
      return;
    }

    setHistoryLoading(supplierId);
    setError("");

    try {
      const res = await apiRequest(
        `/stock-movements/supplier/${supplierId}`,
        {
          method: "GET",
        },
        token
      );

      const data: SupplierHistory = res.data;

      setHistoryCache((prev) => ({
        ...prev,
        [supplierId]: data,
      }));
    } catch (err: any) {
      setError(err.message || "Failed to load supply history");
    } finally {
      setHistoryLoading(null);
    }
  }

  function resetForm() {
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
    });

    setEditingId(null);
    setShowForm(false);
  }

  function openCreateForm() {
    if (!canCreate) return;

    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
    });

    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function startEdit(supplier: Supplier) {
    if (!canEdit) {
      setError("You do not have permission to edit suppliers.");
      return;
    }

    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });

    setEditingId(supplier.id);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) return;

    if (editingId && !canEdit) {
      setError("You do not have permission to edit suppliers.");
      return;
    }

    if (!editingId && !canCreate) {
      setError("You do not have permission to create suppliers.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const body = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      };

      if (editingId) {
        await apiRequest(
          `/suppliers/${editingId}`,
          {
            method: "PUT",
            body: JSON.stringify(body),
          },
          token
        );
      } else {
        await apiRequest(
          "/suppliers",
          {
            method: "POST",
            body: JSON.stringify(body),
          },
          token
        );
      }

      resetForm();
      await fetchSuppliers();
    } catch (err: any) {
      setError(err.message || "Failed to save supplier");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;

    if (!canDelete) {
      setError("You do not have permission to delete suppliers.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this supplier?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await apiRequest(
        `/suppliers/${id}`,
        {
          method: "DELETE",
        },
        token
      );

      if (expandedId === id) {
        setExpandedId(null);
      }

      setHistoryCache((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      await fetchSuppliers();
    } catch (err: any) {
      setError(err.message || "Failed to delete supplier");
    }
  }

  const filtered = suppliers.filter((supplier) => {
    const query = search.toLowerCase();

    return [supplier.name, supplier.email, supplier.phone]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  /*
   * Frontend permission check.
   *
   * Backend must still protect /suppliers with
   * checkPermission("suppliers", "view").
   */
  if (!canView) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
        <Building2
          size={28}
          className="mx-auto text-slate-300 mb-2"
        />

        <p className="text-slate-500 text-sm">
          You do not have permission to view suppliers.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Suppliers
          </h1>

          <p className="text-sm text-slate-500 mt-0.5">
            {suppliers.length} supplier
            {suppliers.length !== 1 ? "s" : ""} you purchase stock from
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() =>
              showForm ? resetForm() : openCreateForm()
            }
            className="bg-[#0B1F3A] hover:bg-[#132a4d] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {showForm ? "Cancel" : "+ Add Supplier"}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {/* Create / Edit Form */}
      {showForm && (canCreate || canEdit) && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
        >
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Name
            </label>

            <input
              required
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Phone
            </label>

            <input
              required
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Email
            </label>

            <input
              required
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Address
            </label>

            <input
              required
              value={form.address}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-[#0B1F3A] hover:bg-[#132a4d] disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg sm:col-span-2 w-fit transition"
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Supplier"
              : "Create Supplier"}
          </button>
        </form>
      )}

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers..."
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
        />
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-slate-500 text-sm">
          Loading suppliers...
        </p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
          <Building2
            size={28}
            className="mx-auto text-slate-300 mb-2"
          />

          <p className="text-slate-500 text-sm">
            {suppliers.length === 0
              ? "No suppliers yet. Add your first one to get started."
              : "No suppliers match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((supplier) => {
            const avatar = avatarStyle(supplier.name);
            const isExpanded = expandedId === supplier.id;
            const history = historyCache[supplier.id];
            const isLoadingHistory =
              historyLoading === supplier.id;

            return (
              <div
                key={supplier.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition group"
              >
                {/* Supplier Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{
                        backgroundColor: avatar.bg,
                        color: avatar.text,
                      }}
                    >
                      {initials(supplier.name)}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {supplier.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        Supplier
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Actions */}
                  {(canEdit || canDelete) && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => startEdit(supplier)}
                          title="Edit supplier"
                          className="text-[#0B1F3A] hover:bg-[#0B1F3A]/10 p-1.5 rounded-md transition"
                        >
                          <Pencil size={15} />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(supplier.id)
                          }
                          title="Delete supplier"
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Supplier Information */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <a
                    href={`tel:${supplier.phone}`}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#0B1F3A] transition"
                  >
                    <Phone size={13} className="shrink-0" />

                    <span className="truncate">
                      {supplier.phone}
                    </span>
                  </a>

                  <a
                    href={`mailto:${supplier.email}`}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#0B1F3A] transition"
                  >
                    <Mail size={13} className="shrink-0" />

                    <span className="truncate">
                      {supplier.email}
                    </span>
                  </a>

                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <MapPin
                      size={13}
                      className="shrink-0 mt-0.5"
                    />

                    <span>{supplier.address}</span>
                  </div>
                </div>

                {/* Supply History */}
                <button
                  type="button"
                  onClick={() => toggleHistory(supplier.id)}
                  className="mt-4 w-full flex items-center justify-between text-xs font-medium text-[#0B1F3A] bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 transition"
                >
                  <span>Supply history</span>

                  {isExpanded ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    {isLoadingHistory ? (
                      <p className="text-xs text-slate-400">
                        Loading history...
                      </p>
                    ) : !history ||
                      history.movements.length === 0 ? (
                      <div className="text-center py-4">
                        <PackageSearch
                          size={20}
                          className="mx-auto text-slate-300 mb-1"
                        />

                        <p className="text-xs text-slate-400">
                          No deliveries recorded yet.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-xs text-slate-500 mb-3">
                          <span>
                            {history.totalQuantity} units overall
                          </span>

                          <span className="font-semibold text-slate-800">
                            ₹{history.totalSpent.toFixed(2)} overall
                          </span>
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {history.byDate.map((day) => (
                            <div key={day.date}>
                              <div className="flex justify-between items-center text-xs font-medium text-slate-500 mb-1">
                                <span>
                                  {formatDateKey(day.date)}
                                </span>

                                <span>
                                  ₹{day.dayTotal.toFixed(2)} that day
                                </span>
                              </div>

                              <div className="space-y-1">
                                {day.movements.map((movement) => (
                                  <div
                                    key={movement.id}
                                    className="bg-slate-50 rounded-md px-2 py-1.5"
                                  >
                                    <div className="flex justify-between items-start text-xs">
                                      <span className="text-slate-700 font-medium truncate">
                                        {movement.productName}
                                      </span>

                                      <span className="text-slate-600 shrink-0 ml-2">
                                        +{movement.quantity} · ₹
                                        {movement.unitPrice} each
                                      </span>
                                    </div>

                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                      {movement.categoryName}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}