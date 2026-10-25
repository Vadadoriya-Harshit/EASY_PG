import { z } from "zod";

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .refine((v) => /^[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number");

export const inquirySchema = z.object({
  kind: z.enum(["inquiry", "visit"]).default("inquiry"),
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone,
  propertySlug: z.string().max(120).optional().or(z.literal("")),
  areaSlug: z.string().max(120).optional().or(z.literal("")),
  roomType: z.string().max(40).optional().or(z.literal("")),
  moveIn: z.string().max(20).optional().or(z.literal("")),
  message: z.string().trim().max(500).optional().or(z.literal("")),
  visitDate: z.string().max(20).optional().or(z.literal("")),
  visitTime: z.string().max(20).optional().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "Please accept to continue" }) }),
  website: z.string().max(0).optional(), // honeypot
}).superRefine((d, ctx) => {
  if (d.kind !== "visit") return;
  if (!d.visitDate) return ctx.addIssue({ code: "custom", path: ["visitDate"], message: "Choose a visit date" });
  const t = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(d.visitDate) && !Number.isNaN(Date.parse(d.visitDate));
  if (!valid) ctx.addIssue({ code: "custom", path: ["visitDate"], message: "Enter a valid date" });
  else if (d.visitDate < t) ctx.addIssue({ code: "custom", path: ["visitDate"], message: "Choose today or a later date" });
});
export type InquiryInput = z.infer<typeof inquirySchema>;

const nn = z.number().nonnegative().nullable();

/** Only values that are safe to put in <img src>/<a href>: no javascript:, no protocol-relative URLs. */
const DATA_IMG = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
export const isSafeImageUrl = (v: string) =>
  v === "" || (v.startsWith("/") && !v.startsWith("//") && !/[\s"'<>\\]/.test(v)) || /^https:\/\/[^\s"'<>]+$/.test(v) || (DATA_IMG.test(v) && v.length <= 2_500_000);
export const isSafeHref = (v: string) =>
  v === "" || v.startsWith("#") || (v.startsWith("/") && !v.startsWith("//") && !/[\s"'<>\\]/.test(v)) || /^(https:\/\/|mailto:|tel:)[^\s"'<>]+$/.test(v);
export const imageUrl = z.string().max(2_500_000).refine(isSafeImageUrl, "Use an uploaded image, a /path or an https URL");
export const hrefUrl = z.string().max(500).refine(isSafeHref, "Use a /path, https URL, mailto: or tel: link");
const text = (n: number) => z.string().max(n);

export const propertySchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  name: z.string().trim().min(2).max(120),
  gender: z.enum(["boys", "girls"]),
  area: z.string().min(1),
  address: z.string().trim().max(300),
  mapUrl: z.string().max(500).refine((v) => v === "" || /^https:\/\/[^\s"'<>]+$/.test(v), "Map link must be an https URL").optional(),
  description: z.string().trim().max(2000),
  phone: z.string().max(20).optional(),
  status: z.enum(["active", "draft"]),
  verified: z.boolean(),
  featured: z.boolean(),
  metro: z
    .object({ station: z.string().min(1), distanceKm: z.number().positive(), method: z.enum(["straight-line", "route"]), verifiedAt: z.string().optional() })
    .optional()
    .nullable(),
  rooms: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["single", "double", "triple", "dormitory"]),
      ac: z.boolean(),
      rent: nn,
      rentUnit: z.enum(["per-bed", "per-room"]),
      deposit: nn,
      included: z.array(z.string()),
      extraCharges: z.array(z.string()),
      availability: z.enum(["now", "from-date", "unknown"]),
      availableFrom: z.string().optional(),
      images: z.array(z.string()).optional(),
      tour360Url: z.string().optional(),
      description: z.string().optional(),
    })
  ),
  facilities: z.array(z.object({ key: z.string(), name: z.string(), status: z.enum(["included", "paid", "not-available"]), note: z.string().optional() })),
  media: z.array(z.object({ type: z.enum(["image", "video"]), url: imageUrl.refine((v) => v.length > 0, "Image is required"), alt: z.string().min(1, "Alt text required").max(200), caption: z.string().max(300).optional(), tag: z.string().max(60).optional(), poster: imageUrl.optional() })).max(60),
  rules: z.array(z.string()),
  nearby: z.array(
    z.object({
      id: z.string(),
      category: z.enum(["metro", "breakfast", "tiffin", "grocery", "pharmacy", "restaurant"]),
      name: z.string().min(1),
      address: z.string().optional(),
      mapUrl: z.string().max(500).refine((v) => v === "" || /^https:\/\/[^\s"'<>]+$/.test(v), "Map link must be an https URL").optional(),
      distanceKm: z.number().nonnegative().optional(),
      distanceMethod: z.enum(["straight-line", "route"]).optional(),
      source: z.string().optional(),
      lastVerified: z.string().optional(),
      external: z.boolean(),
    })
  ),
});

export const areaSchema = z.object({
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2),
  city: z.string().trim().min(2),
  intro: z.string().trim().max(1500),
  landmarks: z.array(z.string()),
  active: z.boolean(),
});

export const inquiryPatchSchema = z.object({
  status: z.enum(["new", "contacted", "visit-scheduled", "converted", "closed"]).optional(),
  notes: z.string().max(2000).optional(),
  email: z.string().max(254).optional().or(z.literal("")),
  sendEmail: z.boolean().optional(),
  visit: z
    .object({
      date: z.string().max(40).optional(),
      time: z.string().max(40).optional(),
      status: z.enum(["requested", "confirmed", "rescheduled", "cancelled"]).optional(),
      confirmedSlot: z.string().max(80).optional(),
      response: z.string().max(500).optional(),
    })
    .optional(),
});

// ------------------------------------------------------------------ CMS
const slide = z.object({ image: imageUrl, label: text(160), tag: text(80), location: text(120), beds: text(80) });
const navItem = z.object({ title: text(80), desc: text(200), href: hrefUrl, icon: text(40), tag: text(40).optional() });
const areaContent = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,80}$/), name: text(80), image: imageUrl, tag: text(80), landmark: text(160), metroStation: text(120), distance: text(60), intro: text(600) });
const amenity = z.object({ id: text(60), title: text(120), tag: text(60), description: text(500), image: imageUrl, features: z.array(text(120)).max(12) });
const socialUrl = z.string().max(300).refine((v) => v === "" || /^https:\/\/[^\s"'<>]+$/.test(v), "Use a full https:// link or leave empty");
const socials = z.object({ instagram: socialUrl, facebook: socialUrl, linkedin: socialUrl, youtube: socialUrl, twitter: socialUrl }).partial();
const branch = z.object({ name: text(120), address: text(300), metro: text(160) });
const pillar = z.object({ icon: text(40), title: text(120), desc: text(500) });
const secStep = z.object({ step: text(8), title: text(120), desc: text(500) });
const faqItem = z.object({ q: text(300), a: text(2000) });

export const HOME_SECTION_IDS = ["featured", "lifestyle", "tour", "calculator", "tools", "metro", "areas", "testimonials", "stats", "contact"] as const;

export const cmsPatchSchema = z
  .object({
    navigation: z.object({ announcement: text(300), announcementLink: hrefUrl, ctaLabel: text(40), ctaHref: hrefUrl, groups: z.array(z.object({ label: text(60), items: z.array(navItem).max(12) })).max(8) }).partial(),
    hero: z.object({ line1: text(80), line2: text(80), line3: text(80), subtitle: text(400), badge1: text(120), badge2: text(120), slides: z.array(slide).max(12) }).partial(),
    areas: z.record(z.string().regex(/^[a-z0-9-]{1,80}$/), areaContent),
    amenities: z.array(amenity).max(24),
    contact: z.object({ phone: text(30), whatsapp: text(20), email: z.string().max(254), address: text(300), visitingHours: text(100), announcement: text(300), branches: z.array(branch).max(20), socials }).partial(),
    about: z
      .object({
        heroTitle: text(160), heroSubtitle: text(400), heroBadge: text(80), statBeds: text(60), statRating: text(60), statResidents: text(60), statYears: text(60),
        originBadge: text(80), originTitle: text(200), originP1: text(1200), originP2: text(1200), originImage: imageUrl, pillars: z.array(pillar).max(12), securitySteps: z.array(secStep).max(12),
      })
      .partial(),
    faq: z.object({ title: text(120), intro: text(400), categories: z.array(z.object({ category: text(120), items: z.array(faqItem).max(40) })).max(20) }).partial(),
    footer: z.object({ newsletterHeading: text(160), newsletterSub: text(400), disclaimer: text(600), copyrightNotice: text(200) }).partial(),
    homeSections: z.array(z.object({ id: z.enum(HOME_SECTION_IDS), visible: z.boolean() })).max(HOME_SECTION_IDS.length),
    seo: z.object({ title: text(70), description: text(200), ogImage: imageUrl }).partial(),
  })
  .partial()
  .strict();
export type CmsPatch = z.infer<typeof cmsPatchSchema>;

// ------------------------------------------------------------------ Vacancy subscribers
export const publicSubscribeSchema = z.object({
  email: z.string().trim().max(254),
  name: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  preferredArea: z.string().max(80).optional(),
  preferredProperty: z.string().max(120).optional(),
  sharingType: z.string().max(20).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Please tick the box to agree to receive vacancy emails." }) }),
  source: z.string().max(40).optional(),
  website: z.string().max(0).optional(), // honeypot
});
