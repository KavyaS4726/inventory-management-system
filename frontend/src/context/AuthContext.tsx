
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import { signOut } from "firebase/auth";

import { apiRequest } from "../api/client";
import { auth } from "../firebase";

interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type PermissionAction = keyof ModulePermissions;

export interface User {
  uid: string;
  email: string;
  name?: string;
  role?: string | null;
  roleId?: string | null;
  isActive?: boolean;
  permissions?: Record<string, ModulePermissions>;
}

interface AuthContextType {
  token: string | null;
  user: User | null;

  login: (
    token: string,
    refreshToken: string,
    user: User
  ) => void;

  refreshUser: () => Promise<void>;

  hasPermission: (
    module: string,
    action: PermissionAction
  ) => boolean;

  logout: () => void;
}

const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

const FIREBASE_API_KEY =
  import.meta.env.VITE_FIREBASE_API_KEY;

function getStoredAuth() {
  try {
    const token = sessionStorage.getItem("token");
    const refreshToken =
      sessionStorage.getItem("refreshToken");

    const userStr = sessionStorage.getItem("user");

    const user = userStr
      ? JSON.parse(userStr)
      : null;

    if (token && user) {
      return {
        token,
        refreshToken,
        user,
      };
    }
  } catch {
    // Ignore invalid stored auth data.
  }

  return {
    token: null,
    refreshToken: null,
    user: null,
  };
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const initial = getStoredAuth();

  const [token, setToken] = useState<string | null>(
    initial.token
  );

  const [refreshToken, setRefreshToken] =
    useState<string | null>(
      initial.refreshToken
    );

  const [user, setUser] =
    useState<User | null>(initial.user);

  const refreshTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Login for both:
   *
   * 1. Email/password
   * 2. Google
   *
   * For email/password, refreshToken contains
   * Firebase REST refresh token.
   *
   * For Google, refreshToken is an empty string.
   * Firebase client SDK handles token refresh.
   */
  const login = (
    newToken: string,
    newRefreshToken: string,
    newUser: User
  ) => {
    setToken(newToken);
    setRefreshToken(newRefreshToken);
    setUser(newUser);

    sessionStorage.setItem(
      "token",
      newToken
    );

    sessionStorage.setItem(
      "refreshToken",
      newRefreshToken
    );

    sessionStorage.setItem(
      "user",
      JSON.stringify(newUser)
    );
  };

  /**
   * Get the latest user profile and permissions
   * from the backend.
   *
   * GET /auth/me
   */
  const refreshUser = async () => {
    const currentToken =
      sessionStorage.getItem("token");

    if (!currentToken) {
      return;
    }

    try {
      const profileRes = await apiRequest(
        "/auth/me",
        {
          method: "GET",
        },
        currentToken
      );

      const updatedUser =
        profileRes.data as User;

      setUser(updatedUser);

      sessionStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );
    } catch (error) {
      console.error(
        "Failed to refresh user permissions:",
        error
      );
    }
  };

  /**
   * Check whether the current user has
   * a specific module permission.
   */
  const hasPermission = (
    module: string,
    action: PermissionAction
  ): boolean => {
    const permissions = user?.permissions;

    if (!permissions) {
      return false;
    }

    const modulePermissions =
      permissions[module];

    if (!modulePermissions) {
      return false;
    }

    return modulePermissions[action] === true;
  };

  /**
   * Logout.
   *
   * We clear our application session and also
   * sign out from Firebase client authentication.
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(
        "Firebase sign out failed:",
        error
      );
    }

    setToken(null);
    setRefreshToken(null);
    setUser(null);

    sessionStorage.removeItem("token");
    sessionStorage.removeItem(
      "refreshToken"
    );
    sessionStorage.removeItem("user");

    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  /**
   * Refresh token for email/password login.
   *
   * This uses Firebase's REST refresh-token API.
   */
  async function refreshAccessToken(
    currentRefreshToken: string
  ) {
    try {
      if (!FIREBASE_API_KEY) {
        throw new Error(
          "VITE_FIREBASE_API_KEY is not configured"
        );
      }

      const res = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body:
            `grant_type=refresh_token` +
            `&refresh_token=${encodeURIComponent(
              currentRefreshToken
            )}`,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        await logout();
        return;
      }

      setToken(data.id_token);
      setRefreshToken(data.refresh_token);

      sessionStorage.setItem(
        "token",
        data.id_token
      );

      sessionStorage.setItem(
        "refreshToken",
        data.refresh_token
      );

      scheduleRefresh(
        data.expires_in
      );

      await refreshUser();
    } catch (error) {
      console.error(
        "Failed to refresh access token:",
        error
      );

      await logout();
    }
  }

  /**
   * Refresh Google/Firebase token.
   *
   * Firebase SDK automatically knows how to
   * refresh the user's Google authentication.
   */
  async function refreshGoogleToken() {
    try {
      const firebaseUser =
        auth.currentUser;

      if (!firebaseUser) {
        return;
      }

      const newToken =
        await firebaseUser.getIdToken(true);

      setToken(newToken);

      sessionStorage.setItem(
        "token",
        newToken
      );

      await refreshUser();

      scheduleGoogleRefresh();
    } catch (error) {
      console.error(
        "Failed to refresh Google token:",
        error
      );

      await logout();
    }
  }

  /**
   * Schedule Google token refresh.
   *
   * Firebase ID tokens normally expire after
   * approximately one hour.
   */
  function scheduleGoogleRefresh() {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }

    refreshTimer.current = setTimeout(
      () => {
        refreshGoogleToken();
      },
      55 * 60 * 1000
    );
  }

  /**
   * Schedule email/password Firebase REST
   * refresh-token flow.
   */
  function scheduleRefresh(
    expiresInSeconds: string | number
  ) {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }

    /**
     * Refresh 5 minutes before expiration.
     */
    const ms =
      Math.max(
        Number(expiresInSeconds) - 300,
        30
      ) * 1000;

    refreshTimer.current =
      setTimeout(() => {
        const currentRefresh =
          sessionStorage.getItem(
            "refreshToken"
          );

        if (currentRefresh) {
          refreshAccessToken(
            currentRefresh
          );
        }
      }, ms);
  }

  /**
   * Authentication initialization.
   *
   * Email/password:
   *   refreshToken exists
   *   -> use REST refresh flow.
   *
   * Google:
   *   refreshToken is empty
   *   -> Firebase SDK handles refresh.
   */
  useEffect(() => {
    if (!token) {
      return;
    }

    if (refreshToken) {
      scheduleRefresh(3600);
    } else {
      scheduleGoogleRefresh();
    }

    refreshUser();

    return () => {
      if (refreshTimer.current) {
        clearTimeout(
          refreshTimer.current
        );

        refreshTimer.current = null;
      }
    };

    // Run when authentication token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        refreshUser,
        hasPermission,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}

