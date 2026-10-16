"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import type { Area, Property } from "@/lib/types";
import { ROOM_LABEL, CATEGORY_LABEL } from "@/lib/site";
import { slugify, uid } from "@/lib/utils";
import ImageFilePicker from "./ImageFilePicker";

type FormVals = Omit<Property, "rules"> & { rulesText: string };
const num = { setValueAs: (v: any) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v)) };

export default function PropertyForm({ initial, areas, isNew }: { initial: Property; areas: Area[]; isNew: boolean }) {
  const router = useRouter();
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [upMsg, setUpMsg] = useState("");
  const { register, handleSubmit, control, watch, setValue } = useForm<FormVals>({ defaultValues: { ...initial, rulesText: initial.rules.join("\n"), mapUrl: initial.mapUrl || "" } });
  const rooms = useFieldArray({ control, name: "rooms" });
  const media = useFieldArray({ control, name: "media" });
  const nearby = useFieldArray({ control, name: "nearby" });
  const hasMetro = !!watch("metro");

  const upload = async (file: File) => {
    setUpMsg("Uploading…");
    try {
      const s = await fetch("/api/admin/upload-sign", { method: "POST" });
      const sig = await s.json();
      if (!s.ok) throw new Error(sig.error);
      const fd = new FormData();
      fd.append("file", file); fd.append("api_key", sig.key); fd.append("timestamp", String(sig.timestamp)); fd.append("signature", sig.signature); fd.append("folder", sig.folder);
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud}/auto/upload`, { method: "POST", body: fd });
      const j = await up.json();
      if (!up.ok) throw new Error(j.error?.message || "Upload failed");
      media.append({ type: j.resource_type === "video" ? "video" : "image", url: j.secure_url, alt: "", caption: "", tag: "" });
      setUpMsg("Uploaded. Add alt text below.");
    } catch (e: any) { setUpMsg(e.message); }
  };

  const onSubmit = async (v: FormVals) => {
    setBusy(true); setErr("");
    const { rulesText, ...rest } = v;
    const body: any = { ...rest, slug: rest.slug || slugify(rest.name), rules: rulesText.split("\n").map((s) => s.trim()).filter(Boolean),
      metro: rest.metro && rest.metro.station ? { ...rest.metro, distanceKm: Number(rest.metro.distanceKm) } : null,
      nearby: rest.nearby.map((n) => ({ ...n, distanceKm: n.distanceKm ? Number(n.distanceKm) : undefined })) };
    delete body.updatedAt;
    const res = await fetch("/api/admin/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(j.error || "Could not save"); setBusy(false); return; }
    router.push("/admin/properties"); router.refresh();
  };

  const F = ({ children, title }: { children: React.ReactNode; title: string }) => <fieldset className="card grid gap-4 p-5"><legend className="px-2 text-lg font-semibold">{title}</legend>{children}</fieldset>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <F title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="label">Name</span><input className="input" required {...register("name")} onBlur={(e) => isNew && !watch("slug") && setValue("slug", slugify(e.target.value))} /></label>
          <label><span className="label">URL slug</span><input className="input" required readOnly={!isNew} {...register("slug")} /></label>
          <label><span className="label">Accommodation</span><select className="input" {...register("gender")}><option value="boys">Boys</option><option value="girls">Girls</option></select></label>
          <label><span className="label">Area</span><select className="input" {...register("area")}>{areas.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}</select></label>
          <label className="sm:col-span-2"><span className="label">Address (owner-confirmed)</span><input className="input" {...register("address")} /></label>
          <label><span className="label">Google Maps link</span><input className="input" type="url" {...register("mapUrl")} /></label>
          <label><span className="label">Property phone (optional)</span><input className="input" {...register("phone")} /></label>
          <label className="sm:col-span-2"><span className="label">Description</span><textarea rows={4} className="input" {...register("description")} /></label>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5" {...register("verified")} /> Owner-verified data</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5" {...register("featured")} /> Featured on home</label>
          <label className="flex items-center gap-2">Status <select className="input !w-auto" {...register("status")}><option value="draft">Draft (hidden)</option><option value="active">Active (public)</option></select></label>
        </div>
      </F>

      <F title="Rooms & pricing">
        {rooms.fields.map((f, i) => (
          <div key={f.id} className="grid gap-3 rounded-xl border border-ink/10 p-4 sm:grid-cols-4">
            <label><span className="label">Type</span><select className="input" {...register(`rooms.${i}.type`)}>{Object.entries(ROOM_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label><span className="label">Rent ₹ / month</span><input type="number" className="input" {...register(`rooms.${i}.rent`, num)} /></label>
            <label><span className="label">Rent is</span><select className="input" {...register(`rooms.${i}.rentUnit`)}><option value="per-bed">per bed</option><option value="per-room">per room</option></select></label>
            <label><span className="label">Deposit ₹</span><input type="number" className="input" {...register(`rooms.${i}.deposit`, num)} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" {...register(`rooms.${i}.ac`)} /> AC</label>
            <label><span className="label">Availability</span><select className="input" {...register(`rooms.${i}.availability`)}><option value="now">Available now</option><option value="from-date">From date</option><option value="unknown">Unknown</option></select></label>
            <label><span className="label">Available from</span><input type="date" className="input" {...register(`rooms.${i}.availableFrom`)} /></label>
            <button type="button" className="btn btn-ghost self-end text-warn" onClick={() => rooms.remove(i)}>Remove</button>
            <label className="sm:col-span-2"><span className="label">Included (comma separated)</span><input className="input" defaultValue={f.included.join(", ")} onChange={(e) => setValue(`rooms.${i}.included`, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></label>
            <label className="sm:col-span-2"><span className="label">Extra charges (comma separated)</span><input className="input" defaultValue={f.extraCharges.join(", ")} onChange={(e) => setValue(`rooms.${i}.extraCharges`, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></label>
          </div>
        ))}
        <button type="button" className="btn btn-ghost self-start" onClick={() => rooms.append({ id: uid(), type: "double", ac: false, rent: null, rentUnit: "per-bed", deposit: null, included: [], extraCharges: [], availability: "unknown" })}>Add room type</button>
      </F>

      <F title="Facilities">
        <div className="grid gap-3 sm:grid-cols-2">
          {initial.facilities.map((f, i) => (
            <label key={f.key} className="flex items-center justify-between gap-3 text-sm">{f.name}
              <select className="input !w-40" {...register(`facilities.${i}.status`)}><option value="included">Included</option><option value="paid">Paid extra</option><option value="not-available">Not available</option></select></label>
          ))}
        </div>
      </F>

      <F title="Metro (optional)">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={hasMetro} onChange={(e) => setValue("metro", e.target.checked ? { station: "", distanceKm: 1, method: "straight-line" } : null)} /> Record nearest metro station</label>
        {hasMetro && <div className="grid gap-3 sm:grid-cols-4">
          <label className="sm:col-span-2"><span className="label">Station</span><input className="input" {...register("metro.station")} /></label>
          <label><span className="label">Distance km</span><input type="number" step="0.1" className="input" {...register("metro.distanceKm", { valueAsNumber: true })} /></label>
          <label><span className="label">Method</span><select className="input" {...register("metro.method")}><option value="straight-line">Straight-line</option><option value="route">Route</option></select></label>
          <label><span className="label">Verified on</span><input type="date" className="input" {...register("metro.verifiedAt")} /></label></div>}
      </F>

      <F title="Photos & Room Media (File Picker)">
        <p className="text-xs text-mute mb-2">
          Upload room photos directly from your device. All images are processed and stored directly in MongoDB Atlas.
        </p>
        <div className="space-y-4">
          {media.fields.map((f, i) => (
            <div key={f.id} className="grid gap-4 rounded-xl border border-ink/10 p-4 sm:grid-cols-[200px_1fr_1fr_auto] items-center bg-surface/50">
              <ImageFilePicker
                value={watch(`media.${i}.url`)}
                onChange={(dataUrl) => setValue(`media.${i}.url`, dataUrl)}
                label={`Photo #${i + 1}`}
                aspectRatio="video"
              />
              <label>
                <span className="label">Alt text & Description</span>
                <input className="input" placeholder="e.g. Spacious AC double room with study pod" {...register(`media.${i}.alt`)} />
              </label>
              <label>
                <span className="label">Tag / Category</span>
                <input className="input" placeholder="Room / Balcony / Lounge" {...register(`media.${i}.tag`)} />
              </label>
              <button
                type="button"
                className="btn btn-ghost self-center text-warn text-xs"
                onClick={() => media.remove(i)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <button
            type="button"
            className="btn btn-primary text-xs"
            onClick={() => media.append({ type: "image", url: "", alt: "", caption: "", tag: "Room" })}
          >
            + Add New Photo
          </button>
        </div>
      </F>


      <F title="House rules (one per line)"><textarea rows={5} className="input" {...register("rulesText")} /></F>

      <F title="Nearby places">
        {nearby.fields.map((f, i) => (
          <div key={f.id} className="grid gap-3 rounded-xl border border-ink/10 p-4 sm:grid-cols-4">
            <label><span className="label">Category</span><select className="input" {...register(`nearby.${i}.category`)}>{Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label className="sm:col-span-2"><span className="label">Name</span><input className="input" {...register(`nearby.${i}.name`)} /></label>
            <label><span className="label">Distance km</span><input type="number" step="0.1" className="input" {...register(`nearby.${i}.distanceKm`, { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })} /></label>
            <label><span className="label">Method</span><select className="input" {...register(`nearby.${i}.distanceMethod`)}><option value="">-</option><option value="straight-line">Straight-line</option><option value="route">Route</option></select></label>
            <label><span className="label">Map link</span><input className="input" {...register(`nearby.${i}.mapUrl`)} /></label>
            <label><span className="label">Last verified</span><input type="date" className="input" {...register(`nearby.${i}.lastVerified`)} /></label>
            <button type="button" className="btn btn-ghost self-end text-warn" onClick={() => nearby.remove(i)}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost self-start" onClick={() => nearby.append({ id: uid(), category: "breakfast", name: "", external: true })}>Add nearby place</button>
      </F>

      {err && <p role="alert" className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn">{err}</p>}
      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-ink/10 bg-bg/90 px-4 py-3 backdrop-blur"><button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save property"}</button><button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancel</button></div>
    </form>
  );
}
