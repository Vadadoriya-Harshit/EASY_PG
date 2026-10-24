import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbLd, type Crumb } from "@/lib/seo";
import { safeJsonLd } from "@/lib/http";

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. The last item is the current page. */
export default function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd(items)) }} />
      <nav aria-label="Breadcrumb" className={`text-xs text-mute ${className}`}>
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <li key={c.href} className="flex items-center gap-1">
                {last ? <span aria-current="page" className="font-semibold text-ink">{c.name}</span> : <Link href={c.href} className="hover:text-ink hover:underline">{c.name}</Link>}
                {!last && <ChevronRight size={12} aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
