import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, Package, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  module: string;
};

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

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const permissions = user?.permissions || {};

  const visibleItems = allNavItems.filter(
    (item) => permissions[item.module]?.view === true
  );

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      
       {!isOpen && (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-[#0B1F3A] p-2 text-white shadow-lg lg:hidden"
       aria-label="Open menu"
        >
      <Menu size={24} />
     </button>
       )}
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-[#0B1F3A] transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400">
                <Package
                  size={18}
                  className="text-[#0B1F3A]"
                  strokeWidth={2.5}
                />
              </div>

              <h1 className="text-lg font-bold tracking-tight text-white">
                InvenTrack
              </h1>
            </div>

            {/* Close button - mobile only */}
            <button
              onClick={closeSidebar}
              className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          <NavLink
            to="/profile"
            onClick={closeSidebar}
            className="mt-2 block truncate text-xs text-slate-400 transition hover:text-slate-200"
          >
            {user?.email} ·{" "}
            <span className="font-medium text-slate-300">
              {user?.role}
            </span>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `block rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "border-amber-400 bg-white/10 text-white"
                    : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <NavLink
            to="/profile"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `block rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border-amber-400 bg-white/10 text-white"
                  : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            My Profile
          </NavLink>
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 px-3 py-4">
          <button
            onClick={logout}
            className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}