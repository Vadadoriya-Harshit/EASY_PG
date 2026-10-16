"use client";
import { useState, useEffect } from "react";
import ImageFilePicker from "@/components/admin/ImageFilePicker";
import {
  User,
  Shield,
  KeyRound,
  Phone,
  Mail,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Server,
  Activity
} from "lucide-react";

interface ProfileData {
  email: string;
  name: string;
  role: string;
  avatar: string;
  phone: string;
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    email: "",
    name: "",
    role: "admin",
    avatar: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/profile");
      const data = await res.json();
      if (res.ok && data.user) {
        setProfile({
          email: data.user.email || "",
          name: data.user.name || "",
          role: data.user.role || "admin",
          avatar: data.user.avatar || "",
          phone: data.user.phone || "",
        });
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    setProfileErr("");

    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          avatar: profile.avatar,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setProfileMsg("Profile updated successfully in MongoDB Atlas!");
        // Broadcast change to header & sidebar
        window.dispatchEvent(
          new CustomEvent("luxora_admin_profile_updated", {
            detail: {
              name: profile.name,
              avatar: profile.avatar,
              phone: profile.phone,
            },
          })
        );
      } else {
        setProfileErr(data.error || "Failed to update profile.");
      }
    } catch {
      setProfileErr("Network error while updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPwErr("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setPwErr("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErr("New passwords do not match.");
      return;
    }

    setSavingPw(true);
    setPwMsg("");
    setPwErr("");

    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setPwMsg("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwErr(data.error || "Failed to change password.");
      }
    } catch {
      setPwErr("Network error while changing password.");
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="h-10 w-10 mx-auto rounded-full border-2 border-brand border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-mute font-semibold">Loading Administrator Profile...</p>
      </div>
    );
  }

  const isSuper = profile.role === "superadmin";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-ink/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              Operator Profile & Security
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 border border-brand/20 px-3 py-1 text-xs font-bold text-brand">
              <Shield size={12} />
              <span>{isSuper ? "Super Administrator" : "Coordinator"}</span>
            </span>
          </div>
          <p className="mt-1 text-xs text-mute">
            Manage your personal profile photo, name, emergency contact, and secure sign-in credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Atlas Live Sync</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Account Summary Card */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-sm backdrop-blur-xl text-center">
            {/* Avatar Display */}
            <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-3xl border-2 border-brand/40 bg-surface shadow-md mb-4 group">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name || "Admin"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand to-accent text-white font-extrabold text-3xl uppercase">
                  {(profile.name || "AD").slice(0, 2)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 pointer-events-none">
                <Camera size={16} />
                <span>Change Below</span>
              </div>
            </div>

            <h2 className="text-lg font-bold text-ink">{profile.name || "Administrator"}</h2>
            <p className="text-xs font-mono text-mute">{profile.email}</p>

            <div className="mt-4 pt-4 border-t border-ink/10 grid grid-cols-2 gap-2 text-left text-xs">
              <div className="rounded-xl bg-ink/5 p-2.5">
                <span className="block text-[10px] text-mute uppercase font-bold">Role</span>
                <span className="font-bold text-ink">{isSuper ? "Super Admin" : "Coordinator"}</span>
              </div>
              <div className="rounded-xl bg-ink/5 p-2.5">
                <span className="block text-[10px] text-mute uppercase font-bold">Status</span>
                <span className="font-bold text-emerald-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                </span>
              </div>
            </div>
          </div>

          {/* Photo Upload Card */}
          <div className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3 flex items-center gap-2">
              <Camera size={14} className="text-brand" /> Upload New Photo
            </h3>
            <ImageFilePicker
              label="Select Profile Photo"
              value={profile.avatar}
              onChange={(newUrl) => setProfile({ ...profile, avatar: newUrl })}
            />
            {profile.avatar && (
              <button
                type="button"
                onClick={() => setProfile({ ...profile, avatar: "" })}
                className="mt-3 text-xs font-semibold text-warn hover:underline"
              >
                Remove Current Photo
              </button>
            )}
          </div>

          {/* Security & System Info */}
          <div className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-sm backdrop-blur-xl text-xs space-y-3">
            <h3 className="font-bold text-ink flex items-center gap-2">
              <Server size={14} className="text-brand" /> Security Specifications
            </h3>
            <div className="space-y-1.5 text-mute">
              <div className="flex justify-between">
                <span>Cookies:</span>
                <strong className="text-ink font-mono">Strict HTTP-Only</strong>
              </div>
              <div className="flex justify-between">
                <span>Encryption:</span>
                <strong className="text-ink font-mono">SHA-256 + Salt</strong>
              </div>
              <div className="flex justify-between">
                <span>Concurrency:</span>
                <strong className="text-emerald-500">Single Active Session</strong>
              </div>
              <div className="flex justify-between">
                <span>Database:</span>
                <strong className="text-ink">MongoDB Atlas Cloud</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Personal Details & Password Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Personal Details */}
          <div className="rounded-3xl border border-ink/10 bg-surface/80 p-6 sm:p-8 shadow-sm backdrop-blur-xl">
            <h2 className="text-lg font-bold text-ink mb-1 flex items-center gap-2">
              <User size={18} className="text-brand" /> Personal Information
            </h2>
            <p className="text-xs text-mute mb-6">
              Update your display name and contact phone number visible to the admin team.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  Display Full Name
                </label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3.5 text-mute pointer-events-none" />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Harshit (Super Admin)"
                    required
                    className="input pl-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  Registered Email Address (Read Only)
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-mute pointer-events-none" />
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="input pl-10 text-sm opacity-60 cursor-not-allowed bg-ink/5"
                  />
                </div>
                <span className="text-[11px] text-mute mt-1 block">
                  Email is locked for single-operator security. Contact database administrator to transfer email.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  Contact Phone Number
                </label>
                <div className="relative flex items-center">
                  <Phone size={16} className="absolute left-3.5 text-mute pointer-events-none" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 98250 87654"
                    className="input pl-10 text-sm"
                  />
                </div>
              </div>

              {profileMsg && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{profileMsg}</span>
                </div>
              )}

              {profileErr && (
                <div className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{profileErr}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="btn btn-primary gap-2 text-xs py-2.5 px-6 shadow-md"
              >
                <Save size={15} />
                {savingProfile ? "Saving to Database…" : "Save Profile Changes"}
              </button>
            </form>
          </div>

          {/* Section 2: Change Password */}
          <div className="rounded-3xl border border-ink/10 bg-surface/80 p-6 sm:p-8 shadow-sm backdrop-blur-xl">
            <h2 className="text-lg font-bold text-ink mb-1 flex items-center gap-2">
              <KeyRound size={18} className="text-brand" /> Change Password
            </h2>
            <p className="text-xs text-mute mb-6">
              Ensure your account is using a long, random password to stay secure against brute-force attempts.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  Current Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-mute pointer-events-none" />
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="input pl-10 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3.5 text-mute hover:text-ink"
                  >
                    {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="absolute left-3.5 text-mute pointer-events-none" />
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      className="input pl-10 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3.5 text-mute hover:text-ink"
                    >
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="absolute left-3.5 text-mute pointer-events-none" />
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      minLength={6}
                      className="input pl-10 text-sm"
                    />
                  </div>
                </div>
              </div>

              {pwMsg && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{pwMsg}</span>
                </div>
              )}

              {pwErr && (
                <div className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{pwErr}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingPw}
                className="btn btn-primary gap-2 text-xs py-2.5 px-6 shadow-md"
              >
                <KeyRound size={15} />
                {savingPw ? "Updating Password…" : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
