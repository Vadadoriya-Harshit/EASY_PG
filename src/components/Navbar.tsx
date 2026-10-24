"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  Building2,
  Users,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  MessageSquare,
  BellRing
} from "lucide-react";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import DynamicIcon from "./DynamicIcon";
import VacancyAlertModal from "./VacancyAlertModal";
import { DEFAULT_CMS_DATA, type NavGroupConfig } from "@/lib/cms-defaults";

export default function Navbar() {
  const path = usePathname();
  const [isVacancyModalOpen, setIsVacancyModalOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);

  const [navData, setNavData] = useState<{
    announcement: string;
    announcementLink: string;
    ctaLabel: string;
    ctaHref: string;
    groups: NavGroupConfig[];
    phone: string;
    whatsapp: string;
  }>({
    announcement: DEFAULT_CMS_DATA.navigation.announcement,
    announcementLink: DEFAULT_CMS_DATA.navigation.announcementLink,
    ctaLabel: DEFAULT_CMS_DATA.navigation.ctaLabel,
    ctaHref: DEFAULT_CMS_DATA.navigation.ctaHref,
    groups: DEFAULT_CMS_DATA.navigation.groups,
    phone: DEFAULT_CMS_DATA.contact.phone,
    whatsapp: DEFAULT_CMS_DATA.contact.whatsapp,
  });

  useEffect(() => {
    const fetchSettings = () => {
      fetch("/api/site-settings")
        .then((r) => r.json())
        .then((res) => {
          if (res.ok && res.data) {
            const nav = res.data.navigation || DEFAULT_CMS_DATA.navigation;
            const contact = res.data.contact || DEFAULT_CMS_DATA.contact;
            setNavData({
              announcement: nav.announcement || contact.announcement || DEFAULT_CMS_DATA.navigation.announcement,
              announcementLink: nav.announcementLink || DEFAULT_CMS_DATA.navigation.announcementLink,
              ctaLabel: nav.ctaLabel || DEFAULT_CMS_DATA.navigation.ctaLabel,
              ctaHref: nav.ctaHref || DEFAULT_CMS_DATA.navigation.ctaHref,
              groups: nav.groups && nav.groups.length > 0 ? nav.groups : DEFAULT_CMS_DATA.navigation.groups,
              phone: contact.phone || SITE.phone,
              whatsapp: contact.whatsapp || SITE.whatsapp,
            });
          }
        })
        .catch(() => {});
    };
    fetchSettings();
    window.addEventListener("sorath_cms_updated", fetchSettings);
    window.addEventListener("luxora_cms_updated", fetchSettings);
    return () => {
      window.removeEventListener("sorath_cms_updated", fetchSettings);
      window.removeEventListener("luxora_cms_updated", fetchSettings);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setActiveDropdown(null);
  }, [path]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (path.startsWith("/admin")) return null;

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const cleanPhone = navData.phone.replace(/[^0-9+]/g, "");
  const cleanWa = navData.whatsapp.replace(/[^0-9]/g, "");

  return (
    <>
      {/* Sticky wrapper: keeps announcement bar + nav bar together when scrolled */}
      <header
        className="sticky top-0 z-50 w-full"
      >
        {/* Top Notification Ticker Bar (Dynamic from CMS) */}
        <div className={cn(
          "bg-gradient-to-r from-brand via-purple-700 to-accent text-white py-1.5 text-xs font-medium transition-all duration-300 relative z-50",
          scrolled ? "max-h-0 py-0 opacity-0 overflow-hidden" : "max-h-12 opacity-100"
        )}>
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <Link href={navData.announcementLink || "/pgs"} className="truncate hover:underline">
                <strong>Official Notice:</strong> {navData.announcement}
              </Link>
            </div>
            <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs">
              <a
                href={`https://wa.me/${cleanWa}?text=${encodeURIComponent("Hello Luxora PG! I would like to book a free visit.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-emerald-300 transition"
              >
                <MessageSquare size={13} /> WhatsApp {navData.whatsapp}
              </a>
              <span className="text-white/40">|</span>
              <a href={`tel:${cleanPhone}`} className="flex items-center gap-1.5 hover:text-cyan-200 transition">
                <PhoneCall size={13} /> {navData.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div
          className={cn(
            "w-full transition-all duration-300 relative",
            scrolled
              ? "bg-surface/95 backdrop-blur-2xl border-b border-ink/15 shadow-xl shadow-black/5 dark:shadow-black/40"
              : "bg-surface/90 backdrop-blur-xl border-b border-ink/10 shadow-sm shadow-black/5"
          )}
        >
          <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-brand/40 to-transparent pointer-events-none" />

          <div className={cn("w-full max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-8 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300", scrolled ? "h-16" : "h-16 sm:h-20")}>
            {/* Brand Logo */}
            <Link href="/" aria-label="Luxora PG Home" className="shrink-0 min-w-0">
              <Logo />
            </Link>

            {/* Dynamic Desktop Navigation Dropdowns */}
            <nav aria-label="Primary" className="hidden xl:flex items-center gap-1 xl:gap-1.5 2xl:gap-2">
            {navData.groups.map((group) => {
              const isOpen = activeDropdown === group.label;
              return (
                <div
                  key={group.label}
                  className="relative shrink-0"
                  onMouseEnter={() => handleMouseEnter(group.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold tracking-wide whitespace-nowrap shrink-0 transition duration-150",
                      isOpen
                        ? "bg-brand/10 text-brand font-bold ring-1 ring-brand/20"
                        : "text-ink/80 hover:text-brand hover:bg-brand/5"
                    )}
                    aria-expanded={isOpen}
                  >
                    <span className="whitespace-nowrap">{group.label}</span>
                    <ChevronDown
                      size={13}
                      className={cn("transition-transform duration-200 shrink-0", isOpen ? "rotate-180 text-brand" : "text-mute")}
                    />
                  </button>

                  {/* Dropdown Menu Box */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="absolute left-0 top-full pt-2 z-[100] w-84"
                      >
                        <div className="rounded-2xl border border-ink/15 bg-surface p-2.5 shadow-2xl shadow-black/25 ring-1 ring-black/5 dark:ring-white/10">
                          {group.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="group flex items-start gap-3 rounded-xl p-2.5 transition-all duration-150 hover:bg-brand/10 dark:hover:bg-brand/15"
                            >
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand transition group-hover:bg-brand group-hover:text-white">
                                <DynamicIcon name={item.icon} size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="text-xs font-bold text-ink group-hover:text-brand transition-colors whitespace-nowrap">
                                    {item.title}
                                  </p>
                                  {item.tag && (
                                    <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-[9px] font-extrabold text-brand whitespace-nowrap shrink-0">
                                      {item.tag}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[11px] text-mute line-clamp-1 leading-snug">
                                  {item.desc}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

              {/* Direct Links */}
              <Link
                href="/about"
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-semibold tracking-wide whitespace-nowrap shrink-0 transition duration-150",
                  path === "/about"
                    ? "bg-brand/10 text-brand font-bold ring-1 ring-brand/20"
                    : "text-ink/80 hover:text-brand hover:bg-brand/5"
                )}
              >
                About
              </Link>
              <Link
                href="/contact"
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-semibold tracking-wide whitespace-nowrap shrink-0 transition duration-150",
                  path === "/contact"
                    ? "bg-brand/10 text-brand font-bold ring-1 ring-brand/20"
                    : "text-ink/80 hover:text-brand hover:bg-brand/5"
                )}
              >
                Contact
              </Link>
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <ThemeToggle />

              {/* Bed Vacancy Alert Button */}
              <button
                type="button"
                onClick={() => setIsVacancyModalOpen(true)}
                className="hidden xl:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border border-brand/30 bg-brand/10 text-brand hover:bg-brand hover:text-white transition shadow-2xs whitespace-nowrap shrink-0 active:scale-95"
                title="Get notified when a bed opens up"
              >
                <BellRing size={13} className="shrink-0" />
                <span>Bed Radar</span>
              </button>

              <Link
                href="/match"
                className="hidden sm:inline-flex items-center gap-1.5 btn btn-primary text-xs py-2 px-3.5 sm:px-4 shadow-md shadow-brand/25 hover:shadow-lg hover:shadow-brand/35 transition-all duration-200 active:scale-95 whitespace-nowrap shrink-0"
              >
                <Sparkles size={14} className="shrink-0" />
                <span className="whitespace-nowrap font-bold">Smart PG Match</span>
              </Link>

              <Link
                href={navData.ctaHref || "/contact"}
                className="hidden 2xl:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold border border-ink/15 bg-surface/80 text-ink hover:border-brand/40 hover:bg-brand/5 hover:text-brand shadow-sm transition-all duration-200 whitespace-nowrap shrink-0"
              >
                <span className="whitespace-nowrap">{navData.ctaLabel || "Schedule Free Visit"}</span>
              </Link>

              {/* Mobile Menu Hamburger */}
              <button
                className="grid h-10 w-10 place-items-center rounded-xl border border-ink/15 bg-surface/80 text-ink hover:border-brand/40 hover:bg-brand/5 hover:text-brand transition shadow-sm active:scale-95 shrink-0 xl:hidden"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={() => setOpen(!open)}
              >
                {open ? <X size={19} /> : <Menu size={19} />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer Menu */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="border-b border-ink/15 bg-surface xl:hidden overflow-hidden shadow-2xl z-[100]"
              >
                <div className="container-x py-5 space-y-4 max-h-[80vh] overflow-y-auto">
                  {/* Quick Category Chips */}
                  <div className="flex items-center gap-2 pb-2 border-b border-ink/5 overflow-x-auto">
                    <Link
                      href="/pgs/boys"
                      className="flex items-center gap-1.5 rounded-full bg-brand/10 text-brand px-3 py-1.5 text-xs font-bold shrink-0 hover:bg-brand hover:text-white transition"
                    >
                      <Building2 size={13} /> Boys PGs
                    </Link>
                    <Link
                      href="/pgs/girls"
                      className="flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3 py-1.5 text-xs font-bold shrink-0 hover:bg-accent hover:text-white transition"
                    >
                      <Users size={13} /> Girls PGs
                    </Link>
                    <Link
                      href="/match"
                      className="flex items-center gap-1.5 rounded-full bg-ok/10 text-ok px-3 py-1.5 text-xs font-bold shrink-0 hover:bg-ok hover:text-white transition"
                    >
                      <Sparkles size={13} /> Quiz Match
                    </Link>
                  </div>

                  {navData.groups.map((group) => {
                    const isExpanded = mobileExpanded === group.label;
                    return (
                      <div key={group.label} className="border-b border-ink/5 pb-2">
                        <button
                          onClick={() => setMobileExpanded(isExpanded ? null : group.label)}
                          className="flex w-full items-center justify-between py-2 text-sm font-bold text-ink"
                        >
                          <span>{group.label}</span>
                          <ChevronDown
                            size={16}
                            className={cn("transition-transform duration-200 text-mute", isExpanded ? "rotate-180 text-brand" : "")}
                          />
                        </button>
                        {isExpanded && (
                          <div className="mt-1 pl-2 space-y-1">
                            {group.items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-start gap-2.5 rounded-lg py-2 px-3 text-xs text-mute hover:text-brand hover:bg-brand/5"
                              >
                                <div className="mt-0.5 text-brand shrink-0">
                                  <DynamicIcon name={item.icon} size={15} />
                                </div>
                                <div>
                                  <span className="font-semibold text-ink block">{item.title}</span>
                                  <span className="text-[10px] text-mute">{item.desc}</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      href="/about"
                      className="rounded-xl border border-ink/10 p-3 text-center text-xs font-semibold text-ink hover:border-brand/40 hover:text-brand transition"
                    >
                      About Us
                    </Link>
                    <Link
                      href="/contact"
                      className="rounded-xl border border-ink/10 p-3 text-center text-xs font-semibold text-ink hover:border-brand/40 hover:text-brand transition"
                    >
                      Contact Desk
                    </Link>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsVacancyModalOpen(true);
                        setOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-brand/10 border border-brand/20 p-2.5 text-xs font-bold text-brand hover:bg-brand hover:text-white transition w-full"
                    >
                      <BellRing size={14} />
                      <span>Bed Vacancy Alert / Waitlist</span>
                    </button>

                    <Link href="/match" className="btn btn-primary w-full text-xs">
                      <Sparkles size={14} /> Smart PG Matcher
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${cleanPhone}`}
                        className="btn btn-ghost w-full text-xs gap-1.5"
                      >
                        <PhoneCall size={13} /> Call Us
                      </a>
                      <a
                        href={`https://wa.me/${cleanWa}?text=${encodeURIComponent("Hello Luxora PG! I would like to book a free visit.")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white w-full text-xs gap-1.5"
                      >
                        <MessageSquare size={13} /> WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Bed Vacancy Alert Public Modal */}
      <VacancyAlertModal
        isOpen={isVacancyModalOpen}
        onClose={() => setIsVacancyModalOpen(false)}
      />
    </>
  );
}
