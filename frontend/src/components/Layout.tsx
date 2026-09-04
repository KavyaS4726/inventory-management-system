import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <div className="ml-64 p-8 max-w-6xl space-y-8">{children}</div>
    </div>
  );
}