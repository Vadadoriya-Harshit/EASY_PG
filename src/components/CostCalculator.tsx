"use client";
import { useState } from "react";
import Link from "next/link";
import { Calculator, ShieldCheck, Check, MessageSquare, ArrowRight } from "lucide-react";
import { inr } from "@/lib/utils";
import { SITE } from "@/lib/site";

interface CostCalculatorProps {
  initialSharing?: "single" | "double" | "triple";
  propertyName?: string;
}

export default function CostCalculator({ initialSharing = "double", propertyName }: CostCalculatorProps) {
  const [sharing, setSharing] = useState<"single" | "double" | "triple">(initialSharing);
  const [ac, setAc] = useState(true);
  const [foodPlan, setFoodPlan] = useState<"none" | "breakfast" | "two_meals" | "three_meals">("two_meals");
  const [laundry, setLaundry] = useState<"basic" | "ironed">("basic");

  // Rent base pricing
  const baseRent: Record<string, number> = {
    single: ac ? 9800 : 8800,
    double: ac ? 7800 : 6800,
    triple: ac ? 5800 : 5000,
  };

  const foodCost: Record<string, number> = {
    none: 0,
    breakfast: 1500,
    two_meals: 3200,
    three_meals: 4500,
  };

  const laundryCost: Record<string, number> = {
    basic: 0, // In-house automatic washing machine included
    ironed: 750, // Professional steam iron service (40 pcs)
  };

  const electricityEst = ac ? 650 : 200;
  const currentRent = baseRent[sharing];
  const currentFood = foodCost[foodPlan];
  const currentLaundry = laundryCost[laundry];
  const monthlyTotal = currentRent + currentFood + currentLaundry + electricityEst;
  const refundableDeposit = currentRent; // 1 month deposit

  const whatsappText = encodeURIComponent(
    `Hello Luxora PG! I calculated an estimate of ${inr(monthlyTotal)}/month for ${sharing} sharing (${ac ? "AC" : "Non-AC"})${propertyName ? ` at ${propertyName}` : ""}. I would like to schedule a visit.`
  );

  return (
    <div className="card card-3d overflow-hidden border border-ink/10 bg-surface shadow-[0_22px_50px_-10px_rgba(0,0,0,0.16),_inset_0_1px_1.5px_rgba(255,255,255,0.22)]">
      <div className="border-b border-ink/10 bg-gradient-to-r from-brand/10 via-accent/10 to-transparent p-5 sm:p-6">
        <div className="flex items-center gap-2 text-brand">
          <Calculator size={20} />
          <span className="text-xs font-bold uppercase tracking-wider">Transparent Cost Estimator</span>
        </div>
        <h3 className="mt-1 text-2xl font-bold">Calculate Your Real Monthly Living Expense</h3>
        <p className="mt-1 text-sm text-mute">
          No hidden electricity surcharges, zero brokerage, and 100% refundable security deposit.
        </p>
      </div>

      <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-12">
        {/* Left Inputs */}
        <div className="space-y-6 lg:col-span-7">
          {/* Sharing Type */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-mute">1. Choose Room Sharing</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { id: "single", label: "Single", sub: "Private Room" },
                { id: "double", label: "Double", sub: "Twin Sharing" },
                { id: "triple", label: "Triple", sub: "3-Bed Suite" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSharing(opt.id as any)}
                  className={`flex flex-col items-center rounded-xl border p-3 text-center transition ${
                    sharing === opt.id
                      ? "border-brand bg-brand/10 font-semibold text-brand"
                      : "border-ink/10 bg-bg/50 text-mute hover:border-ink/20 hover:text-ink"
                  }`}
                >
                  <span className="text-sm font-bold text-ink">{opt.label}</span>
                  <span className="text-[11px] text-mute">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AC Preference */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-mute">2. Climate Control</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setAc(true)}
                className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition ${
                  ac ? "border-brand bg-brand/10 font-semibold text-brand" : "border-ink/10 bg-bg/50 text-mute"
                }`}
              >
                <span>5-Star Inverter AC</span>
                {ac && <Check size={16} />}
              </button>
              <button
                onClick={() => setAc(false)}
                className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition ${
                  !ac ? "border-brand bg-brand/10 font-semibold text-brand" : "border-ink/10 bg-bg/50 text-mute"
                }`}
              >
                <span>Non-AC / Ventilated</span>
                {!ac && <Check size={16} />}
              </button>
            </div>
          </div>

          {/* Meals Plan */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-mute">3. Food / Meal Arrangement</label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { id: "none", title: "No Food", price: "+₹0" },
                { id: "breakfast", title: "Breakfast", price: "+₹1,500" },
                { id: "two_meals", title: "2 Meals (B+D)", price: "+₹3,200" },
                { id: "three_meals", title: "3 Full Meals", price: "+₹4,500" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setFoodPlan(m.id as any)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center text-xs transition ${
                    foodPlan === m.id
                      ? "border-brand bg-brand/10 font-semibold text-brand"
                      : "border-ink/10 bg-bg/50 text-mute hover:border-ink/20"
                  }`}
                >
                  <span className="font-semibold text-ink">{m.title}</span>
                  <span className="mt-0.5 text-[11px] text-mute">{m.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Laundry */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-mute">4. Laundry Preference</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setLaundry("basic")}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  laundry === "basic" ? "border-brand bg-brand/10 text-brand" : "border-ink/10 bg-bg/50 text-mute"
                }`}
              >
                <span className="text-sm font-semibold text-ink">Free Self-Wash</span>
                <span className="text-xs text-mute">In-house automatic machines included</span>
              </button>
              <button
                onClick={() => setLaundry("ironed")}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  laundry === "ironed" ? "border-brand bg-brand/10 text-brand" : "border-ink/10 bg-bg/50 text-mute"
                }`}
              >
                <span className="text-sm font-semibold text-ink">Wash + Steam Iron</span>
                <span className="text-xs text-mute">+₹750 / mo (40 garments)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Receipt */}
        <div className="flex flex-col justify-between rounded-2xl border border-ink/10 bg-bg/90 backdrop-blur-xl p-6 lg:col-span-5 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.1),_inset_0_1px_1px_rgba(255,255,255,0.15)]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-mute">Estimated Monthly Budget</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold text-brand sm:text-5xl">
                {inr(monthlyTotal)}
              </span>
              <span className="text-sm font-medium text-mute">/ month</span>
            </div>

            {/* Line Items */}
            <div className="mt-6 space-y-2.5 border-t border-ink/10 pt-4 text-xs text-mute">
              <div className="flex justify-between">
                <span>Room rent ({sharing} sharing, {ac ? "AC" : "Non-AC"})</span>
                <span className="font-semibold text-ink">{inr(currentRent)}</span>
              </div>
              <div className="flex justify-between">
                <span>Food & meals</span>
                <span className="font-semibold text-ink">{currentFood === 0 ? "Self-managed" : inr(currentFood)}</span>
              </div>
              <div className="flex justify-between">
                <span>Laundry service</span>
                <span className="font-semibold text-ink">{currentLaundry === 0 ? "Free in-house" : inr(currentLaundry)}</span>
              </div>
              <div className="flex justify-between">
                <span>Est. electricity sub-meter</span>
                <span className="font-semibold text-ink">~{inr(electricityEst)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-ink/15 pt-2 font-medium text-ink">
                <span>100% Refundable Deposit (One-time)</span>
                <span className="font-bold text-ok">{inr(refundableDeposit)}</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 flex flex-col gap-1.5 rounded-xl bg-ok/10 p-3 text-xs text-ok">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck size={15} /> Zero Brokerage · Direct Owner Management
              </div>
              <p className="text-[11px] opacity-90">
                Deposit refunded in 5 banking days upon 30-day written move-out notice.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-col gap-2">
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full gap-2 shadow-lg shadow-brand/20"
            >
              <MessageSquare size={16} /> WhatsApp Inquiry with this Budget
            </a>
            <Link
              href="/contact"
              className="btn btn-ghost w-full gap-2 text-xs"
            >
              Schedule Free Property Visit <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
