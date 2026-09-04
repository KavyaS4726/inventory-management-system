
import { useState, type FormEvent } from "react";
import { Package } from "lucide-react";
import { signInWithPopup } from "firebase/auth";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { auth, googleProvider } from "../firebase";

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const { idToken, refreshToken } = res.data;

      const profileRes = await apiRequest(
        "/auth/me",
        {
          method: "GET",
        },
        idToken
      );

      window.history.replaceState(null, "", "/");

      login(
        idToken,
        refreshToken,
        profileRes.data
      );
    } catch (err: any) {
      setError(
        err.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      // Open Google sign-in popup
      const result = await signInWithPopup(
        auth,
        googleProvider
      );

      // Get Firebase ID token
      const idToken = await result.user.getIdToken();

      // Send the Firebase token to our backend
      const response = await apiRequest(
        "/auth/google",
        {
          method: "POST",
          body: JSON.stringify({
            idToken,
          }),
        }
      );

      const profile = response.data;

      /**
       * Google authentication currently gives us
       * the Firebase ID token, but not the refreshToken
       * expected by AuthContext.
       *
       * We will update AuthContext next so Google login
       * can use Firebase's own token refresh mechanism.
       */
      login(
        idToken,
        "",
        profile
      );

      window.history.replaceState(null, "", "/");
    } catch (err: any) {
      console.error("Google login failed:", err);

      setError(
        err?.message ||
          "Google sign-in failed. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const isLoading = loading || googleLoading;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundColor: "#0B1F3A",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <Package
              size={26}
              className="text-[#0B1F3A]"
              strokeWidth={2.5}
            />

            <h1 className="text-2xl font-bold text-slate-800">
              InvenTrack
            </h1>
          </div>

          <p className="text-sm text-slate-500 mt-1">
            Sign in to your account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/30 focus:border-[#0B1F3A]"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/30 focus:border-[#0B1F3A]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0B1F3A] hover:bg-[#132a4d] disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />

          <span className="text-xs text-slate-400">
            OR
          </span>

          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
        >
          {googleLoading ? (
            "Signing in with Google..."
          ) : (
            <>
              <span className="text-lg font-bold">
                G
              </span>

              <span>
                Continue with Google
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

