import {
  useEffect,
  useState,
} from "react";

import {
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

const MODULES = [
  "dashboard",
  "products",
  "categories",
  "suppliers",
  "stockMovements",
  "buyers",
  "orders",
  "users",
  "roles",
] as const;

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  suppliers: "Suppliers",
  stockMovements: "Stock Movements",
  buyers: "Buyers",
  orders: "Orders",
  users: "Users",
  roles: "Roles & Permissions",
};

const VIEW_ONLY_MODULES = new Set([
  "dashboard",
]);

const ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
] as const;

type Action = (typeof ACTIONS)[number];

type ModulePermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

type PermissionsMap = Record<
  string,
  ModulePermissions
>;

interface Permission {
  id: string;
  module: string;
  action: Action;
  name?: string;
  isActive?: boolean;
}

interface User {
  uid: string;
  name: string;
  email: string;
}

interface Role {
  id: string;
  name: string;
  permissionIds?: string[];
  users?: string[];
  isSystem?: boolean;
  isActive?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function emptyPermissions(): PermissionsMap {
  const map: PermissionsMap = {};

  MODULES.forEach((module) => {
    map[module] = {
      view: false,
      create: false,
      edit: false,
      delete: false,
    };
  });

  return map;
}

/**
 * Convert permission IDs from the API into
 * the checkbox map used by this page.
 */
function permissionIdsToMap(
  permissionIds: string[],
  permissionsList: Permission[]
): PermissionsMap {
  const map = emptyPermissions();

  const selectedIds = new Set(
    permissionIds
  );

  for (const permission of permissionsList) {
    if (
      !selectedIds.has(permission.id)
    ) {
      continue;
    }

    if (
      !map[permission.module]
    ) {
      continue;
    }

    if (
      !ACTIONS.includes(
        permission.action
      )
    ) {
      continue;
    }

    map[permission.module][
      permission.action
    ] = true;
  }

  return map;
}

/**
 * Convert the current checkbox map into
 * permission IDs that are sent to backend.
 */
function permissionsMapToIds(
  permissions: PermissionsMap,
  permissionsList: Permission[]
): string[] {
  const ids: string[] = [];

  for (const permission of permissionsList) {
    const modulePermissions =
      permissions[
        permission.module
      ];

    if (!modulePermissions) {
      continue;
    }

    if (
      modulePermissions[
        permission.action
      ] === true
    ) {
      ids.push(permission.id);
    }
  }

  return [
    ...new Set(ids),
  ];
}

function getGrantedActions(
  perms?: ModulePermissions
): Action[] {
  if (!perms) {
    return [];
  }

  return ACTIONS.filter(
    (action) => perms[action] === true
  );
}

function getGrantedModules(
  perms: PermissionsMap
): string[] {
  return MODULES.filter((module) => {
    const modulePerms =
      perms[module];

    if (!modulePerms) {
      return false;
    }

    return (
      modulePerms.view ||
      modulePerms.create ||
      modulePerms.edit ||
      modulePerms.delete
    );
  });
}

function getPermissionCount(
  perms: PermissionsMap
): number {
  return getGrantedModules(
    perms
  ).reduce(
    (total, module) =>
      total +
      getGrantedActions(
        perms[module]
      ).length,
    0
  );
}

function getTimestampSeconds(
  value: unknown
): number | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Math.floor(
      value.getTime() / 1000
    );
  }

  if (
    typeof value === "object"
  ) {
    const obj =
      value as Record<
        string,
        unknown
      >;

    if (
      typeof obj._seconds ===
      "number"
    ) {
      return obj._seconds;
    }

    if (
      typeof obj.seconds ===
      "number"
    ) {
      return obj.seconds;
    }
  }

  if (
    typeof value === "string"
  ) {
    const timestamp =
      new Date(value).getTime();

    if (
      !Number.isNaN(timestamp)
    ) {
      return Math.floor(
        timestamp / 1000
      );
    }
  }

  return null;
}

function formatDate(
  value: unknown
): string {
  const seconds =
    getTimestampSeconds(value);

  if (seconds === null) {
    return "—";
  }

  return new Date(
    seconds * 1000
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

export default function RolesPermissions() {
  const { token } = useAuth();

  const [roles, setRoles] =
    useState<Role[]>([]);

  const [users, setUsers] =
    useState<User[]>([]);

  const [
    permissionList,
    setPermissionList,
  ] = useState<Permission[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [roleName, setRoleName] =
    useState("");

  const [
    selectedUsers,
    setSelectedUsers,
  ] = useState<string[]>([]);

  const [
    permissions,
    setPermissions,
  ] = useState<PermissionsMap>(
    emptyPermissions()
  );

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<Role | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  function resetForm() {
    setRoleName("");
    setSelectedUsers([]);
    setPermissions(
      emptyPermissions()
    );
    setFormError("");
    setEditingId(null);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    resetForm();
  }

  async function fetchRoles() {
    setLoading(true);
    setError("");

    try {
      const res =
        await apiRequest(
          "/roles",
          {
            method: "GET",
          },
          token
        );

      setRoles(
        res.data || []
      );
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to load roles"
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const res =
        await apiRequest(
          "/users",
          {
            method: "GET",
          },
          token
        );

      setUsers(
        res.data?.items ||
          res.data ||
          []
      );
    } catch (err) {
      console.error(
        "Failed to load users",
        err
      );
    }
  }

  async function fetchPermissions() {
    try {
      const res =
        await apiRequest(
          "/permissions",
          {
            method: "GET",
          },
          token
        );

      setPermissionList(
        res.data || []
      );
    } catch (err: any) {
      console.error(
        "Failed to load permissions",
        err
      );

      setError(
        err.message ||
          "Failed to load permissions"
      );
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchRoles();
    fetchUsers();
    fetchPermissions();
  }, [token]);

  function openCreateModal() {
    resetForm();
    setShowModal(true);
  }

  /**
   * Open edit modal.
   *
   * IMPORTANT:
   * We always build the checkbox state
   * from role.permissionIds returned by
   * GET /roles.
   */
  function openEditModal(
    role: Role
  ) {
    const rolePermissions =
      permissionIdsToMap(
        role.permissionIds || [],
        permissionList
      );

    setEditingId(role.id);
    setRoleName(role.name);
    setSelectedUsers(
      role.users || []
    );
    setPermissions(
      rolePermissions
    );
    setFormError("");
    setShowModal(true);
  }

  function toggleUser(
    uid: string
  ) {
    setSelectedUsers(
      (previous) =>
        previous.includes(uid)
          ? previous.filter(
              (id) => id !== uid
            )
          : [
              ...previous,
              uid,
            ]
    );
  }

  function togglePermission(
    module: string,
    action: Action
  ) {
    setPermissions(
      (previous) => ({
        ...previous,

        [module]: {
          ...previous[module],

          [action]:
            !previous[module][
              action
            ],
        },
      })
    );
  }

  function hasAnyPermission(
    map: PermissionsMap
  ): boolean {
    return Object.values(
      map
    ).some(
      (permission) =>
        permission.view ||
        permission.create ||
        permission.edit ||
        permission.delete
    );
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setFormError("");

    if (!roleName.trim()) {
      setFormError(
        "Role name is required."
      );
      return;
    }

    if (
      !hasAnyPermission(
        permissions
      )
    ) {
      setFormError(
        "Select at least one permission."
      );
      return;
    }

    /**
     * THIS IS THE IMPORTANT PART.
     *
     * Read the CURRENT checkbox state
     * and convert it into IDs.
     */
    const permissionIds =
      permissionsMapToIds(
        permissions,
        permissionList
      );

    console.log(
      "Saving role:",
      editingId
    );

    console.log(
      "Selected permissions:",
      permissionIds
    );

    console.log(
      "Selected users:",
      selectedUsers
    );

    const body = {
      name: roleName.trim(),
      users: selectedUsers,
      permissionIds,
    };

    console.log(
      "Request body:",
      body
    );

    setSaving(true);

    try {
      if (editingId) {
        await apiRequest(
          `/roles/${editingId}`,
          {
            method: "PATCH",
            body: JSON.stringify(
              body
            ),
          },
          token
        );
      } else {
        await apiRequest(
          "/roles",
          {
            method: "POST",
            body: JSON.stringify(
              body
            ),
          },
          token
        );
      }

      /**
       * Reload roles from Firestore
       * after saving.
       */
      await fetchRoles();

      setShowModal(false);
      resetForm();
    } catch (err: any) {
      console.error(
        "Failed to save role:",
        err
      );

      setFormError(
        err.message ||
          "Failed to save role."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await apiRequest(
        `/roles/${deleteTarget.id}`,
        {
          method: "DELETE",
        },
        token
      );

      setDeleteTarget(null);

      await fetchRoles();
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to delete role."
      );

      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function userName(
    uid: string
  ): string {
    return (
      users.find(
        (user) =>
          user.uid === uid
      )?.name || uid
    );
  }

  return (
    <>
      {/* PAGE HEADER */}

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Roles &amp; Permissions
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Manage user roles and access levels
          </p>
        </div>

        <button
          type="button"
          onClick={
            openCreateModal
          }
          className="bg-[#0B1F3A] hover:bg-[#132a4d] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Create Role
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-center justify-between text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ROLES TABLE */}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-slate-500 text-sm p-6">
            Loading roles...
          </p>
        ) : roles.length ===
          0 ? (
          <p className="text-slate-500 text-sm p-6">
            No roles created yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                    Assigned Users
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                    Modules
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                    Permissions
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                    Created
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {roles.map(
                  (role) => {
                    const rolePermissions =
                      permissionIdsToMap(
                        role.permissionIds ||
                          [],
                        permissionList
                      );

                    const grantedModules =
                      getGrantedModules(
                        rolePermissions
                      );

                    const permissionCount =
                      getPermissionCount(
                        rolePermissions
                      );

                    return (
                      <tr
                        key={
                          role.id
                        }
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-[#0B1F3A]/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-[#0B1F3A]">
                                {role.name
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </span>
                            </div>

                            <div>
                              <p className="font-medium text-slate-800">
                                {
                                  role.name
                                }
                              </p>

                              {role.isSystem && (
                                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                  System Role
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {role.users
                            ?.length ? (
                            <div>
                              <p className="font-medium text-slate-700">
                                {
                                  role
                                    .users
                                    .length
                                }{" "}
                                {role
                                  .users
                                  .length ===
                                1
                                  ? "user"
                                  : "users"}
                              </p>

                              <p className="text-xs text-slate-400 mt-1 max-w-[180px] truncate">
                                {role.users
                                  .map(
                                    (
                                      uid
                                    ) =>
                                      userName(
                                        uid
                                      )
                                  )
                                  .join(
                                    ", "
                                  )}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              No users
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {grantedModules.length ? (
                            <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                              {grantedModules
                                .slice(
                                  0,
                                  3
                                )
                                .map(
                                  (
                                    module
                                  ) => (
                                    <span
                                      key={
                                        module
                                      }
                                      className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600"
                                    >
                                      {
                                        MODULE_LABELS[
                                          module
                                        ]
                                      }
                                    </span>
                                  )
                                )}

                              {grantedModules.length >
                                3 && (
                                <span className="text-xs px-2 py-1 rounded-md bg-[#0B1F3A]/10 text-[#0B1F3A]">
                                  +
                                  {grantedModules.length -
                                    3}{" "}
                                  more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              No modules
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {permissionCount >
                          0 ? (
                            <div>
                              <p className="font-medium text-slate-700">
                                {
                                  permissionCount
                                }{" "}
                                {permissionCount ===
                                1
                                  ? "permission"
                                  : "permissions"}
                              </p>

                              <p className="text-xs text-slate-400 mt-1">
                                Across{" "}
                                {
                                  grantedModules.length
                                }{" "}
                                {grantedModules.length ===
                                1
                                  ? "module"
                                  : "modules"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              No permissions
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-slate-500">
                          {formatDate(
                            role.createdAt
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  role
                                )
                              }
                              className="p-2 rounded-lg text-slate-500 hover:text-[#0B1F3A] hover:bg-slate-100 transition"
                              title="Edit Role"
                            >
                              <Pencil
                                size={
                                  17
                                }
                              />
                            </button>

                            {!role.isSystem && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget(
                                    role
                                  )
                                }
                                className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                                title="Delete Role"
                              >
                                <Trash2
                                  size={
                                    17
                                  }
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingId
                    ? "Edit Role"
                    : "Create Role"}
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Define users and permissions
                  for this role
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="flex flex-col min-h-0"
            >
              <div className="overflow-y-auto px-6 py-5 space-y-6">
                {formError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {formError}
                  </div>
                )}

                {/* ROLE + USERS */}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      Role Name
                    </label>

                    <input
                      value={
                        roleName
                      }
                      onChange={(
                        e
                      ) =>
                        setRoleName(
                          e.target
                            .value
                        )
                      }
                      placeholder="e.g. Manager"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#0B1F3A] focus:ring-1 focus:ring-[#0B1F3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      Assign Users
                    </label>

                    <div className="border border-slate-200 rounded-lg max-h-44 overflow-y-auto divide-y divide-slate-100">
                      {users.length ===
                      0 ? (
                        <p className="text-sm text-slate-400 px-3 py-3">
                          No users available.
                        </p>
                      ) : (
                        users.map(
                          (
                            user
                          ) => (
                            <label
                              key={
                                user.uid
                              }
                              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(
                                  user.uid
                                )}
                                onChange={() =>
                                  toggleUser(
                                    user.uid
                                  )
                                }
                                className="h-4 w-4"
                              />

                              <div>
                                <p className="text-sm text-slate-700">
                                  {
                                    user.name
                                  }
                                </p>

                                <p className="text-xs text-slate-400">
                                  {
                                    user.email
                                  }
                                </p>
                              </div>
                            </label>
                          )
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* PERMISSIONS */}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-slate-500">
                      Select Permissions
                    </label>

                    <span className="text-xs text-slate-400">
                      {getPermissionCount(
                        permissions
                      )}{" "}
                      selected
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                              Module
                            </th>

                            {ACTIONS.map(
                              (
                                action
                              ) => (
                                <th
                                  key={
                                    action
                                  }
                                  className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase"
                                >
                                  {
                                    action
                                  }
                                </th>
                              )
                            )}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {MODULES.map(
                            (
                              module
                            ) => {
                              const viewOnly =
                                VIEW_ONLY_MODULES.has(
                                  module
                                );

                              return (
                                <tr
                                  key={
                                    module
                                  }
                                  className="hover:bg-slate-50"
                                >
                                  <td className="px-4 py-3 font-medium text-slate-700">
                                    {
                                      MODULE_LABELS[
                                        module
                                      ]
                                    }
                                  </td>

                                  {ACTIONS.map(
                                    (
                                      action
                                    ) => {
                                      if (
                                        viewOnly &&
                                        action !==
                                          "view"
                                      ) {
                                        return (
                                          <td
                                            key={
                                              action
                                            }
                                            className="px-4 py-3 text-center text-slate-300"
                                          >
                                            —
                                          </td>
                                        );
                                      }

                                      return (
                                        <td
                                          key={
                                            action
                                          }
                                          className="px-4 py-3 text-center"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={
                                              permissions[
                                                module
                                              ]?.[
                                                action
                                              ] ===
                                              true
                                            }
                                            onChange={() =>
                                              togglePermission(
                                                module,
                                                action
                                              )
                                            }
                                            className="h-4 w-4"
                                          />
                                        </td>
                                      );
                                    }
                                  )}
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132a4d] text-white text-sm font-medium disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Delete Role
            </h3>

            <p className="text-sm text-slate-500 mb-6">
              Are you sure you
              want to delete the
              role "
              <span className="font-medium text-slate-700">
                {
                  deleteTarget.name
                }
              </span>
              "? This action
              cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(
                    null
                  )
                }
                disabled={
                  deleting
                }
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleDelete
                }
                disabled={
                  deleting
                }
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}  