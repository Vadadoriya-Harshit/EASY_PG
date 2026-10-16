export type Gender = "boys" | "girls";
export type RoomType = "single" | "double" | "triple" | "dormitory";
export type FacilityStatus = "included" | "paid" | "not-available";
export type NearbyCategory = "metro" | "breakfast" | "tiffin" | "grocery" | "pharmacy" | "restaurant";
export type InquiryStatus = "new" | "contacted" | "visit-scheduled" | "converted" | "closed";

export interface Room {
  id: string;
  type: RoomType;
  ac: boolean;
  rent: number | null; // INR / month; null = not confirmed
  rentUnit: "per-bed" | "per-room";
  deposit: number | null;
  included: string[];
  extraCharges: string[];
  availability: "now" | "from-date" | "unknown";
  availableFrom?: string;
}

export interface Facility {
  key: string;
  name: string;
  status: FacilityStatus;
  note?: string;
}

export interface Media {
  type: "image" | "video";
  url: string;
  alt: string;
  caption?: string;
  tag?: string;
  poster?: string;
}

export interface NearbyPlace {
  id: string;
  category: NearbyCategory;
  name: string;
  address?: string;
  mapUrl?: string;
  distanceKm?: number;
  distanceMethod?: "straight-line" | "route";
  source?: string;
  lastVerified?: string; // ISO date; empty = not verified yet
  external: boolean; // third-party business, not a PG amenity
}

export interface Property {
  slug: string;
  name: string;
  gender: Gender;
  area: string; // area slug
  address: string;
  mapUrl?: string;
  description: string;
  phone?: string;
  status: "active" | "draft";
  verified: boolean; // owner-confirmed data
  featured: boolean;
  metro?: { station: string; distanceKm: number; method: "straight-line" | "route"; verifiedAt?: string } | null;
  rooms: Room[];
  facilities: Facility[];
  media: Media[];
  rules: string[];
  nearby: NearbyPlace[];
  updatedAt: string;
}

export interface Area {
  slug: string;
  name: string;
  city: string;
  intro: string;
  landmarks: string[];
  active: boolean;
}

export interface Inquiry {
  id: string;
  kind: "inquiry" | "visit";
  name: string;
  phone: string;
  propertySlug?: string;
  areaSlug?: string;
  roomType?: string;
  moveIn?: string;
  message?: string;
  consent: boolean;
  status: InquiryStatus;
  source?: string;
  visit?: { date: string; time?: string; status: "requested" | "confirmed" | "rescheduled" | "cancelled"; confirmedSlot?: string; response?: string };
  notes: string;
  createdAt: string;
  updatedAt: string;
}
