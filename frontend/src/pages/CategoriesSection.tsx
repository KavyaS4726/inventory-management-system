import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { Pencil, Trash2, Search, Tag, LayoutGrid } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function CategoriesSection() {
  const { token, user } = useAuth();

  const canView = user?.permissions?.categories?.view === true;
  const canCreate = user?.permissions?.categories?.create === true;
  const canEdit = user?.permissions?.categories?.edit === true;
  const canDelete = user?.permissions?.categories?.delete === true;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  async function fetchCategories() {
    if (!token || !canView) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      setError("");

      const res = await apiRequest(
        "/categories",
        {
          method: "GET",
        },
        token
      );

      setCategories(res.data?.items || res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, [token, canView]);

  function resetForm() {
    setForm({
      name: "",
      description: "",
    });

    setEditingId(null);
    setShowForm(false);
  }

  function openCreateForm() {
    if (!canCreate) return;

    setForm({
      name: "",
      description: "",
    });

    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function startEdit(category: Category) {
    if (!canEdit) return;

    setForm({
      name: category.name,
      description: category.description || "",
    });

    setEditingId(category.id);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) return;

    if (editingId && !canEdit) {
      setError("You do not have permission to edit categories.");
      return;
    }

    if (!editingId && !canCreate) {
      setError("You do not have permission to create categories.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await apiRequest(
          `/categories/${editingId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              name: form.name.trim(),
              description: form.description.trim(),
            }),
          },
          token
        );
      } else {
        await apiRequest(
          "/categories",
          {
            method: "POST",
            body: JSON.stringify({
              name: form.name.trim(),
              description: form.description.trim(),
            }),
          },
          token
        );
      }

      resetForm();
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!canDelete || !token) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await apiRequest(
        `/categories/${id}`,
        {
          method: "DELETE",
        },
        token
      );

      await fetchCategories();
    } catch (err: any) {
      setError(err.message || "Failed to delete category");
    }
  }

  const filtered = categories.filter((category) => {
    const query = search.toLowerCase();

    return (
      category.name.toLowerCase().includes(query) ||
      (category.description || "").toLowerCase().includes(query)
    );
  });

  /*
   * Backend also protects this route.
   * This is only the frontend visibility check.
   */
  if (!canView) {
    return (
      <div className="p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-slate-700 font-medium">
            You do not have permission to view categories.
          </p>

          <p className="text-sm text-slate-500 mt-2">
            Contact an administrator if you need access to this module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Categories
          </h1>

          <p className="text-sm text-slate-500 mt-0.5">
            {categories.length} categor
            {categories.length !== 1 ? "ies" : "y"} used to group your
            products
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() =>
              showForm ? resetForm() : openCreateForm()
            }
            className="self-start sm:self-auto bg-[#0B1F3A] hover:bg-[#132a4d] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {showForm ? "Cancel" : "+ Add Category"}
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
              Description
            </label>

            <input
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
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
              ? "Update Category"
              : "Create Category"}
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
          placeholder="Search categories..."
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
        />
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-slate-500 text-sm">
          Loading categories...
        </p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
          <LayoutGrid
            size={28}
            className="mx-auto text-slate-300 mb-2"
          />

          <p className="text-slate-500 text-sm">
            {categories.length === 0
              ? "No categories yet. Add your first one to get started."
              : "No categories match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((category) => (
            <div
              key={category.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-[#EAF0FB] text-[#0B1F3A]">
                    <Tag size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {category.name}
                    </p>

                    <p className="text-xs text-slate-400">
                      Category
                    </p>
                  </div>
                </div>

                {/* Dynamic Actions */}
                {(canEdit || canDelete) && (
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition shrink-0">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        title="Edit category"
                        className="text-[#0B1F3A] hover:bg-[#0B1F3A]/10 p-1.5 rounded-md transition"
                      >
                        <Pencil size={15} />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(category.id)}
                        title="Delete category"
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {category.description && (
                <p className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}