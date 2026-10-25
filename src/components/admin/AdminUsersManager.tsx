"use client";
import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  Key,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Mail,
  Shield,
  Search,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showAlert } from "@/components/FeedbackDialog";

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export default function AdminUsersManager({ currentUserEmail }: { currentUserEmail?: string }) {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const j = await res.json();
      if (j.ok && Array.isArray(j.data)) {
        setUsers(j.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        throw new Error(j.error || "Failed to create account");
      }

      setIsModalOpen(false);
      setSuccessToast(`Admin account for ${email} created successfully!`);
      setTimeout(() => setSuccessToast(""), 4500);

      setName("");
      setEmail("");
      setPassword("");
      setRole("admin");
      await fetchUsers();
    } catch (err: any) {
      setModalError(err.message || "Could not create user account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmEmail) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(deleteConfirmEmail)}`, {
        method: "DELETE",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to delete account");

      setSuccessToast(`Account ${deleteConfirmEmail} deleted.`);
      setTimeout(() => setSuccessToast(""), 4000);
      setDeleteConfirmEmail(null);
      await fetchUsers();
    } catch (err: any) {
      await showAlert({
        title: "Delete Failed",
        message: err.message || "Could not delete user account.",
        tone: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="flex items-center justify-between rounded-2xl bg-ok/15 border border-ok/30 p-4 text-ok text-xs font-semibold shadow-xl animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast("")} className="text-ok">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header & Master Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 border border-brand/20 px-3 py-1 text-xs font-bold text-brand">
              <ShieldCheck size={14} /> Security & Staff Accounts
            </span>
            <span className="text-xs text-mute font-medium">({users.length} Authorized)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-1">
            Management & Administrator Accounts
          </h1>
          <p className="text-xs text-mute mt-0.5">
            Configure role access, reset staff credentials, and view active database operators.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setName("");
            setEmail("");
            setPassword("");
            setRole("admin");
            setModalError("");
            setIsModalOpen(true);
          }}
          className="btn btn-primary text-xs gap-2 px-5 py-2.5 shadow-lg shadow-brand/25 active:scale-95 transition"
        >
          <UserPlus size={16} />
          <span>Add New Admin</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-4 border-ink/10 flex items-center gap-3">
        <Search size={15} className="text-mute shrink-0" />
        <input
          type="text"
          placeholder="Search administrators by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input text-xs w-full"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-xs text-mute hover:text-ink">
            Clear
          </button>
        )}
      </div>

      {/* Users Table & Mobile Cards */}
      <div className="card border-ink/10 overflow-hidden shadow-xl">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-ink/5 border-b border-ink/10 text-mute uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role Privileges</th>
                <th className="py-3 px-4">Access Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filteredUsers.map((u) => {
                const isCurrent = currentUserEmail && u.email.toLowerCase() === currentUserEmail.toLowerCase();
                const isSuper = u.role === "superadmin";

                return (
                  <tr key={u.id || u.email} className="hover:bg-ink/5 transition-colors group">
                    {/* Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand to-accent text-white font-bold text-xs uppercase shadow-sm">
                          {u.name.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-ink group-hover:text-brand transition-colors block">
                            {u.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              (Your Session)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 font-mono text-mute">{u.email}</td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-600 dark:text-purple-400">
                          <Shield size={12} /> Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          Admin Coordinator
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Operator
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={!!isCurrent}
                          onClick={() => setDeleteConfirmEmail(u.email)}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 bg-surface transition",
                            isCurrent
                              ? "opacity-30 cursor-not-allowed text-mute"
                              : "text-mute hover:text-red-500 hover:border-red-500/40"
                          )}
                          title={isCurrent ? "Cannot delete own active session" : "Delete Administrator"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filteredUsers.length && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-mute">
                    <Users size={32} className="mx-auto text-mute/50 mb-2" />
                    <p className="font-semibold text-sm">No administrators found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile App Cards View (md:hidden) */}
        <div className="md:hidden divide-y divide-ink/10">
          {filteredUsers.map((u) => {
            const isCurrent = currentUserEmail && u.email.toLowerCase() === currentUserEmail.toLowerCase();
            const isSuper = u.role === "superadmin";

            return (
              <div key={u.id || u.email} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand to-accent text-white font-bold text-xs uppercase shadow-sm">
                      {u.name.slice(0, 2)}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-ink block">{u.name}</span>
                      <span className="text-[11px] font-mono text-mute">{u.email}</span>
                    </div>
                  </div>

                  {isSuper ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-extrabold text-purple-600 dark:text-purple-400">
                      <Shield size={11} /> Super
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      Staff
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-ink/5">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Operator
                  </span>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmEmail(u.email)}
                      className="flex h-7 px-2.5 items-center gap-1 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-semibold"
                    >
                      <Trash2 size={12} /> Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {!filteredUsers.length && !loading && (
            <div className="p-8 text-center text-mute">
              <Users size={28} className="mx-auto text-mute/50 mb-2" />
              <p className="font-semibold text-xs">No administrators found</p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          POPUP MODAL: ADD ADMIN ACCOUNT
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl border border-ink/15 bg-surface p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink">Add Management User</h3>
                  <p className="text-xs text-mute">Authorize staff to manage leads, inventory & CMS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-ink/10 text-mute hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500 font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Full Operator Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input text-xs"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Login Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input text-xs"
                  placeholder="rahul@luxorapg.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input text-xs"
                  placeholder="••••••••••••"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Assigned Role Privilege</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input text-xs font-bold"
                >
                  <option value="admin">Administrator (Leads & Properties)</option>
                  <option value="superadmin">Super Admin (Full Portal & Security Control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary text-xs gap-2 px-6 shadow-md shadow-brand/25"
                >
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {deleteConfirmEmail && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-surface p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-500">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink">Revoke Staff Access?</h3>
                <p className="text-xs text-mute">Permanent credential deletion</p>
              </div>
            </div>

            <p className="text-xs text-mute leading-relaxed">
              Are you sure you want to permanently revoke access for <strong className="text-ink">{deleteConfirmEmail}</strong>? This user will no longer be able to log in to the admin portal.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmEmail(null)}
                className="btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="btn bg-red-600 hover:bg-red-700 text-white text-xs px-5 shadow-lg shadow-red-600/25"
              >
                {isDeleting ? "Revoking..." : "Yes, Revoke Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
