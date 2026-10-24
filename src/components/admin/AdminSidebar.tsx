"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import {
  Users,
  Building2,
  MapPin,
  Sparkles,
  Shield,
  UserCheck,
  ExternalLink,
  LogOut,
  X,
  LayoutDashboard,
  Layers,
  ChevronRight,
  Database,
  BellRing,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  user: {
    email: string;
    name?: string;
    role?: string;
    avatar?: string;
    phone?: string;
  };
  isOpen?: boolean;
  demo?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ user, isOpen, demo, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const navGroups = [
    {
      title: "OVERVIEW",
      items: [
        {
          href: "/admin",
          label: "Inquiries & CRM",
          icon: LayoutDashboard,
          badge: "Live Leads",
        },
        {
          href: "/admin/vacancies",
          label: "Bed Vacancy Radar",
          icon: BellRing,
          badge: "Subscribers",
        },
      ],
    },
    {
      title: "INVENTORY & ROOMS",
      items: [
        {
          href: "/admin/properties",
          label: "Properties & Rooms",
          icon: Building2,
        },
        {
          href: "/admin/areas",
          label: "Localities & Transit",
          icon: MapPin,
        },
        {
          href: "/admin/forms",
          label: "Forms & Responses",
          icon: ClipboardList,
        },
      ],
    },
    {
      title: "PUBLIC WEBSITE",
      items: [
        {
          href: "/admin/cms",
          label: "Visual CMS & Content",
          icon: Sparkles,
        },
      ],
    },
    {
      title: "OPERATOR & ACCESS",
      items: [
        {
          href: "/admin/profile",
          label: "My Profile & Photo",
          icon: UserCheck,
        },
        ...(user.role === "superadmin"
          ? [
              { href: "/admin/users", label: "Admin Team", icon: Shield },
              { href: "/admin/audit", label: "Security audit log", icon: Database },
            ]
          : []),
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("luxora_admin_tab_active");
        sessionStorage.removeItem("luxora_otp_pending");
      }
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/admin/login";
  };

  const isSuper = user.role === "superadmin";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-ink/10 bg-surface/95 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-xl lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-ink/10 px-6">
          <Link href="/admin" onClick={onClose} className="hover:opacity-95 transition">
            <Logo showTagline={true} className="!text-sm" />
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden rounded-xl p-1.5 text-mute hover:bg-ink/5 hover:text-ink transition"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Data store status: reflects the real configuration, not a fixed label */}
        <div
          role="status"
          className={cn(
            "mx-5 my-3.5 flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold",
            demo
              ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          )}
        >
          <span className="flex items-center gap-2">
            <span className={cn("inline-flex h-2 w-2 rounded-full", demo ? "bg-amber-500" : "bg-emerald-500")} />
            {demo ? "Demo data" : "Database"}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider opacity-90">{demo ? "resets on restart" : "MongoDB"}</span>
        </div>

        {/* Navigation Menus */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <span className="px-3 text-[10px] font-bold tracking-widest text-mute/80 uppercase">
                {group.title}
              </span>
              <div className="mt-1 space-y-1">
                {group.items.map(({ href, label, icon: Icon, badge }: any) => {
                  const isActive =
                    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-150",
                        isActive
                          ? "bg-brand text-white shadow-md shadow-brand/25"
                          : "text-mute hover:bg-ink/5 hover:text-ink"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={16}
                          className={cn(
                            "transition-transform group-hover:scale-110",
                            isActive ? "text-white" : "text-brand"
                          )}
                        />
                        <span>{label}</span>
                      </div>

                      {badge ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-brand/10 text-brand"
                          )}
                        >
                          {badge}
                        </span>
                      ) : (
                        <ChevronRight
                          size={13}
                          className={cn(
                            "opacity-0 transition-opacity group-hover:opacity-100",
                            isActive && "opacity-100 text-white"
                          )}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Operator Mini Card */}
        <div className="border-t border-ink/10 p-4 bg-ink/[0.02]">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-surface p-2.5 shadow-xs">
            <Link
              href="/admin/profile"
              onClick={onClose}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition"
              title="View Profile"
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-brand/30 bg-surface shadow-xs">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "Admin"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand to-accent text-white font-extrabold text-xs uppercase">
                    {(user.name || "AD").slice(0, 2)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-surface" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-ink truncate">
                  {user.name || "Admin"}
                </span>
                <span className="block text-[10px] text-mute font-semibold truncate">
                  {isSuper ? "Super Admin" : "Coordinator"}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl p-2 text-mute hover:bg-warn/10 hover:text-warn transition shrink-0"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
