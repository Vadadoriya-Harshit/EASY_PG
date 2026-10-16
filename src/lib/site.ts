export const SITE = {
  name: "Luxora PG",
  tagline: "Feel At Home, Live In Luxury",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  phone: process.env.NEXT_PUBLIC_PHONE || "+91 98250 87654",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP || "919825087654").replace(/\D/g, ""),
  email: process.env.NEXT_PUBLIC_EMAIL || "stay@luxorapg.com",
  address: process.env.NEXT_PUBLIC_ADDRESS || "Ahmedabad, Gujarat, India",
  heroVideo: process.env.NEXT_PUBLIC_HERO_VIDEO || "",
  heroPoster: process.env.NEXT_PUBLIC_HERO_POSTER || "/images/hero-building.jpg",
};

export const NAV = [
  { href: "/pgs", label: "All PGs" },
  { href: "/pgs/boys", label: "Boys PG" },
  { href: "/pgs/girls", label: "Girls PG" },
  { href: "/areas", label: "Areas" },
  { href: "/nearby", label: "Metro & Food" },
  { href: "/facilities", label: "Facilities" },
  { href: "/gallery", label: "Gallery" },
  { href: "/compare", label: "Compare" },
  { href: "/match", label: "Smart Match" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const FACILITY_CATALOG = [
  { key: "wifi", name: "High-Speed Wi-Fi" },
  { key: "meals", name: "Hygienic Meals" },
  { key: "laundry", name: "Laundry & Ironing" },
  { key: "housekeeping", name: "Daily Housekeeping" },
  { key: "cctv", name: "24/7 CCTV & Security" },
  { key: "parking", name: "Vehicle Parking" },
  { key: "power-backup", name: "100% Power Backup" },
  { key: "water", name: "RO Drinking Water" },
];

export const ROOM_LABEL: Record<string, string> = {
  single: "Single Private Room",
  double: "Double Twin-Sharing",
  triple: "Triple Sharing",
  dormitory: "4-Bed Dormitory",
};

export const CATEGORY_LABEL: Record<string, string> = {
  metro: "Metro Station",
  breakfast: "Breakfast & Nashta",
  tiffin: "Home Tiffin Service",
  grocery: "Daily Grocery & Mart",
  pharmacy: "24/7 Pharmacy",
  restaurant: "Restaurant & Cafe",
};
