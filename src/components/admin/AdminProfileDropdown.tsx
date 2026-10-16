"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  LogOut,
  ChevronDown,
  ExternalLink,
  Users,
  Settings,
  Sparkles,
  CheckCircle2
} from "lucide-react";

interface AdminProfileDropdownProps {
  user: {
    email: string;
    name?: string;
    role?: string;
    avatar?: string;
    phone?: string;
    sid?: string;
  };
}

export default function AdminProfileDropdown({ user }: AdminProfileDropdownProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(user);
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Listen to profile updates broadcasted across components
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setCurrentUser((prev) => ({
          ...prev,
          name: e.detail.name || prev.name,
          avatar: e.detail.avatar !== undefined ? e.detail.avatar : prev.avatar,
        }));
      }
    };
    window.addEventListener("luxora_admin_profile_updated", handleUpdate);
    return () => window.removeEventListener("luxora_admin_profile_updated", handleUpdate);
  }, []);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("luxora_admin_tab_active");
        sessionStorage.removeItem("sorath_otp_email");
      }
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.replace("/admin/login");
    router.refresh();
  };

  const isSuper = currentUser.role === "superadmin";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-surface/80 p-1.5 pr-2.5 hover:border-brand/40 hover:bg-ink/5 transition shadow-sm group focus:outline-none focus:ring-2 focus:ring-brand/30"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Account Options"
      >
        {/* Avatar with Status Ring */}
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl border border-brand/30 bg-surface shadow-xs">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name || "Admin"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand to-accent text-white font-extrabold text-xs uppercase">
              {(currentUser.name || "AD").slice(0, 2)}
            </div>
          )}
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-surface" />
        </div>

        {/* Name & Role Text */}
        <div className="text-left hidden sm:block">
          <span className="block text-xs font-bold text-ink group-hover:text-brand transition truncate max-w-[110px]">
            {currentUser.name || "Admin"}
          </span>
          <span className="block text-[10px] text-mute font-semibold">
            {isSuper ? "Super Admin" : "Coordinator"}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`text-mute group-hover:text-ink transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-ink/15 bg-surface/95 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Info Header Card */}
          <div className="rounded-xl bg-ink/5 p-3 mb-1.5">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-brand/30 bg-surface shadow-xs">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name || "Admin"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand to-accent text-white font-extrabold text-sm uppercase">
                    {(currentUser.name || "AD").slice(0, 2)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-ink truncate">
                  {currentUser.name || "Administrator"}
                </div>
                <div className="text-[11px] text-mute truncate font-mono">
                  {currentUser.email}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand/10 border border-brand/20 px-2 py-0.5 text-[10px] font-bold text-brand">
                  <Shield size={10} />
                  <span>{isSuper ? "Super Admin" : "Coordinator"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-0.5 text-xs font-semibold">
            <Link
              href="/admin/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-ink hover:bg-brand/10 hover:text-brand transition"
            >
              <User size={15} className="text-brand" />
              <div className="flex-1">
                <span>My Profile & Photo</span>
                <span className="block text-[10px] text-mute font-normal">Change photo, phone & password</span>
              </div>
            </Link>

            <Link
              href="/admin/users"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-ink hover:bg-brand/10 hover:text-brand transition"
            >
              <Users size={15} className="text-brand" />
              <div className="flex-1">
                <span>Admin Team</span>
                <span className="block text-[10px] text-mute font-normal">Manage management users</span>
              </div>
            </Link>

            <Link
              href="/"
              target="_blank"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-mute hover:bg-ink/5 hover:text-ink transition"
            >
              <ExternalLink size={15} />
              <span>Preview Live Website</span>
            </Link>
          </div>

          <div className="my-1.5 border-t border-ink/10" />

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-warn hover:bg-warn/10 transition"
          >
            <LogOut size={15} />
            <span>{loggingOut ? "Signing Out…" : "Sign Out of Portal"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
