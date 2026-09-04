import { NavLink } from "react-router-dom";
import { Package } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type NavItem = { to: string; label: string; end?: boolean; module: string };

const allNavItems: NavItem[] = [
  { to: "/", label: "Dashboard", end: true, module: "dashboard" },
  { to: "/products", label: "Products", module: "products" },
  { to: "/categories", label: "Categories", module: "categories" },
  { to: "/suppliers", label: "Suppliers", module: "suppliers" },
  { to: "/stock-movements", label: "Stock Movements", module: "stockMovements" },
  { to: "/buyers", label: "Buyers", module: "buyers" },
  { to: "/orders", label: "Orders", module: "orders" },
  { to: "/roles-permissions", label: "Roles & Permissions", module: "roles" },
  { to: "/users", label: "Users", module: "users" },
];

// Always visible regardless of permissions


export default function Sidebar() {
  const { user, logout } = useAuth();

  const permissions = user?.permissions || {};

  const visibleItems = allNavItems.filter(
    (item) => permissions[item.module]?.view === true
  );

  return (
    <div className="w-64 bg-[#0B1F3A] h-screen flex flex-col fixed left-0 top-0">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
            <Package size={18} className="text-[#0B1F3A]" strokeWidth={2.5} />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">InvenTrack</h1>
        </div>
        <NavLink
          to="/profile"
          className="block text-xs text-slate-400 mt-2 hover:text-slate-200 transition truncate"
        >
          {user?.email} · <span className="font-medium text-slate-300">{user?.role}</span>
        </NavLink>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg text-sm font-medium transition border-l-2 ${
                isActive
                  ? "bg-white/10 text-white border-amber-400"
                  : "text-slate-300 border-transparent hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `block px-3 py-2.5 rounded-lg text-sm font-medium transition border-l-2 ${
              isActive
                ? "bg-white/10 text-white border-amber-400"
                : "text-slate-300 border-transparent hover:bg-white/5 hover:text-white"
            }`
          }
        >
          My Profile
        </NavLink>
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}