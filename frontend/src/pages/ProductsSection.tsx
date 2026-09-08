
import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

interface Product {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  quantity?: number;
  categoryId?: string;
  categoryName?: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductForm {
  name: string;
  sku: string;
  price: string;
  quantity: string;
  categoryId: string;
}

export default function ProductsSection() {
  const { token, hasPermission } = useAuth();

  const canView = hasPermission("products", "view");
  const canCreate = hasPermission("products", "create");
  const canEdit = hasPermission("products", "edit");
  const canDelete = hasPermission("products", "delete");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState<ProductForm>({
    name: "",
    sku: "",
    price: "",
    quantity: "",
    categoryId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    if (!token || !canView) return;

    try {
      setError("");

      const res = await apiRequest(
        "/products",
        {
          method: "GET",
        },
        token
      );

      setProducts(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    }
  };

  const loadCategories = async () => {
    if (!token) return;

    try {
      const res = await apiRequest(
        "/categories",
        {
          method: "GET",
        },
        token
      );

      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  useEffect(() => {
    if (!token) return;

    loadProducts();

    /*
     * Categories are needed by the product form.
     *
     * If the user cannot view categories, the backend will
     * reject this request. That is okay because the product
     * page itself can still work without the category list.
     */
    if (hasPermission("categories", "view")) {
      loadCategories();
    }
  }, [token, canView]);

  const resetForm = () => {
    setForm({
      name: "",
      sku: "",
      price: "",
      quantity: "",
      categoryId: "",
    });

    setEditingProduct(null);
    setShowForm(false);
    setError("");
  };

  const handleAdd = () => {
    if (!canCreate) {
      setError("You do not have permission to create products.");
      return;
    }

    setEditingProduct(null);

    setForm({
      name: "",
      sku: "",
      price: "",
      quantity: "",
      categoryId: "",
    });

    setError("");
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    if (!canEdit) {
      setError("You do not have permission to edit products.");
      return;
    }

    setEditingProduct(product);

    setForm({
      name: product.name || "",
      sku: product.sku || "",
      price:
        product.price !== undefined && product.price !== null
          ? String(product.price)
          : "",
      quantity:
        product.quantity !== undefined && product.quantity !== null
          ? String(product.quantity)
          : "",
      categoryId: product.categoryId || "",
    });

    setError("");
    setShowForm(true);
  };

  const handleDelete = async (product: Product) => {
    if (!canDelete || !token) {
      setError("You do not have permission to delete products.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await apiRequest(
        `/products/${product.id}`,
        {
          method: "DELETE",
        },
        token
      );

      await loadProducts();
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    if (editingProduct && !canEdit) {
      setError("You do not have permission to edit products.");
      return;
    }

    if (!editingProduct && !canCreate) {
      setError("You do not have permission to create products.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const body = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
        categoryId: form.categoryId || undefined,
      };

      if (editingProduct) {
        /*
         * Backend route:
         * PUT /products/:id
         */
        await apiRequest(
          `/products/${editingProduct.id}`,
          {
            method: "PUT",
            body: JSON.stringify(body),
          },
          token
        );
      } else {
        await apiRequest(
          "/products",
          {
            method: "POST",
            body: JSON.stringify(body),
          },
          token
        );
      }

      resetForm();
      await loadProducts();
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = search.toLowerCase();

    return (
      product.name?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.categoryName?.toLowerCase().includes(query)
    );
  });

  /*
   * If the role does not have products.view, the backend
   * should normally prevent this page from being reached.
   *
   * This extra frontend guard prevents the page from
   * displaying product information accidentally.
   */
  if (!canView) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h1 className="text-lg font-semibold text-red-700">
            Access Denied
          </h1>

          <p className="text-sm text-red-600 mt-1">
            You do not have permission to view products.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Products
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Manage your inventory products
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={handleAdd}
            className="self-start md:self-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0B1F3A] text-white rounded-lg hover:bg-[#132a4d] transition"
          >
            <Plus size={18} />
            Add Product
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Product Form */}
      {showForm && (canCreate || canEdit) && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-800">
              {editingProduct ? "Edit Product" : "Add Product"}
            </h2>

            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Product Name
              </label>

              <input
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                SKU
              </label>

              <input
                type="text"
                value={form.sku}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sku: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantity
              </label>

              <input
                type="number"
                min="0"
                required
                value={form.quantity}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>

              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    categoryId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#0B1F3A] text-white rounded-lg hover:bg-[#132a4d] disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : editingProduct
                  ? "Update Product"
                  : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Product
                </th>

                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                  SKU
                </th>

                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Category
                </th>

                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Price
                </th>

                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Quantity
                </th>

                {(canEdit || canDelete) && (
                  <th className="sticky right-0 bg-slate-50 text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">
                   Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit || canDelete ? 6 : 5}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">
                        {product.name}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {product.sku || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {product.categoryName || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {product.price !== undefined
                        ? `₹${Number(product.price).toFixed(2)}`
                        : "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {product.quantity ?? 0}
                    </td>

                    {(canEdit || canDelete) && (
                      <td className="sticky right-0 bg-white px-6 py-4">
                         <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(product)
                              }
                              title="Edit product"
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Pencil size={17} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(product)
                              }
                              title="Delete product"
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

