"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  MapPin,
  Train,
  ArrowUpRight,
  Sparkles,
  Building2,
  Users,
  Compass,
  CheckCircle2
} from "lucide-react";
import type { Area } from "@/lib/types";
import { DEFAULT_CMS_DATA, type AreaContent } from "@/lib/cms-store";

interface AreaCardsGridProps {
  areas: Area[];
  counts: Record<string, number>;
}

export default function AreaCardsGrid({ areas, counts }: AreaCardsGridProps) {
  const [areasData, setAreasData] = useState<Record<string, AreaContent>>(DEFAULT_CMS_DATA.areas);

  useEffect(() => {
    const syncData = () => {
      try {
        const local = localStorage.getItem("sorath_cms_content");
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.areas) setAreasData(parsed.areas);
        }
      } catch { }
    };

    syncData();
    window.addEventListener("sorath_cms_updated", syncData);
    return () => window.removeEventListener("sorath_cms_updated", syncData);
  }, []);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {areas.map((area, index) => {
        const meta = areasData[area.slug] || DEFAULT_CMS_DATA.areas[area.slug] || {
          image: "/images/hero-building.jpg",
          tag: "Prime Locality",
          landmark: "Prime Ahmedabad Location",
          metroStation: "Connected Metro Route",
          distance: "Within 1 km",
          intro: area.intro,
        };
        const count = counts[area.slug] || 0;

        return (
          <motion.div
            key={area.slug}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
            whileHover={{ y: -8 }}
            className="group relative flex flex-col h-full rounded-3xl border border-ink/10 bg-surface shadow-md hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/20 transition-all duration-300 overflow-hidden"
          >
            <Link href={`/areas/${area.slug}`} className="flex flex-col h-full">
              {/* =========================================================================
                  AREA PHOTOGRAPHIC CARD COVER WITH ZOOM ANIMATION
                  ========================================================================= */}
              <div className="relative h-48 w-full overflow-hidden bg-surface/50">
                <Image
                  src={meta.image}
                  alt={`${area.name} Ahmedabad PG Accommodation`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                />

                {/* Subtle vignette gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

                {/* Top Badge: Category Tag */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-black/60 border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                  <Sparkles size={12} className="text-accent" />
                  <span>{meta.tag}</span>
                </div>

                {/* Top Right: Property Count Pill */}
                <div className="absolute top-3 right-3 z-10 rounded-full bg-brand/90 border border-brand/50 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-md backdrop-blur-md">
                  {count} {count === 1 ? "Property" : "Properties"}
                </div>

                {/* Bottom Overlay Title on Image */}
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-md flex items-center justify-between">
                    <span>{area.name}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform duration-300 group-hover:bg-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight size={15} />
                    </span>
                  </h3>
                </div>
              </div>

              {/* =========================================================================
                  AREA DETAILS & CONNECTIVITY METRICS
                  ========================================================================= */}
              <div className="flex flex-col justify-between flex-1 p-5 space-y-4">
                <div>
                  <p className="text-xs text-mute line-clamp-2 leading-relaxed">
                    {meta.intro || area.intro}
                  </p>

                  <div className="mt-3.5 space-y-1.5 text-xs text-ink/80">
                    {/* Landmark */}
                    <div className="flex items-center gap-1.5 text-mute">
                      <MapPin size={13} className="text-brand shrink-0" />
                      <span className="truncate">{meta.landmark}</span>
                    </div>

                    {/* Metro */}
                    <div className="flex items-center gap-1.5 text-mute">
                      <Train size={13} className="text-accent shrink-0" />
                      <span className="truncate">{meta.metroStation} ({meta.distance})</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-ink/5 flex items-center justify-between text-xs font-bold text-brand group-hover:text-accent transition-colors">
                  <span>Explore All Stays in {area.name}</span>
                  <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
