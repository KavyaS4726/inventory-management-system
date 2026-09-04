import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

interface Profile {
  uid: string;
  name: string;
  email: string;
  role: string;
  createdAt?: { _seconds: number; _nanoseconds: number } | string;
}

export default function Profile() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res = await apiRequest("/auth/me", { method: "GET" }, token);
      const data = res.data || res;
      setProfile(data);
      setName(data.name || "");
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await apiRequest(
        "/auth/me",
        { method: "PATCH", body: JSON.stringify({ name }) },
        token
      );
      setSuccess("Profile updated successfully");
      fetchProfile();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters");
      return;
    }
    if (newPassword === currentPassword) {
      setPwError("New password must be different from current password");
      return;
    }

    setPwSaving(true);
    try {
      await apiRequest(
        "/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        },
        token
      );
      setPwSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwError(err.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  }

  const initials = (profile?.name || "")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const createdAtDisplay = (() => {
    const c = profile?.createdAt;
    if (!c) return null;
    const date =
      typeof c === "string"
        ? new Date(c)
        : new Date(c._seconds * 1000);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  })();

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {loading ? (
            <p className="text-slate-500 text-sm">Loading profile...</p>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center text-lg font-semibold">
                  {initials || "?"}
                </div>
                <div>
                  <p className="text-slate-800 font-medium">{profile?.name}</p>
                  {createdAtDisplay && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Member since {createdAtDisplay}
                    </p>
                  )}
                </div>
              </div>

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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Name
                  </label>
                  <input
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Email
                  </label>
                  <input
                    disabled
                    value={profile?.email || ""}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Role
                  </label>
                  <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-[#0B1F3A]/10 text-[#0B1F3A]">
                    {profile?.role?.toUpperCase()}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0B1F3A] hover:bg-[#132a4d] text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Change Password
          </h2>

          {pwError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
              {pwSuccess}
            </p>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={pwSaving}
              className="bg-[#0B1F3A] hover:bg-[#132a4d] text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {pwSaving ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
