"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ExternalLink, ShieldCheck, Sparkles, Building2, MapPin, Users, UserCheck, BellRing } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AdminProfileDropdown from "./AdminProfileDropdown";

interface AdminHeaderProps {
  user: {
    email: string;
    name?: string;
    role?: string;
    avatar?: string;
    phone?: string;
    sid?: string;
  };
  onMenuToggle: () => void;
}

export default function AdminHeader({ user, onMenuToggle }: AdminHeaderProps) {
  const pathname = usePathname();

  // Dynamic breadcrumb section name
  const getPageTitle = () => {
    if (pathname === "/admin") return { title: "Leads CRM & Activity", icon: Users };
    if (pathname.startsWith("/admin/vacancies")) return { title: "Bed Vacancy Radar & Waitlist", icon: BellRing };
    if (pathname.startsWith("/admin/properties")) return { title: "Properties & Room Vacancies", icon: Building2 };
    if (pathname.startsWith("/admin/areas")) return { title: "Localities & Transit Zones", icon: MapPin };
    if (pathname.startsWith("/admin/cms")) return { title: "Visual CMS & Media Assets", icon: Sparkles };
    if (pathname.startsWith("/admin/users")) return { title: "Admin Team & Permissions", icon: ShieldCheck };
    if (pathname.startsWith("/admin/profile")) return { title: "Operator Profile & Security", icon: UserCheck };
    return { title: "Administration", icon: ShieldCheck };
  };

  const { title, icon: TitleIcon } = getPageTitle();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-ink/10 bg-surface/90 px-4 sm:px-8 backdrop-blur-xl">
      {/* Left: Mobile Menu Toggle + Breadcrumbs Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden rounded-xl p-2 text-mute hover:bg-ink/5 hover:text-ink transition focus:outline-none"
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <TitleIcon size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-mute">
              Admin Portal /
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-ink tracking-tight">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* Right Tools: Live Indicator, Website Link, Theme Toggle, Profile Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Live Website Preview Link */}
        <Link
          href="/"
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-bg px-3.5 py-1.5 text-xs font-semibold text-mute hover:text-ink transition hover:border-brand/40 shadow-2xs"
          title="Open live resident website in new tab"
        >
          <span>Live Site</span>
          <ExternalLink size={12} />
        </Link>

        {/* Theme Dark/Light Mode Toggle */}
        <ThemeToggle />

        {/* User Profile Avatar with Click Dropdown */}
        <AdminProfileDropdown user={user} />
      </div>
    </header>
  );
}
