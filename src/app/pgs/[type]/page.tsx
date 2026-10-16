import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PGFinder from "@/components/PGFinder";
import DemoNotice from "@/components/DemoNotice";
import { listAreas, listProperties, isDemoStore } from "@/lib/repo";
import { parseFilters } from "@/lib/filter";
import { ShieldCheck, Lock, Wifi, Utensils, Bike, Moon, BookOpen, Clock } from "lucide-react";

export const revalidate = 60;
export const dynamicParams = false;
export const generateStaticParams = () => [{ type: "boys" }, { type: "girls" }];

const COPY = {
  boys: {
    title: "Boys PG Accommodation in Ahmedabad",
    eyebrow: "Student & Executive Stays",
    intro: "Modern, transparent boys PG residences across Satellite, Vastrapur, Navrangpura and Thaltej. Featuring dedicated motorbike parking, high-speed mesh Wi-Fi, 24/7 biometric keyless access, and quiet study hours.",
    badges: [
      { icon: Wifi, title: "100 Mbps Dual Wi-Fi", sub: "Mesh coverage across all rooms" },
      { icon: Bike, title: "Covered Bike Parking", sub: "24/7 CCTV surveillance" },
      { icon: BookOpen, title: "Silent Study Lounge", sub: "Designed for CAT, GATE & IT sprints" },
      { icon: Clock, title: "Flexible Keycard Access", sub: "Shift-friendly digital night logging" },
    ],
  },
  girls: {
    title: "Girls PG Accommodation in Ahmedabad",
    eyebrow: "Safe, Verified & Hygienic",
    intro: "Secure, verified girls PG residences in well-lit, gated residential societies. Complete peace of mind with 24/7 on-site female wardens, biometric turnstiles, fresh vegetarian meals, and doctor-on-call support.",
    badges: [
      { icon: ShieldCheck, title: "24/7 Female Warden", sub: "Full-time resident superintendent" },
      { icon: Lock, title: "Biometric Turnstiles", sub: "Multi-tier secure entry & visitor logs" },
      { icon: Utensils, title: "Nutritious Hot Meals", sub: "Hygienic Gujarati & Punjabi food" },
      { icon: Moon, title: "Prime Safe Localities", sub: "Well-lit avenues near metro stations" },
    ],
  },
} as const;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { type: string };
  searchParams: Record<string, string>;
}): Promise<Metadata> {
  const c = COPY[params.type as "boys" | "girls"];
  if (!c) return {};
  return {
    title: `${c.title} | Verified Rent & Rooms`,
    description: c.intro,
    alternates: { canonical: `/pgs/${params.type}` },
    robots: Object.keys(searchParams).length ? { index: false, follow: true } : undefined,
  };
}

export default async function TypePage({
  params,
  searchParams,
}: {
  params: { type: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const type = params.type as "boys" | "girls";
  if (!COPY[type]) notFound();
  const c = COPY[type];
  const [props, areas] = await Promise.all([listProperties(), listAreas()]);

  return (
    <>
      <PageHeader title={c.title} intro={c.intro} />

      {/* Feature Highlights Grid */}
      <div className="container-x pt-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {c.badges.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="card flex items-center gap-3.5 p-4 border-ink/10 bg-surface/80"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${type === "girls" ? "bg-pink-500/10 text-pink-600" : "bg-brand/10 text-brand"}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-ink">{b.title}</h4>
                  <p className="text-[11px] text-mute">{b.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="container-x py-10">
        <DemoNotice show={isDemoStore()} />
        <PGFinder
          properties={props.filter((p) => p.gender === type)}
          areas={areas}
          initial={parseFilters(searchParams, type)}
          lockGender={type}
        />
      </div>
    </>
  );
}
