"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageFilePickerProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
  maxDimension?: number;
  quality?: number;
}

/**
 * Uploads a file to the server's /api/admin/upload endpoint.
 * Falls back to client-side dataUrl WebP compression if network fails.
 */
export async function uploadImageToServer(file: File, maxDim = 1200, quality = 0.82): Promise<string> {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: fd,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch (e) {
    console.warn("Direct server upload unavailable, falling back to local compression", e);
  }
  return processImageFile(file, maxDim, quality);
}

/**
 * Uploads multiple files simultaneously to /api/admin/upload.
 */
export async function uploadMultipleImagesToServer(
  files: File[],
  maxDim: number = 1920,
  quality: number = 0.82
): Promise<string[]> {
  try {
    const fd = new FormData();
    for (const f of files) {
      fd.append("files", f);
    }
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: fd,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.urls && data.urls.length > 0) return data.urls;
    }
  } catch (e) {
    console.warn("Direct multi-upload failed, using client compression fallback", e);
  }

  // Fallback: process all files locally
  const urls: string[] = [];
  for (const f of files) {
    const u = await processImageFile(f, maxDim, quality);
    urls.push(u);
  }
  return urls;
}

/**
 * Resizes and optimizes an image file client-side to a crisp WebP/JPEG Base64 string.
 */
export function processImageFile(file: File, maxDim = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Failed to load image element"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to jpeg
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ImageFilePicker({
  value,
  onChange,
  label = "Upload Photo",
  className,
  aspectRatio = "video",
  maxDimension = 1200,
  quality = 0.82,
}: ImageFilePickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please choose a valid image file (JPG, PNG, WebP).");
      return;
    }
    setProcessing(true);
    try {
      const url = await uploadImageToServer(file, maxDimension, quality);
      onChange(url);
    } catch (err) {
      console.error("Image processing error:", err);
      alert("Failed to process photo.");
    } finally {
      setProcessing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const aspectClass =
    aspectRatio === "video" ? "aspect-video" : aspectRatio === "wide" ? "aspect-[21/9]" : "aspect-square";

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <label className="block text-xs font-semibold text-ink/80">{label}</label>}

      {value ? (
        // Preview State with Replace / Remove
        <div className="relative group overflow-hidden rounded-xl border border-ink/15 bg-black/5 dark:bg-white/5">
          <div className={cn("relative w-full overflow-hidden", aspectClass)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded preview"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
              <span className="text-[11px] font-semibold text-white/90 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-400" /> Photo attached
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white transition flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Replace
                </button>
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="rounded-lg bg-red-500/80 hover:bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white transition flex items-center gap-1"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Drag and Drop Upload Zone
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative cursor-pointer rounded-xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center gap-2",
            aspectClass,
            isDragging
              ? "border-brand bg-brand/10 scale-[0.99]"
              : "border-ink/20 hover:border-brand/60 hover:bg-ink/[0.02]"
          )}
        >
          {processing ? (
            <div className="flex flex-col items-center gap-2 text-mute">
              <RefreshCw size={24} className="animate-spin text-brand" />
              <span className="text-xs font-semibold">Processing photo…</span>
            </div>
          ) : (
            <>
              <div className="rounded-full bg-brand/10 p-3 text-brand">
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">
                  Click to browse photo or drag & drop here
                </p>
                <p className="text-[11px] text-mute mt-0.5">Supports PNG, JPG, WebP (Optimized automatically)</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
