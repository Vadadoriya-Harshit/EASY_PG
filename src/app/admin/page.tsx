import Link from "next/link";
import {
  Users,
  Building2,
  CalendarCheck,
  Flame,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Image as ImageIcon,
  Sliders,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Clock,
  PhoneCall,
  MessageSquare
} from "lucide-react";
import { eventCounts, listInquiries, listProperties } from "@/lib/repo";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import InquiryTable from "@/components/admin/InquiryTable";
import AdminAnalyticsCharts from "@/components/admin/AdminAnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [inq, props, ev] = await Promise.all([
    listInquiries(),
    listProperties({ includeDraft: true }),
    eventCounts(),
  ]);

  const newCount = inq.filter((i) => i.status === "new").length;
  const visitCount = inq.filter((i) => i.status === "visit-scheduled").length;
  const convertedCount = inq.filter((i) => i.status === "converted").length;
  const totalCount = inq.length;

  const interest = Object.entries(
    inq.reduce<Record<string, number>>((m, i) => {
      if (i.propertySlug) m[i.propertySlug] = (m[i.propertySlug] || 0) + 1;
      return m;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const getPropertyName = (s: string) => props.find((p) => p.slug === s)?.name || s;

  return (
    <div className="space-y-8">
      {/* =========================================================================
          EXECUTIVE WELCOME BANNER & SHORTCUTS
          ========================================================================= */}
      <div className="rounded-3xl border border-brand/20 bg-gradient-to-r from-brand/15 via-surface to-accent/15 p-6 sm:p-8 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                Operations & Management Center
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight">
              Luxora PG Control Panel
            </h1>

            <p className="text-xs sm:text-sm text-mute max-w-2xl leading-relaxed">
              Manage visitor lead inquiries, room allocations, property photos, area landmarks, and real-time website CMS text.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/cms"
              className="btn btn-primary text-xs gap-1.5 py-2.5 px-4 shadow-lg shadow-brand/25"
            >
              <ImageIcon size={15} />
              <span>Visual CMS & Images</span>
              <ArrowUpRight size={13} />
            </Link>

            <Link
              href="/"
              target="_blank"
              className="btn btn-ghost text-xs gap-1.5 py-2.5 px-4"
            >
              <span>Live Website</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/20 blur-[100px] pointer-events-none" />
      </div>

      {/* =========================================================================
          KEY PERFORMANCE METRICS (KPIs)
          ========================================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5 border-brand/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-mute">
              Incoming Inquiries
            </span>
            <span className="rounded-full bg-brand/10 p-2 text-brand">
              <Users size={18} />
            </span>
          </div>
          <p className="font-display text-3xl sm:text-4xl font-black text-ink mt-2">
            {totalCount}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-mute">
            <span className="text-brand font-bold">{newCount} New</span> leads pending review
          </div>
        </div>

        <div className="card p-5 border-accent/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-mute">
              Visits Scheduled
            </span>
            <span className="rounded-full bg-accent/10 p-2 text-accent">
              <CalendarCheck size={18} />
            </span>
          </div>
          <p className="font-display text-3xl sm:text-4xl font-black text-ink mt-2">
            {visitCount}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-mute">
            <span className="text-accent font-bold">{convertedCount} Converted</span> to residents
          </div>
        </div>

        <div className="card p-5 border-emerald-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-mute">
              Campus Admissions
            </span>
            <span className="rounded-full bg-emerald-500/10 p-2 text-emerald-500">
              <Flame size={18} />
            </span>
          </div>
          <p className="font-display text-3xl sm:text-4xl font-black text-ink mt-2">
            92%
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>High semester occupancy</span>
          </div>
        </div>

        <div className="card p-5 border-purple-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-mute">
              Active Properties
            </span>
            <span className="rounded-full bg-purple-500/10 p-2 text-purple-500">
              <Building2 size={18} />
            </span>
          </div>
          <p className="font-display text-3xl sm:text-4xl font-black text-ink mt-2">
            {props.length}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-mute">
            Across 4 key Ahmedabad hubs
          </div>
        </div>
      </div>

      {/* =========================================================================
          QUICK ACTIONS & CONTENT MANAGEMENT HUB
          ========================================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/cms"
          className="group card p-5 hover:border-brand/50 hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition">
              <ImageIcon size={20} />
            </div>
            <ArrowUpRight size={16} className="text-mute group-hover:text-brand transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <h3 className="font-bold text-sm text-ink mt-4">Section Images & Hero Media</h3>
          <p className="text-xs text-mute mt-1">Change slideshow photos, headline lines, and eyebrow badges.</p>
        </Link>

        <Link
          href="/admin/properties"
          className="group card p-5 hover:border-accent/50 hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition">
              <Building2 size={20} />
            </div>
            <ArrowUpRight size={16} className="text-mute group-hover:text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <h3 className="font-bold text-sm text-ink mt-4">Properties & Room Inventory</h3>
          <p className="text-xs text-mute mt-1">Edit room prices, AC sharing options, facilities and house rules.</p>
        </Link>

        <Link
          href="/admin/areas"
          className="group card p-5 hover:border-emerald-500/50 hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition">
              <MapPin size={20} />
            </div>
            <ArrowUpRight size={16} className="text-mute group-hover:text-emerald-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <h3 className="font-bold text-sm text-ink mt-4">Localities & Transit Routes</h3>
          <p className="text-xs text-mute mt-1">Update Satellite, Navrangpura, Vastrapur & Thaltej metro details.</p>
        </Link>

        <Link
          href="/admin/cms"
          className="group card p-5 hover:border-purple-500/50 hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition">
              <Sliders size={20} />
            </div>
            <ArrowUpRight size={16} className="text-mute group-hover:text-purple-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <h3 className="font-bold text-sm text-ink mt-4">SEO & Announcement Ticker</h3>
          <p className="text-xs text-mute mt-1">Live top notification bar, phone & WhatsApp contact desk.</p>
        </Link>
      </div>

      {/* =========================================================================
          INTERACTIVE ANALYTICS: GROWTH CHARTS, LOCALITY DEMAND & FUNNEL
          ========================================================================= */}
      <AdminAnalyticsCharts />

      {/* =========================================================================
          ACTIVITY ENGAGEMENT & MOST-REQUESTED STAYS
          ========================================================================= */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Requested Properties */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
              <TrendingUp size={16} className="text-brand" />
              Most-Requested Properties
            </h3>
            <span className="text-[11px] text-mute font-medium">Ranked by Inquiry Volume</span>
          </div>

          {interest.length ? (
            <div className="space-y-3">
              {interest.map(([slug, count]) => {
                const percent = Math.min(Math.round((count / Math.max(...interest.map((x) => x[1]))) * 100), 100);
                return (
                  <div key={slug} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-ink">{getPropertyName(slug)}</span>
                      <span className="text-brand">{count} {count === 1 ? "lead" : "leads"}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-ink/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-mute py-4 text-center">No inquiry requests logged yet.</p>
          )}
        </div>

        {/* Live Website Interaction Metrics */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              Live Website Interaction Telemetry
            </h3>
            <span className="text-[11px] text-mute font-medium">Anonymous Session Signals</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { key: "search", label: "Filter Searches", icon: Sliders },
              { key: "cta_whatsapp", label: "WhatsApp Taps", icon: MessageSquare },
              { key: "cta_call", label: "Phone Calls", icon: PhoneCall },
              { key: "visit_submit", label: "Visits Scheduled", icon: CalendarCheck },
              { key: "inquiry_submit", label: "Forms Submitted", icon: Users },
              { key: "smart_match", label: "AI Matches", icon: Sparkles },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-ink/5 border border-ink/5">
                <div className="flex items-center gap-2 text-mute">
                  <Icon size={14} className="text-brand" />
                  <span className="truncate">{label}</span>
                </div>
                <span className="font-mono font-bold text-ink">{ev[key] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          INQUIRY LEADS PIPELINE TABLE
          ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Users size={20} className="text-brand" />
            Visitor Inquiries & Lead Pipeline
          </h2>
          <span className="text-xs text-mute">Real-time visitor inquiry submissions</span>
        </div>

        <InquiryTable
          initial={inq}
          propertyNames={Object.fromEntries(props.map((p) => [p.slug, p.name]))}
        />
      </div>
    </div>
  );
}
