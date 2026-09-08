import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />

      <main className="ml-0 p-4 pt-20 space-y-6 sm:p-6 sm:pt-20 lg:ml-64 lg:p-8 lg:pt-8">
        <div className="mx-auto w-full max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}