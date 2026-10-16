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
});
export type InquiryInput = z.infer<typeof inquirySchema>;

const nn = z.number().nonnegative().nullable();

export const propertySchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  name: z.string().trim().min(2).max(120),
  gender: z.enum(["boys", "girls"]),
  area: z.string().min(1),
  address: z.string().trim().max(300),
  mapUrl: z.string().url().optional().or(z.literal("")),
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
    })
  ),
  facilities: z.array(z.object({ key: z.string(), name: z.string(), status: z.enum(["included", "paid", "not-available"]), note: z.string().optional() })),
  media: z.array(z.object({ type: z.enum(["image", "video"]), url: z.string().min(1), alt: z.string().min(1, "Alt text required"), caption: z.string().optional(), tag: z.string().optional(), poster: z.string().optional() })),
  rules: z.array(z.string()),
  nearby: z.array(
    z.object({
      id: z.string(),
      category: z.enum(["metro", "breakfast", "tiffin", "grocery", "pharmacy", "restaurant"]),
      name: z.string().min(1),
      address: z.string().optional(),
      mapUrl: z.string().optional(),
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
  visit: z
    .object({ status: z.enum(["requested", "confirmed", "rescheduled", "cancelled"]).optional(), confirmedSlot: z.string().max(80).optional(), response: z.string().max(500).optional() })
    .optional(),
});
