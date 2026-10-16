"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Sliders,
  CheckCircle2,
  Save,
  Eye,
  Megaphone,
  Sparkles,
  RotateCcw,
  Building2,
  MapPin,
  Train,
  Plus,
  Trash2,
  ExternalLink,
  Phone,
  MessageSquare,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Menu,
  FileText,
  Mail,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  DEFAULT_CMS_DATA,
  type SiteCmsData,
  type HeroSlide,
  type NavGroupConfig,
  type NavMenuItem,
  type AboutPillar,
  type SecurityStep,
  type FaqCategory,
  type FaqItem,
  type BranchOffice,
  type AmenityContent
} from "@/lib/cms-store";
import { cn } from "@/lib/utils";
import ImageFilePicker from "./ImageFilePicker";
import DynamicIcon, { AVAILABLE_ICON_NAMES } from "@/components/DynamicIcon";

type PageTab = "nav" | "home" | "about" | "facilities" | "areas" | "faq" | "contact";

const PAGE_TABS: { id: PageTab; label: string; icon: any; desc: string }[] = [
  { id: "nav", label: "Header & Navigation", icon: Menu, desc: "Announcement ticker, CTA button & dropdown menu tree" },
  { id: "home", label: "Home / Hero", icon: Sparkles, desc: "Hero headlines, badges & rotating background slides" },
  { id: "about", label: "About Us Page", icon: FileText, desc: "Story, stats, 6 core guarantees & 4 security protocols" },
  { id: "facilities", label: "Facilities & Living", icon: Layers, desc: "Amenity showcases, study lounges, food & terraces" },
  { id: "areas", label: "Areas & Metro Hubs", icon: MapPin, desc: "Satellite, Navrangpura, Vastrapur & Thaltej guides" },
  { id: "faq", label: "FAQ Page", icon: HelpCircle, desc: "Categories, questions, deposits & curfew answers" },
  { id: "contact", label: "Contact & Footer", icon: Phone, desc: "Helpline, WhatsApp, branches, footer disclaimer & alerts" },
];

export default function CmsManager() {
  const [activeTab, setActiveTab] = useState<PageTab>("nav");
  const [cms, setCms] = useState<SiteCmsData>(DEFAULT_CMS_DATA);
  const [savedToast, setSavedToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved CMS data from API or localStorage
  useEffect(() => {
    fetch("/api/admin/cms/content")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok && res.data) {
          setCms(res.data);
          try {
            localStorage.setItem("sorath_cms_content", JSON.stringify(res.data));
          } catch {}
        }
      })
      .catch(() => {
        try {
          const local = localStorage.getItem("sorath_cms_content");
          if (local) setCms(JSON.parse(local));
        } catch {}
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/cms/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cms),
      });

      if (res.ok) {
        try {
          localStorage.setItem("sorath_cms_content", JSON.stringify(cms));
          window.dispatchEvent(new Event("sorath_cms_updated"));
          window.dispatchEvent(new Event("luxora_cms_updated"));
        } catch {}
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 3000);
      }
    } catch {
      try {
        localStorage.setItem("sorath_cms_content", JSON.stringify(cms));
        window.dispatchEvent(new Event("sorath_cms_updated"));
        window.dispatchEvent(new Event("luxora_cms_updated"));
      } catch {}
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all content, navigation menus, and media to defaults?")) return;
    try {
      const res = await fetch("/api/admin/cms/content", { method: "DELETE" });
      if (res.ok) {
        setCms(DEFAULT_CMS_DATA);
        try {
          localStorage.removeItem("sorath_cms_content");
          window.dispatchEvent(new Event("sorath_cms_updated"));
          window.dispatchEvent(new Event("luxora_cms_updated"));
        } catch {}
        alert("Reset to default content successfully.");
      }
    } catch {
      setCms(DEFAULT_CMS_DATA);
    }
  };

  // ===================== NAVIGATION HELPERS =====================
  const updateNav = (field: keyof SiteCmsData["navigation"], val: any) => {
    setCms((prev) => ({
      ...prev,
      navigation: { ...prev.navigation, [field]: val },
    }));
  };

  const addNavGroup = () => {
    const newGroup: NavGroupConfig = {
      label: "New Section",
      items: [{ title: "New Link", desc: "Short description of link", href: "/pgs", icon: "Building2" }],
    };
    setCms((prev) => ({
      ...prev,
      navigation: { ...prev.navigation, groups: [...prev.navigation.groups, newGroup] },
    }));
  };

  const removeNavGroup = (gIdx: number) => {
    if (!confirm("Delete this entire menu group?")) return;
    setCms((prev) => ({
      ...prev,
      navigation: { ...prev.navigation, groups: prev.navigation.groups.filter((_, i) => i !== gIdx) },
    }));
  };

  const updateNavGroupLabel = (gIdx: number, val: string) => {
    setCms((prev) => {
      const groups = [...prev.navigation.groups];
      groups[gIdx] = { ...groups[gIdx], label: val };
      return { ...prev, navigation: { ...prev.navigation, groups } };
    });
  };

  const addNavItem = (gIdx: number) => {
    const newItem: NavMenuItem = {
      title: "New Link Title",
      desc: "Brief explanation of page",
      href: "/pgs",
      icon: "Building2",
    };
    setCms((prev) => {
      const groups = [...prev.navigation.groups];
      groups[gIdx] = { ...groups[gIdx], items: [...groups[gIdx].items, newItem] };
      return { ...prev, navigation: { ...prev.navigation, groups } };
    });
  };

  const removeNavItem = (gIdx: number, itemIdx: number) => {
    setCms((prev) => {
      const groups = [...prev.navigation.groups];
      groups[gIdx] = { ...groups[gIdx], items: groups[gIdx].items.filter((_, i) => i !== itemIdx) };
      return { ...prev, navigation: { ...prev.navigation, groups } };
    });
  };

  const updateNavItem = (gIdx: number, itemIdx: number, field: keyof NavMenuItem, val: string) => {
    setCms((prev) => {
      const groups = [...prev.navigation.groups];
      const items = [...groups[gIdx].items];
      items[itemIdx] = { ...items[itemIdx], [field]: val };
      groups[gIdx] = { ...groups[gIdx], items };
      return { ...prev, navigation: { ...prev.navigation, groups } };
    });
  };

  // ===================== HERO HELPERS =====================
  const updateHero = (field: keyof SiteCmsData["hero"], val: any) => {
    setCms((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: val },
    }));
  };

  const updateSlide = (index: number, field: keyof HeroSlide, val: string) => {
    setCms((prev) => {
      const slides = [...prev.hero.slides];
      slides[index] = { ...slides[index], [field]: val };
      return { ...prev, hero: { ...prev.hero, slides } };
    });
  };

  const addSlide = () => {
    const newSlide: HeroSlide = {
      image: "/images/hero-building.jpg",
      label: "New Campus Residence",
      tag: "Verified Stay",
      location: "Satellite, Ahmedabad",
      beds: "Single & Double AC",
    };
    setCms((prev) => ({
      ...prev,
      hero: { ...prev.hero, slides: [...prev.hero.slides, newSlide] },
    }));
  };

  const removeSlide = (index: number) => {
    if (cms.hero.slides.length <= 1) {
      alert("At least one slide is required for the visual hero.");
      return;
    }
    setCms((prev) => ({
      ...prev,
      hero: { ...prev.hero, slides: prev.hero.slides.filter((_, i) => i !== index) },
    }));
  };

  // ===================== ABOUT HELPERS =====================
  const updateAbout = (field: keyof SiteCmsData["about"], val: any) => {
    setCms((prev) => ({
      ...prev,
      about: { ...prev.about, [field]: val },
    }));
  };

  const updatePillar = (idx: number, field: keyof AboutPillar, val: string) => {
    setCms((prev) => {
      const pillars = [...prev.about.pillars];
      pillars[idx] = { ...pillars[idx], [field]: val };
      return { ...prev, about: { ...prev.about, pillars } };
    });
  };

  const addPillar = () => {
    const newP: AboutPillar = {
      icon: "ShieldCheck",
      title: "New Guarantee Title",
      desc: "Detailed guarantee commitment for residents.",
    };
    setCms((prev) => ({
      ...prev,
      about: { ...prev.about, pillars: [...prev.about.pillars, newP] },
    }));
  };

  const removePillar = (idx: number) => {
    setCms((prev) => ({
      ...prev,
      about: { ...prev.about, pillars: prev.about.pillars.filter((_, i) => i !== idx) },
    }));
  };

  const updateSecurityStep = (idx: number, field: keyof SecurityStep, val: string) => {
    setCms((prev) => {
      const securitySteps = [...prev.about.securitySteps];
      securitySteps[idx] = { ...securitySteps[idx], [field]: val };
      return { ...prev, about: { ...prev.about, securitySteps } };
    });
  };

  // ===================== FAQ HELPERS =====================
  const updateFaq = (field: keyof SiteCmsData["faq"], val: any) => {
    setCms((prev) => ({
      ...prev,
      faq: { ...prev.faq, [field]: val },
    }));
  };

  const addFaqCategory = () => {
    const newCat: FaqCategory = {
      category: "New FAQ Category",
      items: [{ q: "What is the policy?", a: "Detailed policy explanation." }],
    };
    setCms((prev) => ({
      ...prev,
      faq: { ...prev.faq, categories: [...prev.faq.categories, newCat] },
    }));
  };

  const removeFaqCategory = (cIdx: number) => {
    if (!confirm("Delete this entire category and all its questions?")) return;
    setCms((prev) => ({
      ...prev,
      faq: { ...prev.faq, categories: prev.faq.categories.filter((_, i) => i !== cIdx) },
    }));
  };

  const updateFaqCategoryTitle = (cIdx: number, val: string) => {
    setCms((prev) => {
      const categories = [...prev.faq.categories];
      categories[cIdx] = { ...categories[cIdx], category: val };
      return { ...prev, faq: { ...prev.faq, categories } };
    });
  };

  const addFaqItem = (cIdx: number) => {
    const newItem: FaqItem = { q: "New Question?", a: "Detailed answer." };
    setCms((prev) => {
      const categories = [...prev.faq.categories];
      categories[cIdx] = { ...categories[cIdx], items: [...categories[cIdx].items, newItem] };
      return { ...prev, faq: { ...prev.faq, categories } };
    });
  };

  const removeFaqItem = (cIdx: number, iIdx: number) => {
    setCms((prev) => {
      const categories = [...prev.faq.categories];
      categories[cIdx] = { ...categories[cIdx], items: categories[cIdx].items.filter((_, i) => i !== iIdx) };
      return { ...prev, faq: { ...prev.faq, categories } };
    });
  };

  const updateFaqItem = (cIdx: number, iIdx: number, field: keyof FaqItem, val: string) => {
    setCms((prev) => {
      const categories = [...prev.faq.categories];
      const items = [...categories[cIdx].items];
      items[iIdx] = { ...items[iIdx], [field]: val };
      categories[cIdx] = { ...categories[cIdx], items };
      return { ...prev, faq: { ...prev.faq, categories } };
    });
  };

  // ===================== CONTACT & FOOTER HELPERS =====================
  const updateContact = (field: keyof SiteCmsData["contact"], val: any) => {
    setCms((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: val },
    }));
  };

  const updateFooter = (field: keyof SiteCmsData["footer"], val: any) => {
    setCms((prev) => ({
      ...prev,
      footer: { ...prev.footer, [field]: val },
    }));
  };

  const addBranch = () => {
    const newB: BranchOffice = {
      name: "New Branch Residence",
      address: "Full street address, Ahmedabad",
      metro: "Nearest Metro Station (0.5 km)",
    };
    setCms((prev) => ({
      ...prev,
      contact: { ...prev.contact, branches: [...prev.contact.branches, newB] },
    }));
  };

  const removeBranch = (idx: number) => {
    setCms((prev) => ({
      ...prev,
      contact: { ...prev.contact, branches: prev.contact.branches.filter((_, i) => i !== idx) },
    }));
  };

  const updateBranch = (idx: number, field: keyof BranchOffice, val: string) => {
    setCms((prev) => {
      const branches = [...prev.contact.branches];
      branches[idx] = { ...branches[idx], [field]: val };
      return { ...prev, contact: { ...prev.contact, branches } };
    });
  };

  // ===================== AMENITY HELPERS =====================
  const updateAmenity = (index: number, field: keyof AmenityContent, val: any) => {
    setCms((prev) => {
      const amenities = [...prev.amenities];
      amenities[index] = { ...amenities[index], [field]: val };
      return { ...prev, amenities };
    });
  };

  // ===================== AREA HELPERS =====================
  const updateArea = (key: string, field: string, val: string) => {
    setCms((prev) => ({
      ...prev,
      areas: {
        ...prev.areas,
        [key]: { ...prev.areas[key], [field]: val },
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Master Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
            <Globe size={13} /> Zero-Hardcode Visual CMS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">
            Dynamic Page & Navigation Manager
          </h1>
          <p className="text-xs text-mute mt-1">
            Edit all public website pages, header navigation menus, FAQs, guarantees, and branches in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="btn btn-ghost text-xs gap-1.5 border border-ink/10"
          >
            <Eye size={14} /> View Live Site <ExternalLink size={12} />
          </Link>
          <button
            onClick={handleReset}
            type="button"
            className="btn btn-ghost text-xs text-red-500 hover:bg-red-500/10 border border-red-500/20"
          >
            <RotateCcw size={14} /> Factory Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary text-xs gap-2 px-6 shadow-lg shadow-brand/25"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                Publishing...
              </span>
            ) : (
              <>
                <Save size={15} /> Save & Publish Live
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      {savedToast && (
        <div className="flex items-center justify-between rounded-2xl bg-ok/15 border border-ok/30 p-4 text-ok text-xs font-semibold shadow-lg">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} /> All changes published to MongoDB Atlas and synced across the public website!
          </span>
          <span className="text-[11px] opacity-80">Saved just now</span>
        </div>
      )}

      {/* Page-Wise Tabs Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-ink/10">
        {PAGE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0",
                isActive
                  ? "bg-brand text-white shadow-md shadow-brand/25"
                  : "bg-surface border border-ink/10 text-ink/70 hover:text-brand hover:border-brand/40"
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Page Notice */}
      <div className="rounded-xl bg-brand/5 border border-brand/15 px-4 py-2.5 flex items-center justify-between text-xs">
        <span className="text-brand font-semibold">
          Currently Editing: <strong>{PAGE_TABS.find((t) => t.id === activeTab)?.label}</strong> — {PAGE_TABS.find((t) => t.id === activeTab)?.desc}
        </span>
        <span className="text-mute text-[11px]">Auto-saved to preview cache</span>
      </div>

      {/* =========================================================================
          TAB 1: HEADER & NAVIGATION MENU MANAGER
          ========================================================================= */}
      {activeTab === "nav" && (
        <div className="space-y-8">
          {/* Top Announcement Bar & CTA Settings */}
          <div className="card p-6 border-ink/10 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-ink/10">
              <Megaphone size={18} className="text-brand" />
              <h3 className="font-bold text-base text-ink">Top Ticker & Action Button</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-ink">Official Notice Announcement (Top Bar)</label>
                <input
                  type="text"
                  value={cms.navigation?.announcement || ""}
                  onChange={(e) => updateNav("announcement", e.target.value)}
                  className="input text-xs"
                  placeholder="e.g. Admissions Open 2026-27: Verified Boys & Girls PGs. 0% Brokerage."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Announcement Target Link</label>
                <input
                  type="text"
                  value={cms.navigation?.announcementLink || "/pgs"}
                  onChange={(e) => updateNav("announcementLink", e.target.value)}
                  className="input text-xs"
                  placeholder="/pgs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Header CTA Button Text</label>
                <input
                  type="text"
                  value={cms.navigation?.ctaLabel || "Schedule Free Visit"}
                  onChange={(e) => updateNav("ctaLabel", e.target.value)}
                  className="input text-xs"
                  placeholder="Schedule Visit"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Header CTA Target Link</label>
                <input
                  type="text"
                  value={cms.navigation?.ctaHref || "/contact"}
                  onChange={(e) => updateNav("ctaHref", e.target.value)}
                  className="input text-xs"
                  placeholder="/contact"
                />
              </div>
            </div>
          </div>

          {/* Navigation Menu Groups Tree */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-ink">Primary Navigation Dropdowns</h3>
                <p className="text-xs text-mute">Manage dropdown menus, icons, descriptions, and labels appearing in the navbar.</p>
              </div>
              <button
                type="button"
                onClick={addNavGroup}
                className="btn btn-ghost text-xs gap-1.5 border border-brand/20 text-brand hover:bg-brand/10"
              >
                <Plus size={14} /> Add Dropdown Group
              </button>
            </div>

            {(cms.navigation?.groups || []).map((group, gIdx) => (
              <div key={gIdx} className="card p-6 border-ink/10 space-y-4 bg-surface/60">
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-ink/10">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold shrink-0">
                      {gIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={group.label}
                      onChange={(e) => updateNavGroupLabel(gIdx, e.target.value)}
                      className="input text-xs font-bold max-w-xs"
                      placeholder="Dropdown Label (e.g. Accommodations)"
                    />
                    <span className="text-xs text-mute">({group.items.length} items)</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => addNavItem(gIdx)}
                      className="btn btn-ghost text-xs gap-1 border border-ink/10"
                    >
                      <Plus size={13} /> Add Menu Item
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNavGroup(gIdx)}
                      className="btn btn-ghost text-xs text-red-500 hover:bg-red-500/10 p-2"
                      title="Remove Group"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* List of items in this group */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="rounded-xl border border-ink/10 bg-bg p-4 space-y-3 relative group/item"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand shrink-0">
                            <DynamicIcon name={item.icon} size={16} />
                          </div>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateNavItem(gIdx, itemIdx, "title", e.target.value)}
                            className="input text-xs font-bold"
                            placeholder="Title"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNavItem(gIdx, itemIdx)}
                          className="text-red-400 hover:text-red-500 p-1"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-mute uppercase">Subtitle / Desc</label>
                        <input
                          type="text"
                          value={item.desc}
                          onChange={(e) => updateNavItem(gIdx, itemIdx, "desc", e.target.value)}
                          className="input text-xs"
                          placeholder="Short description"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-mute uppercase">Link Target (href)</label>
                          <input
                            type="text"
                            value={item.href}
                            onChange={(e) => updateNavItem(gIdx, itemIdx, "href", e.target.value)}
                            className="input text-xs font-mono"
                            placeholder="/pgs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-mute uppercase">Icon</label>
                          <select
                            value={item.icon}
                            onChange={(e) => updateNavItem(gIdx, itemIdx, "icon", e.target.value)}
                            className="input text-xs font-semibold"
                          >
                            {AVAILABLE_ICON_NAMES.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-mute uppercase">Badge Tag (Optional)</label>
                        <input
                          type="text"
                          value={item.tag || ""}
                          onChange={(e) => updateNavItem(gIdx, itemIdx, "tag", e.target.value)}
                          className="input text-xs"
                          placeholder="e.g. Popular, Verified Safe, AI Quiz"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: HOME PAGE & HERO SLIDES
          ========================================================================= */}
      {activeTab === "home" && (
        <div className="space-y-8">
          <div className="card p-6 border-ink/10 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-ink/10">
              <Sparkles size={18} className="text-brand" />
              <h3 className="font-bold text-base text-ink">Hero Text & Headlines</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Headline Line 1</label>
                <input
                  type="text"
                  value={cms.hero.line1}
                  onChange={(e) => updateHero("line1", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Headline Line 2</label>
                <input
                  type="text"
                  value={cms.hero.line2}
                  onChange={(e) => updateHero("line2", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Headline Line 3</label>
                <input
                  type="text"
                  value={cms.hero.line3}
                  onChange={(e) => updateHero("line3", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-xs font-bold text-ink">Hero Subtitle</label>
                <textarea
                  rows={2}
                  value={cms.hero.subtitle}
                  onChange={(e) => updateHero("subtitle", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Trust Badge 1</label>
                <input
                  type="text"
                  value={cms.hero.badge1}
                  onChange={(e) => updateHero("badge1", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-ink">Trust Badge 2</label>
                <input
                  type="text"
                  value={cms.hero.badge2}
                  onChange={(e) => updateHero("badge2", e.target.value)}
                  className="input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Hero Slides */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-ink">Hero Background Slides</h3>
                <p className="text-xs text-mute">Automatic rotating high-resolution visual slides shown on the homepage.</p>
              </div>
              <button
                type="button"
                onClick={addSlide}
                className="btn btn-ghost text-xs gap-1.5 border border-brand/20 text-brand hover:bg-brand/10"
              >
                <Plus size={14} /> Add Hero Slide
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cms.hero.slides.map((slide, idx) => (
                <div key={idx} className="card p-5 border-ink/10 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                      <span className="text-xs font-bold text-brand">Slide #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeSlide(idx)}
                        className="text-red-400 hover:text-red-500 p-1"
                        title="Remove Slide"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <ImageFilePicker
                      label="Slide Photo"
                      value={slide.image}
                      onChange={(img) => updateSlide(idx, "image", img)}
                      aspectRatio="video"
                    />

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-mute uppercase">Title / Label</label>
                      <input
                        type="text"
                        value={slide.label}
                        onChange={(e) => updateSlide(idx, "label", e.target.value)}
                        className="input text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-mute uppercase">Badge Tag</label>
                        <input
                          type="text"
                          value={slide.tag}
                          onChange={(e) => updateSlide(idx, "tag", e.target.value)}
                          className="input text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-mute uppercase">Room Types</label>
                        <input
                          type="text"
                          value={slide.beds}
                          onChange={(e) => updateSlide(idx, "beds", e.target.value)}
                          className="input text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-mute uppercase">Location</label>
                      <input
                        type="text"
                        value={slide.location}
                        onChange={(e) => updateSlide(idx, "location", e.target.value)}
                        className="input text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ABOUT US PAGE
          ========================================================================= */}
      {activeTab === "about" && (
        <div className="space-y-8">
          {/* Origin Story Section */}
          <div className="card p-6 border-ink/10 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-ink/10">
              <FileText size={18} className="text-brand" />
              <h3 className="font-bold text-base text-ink">The Origin Story & Badges</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Section Badge</label>
                <input
                  type="text"
                  value={cms.about?.originBadge || ""}
                  onChange={(e) => updateAbout("originBadge", e.target.value)}
                  className="input text-xs"
                  placeholder="e.g. The Luxora Origin Story"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Main Headline</label>
                <input
                  type="text"
                  value={cms.about?.originTitle || ""}
                  onChange={(e) => updateAbout("originTitle", e.target.value)}
                  className="input text-xs"
                  placeholder="Built out of frustration with broker scams"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-ink">Story Paragraph 1</label>
                <textarea
                  rows={3}
                  value={cms.about?.originP1 || ""}
                  onChange={(e) => updateAbout("originP1", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-ink">Story Paragraph 2</label>
                <textarea
                  rows={3}
                  value={cms.about?.originP2 || ""}
                  onChange={(e) => updateAbout("originP2", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <ImageFilePicker
                  label="Origin Story Campus Photo"
                  value={cms.about?.originImage || "/images/hero-building.jpg"}
                  onChange={(img) => updateAbout("originImage", img)}
                  aspectRatio="video"
                />
              </div>
            </div>
          </div>

          {/* Key Stats Counters */}
          <div className="card p-6 border-ink/10 space-y-5">
            <h3 className="font-bold text-base text-ink pb-3 border-b border-ink/10">Key Network Metrics</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Beds Managed</label>
                <input
                  type="text"
                  value={cms.about?.statBeds || "500+ Beds"}
                  onChange={(e) => updateAbout("statBeds", e.target.value)}
                  className="input text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Resident Rating</label>
                <input
                  type="text"
                  value={cms.about?.statRating || "4.8★"}
                  onChange={(e) => updateAbout("statRating", e.target.value)}
                  className="input text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Total Residents / Alumni</label>
                <input
                  type="text"
                  value={cms.about?.statResidents || "1,200+ Residents"}
                  onChange={(e) => updateAbout("statResidents", e.target.value)}
                  className="input text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Years in Operation</label>
                <input
                  type="text"
                  value={cms.about?.statYears || "5+ Years"}
                  onChange={(e) => updateAbout("statYears", e.target.value)}
                  className="input text-xs"
                />
              </div>
            </div>
          </div>

          {/* 6 Core Guarantees (Pillars) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-ink">The Core Guarantees (Pillars)</h3>
                <p className="text-xs text-mute">Shown as spotlight guarantee cards on the About page.</p>
              </div>
              <button
                type="button"
                onClick={addPillar}
                className="btn btn-ghost text-xs gap-1.5 border border-brand/20 text-brand hover:bg-brand/10"
              >
                <Plus size={14} /> Add Guarantee Pillar
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(cms.about?.pillars || []).map((pillar, pIdx) => (
                <div key={pIdx} className="card p-5 border-ink/10 space-y-3 bg-surface/80">
                  <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <DynamicIcon name={pillar.icon} size={15} />
                      </div>
                      <span className="text-xs font-bold text-brand">Pillar #{pIdx + 1}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePillar(pIdx)}
                      className="text-red-400 hover:text-red-500 p-1"
                      title="Remove Pillar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Title</label>
                    <input
                      type="text"
                      value={pillar.title}
                      onChange={(e) => updatePillar(pIdx, "title", e.target.value)}
                      className="input text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Icon</label>
                    <select
                      value={pillar.icon}
                      onChange={(e) => updatePillar(pIdx, "icon", e.target.value)}
                      className="input text-xs font-semibold"
                    >
                      {AVAILABLE_ICON_NAMES.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Description</label>
                    <textarea
                      rows={3}
                      value={pillar.desc}
                      onChange={(e) => updatePillar(pIdx, "desc", e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Security Protocols */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-base text-ink">The 4-Step Security Protocols</h3>
              <p className="text-xs text-mute">Numbered steps displaying safety, turnstiles, wardens, and CCTV.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(cms.about?.securitySteps || []).map((step, sIdx) => (
                <div key={sIdx} className="card p-4 border-ink/10 space-y-3 bg-surface/80">
                  <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                    <input
                      type="text"
                      value={step.step}
                      onChange={(e) => updateSecurityStep(sIdx, "step", e.target.value)}
                      className="input text-xs font-mono font-bold w-16"
                    />
                    <span className="text-[10px] text-mute uppercase font-bold">Step</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Protocol Title</label>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => updateSecurityStep(sIdx, "title", e.target.value)}
                      className="input text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Protocol Details</label>
                    <textarea
                      rows={3}
                      value={step.desc}
                      onChange={(e) => updateSecurityStep(sIdx, "desc", e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: FACILITIES & AMENITIES
          ========================================================================= */}
      {activeTab === "facilities" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-ink">Lifestyle Amenities & Facilities</h3>
              <p className="text-xs text-mute">Co-working study lounges, 3 meals daily, rooftop terrace, and washrooms.</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {cms.amenities.map((item, idx) => (
              <div key={item.id} className="card p-6 border-ink/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-ink/10">
                  <span className="font-bold text-sm text-brand">{item.title}</span>
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                    {item.tag}
                  </span>
                </div>

                <ImageFilePicker
                  label="Amenity Photo"
                  value={item.image}
                  onChange={(img) => updateAmenity(idx, "image", img)}
                  aspectRatio="video"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Title</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateAmenity(idx, "title", e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Tag</label>
                    <input
                      type="text"
                      value={item.tag}
                      onChange={(e) => updateAmenity(idx, "tag", e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-mute uppercase">Description</label>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => updateAmenity(idx, "description", e.target.value)}
                    className="input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-mute uppercase">
                    Bullet Features (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={item.features.join(", ")}
                    onChange={(e) =>
                      updateAmenity(
                        idx,
                        "features",
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    className="input text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: AREAS & METRO TRANSIT
          ========================================================================= */}
      {activeTab === "areas" && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-base text-ink">Ahmedabad Neighbourhood Hubs</h3>
            <p className="text-xs text-mute">Curated descriptions, nearest metro stations, and route distances.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {Object.entries(cms.areas).map(([slug, area]) => (
              <div key={slug} className="card p-6 border-ink/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-ink/10">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-brand" />
                    <h4 className="font-bold text-base text-ink">{area.name}</h4>
                  </div>
                  <span className="text-xs font-mono text-mute bg-ink/5 px-2 py-0.5 rounded">
                    /{slug}
                  </span>
                </div>

                <ImageFilePicker
                  label={`${area.name} Cover Image`}
                  value={area.image}
                  onChange={(img) => updateArea(slug, "image", img)}
                  aspectRatio="video"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Hub Tag</label>
                    <input
                      type="text"
                      value={area.tag}
                      onChange={(e) => updateArea(slug, "tag", e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Key Landmark</label>
                    <input
                      type="text"
                      value={area.landmark}
                      onChange={(e) => updateArea(slug, "landmark", e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Metro Station</label>
                    <input
                      type="text"
                      value={area.metroStation}
                      onChange={(e) => updateArea(slug, "metroStation", e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Walking Distance</label>
                    <input
                      type="text"
                      value={area.distance}
                      onChange={(e) => updateArea(slug, "distance", e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-mute uppercase">Area Overview</label>
                  <textarea
                    rows={2}
                    value={area.intro}
                    onChange={(e) => updateArea(slug, "intro", e.target.value)}
                    className="input text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: FAQ PAGE
          ========================================================================= */}
      {activeTab === "faq" && (
        <div className="space-y-8">
          <div className="card p-6 border-ink/10 space-y-4">
            <h3 className="font-bold text-base text-ink pb-3 border-b border-ink/10">FAQ Page Header</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Page Title</label>
                <input
                  type="text"
                  value={cms.faq?.title || "Frequently Asked Questions"}
                  onChange={(e) => updateFaq("title", e.target.value)}
                  className="input text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Intro Subtitle</label>
                <input
                  type="text"
                  value={cms.faq?.intro || ""}
                  onChange={(e) => updateFaq("intro", e.target.value)}
                  className="input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Categories and Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-ink">FAQ Categories & Answers</h3>
                <p className="text-xs text-mute">Manage accordion question-and-answer lists grouped by category.</p>
              </div>
              <button
                type="button"
                onClick={addFaqCategory}
                className="btn btn-ghost text-xs gap-1.5 border border-brand/20 text-brand hover:bg-brand/10"
              >
                <Plus size={14} /> Add FAQ Category
              </button>
            </div>

            {(cms.faq?.categories || []).map((cat, cIdx) => (
              <div key={cIdx} className="card p-6 border-ink/10 space-y-4 bg-surface/60">
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-ink/10">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold shrink-0">
                      {cIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={cat.category}
                      onChange={(e) => updateFaqCategoryTitle(cIdx, e.target.value)}
                      className="input text-xs font-bold max-w-sm"
                      placeholder="Category Title (e.g. Rent, Deposits & Move-in)"
                    />
                    <span className="text-xs text-mute">({cat.items.length} questions)</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => addFaqItem(cIdx)}
                      className="btn btn-ghost text-xs gap-1 border border-ink/10"
                    >
                      <Plus size={13} /> Add Question
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFaqCategory(cIdx)}
                      className="btn btn-ghost text-xs text-red-500 hover:bg-red-500/10 p-2"
                      title="Remove Category"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {cat.items.map((item, iIdx) => (
                    <div key={iIdx} className="rounded-xl border border-ink/10 bg-bg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <label className="text-[10px] font-bold text-mute uppercase">Question</label>
                          <input
                            type="text"
                            value={item.q}
                            onChange={(e) => updateFaqItem(cIdx, iIdx, "q", e.target.value)}
                            className="input text-xs font-bold"
                            placeholder="Question text"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFaqItem(cIdx, iIdx)}
                          className="text-red-400 hover:text-red-500 p-1"
                          title="Remove Question"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-mute uppercase">Detailed Answer</label>
                        <textarea
                          rows={3}
                          value={item.a}
                          onChange={(e) => updateFaqItem(cIdx, iIdx, "a", e.target.value)}
                          className="input text-xs leading-relaxed"
                          placeholder="Comprehensive transparent answer"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: CONTACT & FOOTER
          ========================================================================= */}
      {activeTab === "contact" && (
        <div className="space-y-8">
          {/* Central Helpline & Desk Information */}
          <div className="card p-6 border-ink/10 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-ink/10">
              <Phone size={18} className="text-brand" />
              <h3 className="font-bold text-base text-ink">Central Desk & Helpline</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Coordinator Helpline Phone</label>
                <input
                  type="text"
                  value={cms.contact.phone}
                  onChange={(e) => updateContact("phone", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">WhatsApp Number (with country code)</label>
                <input
                  type="text"
                  value={cms.contact.whatsapp}
                  onChange={(e) => updateContact("whatsapp", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Admissions Email Address</label>
                <input
                  type="text"
                  value={cms.contact.email}
                  onChange={(e) => updateContact("email", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Visiting & Guided Tour Hours</label>
                <input
                  type="text"
                  value={cms.contact.visitingHours}
                  onChange={(e) => updateContact("visitingHours", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-ink">Central Office Address</label>
                <input
                  type="text"
                  value={cms.contact.address}
                  onChange={(e) => updateContact("address", e.target.value)}
                  className="input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Physical Branch Offices */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-ink">Physical Property Branches</h3>
                <p className="text-xs text-mute">Shown on the Contact page under property locations.</p>
              </div>
              <button
                type="button"
                onClick={addBranch}
                className="btn btn-ghost text-xs gap-1.5 border border-brand/20 text-brand hover:bg-brand/10"
              >
                <Plus size={14} /> Add Branch Office
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(cms.contact.branches || []).map((branch, bIdx) => (
                <div key={bIdx} className="card p-5 border-ink/10 space-y-3 bg-surface/80">
                  <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                    <span className="text-xs font-bold text-brand">Branch #{bIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeBranch(bIdx)}
                      className="text-red-400 hover:text-red-500 p-1"
                      title="Remove Branch"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Branch Name</label>
                    <input
                      type="text"
                      value={branch.name}
                      onChange={(e) => updateBranch(bIdx, "name", e.target.value)}
                      className="input text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Physical Address</label>
                    <input
                      type="text"
                      value={branch.address}
                      onChange={(e) => updateBranch(bIdx, "address", e.target.value)}
                      className="input text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-mute uppercase">Nearest Metro</label>
                    <input
                      type="text"
                      value={branch.metro}
                      onChange={(e) => updateBranch(bIdx, "metro", e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Texts & Disclaimers */}
          <div className="card p-6 border-ink/10 space-y-5">
            <h3 className="font-bold text-base text-ink pb-3 border-b border-ink/10">Footer Settings</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-ink">Newsletter Banner Heading</label>
                <input
                  type="text"
                  value={cms.footer?.newsletterHeading || ""}
                  onChange={(e) => updateFooter("newsletterHeading", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-ink">Newsletter Subtitle</label>
                <textarea
                  rows={2}
                  value={cms.footer?.newsletterSub || ""}
                  onChange={(e) => updateFooter("newsletterSub", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-ink">Footer Brand Disclaimer</label>
                <textarea
                  rows={2}
                  value={cms.footer?.disclaimer || ""}
                  onChange={(e) => updateFooter("disclaimer", e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-ink">Copyright Notice</label>
                <input
                  type="text"
                  value={cms.footer?.copyrightNotice || ""}
                  onChange={(e) => updateFooter("copyrightNotice", e.target.value)}
                  className="input text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
