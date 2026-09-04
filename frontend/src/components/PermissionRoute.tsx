import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

interface PermissionRouteProps {
  module: string;
  children: ReactNode;
}

export default function PermissionRoute({ module, children }: PermissionRouteProps) {
  const { user } = useAuth();
  const canView = user?.permissions?.[module]?.view === true;

  if (!canView) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}