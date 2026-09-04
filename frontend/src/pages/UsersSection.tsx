import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import CreateUserForm from "../components/CreateUserForm";
import { Search, UserCog } from "lucide-react";

interface User {
  uid: string;
  name: string;
  email: string;
  isActive?: boolean;
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
  if (!name) return AVATAR_COLORS[0];
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function UsersSection() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState("");

  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await apiRequest("/users", { method: "GET" }, token);
      setUsers(res.data?.items || res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [token]);

  if (!isAdmin) {
    return (
      <>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Users</h1>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-slate-500">
            You don't have permission to view this page.
          </p>
        </div>
      </>
    );
  }

  const filteredUsers = users.filter((u) =>
    [u.name, u.email].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {users.length} user{users.length !== 1 ? "s" : ""} with access to InvenTrack
          </p>
        </div>
      </div>

      {showCreateForm && (
        <CreateUserForm
          token={token}
          onCancel={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchUsers();
          }}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-slate-800">All Users</h2>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#0B1F3A] hover:bg-[#132a4d] text-white text-sm font-medium px-4 py-2 rounded-lg transition self-start sm:self-auto"
            >
              + Create User
            </button>
          )}
        </div>

        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-4">
            {error}
          </p>
        )}

        {loading && <p className="text-slate-500 text-sm mt-4">Loading users...</p>}

        {!loading && filteredUsers.length === 0 && (
          <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center mt-4">
            <UserCog size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm">
              {users.length === 0 ? "No users yet." : "No users match your search."}
            </p>
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className="space-y-3 mt-4">
            {filteredUsers.map((u) => {
              const isSelf = u.uid === user?.uid;
              const avatar = avatarStyle(u.name);
              return (
                <div
                  key={u.uid}
                  className="flex justify-between items-center gap-3 border-b border-slate-100 last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{ backgroundColor: avatar.bg, color: avatar.text }}
                    >
                      {initials(u.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-800 font-medium truncate">
                        {u.name} {isSelf && <span className="text-xs text-slate-400 italic">(you)</span>}
                      </p>
                      <p className="text-sm text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                      u.isActive === false
                        ? "bg-slate-100 text-slate-500"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {u.isActive === false ? "Inactive" : "Active"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}