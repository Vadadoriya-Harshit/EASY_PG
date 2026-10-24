"use client";
import { useState, useEffect } from "react";
import {
  User,
  Camera,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Key,
  Clock,
  Sparkles,
  Save,
  Laptop
} from "lucide-react";
import ImageFilePicker from "./ImageFilePicker";
import { cn } from "@/lib/utils";

interface AdminProfileData {
  name: string;
  email: string;
  role: string;
  avatar: string;
  phone: string;
  activeSessionId?: string;
  activeSessionIp?: string;
  activeSessionAt?: string;
  createdAt?: string;
}

export default function AdminProfileModal({
  isOpen,
  onClose,
  initialUser,
  onProfileUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialUser?: {
    email: string;
    name?: string;
    role?: string;
    avatar?: string;
    phone?: string;
  };
  onProfileUpdated?: (updated: { name: string; avatar: string; phone: string }) => void;
}) {
  const [profile, setProfile] = useState<AdminProfileData>({
    name: initialUser?.name || "Admin",
    email: initialUser?.email || "",
    role: initialUser?.role || "admin",
    avatar: initialUser?.avatar || "",
    phone: initialUser?.phone || "",
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  // Load latest profile from API
  useEffect(() => {
    if (isOpen) {
      setErr("");
      setSuccess("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);

      fetch("/api/admin/profile")
        .then((r) => r.json())
        .then((d) => {
          if (d.ok && d.profile) {
            setProfile(d.profile);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    if (showPasswordSection && newPassword) {
      if (newPassword.length < 6) {
        setErr("New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErr("New passwords do not match.");
        return;
      }
      if (!currentPassword) {
        setErr("Please enter your current password to authorize this change.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          avatar: profile.avatar,
          currentPassword: showPasswordSection ? currentPassword : undefined,
          newPassword: showPasswordSection ? newPassword : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setSuccess("Profile details and security settings updated successfully!");
      if (onProfileUpdated) {
        onProfileUpdated({
          name: profile.name,
          avatar: profile.avatar,
          phone: profile.phone,
        });
      }

      // Notify other components
      window.dispatchEvent(
        new CustomEvent("luxora_admin_profile_updated", {
          detail: { name: profile.name, avatar: profile.avatar },
        })
      );

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      setErr(e.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const isSuper = profile.role === "superadmin";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl border border-ink/15 bg-surface p-6 sm:p-7 shadow-2xl space-y-6 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-ink/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-ink">Operator Profile & Identity</h3>
              <p className="text-xs text-mute">Manage display name, profile photo, and security credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-ink/10 text-mute hover:text-ink transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="rounded-xl border border-ok/30 bg-ok/10 p-3 text-xs text-ok font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Error Alert */}
        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500 font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Avatar Upload Section */}
          <div className="rounded-2xl border border-ink/10 bg-bg p-4 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-brand/40 bg-surface shadow-md">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand to-accent text-white font-extrabold text-xl uppercase">
                  {profile.name.slice(0, 2)}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <span className="text-xs font-bold text-ink block">Profile Photo (Live Avatar)</span>
              <p className="text-[11px] text-mute">
                Visible in the admin header and operational activity logs.
              </p>
              <div className="pt-1">
                <ImageFilePicker
                  label="Upload New Photo"
                  value={profile.avatar}
                  onChange={(img) => setProfile((p) => ({ ...p, avatar: img }))}
                  aspectRatio="square"
                  maxDimension={400}
                />
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Operator Name *</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="input text-xs font-semibold"
                placeholder="e.g. Harshit Vadadoriya"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Contact Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                className="input text-xs"
                placeholder="+91 98250 12345"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Authorized Login Email</label>
              <input
                type="email"
                readOnly
                value={profile.email}
                className="input text-xs font-mono bg-ink/5 cursor-not-allowed opacity-80"
              />
              <span className="text-[10px] text-mute">Email cannot be changed directly</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Security Privilege Level</label>
              <div className="flex items-center h-10 px-3 rounded-xl border border-ink/10 bg-ink/5">
                {isSuper ? (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-purple-600 dark:text-purple-400">
                    <ShieldCheck size={14} /> Super Administrator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <ShieldCheck size={14} /> Property Coordinator
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Active Session Verification Card */}
          <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Laptop size={14} /> Active Device Session
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Single Session
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-mute pt-1">
              <div>
                <span>Operator IP:</span>{" "}
                <strong className="text-ink font-mono">{profile.activeSessionIp || "Active"}</strong>
              </div>
              <div>
                <span>Login Active Since:</span>{" "}
                <strong className="text-ink">
                  {profile.activeSessionAt ? new Date(profile.activeSessionAt).toLocaleTimeString() : "Just now"}
                </strong>
              </div>
            </div>
          </div>

          {/* Change Password Section Toggle */}
          <div className="border-t border-ink/10 pt-3">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-xs font-bold text-brand hover:underline flex items-center gap-1.5"
            >
              <Key size={13} />
              <span>{showPasswordSection ? "Cancel Password Change" : "Change Login Password"}</span>
            </button>

            {showPasswordSection && (
              <div className="mt-3 p-4 rounded-2xl border border-ink/10 bg-bg space-y-3 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-ink">Current Password *</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input text-xs"
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-ink">New Password *</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input text-xs"
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-ink">Confirm New Password *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input text-xs"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink/10">
            <button type="button" onClick={onClose} className="btn btn-ghost text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary text-xs gap-2 px-6 shadow-lg shadow-brand/25"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Updating...
                </span>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
