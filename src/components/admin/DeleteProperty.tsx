"use client";
import { useRouter } from "next/navigation";
import { showConfirm, showToast } from "@/components/FeedbackDialog";

export default function DeleteProperty({ slug }: { slug: string }) {
  const r = useRouter();
  return (
    <button
      className="btn btn-ghost !min-h-[40px] text-warn"
      onClick={async () => {
        const ok = await showConfirm({
          title: "Delete Property",
          message: `Are you sure you want to permanently delete "${slug}"? This cannot be undone.`,
          tone: "danger",
          danger: true,
          confirmLabel: "Delete Property",
        });
        if (!ok) return;
        await fetch(`/api/admin/properties/${slug}`, { method: "DELETE" });
        showToast(`Property "${slug}" removed.`, "info");
        r.refresh();
      }}
    >
      Delete
    </button>
  );
}
