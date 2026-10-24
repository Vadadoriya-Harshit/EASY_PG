"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  ExternalLink
} from "lucide-react";
import type { Area } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function AreaManager({ initial }: { initial: Area[] }) {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>(initial);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deleteConfirmArea, setDeleteConfirmArea] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("Ahmedabad");
  const [intro, setIntro] = useState("");
  const [landmarks, setLandmarks] = useState("");
  const [active, setActive] = useState(true);

  // Open Create Modal
  const handleOpenAdd = () => {
    setEditingArea(null);
    setName("");
    setSlug("");
    setCity("Ahmedabad");
    setIntro("");
    setLandmarks("");
    setActive(true);
    setModalError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (a: Area) => {
    setEditingArea(a);
    setName(a.name);
    setSlug(a.slug);
    setCity(a.city);
    setIntro(a.intro);
    setLandmarks(a.landmarks?.join(", ") || "");
    setActive(a.active);
    setModalError("");
    setIsModalOpen(true);
  };

  // Submit Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setIsSaving(true);

    try {
      const finalSlug = slug.trim() || slugify(name);
      if (!name.trim()) throw new Error("Area name is required.");

      const payload: Area = {
        slug: finalSlug,
        name: name.trim(),
        city: city.trim() || "Ahmedabad",
        intro: intro.trim(),
        landmarks: landmarks.split(",").map((s) => s.trim()).filter(Boolean),
        active,
      };

      const res = await fetch("/api/admin/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to save area.");
      }

      setAreas((prev) => {
        const idx = prev.findIndex((a) => a.slug === payload.slug);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = payload;
          return updated;
        } else {
          return [...prev, payload];
        }
      });

      setIsModalOpen(false);
      setSuccessToast(`Locality "${payload.name}" successfully saved in database!`);
      setTimeout(() => setSuccessToast(""), 4000);
      router.refresh();
    } catch (err: any) {
      setModalError(err.message || "Could not save area.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Active
  const handleToggleActive = async (a: Area) => {
    const updated = { ...a, active: !a.active };
    try {
      const res = await fetch("/api/admin/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setAreas((prev) => prev.map((x) => (x.slug === a.slug ? updated : x)));
        setSuccessToast(`Locality "${a.name}" set to ${updated.active ? "Visible" : "Hidden"}.`);
        setTimeout(() => setSuccessToast(""), 3500);
      }
    } catch {}
  };

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmArea) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/areas?slug=${encodeURIComponent(deleteConfirmArea.slug)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete area.");

      setAreas((prev) => prev.filter((a) => a.slug !== deleteConfirmArea.slug));
      setSuccessToast(`Locality "${deleteConfirmArea.name}" removed successfully.`);
      setTimeout(() => setSuccessToast(""), 4000);
      setDeleteConfirmArea(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Could not delete area.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAreas = areas.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successToast && (
        <div className="flex items-center justify-between rounded-2xl bg-ok/15 border border-ok/30 p-4 text-ok text-xs font-semibold shadow-xl animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast("")} className="text-ok hover:opacity-75">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 border border-brand/20 px-3 py-1 text-xs font-bold text-brand">
              <MapPin size={13} /> Localities & Metro Transit
            </span>
            <span className="text-xs text-mute font-medium">({areas.length} Hubs)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-1">
            Ahmedabad Locality Manager
          </h1>
          <p className="text-xs text-mute mt-0.5">
            Manage student & tech neighborhood guides, key educational landmarks, and metro routes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn btn-primary text-xs gap-2 px-5 py-2.5 shadow-lg shadow-brand/25 active:scale-95 transition"
        >
          <Plus size={16} />
          <span>Add New Locality</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-4 border-ink/10 flex items-center gap-3">
        <Search size={15} className="text-mute shrink-0" />
        <input
          type="text"
          placeholder="Search by neighborhood name, landmark, or city..."
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

      {/* Localities Table & Mobile Cards */}
      <div className="card border-ink/10 overflow-hidden shadow-xl">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-ink/5 border-b border-ink/10 text-mute uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Locality Hub</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Key Landmarks & Highlights</th>
                <th className="py-3 px-4">Visibility</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filteredAreas.map((a) => (
                <tr key={a.slug} className="hover:bg-ink/5 transition-colors group">
                  {/* Name & Slug */}
                  <td className="py-3.5 px-4">
                    <div>
                      <span className="font-bold text-sm text-ink group-hover:text-brand transition-colors block">
                        {a.name}
                      </span>
                      <span className="text-[11px] font-mono text-mute">/areas/{a.slug}</span>
                    </div>
                  </td>

                  {/* City */}
                  <td className="py-3.5 px-4 font-semibold text-ink">{a.city}</td>

                  {/* Landmarks */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {a.landmarks?.map((lm, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-ink/5 border border-ink/10 px-2 py-0.5 text-[10px] text-mute font-medium"
                        >
                          {lm}
                        </span>
                      ))}
                      {!a.landmarks?.length && <span className="text-mute text-[11px]">—</span>}
                    </div>
                  </td>

                  {/* Active Toggle */}
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(a)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition",
                        a.active
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-ink/5 border-ink/15 text-mute"
                      )}
                    >
                      {a.active ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{a.active ? "Public" : "Hidden"}</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(a)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 bg-surface text-mute hover:text-brand hover:border-brand/40 transition"
                        title="Edit Area"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmArea(a)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 bg-surface text-mute hover:text-red-500 hover:border-red-500/40 transition"
                        title="Delete Area"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredAreas.length && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-mute">
                    <MapPin size={32} className="mx-auto text-mute/50 mb-2" />
                    <p className="font-semibold text-sm">No localities found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile App Cards View (md:hidden) */}
        <div className="md:hidden divide-y divide-ink/10">
          {filteredAreas.map((a) => (
            <div key={a.slug} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-sm text-ink block">{a.name}</span>
                  <span className="text-[11px] font-mono text-mute">{a.city} · /areas/{a.slug}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleActive(a)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition",
                    a.active
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-ink/5 border-ink/15 text-mute"
                  )}
                >
                  {a.active ? <Eye size={11} /> : <EyeOff size={11} />}
                  <span>{a.active ? "Public" : "Hidden"}</span>
                </button>
              </div>

              {a.landmarks && a.landmarks.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {a.landmarks.map((lm, i) => (
                    <span key={i} className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] text-mute">
                      {lm}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-ink/5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(a)}
                  className="flex h-7 px-2.5 items-center gap-1 rounded-lg border border-ink/10 bg-surface text-mute hover:text-brand text-xs font-semibold"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmArea(a)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink/10 bg-surface text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {!filteredAreas.length && (
            <div className="p-8 text-center text-mute">
              <MapPin size={28} className="mx-auto text-mute/50 mb-2" />
              <p className="font-semibold text-xs">No localities found</p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          POPUP MODAL: ADD / EDIT LOCALITY
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-ink/15 bg-surface p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink">
                    {editingArea ? `Edit: ${editingArea.name}` : "Add New Locality"}
                  </h3>
                  <p className="text-xs text-mute">Define neighborhood landmark and metro routing details</p>
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

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Locality Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingArea) setSlug(slugify(e.target.value));
                    }}
                    className="input text-xs"
                    placeholder="e.g. Navrangpura"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">URL Slug *</label>
                  <input
                    type="text"
                    required
                    readOnly={!!editingArea}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="input text-xs font-mono"
                    placeholder="navrangpura"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input text-xs"
                  placeholder="Ahmedabad"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Locality Introduction & Guidance</label>
                <textarea
                  rows={3}
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  className="input text-xs leading-relaxed"
                  placeholder="Ahmedabad's prime student and institutional hub. Walking distance to Gujarat University, CEPT and Commerce Six Roads..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Key Landmarks (Comma separated)</label>
                <input
                  type="text"
                  value={landmarks}
                  onChange={(e) => setLandmarks(e.target.value)}
                  className="input text-xs"
                  placeholder="CEPT, Gujarat University, HL College, Commerce Six Roads Metro"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded accent-brand"
                  />
                  <span>Active (Visible on discovery filters)</span>
                </label>
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
                  disabled={isSaving}
                  className="btn btn-primary text-xs gap-2 px-6 shadow-md shadow-brand/25"
                >
                  {isSaving ? "Saving..." : editingArea ? "Update Locality" : "Create Locality"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {deleteConfirmArea && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-surface p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-500">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink">Delete Locality?</h3>
                <p className="text-xs text-mute">Permanent removal</p>
              </div>
            </div>

            <p className="text-xs text-mute leading-relaxed">
              Are you sure you want to delete <strong className="text-ink">{deleteConfirmArea.name}</strong>?
              Make sure no active properties are assigned to this area.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmArea(null)}
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
                {isDeleting ? "Deleting..." : "Yes, Delete Locality"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
