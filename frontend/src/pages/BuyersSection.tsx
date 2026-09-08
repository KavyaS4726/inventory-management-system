import { useEffect, useState } from "react";

import {
  Pencil,
  Trash2,
  Search,
  Users,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

import type { Buyer } from "../api/type";

import {
  getAllBuyers,
  createBuyer,
  updateBuyer,
  deleteBuyer,
} from "../api/buyerOrders";

import { useAuth } from "../context/AuthContext";

type BuyerForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

const emptyForm: BuyerForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

const AVATAR_COLORS = [
  { bg: "#EAF0FB", text: "#0B1F3A" },
  { bg: "#FDF0E7", text: "#B5502F" },
  { bg: "#EAF7EF", text: "#1E7A46" },
  { bg: "#F3EDFB", text: "#6B3FA0" },
  { bg: "#FEF3E8", text: "#B8791A" },
  { bg: "#E9F5F7", text: "#1B6E7D" },
];

function avatarStyle(name: string) {
  if (!name) return AVATAR_COLORS[0];

  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;

  return AVATAR_COLORS[idx];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function BuyersPage() {
  const { token, hasPermission } = useAuth();

  // Buyers permissions only.
  const canCreate = hasPermission("buyers", "create");
  const canEdit = hasPermission("buyers", "edit");
  const canDelete = hasPermission("buyers", "delete");

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BuyerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  function validate(values: BuyerForm) {
    const errors: Partial<Record<keyof BuyerForm, string>> = {};

    if (!values.name.trim()) {
      errors.name = "Name is required.";
    }

    if (!values.phone.trim()) {
      errors.phone = "Phone is required.";
    } else if (!/^\d{10}$/.test(values.phone.trim())) {
      errors.phone = "Enter a valid 10-digit phone number.";
    }

    if (!values.email.trim()) {
      errors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
    ) {
      errors.email = "Enter a valid email address.";
    }

    if (!values.address.trim()) {
      errors.address = "Address is required.";
    }

    return errors;
  }

  const errors = validate(form);
  const isValid = Object.keys(errors).length === 0;

  useEffect(() => {
    fetchBuyers();
  }, []);

  async function fetchBuyers() {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllBuyers(token);

      setBuyers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load buyers.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setTouched(false);
    setShowModal(true);
  }

  function openEditModal(buyer: Buyer) {
    setEditingId(buyer.id ?? null);

    setForm({
      name: buyer.name ?? "",
      phone: buyer.phone ?? "",
      email: buyer.email ?? "",
      address: buyer.address ?? "",
    });

    setTouched(false);
    setShowModal(true);
  }

  async function handleSave() {
    setTouched(true);

    if (!isValid) return;

    setSaving(true);

    try {
      if (editingId) {
        await updateBuyer(editingId, form, token);
      } else {
        await createBuyer(form, token);
      }

      setShowModal(false);

      await fetchBuyers();
    } catch (err) {
      console.error(err);
      alert("Failed to save buyer.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this buyer? This cannot be undone.")) {
      return;
    }

    try {
      await deleteBuyer(id, token);

      setBuyers((prev) =>
        prev.filter((b) => b.id !== id)
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete buyer.");
    }
  }

  const filtered = buyers.filter((b) =>
    [b.name, b.email, b.phone]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Buyers
          </h1>

          <p className="text-sm text-slate-500 mt-0.5">
            {buyers.length} buyer
            {buyers.length !== 1 ? "s" : ""} you sell products to
          </p>
        </div>

        {/* Only users with Buyers -> Create can see this button */}
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="self-start sm:self-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Buyer
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          placeholder="Search buyers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
        />
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-500">
          Loading buyers...
        </p>
      ) : error ? (
        <p className="text-red-600">
          {error}
        </p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <Users
            size={28}
            className="mx-auto text-slate-300 mb-2"
          />

          <p className="text-slate-500 text-sm">
            {buyers.length === 0
              ? "No buyers yet. Add your first one to get started."
              : "No buyers match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((buyer) => {
            const avatar = avatarStyle(buyer.name);

            return (
              <div
                key={buyer.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{
                        backgroundColor: avatar.bg,
                        color: avatar.text,
                      }}
                    >
                      {initials(buyer.name)}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {buyer.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        Buyer
                      </p>
                    </div>
                  </div>

                  {/* Only show actions that the user actually has */}
                  {(canEdit || canDelete) && (
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition shrink-0">
                      {canEdit && (
                        <button
                          onClick={() =>
                            openEditModal(buyer)
                          }
                          title="Edit"
                          className="text-gray-700 hover:bg-gray-100 p-1.5 rounded-md transition"
                        >
                          <Pencil size={15} />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() =>
                            buyer.id &&
                            handleDelete(buyer.id)
                          }
                          title="Delete"
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <a
                    href={`tel:${buyer.phone}`}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition"
                  >
                    <Phone
                      size={13}
                      className="shrink-0"
                    />

                    <span className="truncate">
                      {buyer.phone}
                    </span>
                  </a>

                  <a
                    href={`mailto:${buyer.email}`}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition"
                  >
                    <Mail
                      size={13}
                      className="shrink-0"
                    />

                    <span className="truncate">
                      {buyer.email}
                    </span>
                  </a>

                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <MapPin
                      size={13}
                      className="shrink-0 mt-0.5"
                    />

                    <span>
                      {buyer.address}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingId
                ? "Edit Buyer"
                : "Add Buyer"}
            </h2>

            <div className="space-y-3">
              <div>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-sm ${
                    touched && errors.name
                      ? "border-red-400"
                      : "border-gray-300"
                  }`}
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                />

                {touched && errors.name && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-sm ${
                    touched && errors.phone
                      ? "border-red-400"
                      : "border-gray-300"
                  }`}
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                />

                {touched && errors.phone && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-sm ${
                    touched && errors.email
                      ? "border-red-400"
                      : "border-gray-300"
                  }`}
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                />

                {touched && errors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-sm ${
                    touched && errors.address
                      ? "border-red-400"
                      : "border-gray-300"
                  }`}
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: e.target.value,
                    })
                  }
                />

                {touched && errors.address && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.address}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={
                  saving ||
                  (touched && !isValid)
                }
                className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}