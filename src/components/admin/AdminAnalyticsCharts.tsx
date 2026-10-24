"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
  BedDouble,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHLY_DATA = [
  { month: "May", leads: 42, visits: 18, rate: "42%" },
  { month: "Jun", leads: 68, visits: 31, rate: "45%" },
  { month: "Jul", leads: 112, visits: 58, rate: "51%" },
  { month: "Aug", leads: 145, visits: 76, rate: "52%" },
  { month: "Sep", leads: 130, visits: 64, rate: "49%" },
  { month: "Oct", leads: 168, visits: 89, rate: "53%" },
];

const LOCALITY_DISTRIBUTION = [
  { name: "Satellite", percent: 38, count: "64 leads", beds: "180 beds", color: "from-violet-500 to-purple-600", dot: "bg-purple-500" },
  { name: "Navrangpura", percent: 28, count: "48 leads", beds: "140 beds", color: "from-cyan-500 to-blue-600", dot: "bg-cyan-500" },
  { name: "Vastrapur", percent: 20, count: "34 leads", beds: "110 beds", color: "from-emerald-500 to-teal-600", dot: "bg-emerald-500" },
  { name: "Thaltej", percent: 14, count: "22 leads", beds: "70 beds", color: "from-amber-500 to-orange-600", dot: "bg-amber-500" },
];

const SHARING_DEMAND = [
  { type: "Private Single AC", percent: 44, color: "#6366f1", tailwind: "bg-indigo-500", inq: "128 leads" },
  { type: "Twin Sharing", percent: 38, color: "#06b6d4", tailwind: "bg-cyan-500", inq: "110 leads" },
  { type: "Triple Budget", percent: 18, color: "#10b981", tailwind: "bg-emerald-500", inq: "52 leads" },
];

const PEAK_HOURS = [
  { slot: "11:00 AM", traffic: 22, label: "Morning" },
  { slot: "02:30 PM", traffic: 18, label: "Afternoon" },
  { slot: "05:00 PM", traffic: 36, label: "Peak Evening", highlight: true },
  { slot: "06:30 PM", traffic: 24, label: "Post-Work" },
];

const FUNNEL_STAGES = [
  { stage: "Website Search Visitors", count: "3,420", drop: "100%", percent: 100, color: "bg-brand" },
  { stage: "Inquiry Forms & Chats", count: "568", drop: "16.6%", percent: 70, color: "bg-purple-500" },
  { stage: "Walkthrough Visits Booked", count: "286", drop: "8.3%", percent: 48, color: "bg-accent" },
  { stage: "Confirmed Bed Admissions", count: "142", drop: "4.1%", percent: 28, color: "bg-emerald-500" },
];

export default function AdminAnalyticsCharts() {
  const [activePoint, setActivePoint] = useState<number | null>(5); // default October
  const [activeDonut, setActiveDonut] = useState<number | null>(0);

  const maxLeads = 180;
  const svgWidth = 500;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 25;

  // Generate SVG coordinates for monthly line chart
  const points = MONTHLY_DATA.map((d, i) => {
    const x = paddingX + (i / (MONTHLY_DATA.length - 1)) * (svgWidth - 2 * paddingX);
    const y = svgHeight - paddingY - (d.leads / maxLeads) * (svgHeight - 2 * paddingY);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  // SVG Donut Calculations
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* =========================================================================
          CHART 1: MONTHLY LEADS & INQUIRY GROWTH TRAJECTORY (7 COLS)
          ========================================================================= */}
      <div className="lg:col-span-7 card p-6 space-y-5 border-brand/20 relative overflow-hidden bg-gradient-to-b from-surface via-surface to-brand/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <BarChart3 size={16} />
              </span>
              <h3 className="font-bold text-base text-ink">Inquiry & Tour Growth Velocity</h3>
            </div>
            <p className="text-xs text-mute mt-0.5">Semester admission inquiries & physical walk-ins</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={12} /> +29.2% MoM
            </span>
          </div>
        </div>

        {/* SVG Curved Area Graph */}
        <div className="relative pt-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-48 overflow-visible"
            aria-label="Monthly Inquiries Line Chart"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--brand))" stopOpacity="0.45" />
                <stop offset="100%" stopColor="rgb(var(--brand))" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(var(--accent))" />
                <stop offset="100%" stopColor="rgb(var(--brand))" />
              </linearGradient>
            </defs>

            {/* Subtle Grid Guidelines */}
            {[0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = svgHeight - paddingY - ratio * (svgHeight - 2 * paddingY);
              return (
                <line
                  key={ratio}
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Gradient Fill under the Curve */}
            <path d={areaD} fill="url(#areaGradient)" />

            {/* Bold Glowing Line */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Nodes */}
            {points.map((pt, idx) => {
              const isActive = activePoint === idx;
              return (
                <g key={pt.month} className="cursor-pointer" onClick={() => setActivePoint(idx)}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 6.5 : 4}
                    className={cn(
                      "transition-all duration-200",
                      isActive
                        ? "fill-brand stroke-white stroke-[2.5px] drop-shadow"
                        : "fill-surface stroke-brand stroke-2 hover:r-6"
                    )}
                  />

                  {/* Month Label below */}
                  <text
                    x={pt.x}
                    y={svgHeight - 5}
                    textAnchor="middle"
                    className={cn(
                      "text-[11px] font-bold transition-colors",
                      isActive ? "fill-brand" : "fill-mute"
                    )}
                  >
                    {pt.month}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Active Data Tooltip Indicator */}
          {activePoint !== null && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-ink/5 p-3 text-xs border border-ink/10">
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink">{MONTHLY_DATA[activePoint].month} 2026:</span>
                <span className="font-bold text-brand">{MONTHLY_DATA[activePoint].leads} Total Inquiries</span>
                <span className="text-mute">·</span>
                <span className="font-semibold text-accent">{MONTHLY_DATA[activePoint].visits} Visits Scheduled</span>
              </div>
              <span className="rounded-md bg-brand/10 px-2 py-0.5 font-bold text-brand text-[11px]">
                {MONTHLY_DATA[activePoint].rate} Visit Conv.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          CHART 2: LOCALITY SHARE & OCCUPANCY (5 COLS)
          ========================================================================= */}
      <div className="lg:col-span-5 card p-6 space-y-5 border-accent/20 bg-gradient-to-b from-surface via-surface to-accent/[0.02]">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <PieIcon size={16} />
            </span>
            <h3 className="font-bold text-base text-ink">Locality Demand Share</h3>
          </div>
          <span className="text-xs text-mute">4 Ahmedabad Hubs</span>
        </div>

        {/* Visual Progress Bars for Each Locality */}
        <div className="space-y-4">
          {LOCALITY_DISTRIBUTION.map((loc) => (
            <div key={loc.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", loc.dot)} />
                  <span className="font-bold text-ink">{loc.name}</span>
                  <span className="text-mute text-[11px]">({loc.beds})</span>
                </div>
                <div className="flex items-center gap-2 font-mono font-bold">
                  <span className="text-mute text-[11px]">{loc.count}</span>
                  <span className="text-ink">{loc.percent}%</span>
                </div>
              </div>

              {/* Progress Bar with Gradient */}
              <div className="h-2.5 w-full rounded-full bg-ink/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${loc.percent}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn("h-full rounded-full bg-gradient-to-r", loc.color)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Summary Pill */}
        <div className="pt-2 border-t border-ink/10 flex items-center justify-between text-xs text-mute">
          <span className="flex items-center gap-1 font-semibold text-ink">
            <CheckCircle2 size={13} className="text-emerald-500" /> Satellite is Top Performer
          </span>
          <span className="text-[11px]">98% Beds Filled</span>
        </div>
      </div>

      {/* =========================================================================
          CHART 3: SHARING TYPE DONUT & PEAK WALKTHROUGH SLOTS (12 COLS)
          ========================================================================= */}
      <div className="lg:col-span-12 grid gap-6 md:grid-cols-2">
        {/* Sub-Chart A: Sharing Preference Donut */}
        <div className="card p-6 space-y-4 border-ink/10 bg-surface/80">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <BedDouble size={16} />
              </span>
              <h3 className="font-bold text-sm text-ink">Room Category Preference</h3>
            </div>
            <span className="text-[11px] text-mute font-medium">Single vs Twin vs Triple</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="14" />
                {SHARING_DEMAND.map((item, i) => {
                  const dashArray = (item.percent / 100) * circumference;
                  const dashOffset = -(accumulatedPercent / 100) * circumference;
                  accumulatedPercent += item.percent;
                  const isHovered = activeDonut === i;
                  return (
                    <circle
                      key={item.type}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={isHovered ? 16 : 14}
                      strokeDasharray={`${dashArray} ${circumference}`}
                      strokeDashoffset={dashOffset}
                      className="cursor-pointer transition-all duration-300"
                      onMouseEnter={() => setActiveDonut(i)}
                    />
                  );
                })}
              </svg>
              <div className="absolute text-center">
                <span className="block font-display text-xl font-black text-ink">
                  {SHARING_DEMAND[activeDonut ?? 0].percent}%
                </span>
                <span className="block text-[10px] uppercase font-bold text-mute">
                  Popularity
                </span>
              </div>
            </div>

            {/* Sharing Legend */}
            <div className="space-y-3 w-full text-xs">
              {SHARING_DEMAND.map((s, idx) => (
                <div
                  key={s.type}
                  onClick={() => setActiveDonut(idx)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer",
                    activeDonut === idx ? "bg-ink/5 border-ink/20 shadow-sm" : "border-transparent hover:bg-ink/5"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn("h-3 w-3 rounded-md", s.tailwind)} />
                    <span className="font-semibold text-ink">{s.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-mute text-[11px] font-mono">{s.inq}</span>
                    <strong className="text-ink font-bold">{s.percent}%</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-Chart B: Peak Walkthrough Schedule Slots */}
        <div className="card p-6 space-y-4 border-ink/10 bg-surface/80">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Clock size={16} />
              </span>
              <h3 className="font-bold text-sm text-ink">Guided Tour Booking Distribution</h3>
            </div>
            <span className="text-[11px] text-mute font-medium">Walkthrough Time Preferences</span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {PEAK_HOURS.map((hr) => (
              <div
                key={hr.slot}
                className={cn(
                  "rounded-2xl border p-3 flex flex-col items-center text-center justify-between relative transition-all",
                  hr.highlight
                    ? "border-brand/40 bg-brand/10 shadow-sm"
                    : "border-ink/10 bg-ink/5"
                )}
              >
                {hr.highlight && (
                  <span className="absolute -top-2.5 rounded-full bg-brand px-2 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
                    Peak
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-mute mt-1">
                  {hr.label}
                </span>
                <span className="font-display text-xl font-black text-ink my-1">
                  {hr.traffic}%
                </span>
                <span className="text-xs font-mono font-semibold text-brand">
                  {hr.slot}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-mute leading-relaxed pt-1">
            * 5:00 PM is the highest demand slot due to university classes & corporate office wrap-ups in Ahmedabad.
          </p>
        </div>
      </div>

      {/* =========================================================================
          CHART 4: CONVERSION FUNNEL PIPELINE (12 COLS FULL WIDTH)
          ========================================================================= */}
      <div className="lg:col-span-12 card p-6 space-y-5 border-ink/10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
          <div>
            <h3 className="font-bold text-base text-ink flex items-center gap-2">
              <Layers size={17} className="text-brand" />
              Visitor-to-Resident Conversion Funnel
            </h3>
            <p className="text-xs text-mute mt-0.5">Step-by-step telemetry from website discovery to verified check-in</p>
          </div>
          <span className="text-xs font-bold text-brand">Overall Conversion: 4.1%</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FUNNEL_STAGES.map((stage, idx) => (
            <div
              key={stage.stage}
              className="rounded-2xl border border-ink/10 bg-surface/60 p-4 space-y-2 relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs text-mute">
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Stage 0{idx + 1}</span>
                <span className="font-bold text-ink">{stage.drop}</span>
              </div>

              <h4 className="font-bold text-xs text-ink">{stage.stage}</h4>
              <p className="font-display text-2xl font-black text-brand">{stage.count}</p>

              {/* Progress Meter */}
              <div className="h-1.5 w-full rounded-full bg-ink/10 overflow-hidden mt-2">
                <div className={cn("h-full rounded-full", stage.color)} style={{ width: `${stage.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
