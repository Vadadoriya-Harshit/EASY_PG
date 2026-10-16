"use client";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

interface AdminShellProps {
  user: {
    email: string;
    name?: string;
    role?: string;
    avatar?: string;
    phone?: string;
    sid?: string;
  };
  children: React.ReactNode;
}

export default function AdminShell({ user, children }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar (Desktop fixed left w-72, Mobile drawer) */}
      <AdminSidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area (Offset by sidebar w-72 on large screens) */}
      <div className="flex flex-col min-h-screen lg:pl-72 transition-all duration-300">
        {/* Top Header */}
        <AdminHeader
          user={user}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 px-4 py-8 sm:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
