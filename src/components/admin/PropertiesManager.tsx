"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Users,
  ShieldCheck,
  Star,
  MapPin,
  Train,
  Sparkles,
  Camera,
  Layers,
  ChevronRight,
  Info
} from "lucide-react";
import type { Area, Property } from "@/lib/types";
import { FACILITY_CATALOG, ROOM_LABEL } from "@/lib/site";
import { slugify, uid } from "@/lib/utils";
import ImageFilePicker, { processImageFile, uploadImageToServer, uploadMultipleImagesToServer } from "./ImageFilePicker";
import { SortableList, SortableItem, ReorderControls } from "./Sortable";
import { cn, inr } from "@/lib/utils";
import { Compass, Upload, Image as ImageIcon, AlertTriangle, RefreshCw } from "lucide-react";
import UniqueDeleteModal from "./UniqueDeleteModal";

interface PropertiesManagerProps {
  initialProps: Property[];
  areas: Area[];
}

export default function PropertiesManager({ initialProps, areas }: PropertiesManagerProps) {
  const [properties, setProperties] = useState<Property[]>(initialProps);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Highlight state for newly added item
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // Unique Delete Modal State
  const [uniqueDeleteState, setUniqueDeleteState] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    itemName?: string;
    itemPreviewUrl?: string;
    confirmLabel?: string;
    isDeleting?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    onConfirm: () => {},
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"basics" | "rooms" | "photos" | "facilities" | "rules">("basics");
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Delete Confirmation State
  const [deleteConfirmProp, setDeleteConfirmProp] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Wipe All Data State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleWipeAllData = async () => {
    if (resetConfirmText.trim().toUpperCase() !== "WIPE") return;
    setIsResetting(true);
    setResetError("");
    try {
      const res = await fetch("/api/admin/reset-data", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Reset failed");
      setProperties([]);
      setIsResetModalOpen(false);
      setResetConfirmText("");
      setSuccessToast("All properties, rooms, areas, and inquiry records have been wiped clean.");
    } catch (err: any) {
      setResetError(err.message || "Failed to wipe data");
    } finally {
      setIsResetting(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState<Property>({
    slug: "",
    name: "",
    gender: "boys",
    area: areas[0]?.slug || "satellite",
    address: "",
    description: "",
    phone: "",
    mapUrl: "",
    status: "active",
    verified: true,
    featured: false,
    metro: { station: "", distanceKm: 0.8, method: "route" },
    rooms: [
      {
        id: uid(),
        type: "single",
        ac: true,
        rent: 14000,
        rentUnit: "per-bed",
        deposit: 14000,
        included: ["Wi-Fi", "3 Meals", "Housekeeping"],
        extraCharges: ["AC Units per meter"],
        availability: "now",
      },
      {
        id: uid(),
        type: "double",
        ac: true,
        rent: 9500,
        rentUnit: "per-bed",
        deposit: 9500,
        included: ["Wi-Fi", "3 Meals", "Housekeeping"],
        extraCharges: [],
        availability: "now",
      },
    ],
    facilities: FACILITY_CATALOG.map((f) => ({
      key: f.key,
      name: f.name,
      status: "included" as const,
    })),
    media: [
      {
        type: "image",
        url: "/images/hero-building.jpg",
        alt: "Exterior Campus View",
        caption: "Main entrance with biometric turnstile",
        tag: "Exterior",
      },
    ],
    rules: [
      "Gate timing: 10:30 PM (Biometric log thereafter)",
      "Strictly vegetarian & non-smoking premises",
      "Parents allowed in ground-floor lounge only",
      "Sub-meter AC billed monthly at government tariff",
    ],
    nearby: [],
    updatedAt: "",
  });

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingProp(null);
    setFormData({
      slug: "",
      name: "",
      gender: "boys",
      area: areas[0]?.slug || "satellite",
      address: "",
      description: "",
      phone: "+91 98250 12345",
      mapUrl: "",
      status: "active",
      verified: true,
      featured: false,
      metro: { station: "Commerce Six Roads Metro", distanceKm: 0.8, method: "route" },
      rooms: [
        {
          id: uid(),
          type: "single",
          ac: true,
          rent: 14000,
          rentUnit: "per-bed",
          deposit: 14000,
          included: ["Wi-Fi", "3 Meals", "Housekeeping"],
          extraCharges: [],
          availability: "now",
        },
      ],
      facilities: FACILITY_CATALOG.map((f) => ({
        key: f.key,
        name: f.name,
        status: "included" as const,
      })),
      media: [
        {
          type: "image",
          url: "/images/hero-building.jpg",
          alt: "Campus Main Building",
          caption: "Luxora PG Campus",
          tag: "Exterior",
        },
      ],
      rules: [
        "Gate timing: 10:30 PM (Biometric log thereafter)",
        "Strictly vegetarian premises",
        "Sub-meter AC billed monthly at government tariff",
      ],
      nearby: [],
      updatedAt: "",
    });
    setActiveModalTab("basics");
    setModalError("");
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (prop: Property) => {
    setEditingProp(prop);
    // Ensure all catalog facilities exist
    const mergedFacilities = FACILITY_CATALOG.map((f) => {
      const existing = prop.facilities?.find((x) => x.key === f.key);
      return existing || { key: f.key, name: f.name, status: "not-available" as const };
    });

    setFormData({
      ...prop,
      facilities: mergedFacilities,
      media: prop.media?.length ? prop.media : [{ type: "image", url: "/images/hero-building.jpg", alt: prop.name }],
      rules: prop.rules?.length ? prop.rules : [],
      rooms: prop.rooms?.length ? prop.rooms : [],
    });
    setActiveModalTab("basics");
    setModalError("");
    setIsModalOpen(true);
  };

  // Save / Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setIsSaving(true);

    try {
      const finalSlug = formData.slug.trim() || slugify(formData.name);
      if (!formData.name.trim()) throw new Error("Property name is required.");
      if (!formData.address.trim()) throw new Error("Address is required.");

      const payload = {
        ...formData,
        slug: finalSlug,
        rules: Array.isArray(formData.rules)
          ? formData.rules
          : String(formData.rules).split("\n").map((s) => s.trim()).filter(Boolean),
      };

      const res = await fetch("/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to save property.");
      }

      const saved = data.property || payload;

      // Update state
      setProperties((prev) => {
        const idx = prev.findIndex((p) => p.slug === saved.slug);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        } else {
          return [saved, ...prev];
        }
      });

      setIsModalOpen(false);
      const al = data.alerts;
      const alertNote = data.alertError
        ? ` ${data.alertError}`
        : al?.queued
        ? ` Vacancy alert emails: ${al.sent} sent${al.failed ? `, ${al.failed} failed (see Vacancy alerts > Notification log)` : ""}.`
        : "";
      setSuccessToast(`Property "${saved.name}" saved.${alertNote}`);
      setTimeout(() => setSuccessToast(""), 7000);
    } catch (err: any) {
      setModalError(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmProp) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/properties/${deleteConfirmProp.slug}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete property.");

      setProperties((prev) => prev.filter((p) => p.slug !== deleteConfirmProp.slug));
      setSuccessToast(`Property "${deleteConfirmProp.name}" removed successfully.`);
      setTimeout(() => setSuccessToast(""), 4000);
      setDeleteConfirmProp(null);
    } catch (err: any) {
      alert(err.message || "Could not delete property.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase());
      const matchArea = areaFilter === "all" || p.area === areaFilter;
      const matchGender = genderFilter === "all" || p.gender === genderFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchArea && matchGender && matchStatus;
    });
  }, [properties, search, areaFilter, genderFilter, statusFilter]);

  const boysCount = properties.filter((p) => p.gender === "boys").length;
  const girlsCount = properties.filter((p) => p.gender === "girls").length;
  const verifiedCount = properties.filter((p) => p.verified).length;

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

      {/* Top Header & Master Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 border border-brand/20 px-3 py-1 text-xs font-bold text-brand">
              <Building2 size={13} /> Inventory & Residences
            </span>
            <span className="text-xs text-mute font-medium">({properties.length} Total Registered)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-1">
            PG Properties & Room Inventory
          </h1>
          <p className="text-xs text-mute mt-0.5">
            Manage rooms, monthly rents, refundable deposits, facilities matrix, and high-resolution photo galleries.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => {
              setResetConfirmText("");
              setResetError("");
              setIsResetModalOpen(true);
            }}
            type="button"
            className="btn btn-ghost border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs gap-1.5 px-3.5 py-2.5 transition"
            title="Wipe all data to assign fresh software to new user"
          >
            <Trash2 size={14} />
            <span>Wipe All Data</span>
          </button>

          <button
            onClick={handleOpenAdd}
            type="button"
            className="btn btn-primary text-xs gap-2 px-5 py-2.5 shadow-lg shadow-brand/25 active:scale-95 transition"
          >
            <Plus size={16} />
            <span>Add New Property</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="card p-3.5 border-ink/10 flex items-center justify-between">
          <span className="text-mute font-medium">Total Properties:</span>
          <span className="font-bold text-ink text-sm">{properties.length}</span>
        </div>
        <div className="card p-3.5 border-ink/10 flex items-center justify-between">
          <span className="text-blue-500 font-medium flex items-center gap-1">
            <Users size={14} /> Boys PGs:
          </span>
          <span className="font-bold text-ink text-sm">{boysCount}</span>
        </div>
        <div className="card p-3.5 border-ink/10 flex items-center justify-between">
          <span className="text-purple-500 font-medium flex items-center gap-1">
            <ShieldCheck size={14} /> Girls PGs:
          </span>
          <span className="font-bold text-ink text-sm">{girlsCount}</span>
        </div>
        <div className="card p-3.5 border-ink/10 flex items-center justify-between">
          <span className="text-ok font-medium flex items-center gap-1">
            <CheckCircle2 size={14} /> Owner Verified:
          </span>
          <span className="font-bold text-ink text-sm">{verifiedCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 border-ink/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input
            type="text"
            placeholder="Search by property name, address, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input text-xs pl-9 w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Area Filter */}
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="input text-xs !w-auto"
          >
            <option value="all">All Localities</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="input text-xs !w-auto"
          >
            <option value="all">All Accommodations</option>
            <option value="boys">Boys PGs Only</option>
            <option value="girls">Girls PGs Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input text-xs !w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Public)</option>
            <option value="draft">Draft (Hidden)</option>
          </select>

          {(search || areaFilter !== "all" || genderFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setAreaFilter("all");
                setGenderFilter("all");
                setStatusFilter("all");
              }}
              className="btn btn-ghost text-xs p-2 text-mute hover:text-ink"
              title="Reset Filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Executive Properties Table & Mobile Cards */}
      <div className="card border-ink/10 overflow-hidden shadow-xl">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="bg-ink/5 border-b border-ink/10 text-mute uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Area & Address</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Rooms & Pricing</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filteredProperties.map((p) => {
                const cover = p.media?.[0]?.url || "/images/hero-building.jpg";
                const areaObj = areas.find((a) => a.slug === p.area);
                const minRent = p.rooms?.reduce((min, r) => (r.rent && r.rent < min ? r.rent : min), Infinity);
                const displayRent = minRent && minRent !== Infinity ? `₹${minRent.toLocaleString("en-IN")}/mo` : "On Request";

                return (
                  <tr key={p.slug} className="hover:bg-ink/5 transition-colors group">
                    {/* Property Thumbnail & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-ink/5">
                          <img
                            src={cover}
                            alt={p.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-ink group-hover:text-brand transition-colors truncate">
                              {p.name}
                            </span>
                            {p.featured && (
                              <span title="Featured on Homepage" className="text-amber-400 shrink-0">
                                <Star size={13} fill="currentColor" />
                              </span>
                            )}
                            {p.verified && (
                              <span title="Owner Verified Data" className="text-emerald-500 shrink-0">
                                <ShieldCheck size={14} />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-mute">/{p.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* Area & Address */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="inline-flex items-center gap-1 font-semibold text-ink">
                          <MapPin size={12} className="text-brand" />
                          {areaObj?.name || p.area}
                        </span>
                        <p className="text-mute text-[11px] line-clamp-1 max-w-xs">{p.address}</p>
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="py-3.5 px-4">
                      {p.gender === "boys" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 font-bold text-blue-600 dark:text-blue-400">
                          <Users size={12} /> Boys PG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 font-bold text-purple-600 dark:text-purple-400">
                          <ShieldCheck size={12} /> Girls PG
                        </span>
                      )}
                    </td>

                    {/* Rooms & Pricing */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-ink">{displayRent}</span>
                        <span className="block text-[10px] text-mute">
                          {p.rooms?.length || 0} room type{p.rooms?.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {p.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active (Public)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Draft (Hidden)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Public Live Site */}
                        <Link
                          href={`/pg/${p.slug}`}
                          target="_blank"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 bg-surface text-mute hover:text-brand hover:border-brand/40 transition"
                          title="View on Public Website"
                        >
                          <Eye size={14} />
                        </Link>

                        {/* Edit in Popup Modal */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 bg-surface text-mute hover:text-brand hover:border-brand/40 transition"
                          title="Edit Property"
                        >
                          <Pencil size={14} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmProp(p)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 bg-surface text-mute hover:text-red-500 hover:border-red-500/40 transition"
                          title="Delete Property"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filteredProperties.length && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-mute">
                    <Building2 size={32} className="mx-auto text-mute/50 mb-2" />
                    <p className="font-semibold text-sm">No properties found</p>
                    <p className="text-xs">Adjust your search or click "+ Add New Property" above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile App Cards View (md:hidden - Zero cutoffs, responsive for all phones) */}
        <div className="md:hidden divide-y divide-ink/10">
          {filteredProperties.map((p) => {
            const cover = p.media?.[0]?.url || "/images/hero-building.jpg";
            const areaObj = areas.find((a) => a.slug === p.area);
            const minRent = p.rooms?.reduce((min, r) => (r.rent && r.rent < min ? r.rent : min), Infinity);
            const displayRent = minRent && minRent !== Infinity ? `₹${minRent.toLocaleString("en-IN")}/mo` : "On Request";

            return (
              <div key={p.slug} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-ink/5">
                    <img src={cover} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-ink truncate">{p.name}</span>
                      {p.verified && <span title="Verified" className="text-emerald-500 shrink-0"><ShieldCheck size={13} /></span>}
                    </div>
                    <p className="text-xs text-mute flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-brand shrink-0" />
                      <span className="truncate">{areaObj?.name || p.area}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${p.gender === "boys" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" : "bg-purple-500/10 text-purple-600 border border-purple-500/20"}`}>
                        {p.gender === "boys" ? "Boys PG" : "Girls PG"}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === "active" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border border-amber-500/20"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${p.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                        {p.status === "active" ? "Active" : "Draft"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-ink/5">
                  <div>
                    <span className="font-bold text-ink">{displayRent}</span>
                    <span className="text-[10px] text-mute ml-1">({p.rooms?.length || 0} room types)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/pg/${p.slug}`}
                      target="_blank"
                      className="flex h-8 px-2.5 items-center gap-1 rounded-lg border border-ink/10 bg-surface text-mute hover:text-brand text-xs font-semibold"
                    >
                      <Eye size={13} /> View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="flex h-8 px-2.5 items-center gap-1 rounded-lg border border-ink/10 bg-surface text-mute hover:text-brand text-xs font-semibold"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmProp(p)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 bg-surface text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!filteredProperties.length && (
            <div className="p-8 text-center text-mute">
              <Building2 size={28} className="mx-auto text-mute/50 mb-2" />
              <p className="font-semibold text-xs">No properties found</p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL POPUP: ADD / EDIT PROPERTY
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-ink/15 bg-surface shadow-2xl overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10 bg-surface/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink">
                    {editingProp ? `Edit: ${editingProp.name}` : "Add New PG Residence"}
                  </h3>
                  <p className="text-xs text-mute">
                    {editingProp ? "Update room details, rent and photos" : "Create a new verified accommodation profile"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-ink/10 text-mute hover:text-ink hover:bg-ink/5 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex gap-2 px-6 pt-3 pb-2 border-b border-ink/10 overflow-x-auto bg-surface/50 shrink-0">
              {[
                { id: "basics", label: "Basics & Info", icon: Info },
                { id: "rooms", label: "Rooms & Pricing", icon: Building2 },
                { id: "photos", label: "Photos & Media", icon: Camera },
                { id: "facilities", label: "Facilities Matrix", icon: Layers },
                { id: "rules", label: "Rules & Metro", icon: Train },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveModalTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap",
                      isActive
                        ? "bg-brand text-white shadow-sm"
                        : "text-mute hover:text-ink hover:bg-ink/5"
                    )}
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body / Scrollable Form */}
            <form id="property-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-500 font-semibold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* TAB 1: BASICS */}
              {activeModalTab === "basics" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink">Property Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            name: val,
                            slug: !editingProp ? slugify(val) : prev.slug,
                          }));
                        }}
                        className="input text-xs"
                        placeholder="e.g. Luxora Elite Residence"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink">URL Slug *</label>
                      <input
                        type="text"
                        required
                        readOnly={!!editingProp}
                        value={formData.slug}
                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                        className="input text-xs font-mono"
                        placeholder="e.g. luxora-elite-residence"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink">Accommodation Category *</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value as any }))}
                        className="input text-xs font-bold"
                      >
                        <option value="boys">Boys PG Stay</option>
                        <option value="girls">Girls PG Stay</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink">Locality / Area Hub *</label>
                      <select
                        value={formData.area}
                        onChange={(e) => setFormData((prev) => ({ ...prev, area: e.target.value }))}
                        className="input text-xs font-bold"
                      >
                        {areas.map((a) => (
                          <option key={a.slug} value={a.slug}>
                            {a.name} ({a.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-ink">Full Street Address *</label>
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                        className="input text-xs"
                        placeholder="Street number, building name, landmark, Ahmedabad"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink">Direct Coordinator Phone</label>
                      <input
                        type="text"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        className="input text-xs"
                        placeholder="+91 98250 12345"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink">Google Maps URL</label>
                      <input
                        type="url"
                        value={formData.mapUrl || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, mapUrl: e.target.value }))}
                        className="input text-xs font-mono"
                        placeholder="https://maps.google.com/..."
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-ink">Description & Highlights</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        className="input text-xs"
                        placeholder="Describe the campus atmosphere, room comfort, food quality, and amenities..."
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-3 border-t border-ink/10 text-xs font-bold">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.verified}
                        onChange={(e) => setFormData((prev) => ({ ...prev, verified: e.target.checked }))}
                        className="h-4 w-4 rounded accent-brand"
                      />
                      <span>Owner-verified data badge</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                        className="h-4 w-4 rounded accent-brand"
                      />
                      <span>Featured on homepage</span>
                    </label>

                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-mute font-semibold">Publish Status:</span>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                        className="input text-xs !w-auto font-bold"
                      >
                        <option value="active">Active (Visible)</option>
                        <option value="draft">Draft (Hidden)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ROOMS & PRICING */}
              {activeModalTab === "rooms" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-ink">Room Types & Rent Structure</h4>
                      <p className="text-xs text-mute">Define single, double, or triple rooms with rent and security deposit.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newRoomId = uid();
                        setFormData((prev) => ({
                          ...prev,
                          rooms: [
                            ...(prev.rooms || []),
                            {
                              id: newRoomId,
                              type: "double",
                              ac: true,
                              rent: 9000,
                              rentUnit: "per-bed",
                              deposit: 9000,
                              included: ["Wi-Fi", "3 Meals"],
                              extraCharges: [],
                              availability: "now",
                              images: [],
                              tour360Urls: [],
                            },
                          ],
                        }));
                        setHighlightedItemId(newRoomId);
                        setTimeout(() => {
                          const el = document.getElementById(`room-card-${newRoomId}`);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                            const input = el.querySelector<HTMLInputElement | HTMLSelectElement>("select, input");
                            input?.focus();
                          }
                        }, 120);
                        setTimeout(() => {
                          setHighlightedItemId((curr) => (curr === newRoomId ? null : curr));
                        }, 4500);
                      }}
                      className="btn btn-ghost text-xs gap-1 border border-brand/20 text-brand hover:bg-brand/10"
                    >
                      <Plus size={13} /> Add Room Type
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.rooms?.map((room, idx) => (
                      <div
                        key={room.id}
                        id={`room-card-${room.id}`}
                        className={cn(
                          "rounded-2xl border bg-bg p-4 space-y-3 transition-all duration-500",
                          highlightedItemId === room.id
                            ? "ring-4 ring-brand/60 ring-offset-2 border-brand shadow-2xl shadow-brand/25 bg-brand/5 scale-[1.01]"
                            : "border-ink/10"
                        )}
                      >
                        {highlightedItemId === room.id && (
                          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand to-purple-600 px-3.5 py-1.5 text-white text-xs font-bold animate-bounce shadow-lg">
                            <span className="flex items-center gap-1.5">
                              <Sparkles size={14} /> ✨ Newly Added Room — Enter Details & Pricing Below
                            </span>
                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-extrabold uppercase">
                              Active Focus
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                          <span className="font-bold text-xs text-brand flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-brand text-[10px] font-black">
                              {idx + 1}
                            </span>
                            Room Option #{idx + 1} · {ROOM_LABEL[room.type] || room.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setUniqueDeleteState({
                                isOpen: true,
                                title: `Delete Room Option #${idx + 1}?`,
                                description: `Are you sure you want to remove this ${ROOM_LABEL[room.type] || room.type} configuration? All photos and rent settings for this room will be removed.`,
                                itemName: `${ROOM_LABEL[room.type] || room.type} (${room.rent ? inr(room.rent) : "Price on request"})`,
                                confirmLabel: "Delete Room",
                                onConfirm: () => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    rooms: prev.rooms.filter((_, i) => i !== idx),
                                  }));
                                  setUniqueDeleteState((prev) => ({ ...prev, isOpen: false }));
                                },
                              });
                            }}
                            className="text-red-400 hover:text-red-500 p-1 transition"
                            title="Remove Room"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-mute uppercase">Type</label>
                            <select
                              value={room.type}
                              onChange={(e) => {
                                const rooms = [...formData.rooms];
                                rooms[idx].type = e.target.value as any;
                                setFormData((prev) => ({ ...prev, rooms }));
                              }}
                              className="input text-xs"
                            >
                              {Object.entries(ROOM_LABEL).map(([k, l]) => (
                                <option key={k} value={k}>
                                  {l}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-mute uppercase">Rent ₹ / Month</label>
                            <input
                              type="number"
                              value={room.rent || ""}
                              onChange={(e) => {
                                const rooms = [...formData.rooms];
                                rooms[idx].rent = e.target.value ? Number(e.target.value) : null;
                                setFormData((prev) => ({ ...prev, rooms }));
                              }}
                              className="input text-xs font-bold"
                              placeholder="9500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-mute uppercase">Rent Basis</label>
                            <select
                              value={room.rentUnit}
                              onChange={(e) => {
                                const rooms = [...formData.rooms];
                                rooms[idx].rentUnit = e.target.value as any;
                                setFormData((prev) => ({ ...prev, rooms }));
                              }}
                              className="input text-xs"
                            >
                              <option value="per-bed">Per Bed</option>
                              <option value="per-room">Per Room</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-mute uppercase">Deposit ₹</label>
                            <input
                              type="number"
                              value={room.deposit || ""}
                              onChange={(e) => {
                                const rooms = [...formData.rooms];
                                rooms[idx].deposit = e.target.value ? Number(e.target.value) : null;
                                setFormData((prev) => ({ ...prev, rooms }));
                              }}
                              className="input text-xs"
                              placeholder="9500"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] font-bold text-mute uppercase">
                              Inclusions (Comma separated)
                            </label>
                            <input
                              type="text"
                              value={room.included?.join(", ") || ""}
                              onChange={(e) => {
                                const rooms = [...formData.rooms];
                                rooms[idx].included = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                                setFormData((prev) => ({ ...prev, rooms }));
                              }}
                              className="input text-xs"
                              placeholder="Wi-Fi, 3 Meals, Housekeeping"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-mute uppercase" htmlFor={`avail-${room.id}`}>Availability</label>
                            <select
                              id={`avail-${room.id}`}
                              value={room.availability}
                              onChange={(e) => {
                                const rooms = [...formData.rooms];
                                rooms[idx] = { ...rooms[idx], availability: e.target.value as any };
                                setFormData((prev) => ({ ...prev, rooms }));
                              }}
                              className="input text-xs font-bold"
                            >
                              <option value="now">Available now</option>
                              <option value="from-date">Available from a date</option>
                              <option value="unknown">Not available / unknown</option>
                            </select>
                            {room.availability === "now" && (
                              <p className="text-[10px] text-mute">Saving with this on emails matching subscribers if the room was not available before.</p>
                            )}
                          </div>

                          {room.availability === "from-date" && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-mute uppercase" htmlFor={`from-${room.id}`}>Available from</label>
                              <input
                                id={`from-${room.id}`}
                                type="date"
                                value={room.availableFrom || ""}
                                onChange={(e) => {
                                  const rooms = [...formData.rooms];
                                  rooms[idx] = { ...rooms[idx], availableFrom: e.target.value };
                                  setFormData((prev) => ({ ...prev, rooms }));
                                }}
                                className="input text-xs"
                              />
                            </div>
                          )}

                          {/* 📸 Room Photos & Direct File Upload */}
                          <div className="space-y-2 sm:col-span-2 rounded-xl border border-ink/10 bg-surface/50 p-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-mute uppercase flex items-center gap-1">
                                <Camera size={12} className="text-brand" />
                                <span>Room Photos ({room.images?.length || 0})</span>
                              </label>
                              <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-brand/10 hover:bg-brand/20 px-2 py-1 text-[10px] font-bold text-brand transition">
                                <Upload size={11} />
                                <span>+ Upload Photos</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const files = e.target.files ? Array.from(e.target.files) : [];
                                    if (files.length === 0) return;
                                    try {
                                      const uploaded = await uploadMultipleImagesToServer(files);
                                      const rooms = [...formData.rooms];
                                      const curImgs = rooms[idx].images || [];
                                      rooms[idx] = { ...rooms[idx], images: [...curImgs, ...uploaded] };
                                      setFormData((prev) => ({ ...prev, rooms }));
                                    } catch (err) {
                                      console.error("Failed to process room images", err);
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            {/* Thumbnail strip of room photos */}
                            {room.images && room.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {room.images.map((imgUrl, imgIdx) => (
                                  <div key={imgIdx} className="relative group h-14 w-20 rounded-lg overflow-hidden border border-ink/15 bg-black/10">
                                    <img src={imgUrl} alt={`Room ${imgIdx + 1}`} className="h-full w-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUniqueDeleteState({
                                          isOpen: true,
                                          title: `Delete Room Photo #${imgIdx + 1}?`,
                                          description: "Are you sure you want to remove this photo from this room configuration?",
                                          itemPreviewUrl: imgUrl,
                                          confirmLabel: "Delete Photo",
                                          onConfirm: () => {
                                            const rooms = [...formData.rooms];
                                            rooms[idx] = {
                                              ...rooms[idx],
                                              images: rooms[idx].images?.filter((_, i) => i !== imgIdx),
                                            };
                                            setFormData((prev) => ({ ...prev, rooms }));
                                            setUniqueDeleteState((prev) => ({ ...prev, isOpen: false }));
                                          },
                                        });
                                      }}
                                      className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                                      title="Remove photo"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 🌐 360° Virtual Tour / Panorama Upload (Multiple 360 photos support) */}
                          <div className="space-y-2 sm:col-span-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
                                <Compass size={12} className="text-amber-500" />
                                <span>
                                  360° Panoramas (
                                  {(() => {
                                    const list =
                                      room.tour360Urls && room.tour360Urls.length > 0
                                        ? room.tour360Urls
                                        : room.tour360Url
                                        ? [room.tour360Url]
                                        : [];
                                    return list.length;
                                  })()}
                                  )
                                </span>
                              </label>
                              <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 transition">
                                <Upload size={11} />
                                <span>+ Upload 360 Photos</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={async (e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (!files.length) return;
                                    try {
                                      const urls = await uploadMultipleImagesToServer(files, 2560, 0.88);
                                      const rooms = [...formData.rooms];
                                      const existing360 =
                                        rooms[idx].tour360Urls && rooms[idx].tour360Urls.length > 0
                                          ? rooms[idx].tour360Urls
                                          : rooms[idx].tour360Url
                                          ? [rooms[idx].tour360Url]
                                          : [];
                                      const combined = [...existing360, ...urls];
                                      rooms[idx] = {
                                        ...rooms[idx],
                                        tour360Urls: combined,
                                        tour360Url: combined[0] || "",
                                      };
                                      setFormData((prev) => ({ ...prev, rooms }));
                                    } catch (err) {
                                      console.error("Failed to process 360 panorama", err);
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            {/* 360 Panoramas List */}
                            {(() => {
                              const panList =
                                room.tour360Urls && room.tour360Urls.length > 0
                                  ? room.tour360Urls
                                  : room.tour360Url
                                  ? [room.tour360Url]
                                  : [];

                              if (panList.length === 0) {
                                return (
                                  <p className="text-[11px] text-mute leading-relaxed">
                                    No 360 panorama attached. You can upload multiple 360 photos per room.
                                  </p>
                                );
                              }

                              return (
                                <div className="space-y-1.5 pt-1">
                                  {panList.map((panUrl, pIdx) => (
                                    <div
                                      key={pIdx}
                                      className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs"
                                    >
                                      <Compass size={13} className="text-amber-500 animate-spin-slow shrink-0" />
                                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                        Scene #{pIdx + 1}
                                      </span>
                                      <span className="text-[10px] font-mono truncate flex-1 text-ink">
                                        {panUrl.startsWith("data:") ? "Custom 360 Panorama" : panUrl}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setUniqueDeleteState({
                                            isOpen: true,
                                            title: `Delete 360° Scene #${pIdx + 1}?`,
                                            description:
                                              "Are you sure you want to remove this 360° panorama photo from this room?",
                                            itemPreviewUrl: panUrl,
                                            confirmLabel: "Delete 360 Scene",
                                            onConfirm: () => {
                                              const rooms = [...formData.rooms];
                                              const cur = (
                                                rooms[idx].tour360Urls && rooms[idx].tour360Urls.length > 0
                                                  ? rooms[idx].tour360Urls
                                                  : rooms[idx].tour360Url
                                                  ? [rooms[idx].tour360Url]
                                                  : []
                                              ).filter((_, i) => i !== pIdx);
                                              rooms[idx] = {
                                                ...rooms[idx],
                                                tour360Urls: cur,
                                                tour360Url: cur[0] || "",
                                              };
                                              setFormData((prev) => ({ ...prev, rooms }));
                                              setUniqueDeleteState((prev) => ({ ...prev, isOpen: false }));
                                            },
                                          });
                                        }}
                                        className="text-red-500 hover:text-red-600 p-0.5"
                                        title="Clear 360 Tour"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>

                          <div className="space-y-1 sm:col-span-4">
                            <label className="text-[10px] font-bold text-mute uppercase">
                              Room Highlights / Features
                            </label>
                            <input
                              type="text"
                              value={room.description || ""}
                              onChange={(e) => {
                                const rooms = [...formData.rooms];
                                rooms[idx] = { ...rooms[idx], description: e.target.value };
                                setFormData((prev) => ({ ...prev, rooms }));
                              }}
                              className="input text-xs"
                              placeholder="e.g. Executive Single suite with attached ensuite & ergonomic study pod"
                            />
                          </div>

                          <div className="flex items-center gap-3 sm:col-span-4 pt-2">
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={room.ac}
                                onChange={(e) => {
                                  const rooms = [...formData.rooms];
                                  rooms[idx].ac = e.target.checked;
                                  setFormData((prev) => ({ ...prev, rooms }));
                                }}
                                className="h-4 w-4 rounded accent-brand"
                              />
                              <span>Air Conditioning (AC)</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PHOTOS & MEDIA */}
              {activeModalTab === "photos" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-ink">Room & Campus Photos</h4>
                      <p className="text-xs text-mute">
                        Upload high-resolution images. Processed directly with automatic WebP compression.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newSlotIdx = (formData.media || []).length;
                        const slotId = `photo-slot-${newSlotIdx}`;
                        setFormData((prev) => ({
                          ...prev,
                          media: [
                            ...(prev.media || []),
                            {
                              type: "image",
                              url: "/images/room-single.jpg",
                              alt: "Room Photo",
                              caption: "Room Interior",
                              tag: "Room",
                            },
                          ],
                        }));
                        setHighlightedItemId(slotId);
                        setTimeout(() => {
                          const el = document.getElementById(slotId);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                            const input = el.querySelector<HTMLInputElement>("input");
                            input?.focus();
                          }
                        }, 120);
                        setTimeout(() => setHighlightedItemId((curr) => (curr === slotId ? null : curr)), 4500);
                      }}
                      className="btn btn-ghost text-xs gap-1 border border-brand/20 text-brand hover:bg-brand/10"
                    >
                      <Plus size={13} /> Add Photo Slot
                    </button>
                  </div>

                  <SortableList
                    label="photos"
                    items={formData.media || []}
                    onChange={(media) => setFormData((prev) => ({ ...prev, media }))}
                    itemLabel={(m, i) => m.caption || m.alt || `Photo ${i + 1}`}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    {formData.media?.map((m, idx) => {
                      const isHighlighted = highlightedItemId === `photo-slot-${idx}`;
                      return (
                        <SortableItem
                          key={idx}
                          index={idx}
                          id={`photo-slot-${idx}`}
                          className={cn(
                            "rounded-2xl border bg-bg p-4 space-y-3 transition-all duration-500",
                            isHighlighted
                              ? "ring-4 ring-brand/60 ring-offset-2 border-brand shadow-2xl shadow-brand/25 bg-brand/5 scale-[1.01]"
                              : "border-ink/10"
                          )}
                        >
                          {isHighlighted && (
                            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand to-purple-600 px-3 py-1.5 text-white text-xs font-bold animate-bounce shadow-lg">
                              <span className="flex items-center gap-1.5">
                                <Sparkles size={14} /> ✨ New Photo Slot Added — Upload Below
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                            <span className="font-bold text-xs text-brand">
                              Photo #{idx + 1}
                              {idx === 0 ? " · cover" : ""}
                            </span>
                            <ReorderControls className="ml-auto mr-1" />
                            <button
                              type="button"
                              onClick={() => {
                                setUniqueDeleteState({
                                  isOpen: true,
                                  title: `Delete Gallery Photo #${idx + 1}?`,
                                  description: "Are you sure you want to remove this property gallery photo?",
                                  itemName: m.caption || m.alt || `Photo #${idx + 1}`,
                                  itemPreviewUrl: m.url,
                                  confirmLabel: "Delete Photo",
                                  onConfirm: () => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      media: prev.media.filter((_, i) => i !== idx),
                                    }));
                                    setUniqueDeleteState((prev) => ({ ...prev, isOpen: false }));
                                  },
                                });
                              }}
                              className="text-red-400 hover:text-red-500 p-1 transition"
                              title="Remove Photo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                        <ImageFilePicker
                          label="Room / Campus Image"
                          value={m.url}
                          onChange={(url) => {
                            const media = [...formData.media];
                            media[idx].url = url;
                            setFormData((prev) => ({ ...prev, media }));
                          }}
                          aspectRatio="video"
                        />

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-mute uppercase">Description / Alt Text *</label>
                          <input
                            type="text"
                            required
                            value={m.alt}
                            onChange={(e) => {
                              const media = [...formData.media];
                              media[idx].alt = e.target.value;
                              setFormData((prev) => ({ ...prev, media }));
                            }}
                            className="input text-xs"
                            placeholder="e.g. Spacious Double Sharing Room with Balcony"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-mute uppercase">Tag / Category</label>
                            <input
                              type="text"
                              value={m.tag || ""}
                              onChange={(e) => {
                                const media = [...formData.media];
                                media[idx].tag = e.target.value;
                                setFormData((prev) => ({ ...prev, media }));
                              }}
                              className="input text-xs"
                              placeholder="Room / Balcony / Terrace"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-mute uppercase">Caption (Optional)</label>
                            <input
                              type="text"
                              value={m.caption || ""}
                              onChange={(e) => {
                                const media = [...formData.media];
                                media[idx].caption = e.target.value;
                                setFormData((prev) => ({ ...prev, media }));
                              }}
                              className="input text-xs"
                              placeholder="Caption text"
                            />
                          </div>
                        </div>
                      </SortableItem>
                    );
                  })}
                  </SortableList>
                </div>
              )}

              {/* TAB 4: FACILITIES */}
              {activeModalTab === "facilities" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-ink">Facilities & Inclusions Matrix</h4>
                    <p className="text-xs text-mute">
                      Specify whether each standard facility is included in base rent, paid extra, or not available.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {formData.facilities?.map((f, idx) => (
                      <div
                        key={f.key}
                        className="flex items-center justify-between p-3 rounded-xl border border-ink/10 bg-bg"
                      >
                        <span className="font-bold text-xs text-ink">{f.name}</span>
                        <select
                          value={f.status}
                          onChange={(e) => {
                            const facilities = [...formData.facilities];
                            facilities[idx].status = e.target.value as any;
                            setFormData((prev) => ({ ...prev, facilities }));
                          }}
                          className={cn(
                            "input text-xs !w-36 font-semibold",
                            f.status === "included" && "text-ok border-ok/30",
                            f.status === "paid" && "text-warn border-warn/30",
                            f.status === "not-available" && "text-mute"
                          )}
                        >
                          <option value="included">Included in Rent</option>
                          <option value="paid">Paid Extra</option>
                          <option value="not-available">Not Available</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: RULES & METRO */}
              {activeModalTab === "rules" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-ink/10 bg-bg p-4 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-brand">Metro Connectivity</h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-mute uppercase">Nearest Metro Station</label>
                        <input
                          type="text"
                          value={formData.metro?.station || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              metro: {
                                station: e.target.value,
                                distanceKm: prev.metro?.distanceKm || 0.8,
                                method: prev.metro?.method || "route",
                              },
                            }))
                          }
                          className="input text-xs"
                          placeholder="Doordarshan Kendra Metro"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-mute uppercase">Distance (KM)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.metro?.distanceKm || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              metro: {
                                station: prev.metro?.station || "",
                                distanceKm: Number(e.target.value),
                                method: prev.metro?.method || "route",
                              },
                            }))
                          }
                          className="input text-xs"
                          placeholder="0.9"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-mute uppercase">Measurement</label>
                        <select
                          value={formData.metro?.method || "route"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              metro: {
                                station: prev.metro?.station || "",
                                distanceKm: prev.metro?.distanceKm || 0.8,
                                method: e.target.value as any,
                              },
                            }))
                          }
                          className="input text-xs"
                        >
                          <option value="route">Walking Route</option>
                          <option value="straight-line">Straight-line</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">House Rules (One rule per line)</label>
                    <textarea
                      rows={5}
                      value={Array.isArray(formData.rules) ? formData.rules.join("\n") : formData.rules}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          rules: e.target.value.split("\n"),
                        }))
                      }
                      className="input text-xs leading-relaxed"
                      placeholder="Gate timing: 10:30 PM&#10;Strictly vegetarian premises&#10;Sub-meter AC billed monthly at government tariff"
                    />
                  </div>
                </div>
              )}
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-ink/10 bg-surface/90 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost text-xs"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="property-form"
                disabled={isSaving}
                className="btn btn-primary text-xs gap-2 px-6 shadow-md shadow-brand/25"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    Saving to Database...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>{editingProp ? "Update Property" : "Create Property Profile"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {deleteConfirmProp && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-surface p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-500">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink">Delete Property?</h3>
                <p className="text-xs text-mute">Permanent removal from website & database</p>
              </div>
            </div>

            <p className="text-xs text-mute leading-relaxed">
              Are you sure you want to delete <strong className="text-ink">{deleteConfirmProp.name}</strong> (
              <span className="font-mono text-red-400">/{deleteConfirmProp.slug}</span>)? All associated room inventory, pricing, and media will be removed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmProp(null)}
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
                {isDeleting ? "Deleting..." : "Yes, Delete Property"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          WIPE ALL DATA (HANDOVER RESET) MODAL
          ========================================================================= */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl border border-red-500/40 bg-surface p-6 sm:p-8 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-500">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-ink">Wipe All Data (Software Handover)</h3>
                <p className="text-xs text-mute">Permanently clean all data to start fresh</p>
              </div>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400 space-y-1">
              <p className="font-bold">⚠️ Warning: Irreversible Action</p>
              <p>
                This will delete <strong>all properties, rooms, areas, inquiries, events, and vacancy subscriptions</strong> from your database and memory store. Use this when handing over the software to a client or team so they can enter their own data from zero.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">
                Type <strong className="text-red-500 font-mono">WIPE</strong> to confirm:
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="Type WIPE here"
                className="input text-xs font-mono uppercase tracking-widest"
              />
            </div>

            {resetError && (
              <p className="text-xs text-red-500 font-medium">{resetError}</p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink/10">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetConfirmText.trim().toUpperCase() !== "WIPE" || isResetting}
                onClick={handleWipeAllData}
                className="btn bg-red-600 hover:bg-red-700 text-white text-xs px-5 shadow-lg shadow-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Wiping Database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Confirm Wipe All Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unique Delete Confirmation Dialog */}
      <UniqueDeleteModal
        {...uniqueDeleteState}
        onCancel={() => setUniqueDeleteState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
