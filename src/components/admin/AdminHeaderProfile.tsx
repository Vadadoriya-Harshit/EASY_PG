"use client";
import { useState, useEffect } from "react";
import { User, ShieldCheck } from "lucide-react";
import AdminProfileModal from "./AdminProfileModal";

interface AdminHeaderProfileProps {
  user: {
    email: string;
    name?: string;
    role?: string;
    avatar?: string;
    phone?: string;
  };
}

export default function AdminHeaderProfile({ user }: AdminHeaderProfileProps) {
  const [currentUser, setCurrentUser] = useState(user);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    const onUpdated = (e: any) => {
      if (e.detail) {
        setCurrentUser((prev) => ({
          ...prev,
          name: e.detail.name || prev.name,
          avatar: e.detail.avatar !== undefined ? e.detail.avatar : prev.avatar,
        }));
      }
    };

    window.addEventListener("luxora_admin_profile_updated", onUpdated);
    return () => window.removeEventListener("luxora_admin_profile_updated", onUpdated);
  }, []);

  const isSuper = currentUser.role === "superadmin";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-surface/80 p-1.5 pr-3 hover:border-brand/40 hover:bg-brand/5 transition shadow-sm group"
        title="View & Edit Administrator Profile"
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
          <span className="block text-xs font-bold text-ink group-hover:text-brand transition truncate max-w-[120px]">
            {currentUser.name || "Admin"}
          </span>
          <span className="block text-[10px] text-mute font-semibold">
            {isSuper ? "Super Admin" : "Coordinator"}
          </span>
        </div>
      </button>

      {/* Profile Dialog */}
      <AdminProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser((prev) => ({
            ...prev,
            name: updated.name,
            avatar: updated.avatar,
            phone: updated.phone,
          }));
        }}
      />
    </>
  );
}
