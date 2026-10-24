"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { Camera, Compass, Upload, Trash2, X, Plus, ShieldCheck, Sparkles } from "lucide-react";
import type { Area, Property } from "@/lib/types";
import { ROOM_LABEL, CATEGORY_LABEL } from "@/lib/site";
import { slugify, uid, inr, cn } from "@/lib/utils";
import ImageFilePicker, { uploadImageToServer, uploadMultipleImagesToServer } from "./ImageFilePicker";
import UniqueDeleteModal from "./UniqueDeleteModal";

type FormVals = Omit<Property, "rules"> & { rulesText: string };
const num = { setValueAs: (v: any) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v)) };

export default function PropertyForm({ initial, areas, isNew }: { initial: Property; areas: Area[]; isNew: boolean }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [upMsg, setUpMsg] = useState("");
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

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

  const { register, handleSubmit, control, watch, setValue } = useForm<FormVals>({
    defaultValues: { ...initial, rulesText: initial.rules.join("\n"), mapUrl: initial.mapUrl || "" },
  });
  const rooms = useFieldArray({ control, name: "rooms" });
  const media = useFieldArray({ control, name: "media" });
  const nearby = useFieldArray({ control, name: "nearby" });
  const hasMetro = !!watch("metro");

  const onSubmit = async (v: FormVals) => {
    setBusy(true);
    setErr("");
    const { rulesText, ...rest } = v;
    const body: any = {
      ...rest,
      slug: rest.slug || slugify(rest.name),
      rules: rulesText.split("\n").map((s) => s.trim()).filter(Boolean),
      metro: rest.metro && rest.metro.station ? { ...rest.metro, distanceKm: Number(rest.metro.distanceKm) } : null,
      nearby: rest.nearby.map((n) => ({ ...n, distanceKm: n.distanceKm ? Number(n.distanceKm) : undefined })),
    };
    delete body.updatedAt;
    const res = await fetch("/api/admin/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j.error || "Could not save property");
      setBusy(false);
      return;
    }
    router.push("/admin/properties");
    router.refresh();
  };

  const F = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <fieldset className="card grid gap-4 p-5 rounded-2xl border border-ink/10 bg-surface">
      <legend className="px-2 text-lg font-bold text-ink">{title}</legend>
      {children}
    </fieldset>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <F title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Name</span>
            <input className="input" required {...register("name")} onBlur={(e) => isNew && !watch("slug") && setValue("slug", slugify(e.target.value))} />
          </label>
          <label>
            <span className="label">URL slug</span>
            <input className="input" required readOnly={!isNew} {...register("slug")} />
          </label>
          <label>
            <span className="label">Accommodation</span>
            <select className="input" {...register("gender")}>
              <option value="boys">Boys</option>
              <option value="girls">Girls</option>
            </select>
          </label>
          <label>
            <span className="label">Area</span>
            <select className="input" {...register("area")}>
              {areas.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="label">Address (owner-confirmed)</span>
            <input className="input" {...register("address")} />
          </label>
          <label>
            <span className="label">Google Maps link</span>
            <input className="input" type="url" {...register("mapUrl")} />
          </label>
          <label>
            <span className="label">Property phone (optional)</span>
            <input className="input" {...register("phone")} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Description</span>
            <textarea rows={4} className="input" {...register("description")} />
          </label>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input type="checkbox" className="h-5 w-5 rounded accent-brand" {...register("verified")} /> Owner-verified data
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input type="checkbox" className="h-5 w-5 rounded accent-brand" {...register("featured")} /> Featured on home
          </label>
          <label className="flex items-center gap-2 font-medium">
            Status{" "}
            <select className="input !w-auto" {...register("status")}>
              <option value="draft">Draft (hidden)</option>
              <option value="active">Active (public)</option>
            </select>
          </label>
        </div>
      </F>

      <F title="Rooms & pricing (with Room Photos & 360 Panorama)">
        <p className="text-xs text-mute mb-2">
          Add rooms with room-wise photos and 360 panorama upload. All photos are uploaded directly from your device.
        </p>

        {rooms.fields.map((f, i) => {
          const roomImages = watch(`rooms.${i}.images`) || [];
          const tour360Urls: string[] = watch(`rooms.${i}.tour360Urls`) || [];
          const singleTour360 = watch(`rooms.${i}.tour360Url`) || "";
          const allTour360 = tour360Urls.length > 0 ? tour360Urls : (singleTour360 ? [singleTour360] : []);
          const isHighlighted = highlightedItemId === f.id;

          return (
            <div
              key={f.id}
              id={`form-room-${f.id}`}
              className={cn(
                "grid gap-3 rounded-2xl border p-4 sm:grid-cols-4 transition-all duration-500",
                isHighlighted
                  ? "ring-4 ring-brand/60 ring-offset-2 border-brand shadow-2xl shadow-brand/25 bg-brand/5 scale-[1.01]"
                  : "border-ink/15 bg-bg/60"
              )}
            >
              {isHighlighted && (
                <div className="sm:col-span-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-brand to-purple-600 px-3.5 py-1.5 text-white text-xs font-bold animate-bounce shadow-lg">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} /> ✨ Newly Added Room — Enter Details & Pricing Below
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-extrabold uppercase">
                    Active Focus
                  </span>
                </div>
              )}
              <label>
                <span className="label">Room Type</span>
                <select className="input" {...register(`rooms.${i}.type`)}>
                  {Object.entries(ROOM_LABEL).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="label">Rent ₹ / month</span>
                <input type="number" className="input" {...register(`rooms.${i}.rent`, num)} />
              </label>

              <label>
                <span className="label">Rent is</span>
                <select className="input" {...register(`rooms.${i}.rentUnit`)}>
                  <option value="per-bed">per bed</option>
                  <option value="per-room">per room</option>
                </select>
              </label>

              <label>
                <span className="label">Deposit ₹</span>
                <input type="number" className="input" {...register(`rooms.${i}.deposit`, num)} />
              </label>

              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" className="h-5 w-5 rounded accent-brand" {...register(`rooms.${i}.ac`)} /> Air Conditioned (AC)
              </label>

              <label>
                <span className="label">Availability</span>
                <select className="input" {...register(`rooms.${i}.availability`)}>
                  <option value="now">Available now</option>
                  <option value="from-date">From date</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>

              <label>
                <span className="label">Available from</span>
                <input type="date" className="input" {...register(`rooms.${i}.availableFrom`)} />
              </label>

              <button
                type="button"
                className="btn btn-ghost self-end text-red-500 hover:text-red-600 hover:bg-red-500/10"
                onClick={() => {
                  const roomType = watch(`rooms.${i}.type`);
                  const rent = watch(`rooms.${i}.rent`);
                  setUniqueDeleteState({
                    isOpen: true,
                    title: `Delete Room Option #${i + 1}?`,
                    description: `Are you sure you want to remove this ${ROOM_LABEL[roomType] || roomType} room option?`,
                    itemName: `${ROOM_LABEL[roomType] || roomType} (${rent ? inr(rent) : "Price on request"})`,
                    confirmLabel: "Delete Room",
                    onConfirm: () => {
                      rooms.remove(i);
                      setUniqueDeleteState((prev) => ({ ...prev, isOpen: false }));
                    },
                  });
                }}
              >
                Remove Room
              </button>

              <label className="sm:col-span-2">
                <span className="label">Included (comma separated)</span>
                <input
                  className="input"
                  defaultValue={f.included?.join(", ") || ""}
                  onChange={(e) =>
                    setValue(
                      `rooms.${i}.included`,
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder="Wi-Fi, 3 Meals, Housekeeping, Geyser"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="label">Extra charges (comma separated)</span>
                <input
                  className="input"
                  defaultValue={f.extraCharges?.join(", ") || ""}
                  onChange={(e) =>
                    setValue(
                      `rooms.${i}.extraCharges`,
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder="AC Units per sub-meter, Laundry"
                />
              </label>

              {/* 📸 Room Photos Direct File Upload */}
              <div className="space-y-2 sm:col-span-2 rounded-xl border border-ink/10 bg-surface/80 p-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-mute uppercase flex items-center gap-1">
                    <Camera size={13} className="text-brand" />
                    <span>Room Photos ({roomImages.length})</span>
                  </label>

                  <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-brand/10 hover:bg-brand/20 px-2.5 py-1 text-[11px] font-bold text-brand transition">
                    <Upload size={12} />
                    <span>+ Upload Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const files = e.target.files ? Array.from(e.target.files) : [];
                        if (files.length === 0) return;
                        const uploadedUrls = await uploadMultipleImagesToServer(files);
                        setValue(`rooms.${i}.images`, [...roomImages, ...uploadedUrls]);
                      }}
                    />
                  </label>
                </div>

                {roomImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {roomImages.map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="relative group h-14 w-20 rounded-xl overflow-hidden border border-ink/15 bg-black/10">
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
                                setValue(
                                  `rooms.${i}.images`,
                                  roomImages.filter((_, idx) => idx !== imgIdx)
                                );
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

              {/* 🌐 360° Virtual Tour / Panorama Upload (Multiple 360 Photos Support) */}
              <div className="space-y-2 sm:col-span-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
                    <Compass size={13} className="text-amber-500" />
                    <span>360° Panoramas ({allTour360.length})</span>
                  </label>

                  <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 transition">
                    <Upload size={12} />
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
                          const combined = [...allTour360, ...urls];
                          setValue(`rooms.${i}.tour360Urls`, combined);
                          setValue(`rooms.${i}.tour360Url`, combined[0] || "");
                        } catch (err) {
                          console.error("Failed to process 360 panorama", err);
                        }
                      }}
                    />
                  </label>
                </div>

                {allTour360.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {allTour360.map((panUrl, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
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
                              description: "Are you sure you want to remove this 360° panorama scene from this room?",
                              itemPreviewUrl: panUrl,
                              confirmLabel: "Delete 360 Scene",
                              onConfirm: () => {
                                const cur = allTour360.filter((_, idx) => idx !== pIdx);
                                setValue(`rooms.${i}.tour360Urls`, cur);
                                setValue(`rooms.${i}.tour360Url`, cur[0] || "");
                                setUniqueDeleteState((prev) => ({ ...prev, isOpen: false }));
                              },
                            });
                          }}
                          className="text-red-500 hover:text-red-600 p-0.5"
                          title="Remove 360 Scene"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-mute">No 360 panorama attached for this room.</p>
                )}
              </div>

              <label className="sm:col-span-4">
                <span className="label">Room Description / Highlight</span>
                <input className="input" placeholder="e.g. Spacious ensuite room with study pod & private balcony" {...register(`rooms.${i}.description`)} />
              </label>
            </div>
          );
        })}

        <button
          type="button"
          className="btn btn-ghost border border-brand/20 text-brand self-start gap-1 text-xs hover:bg-brand/10"
          onClick={() => {
            const newRoomId = uid();
            rooms.append({
              id: newRoomId,
              type: "double",
              ac: true,
              rent: null,
              rentUnit: "per-bed",
              deposit: null,
              included: ["Wi-Fi", "3 Meals", "Housekeeping"],
              extraCharges: [],
              availability: "now",
              images: [],
              tour360Url: "",
              tour360Urls: [],
              description: "",
            });
            setHighlightedItemId(newRoomId);
            setTimeout(() => {
              const el = document.getElementById(`form-room-${newRoomId}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                const sel = el.querySelector<HTMLSelectElement | HTMLInputElement>("select, input");
                sel?.focus();
              }
            }, 120);
            setTimeout(() => setHighlightedItemId((curr) => curr === newRoomId ? null : curr), 4500);
          }}
        >
          <Plus size={14} /> Add Room Type
        </button>
      </F>

      <F title="Facilities">
        <div className="grid gap-3 sm:grid-cols-2">
          {initial.facilities.map((f, i) => (
            <label key={f.key} className="flex items-center justify-between gap-3 text-sm">
              {f.name}
              <select className="input !w-40" {...register(`facilities.${i}.status`)}>
                <option value="included">Included</option>
                <option value="paid">Paid extra</option>
                <option value="not-available">Not available</option>
              </select>
            </label>
          ))}
        </div>
      </F>

      <F title="Metro (optional)">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="h-5 w-5 rounded accent-brand"
            checked={hasMetro}
            onChange={(e) => setValue("metro", e.target.checked ? { station: "", distanceKm: 1, method: "straight-line" } : null)}
          />{" "}
          Record nearest metro station
        </label>
        {hasMetro && (
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="sm:col-span-2">
              <span className="label">Station</span>
              <input className="input" {...register("metro.station")} />
            </label>
            <label>
              <span className="label">Distance km</span>
              <input type="number" step="0.1" className="input" {...register("metro.distanceKm", { valueAsNumber: true })} />
            </label>
            <label>
              <span className="label">Method</span>
              <select className="input" {...register("metro.method")}>
                <option value="straight-line">Straight-line</option>
                <option value="route">Route</option>
              </select>
            </label>
            <label>
              <span className="label">Verified on</span>
              <input type="date" className="input" {...register("metro.verifiedAt")} />
            </label>
          </div>
        )}
      </F>

      <F title="Property Photos & Gallery (Upload Only - No URLs)">
        <p className="text-xs text-mute mb-2">
          Upload exterior and campus photos directly from your device.
        </p>
        <div className="space-y-4">
          {media.fields.map((f, i) => (
            <div key={f.id} className="grid gap-4 rounded-xl border border-ink/10 p-4 sm:grid-cols-[200px_1fr_1fr_auto] items-center bg-surface/50">
              <ImageFilePicker
                value={watch(`media.${i}.url`)}
                onChange={(url) => setValue(`media.${i}.url`, url)}
                label={`Photo #${i + 1}`}
                aspectRatio="video"
              />
              <label>
                <span className="label">Alt text & Description</span>
                <input className="input" placeholder="e.g. Campus Building Entrance" {...register(`media.${i}.alt`)} />
              </label>
              <label>
                <span className="label">Tag / Category</span>
                <input className="input" placeholder="Exterior / Common Area / Cafeteria" {...register(`media.${i}.tag`)} />
              </label>
              <button type="button" className="btn btn-ghost self-center text-red-500 hover:text-red-600 text-xs" onClick={() => media.remove(i)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            className="btn btn-primary text-xs"
            onClick={() => media.append({ type: "image", url: "", alt: "", caption: "", tag: "Campus" })}
          >
            + Add New Photo Slot
          </button>
        </div>
      </F>

      <F title="House rules (one per line)">
        <textarea rows={5} className="input" {...register("rulesText")} />
      </F>

      <F title="Nearby places">
        {nearby.fields.map((f, i) => (
          <div key={f.id} className="grid gap-3 rounded-xl border border-ink/10 p-4 sm:grid-cols-4">
            <label>
              <span className="label">Category</span>
              <select className="input" {...register(`nearby.${i}.category`)}>
                {Object.entries(CATEGORY_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="label">Name</span>
              <input className="input" {...register(`nearby.${i}.name`)} />
            </label>
            <label>
              <span className="label">Distance km</span>
              <input type="number" step="0.1" className="input" {...register(`nearby.${i}.distanceKm`, { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })} />
            </label>
            <label>
              <span className="label">Method</span>
              <select className="input" {...register(`nearby.${i}.distanceMethod`)}>
                <option value="">-</option>
                <option value="straight-line">Straight-line</option>
                <option value="route">Route</option>
              </select>
            </label>
            <label>
              <span className="label">Map link</span>
              <input className="input" {...register(`nearby.${i}.mapUrl`)} />
            </label>
            <label>
              <span className="label">Last verified</span>
              <input type="date" className="input" {...register(`nearby.${i}.lastVerified`)} />
            </label>
            <button type="button" className="btn btn-ghost self-end text-red-500 hover:text-red-600" onClick={() => nearby.remove(i)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost self-start" onClick={() => nearby.append({ id: uid(), category: "breakfast", name: "", external: true })}>
          Add nearby place
        </button>
      </F>

      {err && <p role="alert" className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn">{err}</p>}
      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-ink/10 bg-bg/90 px-4 py-3 backdrop-blur z-20">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save property"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>

      {/* Unique Delete Confirmation Dialog */}
      <UniqueDeleteModal
        {...uniqueDeleteState}
        onCancel={() => setUniqueDeleteState((prev) => ({ ...prev, isOpen: false }))}
      />
    </form>
  );
}
