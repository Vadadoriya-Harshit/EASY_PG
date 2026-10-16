import { Wifi, Utensils, WashingMachine, Sparkles, ShieldCheck, Car, Zap, Droplets, Check } from "lucide-react";

const map: Record<string, any> = {
  wifi: Wifi, meals: Utensils, laundry: WashingMachine, housekeeping: Sparkles,
  cctv: ShieldCheck, parking: Car, "power-backup": Zap, water: Droplets,
};
export default function FacilityIcon({ k, size = 16, className }: { k: string; size?: number; className?: string }) {
  const I = map[k] || Check;
  return <I size={size} className={className} aria-hidden="true" />;
}
