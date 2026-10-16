import type { Area, Facility, Property, Room, NearbyPlace, Media } from "./types";
import { FACILITY_CATALOG } from "./site";

const NOW = new Date().toISOString();

export const sampleAreas: Area[] = [
  {
    slug: "satellite",
    name: "Satellite",
    city: "Ahmedabad",
    intro: "Prime residential & student corridor near ISRO, Jodhpur Char Rasta, and SG Highway corporate hub. Excellent connectivity via Doordarshan Kendra Metro and BRTS feeder lines.",
    landmarks: ["Doordarshan Kendra Metro", "Jodhpur Cross Roads", "Star Bazaar", "ISRO Colony"],
    active: true,
  },
  {
    slug: "vastrapur",
    name: "Vastrapur",
    city: "Ahmedabad",
    intro: "Vibrant educational & youth district surrounding the serene Vastrapur Lake, IIM Ahmedabad campus, and Alpha One Mall. Famous for quiet study cafes and evening street food hubs.",
    landmarks: ["Vastrapur Lake", "IIM Ahmedabad", "Ahmedabad University", "Alpha One Mall"],
    active: true,
  },
  {
    slug: "navrangpura",
    name: "Navrangpura",
    city: "Ahmedabad",
    intro: "The university heart of Ahmedabad hosting Gujarat University, CEPT University, and premier coaching centers. Walking distance from Commerce Six Roads Metro station.",
    landmarks: ["Commerce Six Roads Metro", "Gujarat University Library", "CEPT Campus", "LD College of Engineering"],
    active: true,
  },
  {
    slug: "thaltej",
    name: "Thaltej",
    city: "Ahmedabad",
    intro: "Modern, quiet, upscale neighbourhood near Thaltej Metro Station (Blue Line terminus) and SG Highway IT corridor. Ideal for IT professionals and postgraduates wanting calm surroundings.",
    landmarks: ["Thaltej Metro Station", "Acropolis Mall", "SG Highway IT Park", "Sola Civil Circle"],
    active: true,
  },
];

const fac = (included: string[], paid: string[] = []): Facility[] =>
  FACILITY_CATALOG.map((f) => ({
    key: f.key,
    name: f.name,
    status: included.includes(f.key) ? "included" : paid.includes(f.key) ? "paid" : "not-available",
  }));

const room = (
  id: string,
  type: Room["type"],
  ac: boolean,
  rent: number | null,
  deposit: number | null,
  now = true,
  extra: Partial<Room> = {}
): Room => ({
  id,
  type,
  ac,
  rent,
  rentUnit: "per-bed",
  deposit,
  included: ["Spring-fit orthopedic mattress", "Dedicated study desk & ergonomic chair", "Personal full-length wardrobe with lock", "High-speed Wi-Fi access"],
  extraCharges: ac ? ["Electricity as per separate room sub-meter (₹10/unit)"] : [],
  availability: now ? "now" : "unknown",
  ...extra,
});

export const propertyMedia = {
  building: { type: "image" as const, url: "/images/hero-building.jpg", alt: "Luxora PG modern architecture exterior facade at dusk", caption: "Exterior Facade", tag: "Building" },
  single: { type: "image" as const, url: "/images/room-single.jpg", alt: "Luxury single room with study desk, warm headboard lighting", caption: "Executive Single Room", tag: "Room" },
  double: { type: "image" as const, url: "/images/room-double.jpg", alt: "Spacious twin-sharing bedroom with individual study tables and wardrobes", caption: "Premium Double Sharing", tag: "Room" },
  study: { type: "image" as const, url: "/images/study-lounge.jpg", alt: "Quiet co-working and study lounge with 100 Mbps Wi-Fi pods", caption: "24/7 Co-working Study Pods", tag: "Study Lounge" },
  dining: { type: "image" as const, url: "/images/dining-hall.jpg", alt: "Spotless hygienic dining cafeteria serving fresh nutritious food", caption: "Hygienic Dining Hall", tag: "Dining" },
  rooftop: { type: "image" as const, url: "/images/rooftop-terrace.jpg", alt: "Aesthetic rooftop terrace garden with fairy lights and city sunset view", caption: "Rooftop Garden Terrace", tag: "Rooftop" },
  washroom: { type: "image" as const, url: "/images/bathroom.jpg", alt: "Ensuite luxury bathroom with glass shower cabin and vanity mirror", caption: "Ensuite Modern Bathroom", tag: "Washroom" },
};

const nearbyPlacesFor = (area: string): NearbyPlace[] => {
  switch (area) {
    case "satellite":
      return [
        { id: "sat-m1", category: "metro", name: "Doordarshan Kendra Metro Station", address: "Drive In Rd, Thaltej-Satellite Link", distanceKm: 0.9, distanceMethod: "route", source: "Ahmedabad Metro Phase 1 Verified", lastVerified: "2026-10-10", external: true },
        { id: "sat-b1", category: "breakfast", name: "Iscon Gathiya & Jalebi", address: "Jodhpur Cross Road, Satellite", distanceKm: 0.4, distanceMethod: "route", source: "Field Survey", lastVerified: "2026-10-11", external: true },
        { id: "sat-t1", category: "tiffin", name: "Annapurna Home Tiffin Services", address: "B/H Shivranjani Society, Satellite", distanceKm: 0.6, distanceMethod: "route", source: "Resident Feedback", lastVerified: "2026-10-09", external: true },
        { id: "sat-g1", category: "grocery", name: "Reliance Smart Point & Amul Parlour", address: "Star Bazaar Road, Satellite", distanceKm: 0.3, distanceMethod: "route", source: "Field Survey", lastVerified: "2026-10-12", external: true },
        { id: "sat-p1", category: "pharmacy", name: "Apollo 24|7 Pharmacy", address: "Opp. Seema Hall, Anandnagar Rd", distanceKm: 0.5, distanceMethod: "route", source: "Field Survey", lastVerified: "2026-10-12", external: true },
      ];
    case "vastrapur":
      return [
        { id: "vas-m1", category: "metro", name: "Gurukul Road Metro Station", address: "Drive-In Road", distanceKm: 1.4, distanceMethod: "route", source: "Ahmedabad Metro", lastVerified: "2026-10-10", external: true },
        { id: "vas-b1", category: "breakfast", name: "Karnavati Dabeli & Live Dhokla Center", address: "Vastrapur Lake Food Street", distanceKm: 0.3, distanceMethod: "route", source: "Field Survey", lastVerified: "2026-10-11", external: true },
        { id: "vas-t1", category: "tiffin", name: "Swad Kathiyawadi & Gujarati Tiffin", address: "Near Mansi Circle, Vastrapur", distanceKm: 0.7, distanceMethod: "route", source: "Resident Feedback", lastVerified: "2026-10-08", external: true },
        { id: "vas-g1", category: "grocery", name: "Nature Basket & D-Mart Ready", address: "Premchand Nagar Rd, Vastrapur", distanceKm: 0.5, distanceMethod: "route", source: "Field Survey", lastVerified: "2026-10-10", external: true },
      ];
    case "navrangpura":
      return [
        { id: "nav-m1", category: "metro", name: "Commerce Six Roads Metro Station", address: "University Road, Navrangpura", distanceKm: 0.5, distanceMethod: "route", source: "Ahmedabad Metro Official", lastVerified: "2026-10-12", external: true },
        { id: "nav-b1", category: "breakfast", name: "Jay Bhavani Vadapav & Tea Post", address: "Commerce Six Roads, Navrangpura", distanceKm: 0.2, distanceMethod: "route", source: "Field Survey", lastVerified: "2026-10-12", external: true },
        { id: "nav-t1", category: "tiffin", name: "Maa Ki Rasoi Pure Veg Mess", address: "Near LD College Gate, Navrangpura", distanceKm: 0.6, distanceMethod: "route", source: "Field Survey", lastVerified: "2026-10-11", external: true },
        { id: "nav-p1", category: "pharmacy", name: "Medkart Pharmacy (Generic & Brand)", address: "Mithakhali Six Roads, Navrangpura", distanceKm: 0.7, distanceMethod: "route", source: "Field Survey", lastVerified: "2026-10-10", external: true },
      ];
    case "thaltej":
      return [
        { id: "tha-m1", category: "metro", name: "Thaltej Metro Station (Terminal)", address: "Near Zydus Hospital Cross Rd, Thaltej", distanceKm: 0.6, distanceMethod: "route", source: "Ahmedabad Metro", lastVerified: "2026-10-11", external: true },
        { id: "tha-b1", category: "breakfast", name: "Gwalia Sweets & South Indian Tiffin", address: "Hebatpur Road, Thaltej", distanceKm: 0.5, distanceMethod: "route", source: "Field Survey", lastVerified: "2026-10-10", external: true },
        { id: "tha-t1", category: "tiffin", name: "Shreeji Punjabi & Jain Tiffin Center", address: "Baghban Party Plot Road, Thaltej", distanceKm: 0.8, distanceMethod: "route", source: "Resident Feedback", lastVerified: "2026-10-09", external: true },
        { id: "tha-g1", category: "grocery", name: "Amul Ice Cream & Daily Fresh Grocery", address: "Thaltej Shilaj Road", distanceKm: 0.4, distanceMethod: "route", source: "Field Survey", lastVerified: "2026-10-11", external: true },
      ];
    default:
      return [];
  }
};

const base = (
  slug: string,
  name: string,
  gender: Property["gender"],
  area: string,
  extra: Partial<Property>
): Property => ({
  slug,
  name,
  gender,
  area,
  address: "Plot 42, Near Main Transit Corridor, Ahmedabad",
  description: "Designed for serious students and ambitious working professionals who value quiet focus, hygienic living, and respectful house culture. Features premium wooden furnishing, 24/7 power backup, high-speed dual Wi-Fi lines, biometric entry, and regular professional housekeeping.",
  status: "active",
  verified: true,
  featured: false,
  rooms: [],
  facilities: [],
  media: [
    propertyMedia.building,
    propertyMedia.single,
    propertyMedia.double,
    propertyMedia.study,
    propertyMedia.dining,
    propertyMedia.rooftop,
    propertyMedia.washroom,
  ],
  rules: [
    "Biometric entry active 24/7; quiet study hours strictly observed between 11:00 PM and 6:30 AM.",
    "Daytime visitors permitted in ground-floor lounge only (10:00 AM – 7:00 PM with ID sign-in).",
    "Zero tolerance for smoking, alcohol, narcotics, or loud partying on premises.",
    "Electricity billed transparently per individual room sub-meter at government tariff rates.",
    "30-day prior written notice required before move-out; deposit refunded within 5 business days after room inspection.",
  ],
  nearby: nearbyPlacesFor(area),
  updatedAt: NOW,
  ...extra,
});

export const sampleProperties: Property[] = [
  base("luxora-boys-satellite", "Luxora Boys PG, Satellite", "boys", "satellite", {
    featured: true,
    address: "24, Golden Tulip Lane, Opp. ISRO Staff Quarters, Satellite, Ahmedabad",
    description: "Our flagship boys residence in Satellite, engineered for university students and IT engineers. Features air-conditioned study pods, dedicated motorbike parking with CCTV surveillance, high-speed commercial Wi-Fi, and 2-minute walking access to Jodhpur Cross Road food hub.",
    rooms: [
      room("sb-sat-1", "single", true, 9500, 9500, true),
      room("sb-sat-2", "double", true, 7800, 7500, true),
      room("sb-sat-3", "triple", false, 5500, 5000, true),
    ],
    facilities: fac(
      ["wifi", "cctv", "water", "housekeeping", "power-backup", "parking"],
      ["laundry", "meals"]
    ),
    metro: { station: "Doordarshan Kendra Metro", distanceKm: 0.9, method: "route", verifiedAt: "2026-10-10" },
    rules: [
      "Biometric gate entry; night entry past 11:00 PM permitted with digital self-log.",
      "Dedicated high-speed study lounge with silence policy after 10:30 PM.",
      "Motorcycle parking with numbered slots and 24/7 HD CCTV recording.",
      "Electricity sub-meter charged at ₹10/unit; RO drinking water provided 24x7 without extra fee.",
    ],
  }),

  base("luxora-girls-satellite", "Luxora Girls PG, Satellite", "girls", "satellite", {
    featured: true,
    address: "B-12, Green Haven Enclave, Near Jodhpur Char Rasta, Satellite, Ahmedabad",
    description: "A secure, premium girls PG in a well-lit gated residential society. Offers 24/7 on-site female resident warden, biometric door locks, high-speed Wi-Fi, daily housekeeping, and optional nutritious home-style breakfast and dinner.",
    rooms: [
      room("sg-sat-1", "single", true, 10500, 10000, true),
      room("sg-sat-2", "double", true, 8200, 8000, true),
      room("sg-sat-3", "triple", false, 6000, 6000, true),
    ],
    facilities: fac(
      ["wifi", "cctv", "water", "housekeeping", "power-backup", "laundry"],
      ["meals"]
    ),
    metro: { station: "Doordarshan Kendra Metro", distanceKm: 0.9, method: "route", verifiedAt: "2026-10-10" },
    rules: [
      "24/7 female warden in residence; entry gate closes at 10:00 PM (late passes available via parent approval portal).",
      "Biometric entry for residents; guest policy restricted to ground floor reception lobby.",
      "Daily room cleaning, twice-weekly linen wash, and hygienic RO water on all floors.",
      "Strict security monitoring with 16 high-definition cameras in all external and corridor common areas.",
    ],
  }),

  base("luxora-boys-vastrapur", "Luxora Boys PG, Vastrapur", "boys", "vastrapur", {
    featured: true,
    address: "8, Lake View Residency, Behind Alpha One Mall, Vastrapur, Ahmedabad",
    description: "Located 400 metres from Vastrapur Lake, this PG is popular among IIM aspirants, CAT students, and startup founders. Spacious rooms with large sunny balconies, co-working workstations, and 24-hour backup generator.",
    rooms: [
      room("sb-vas-1", "double", true, 8000, 8000, true),
      room("sb-vas-2", "triple", true, 6500, 6000, true),
      room("sb-vas-3", "dormitory", false, 4500, 4000, true),
    ],
    facilities: fac(
      ["wifi", "cctv", "water", "housekeeping", "power-backup", "parking"],
      ["laundry", "meals"]
    ),
    metro: { station: "Gurukul Road Metro", distanceKm: 1.4, method: "route", verifiedAt: "2026-10-10" },
    rules: [
      "Strict silence maintained in library and study area at all times.",
      "Cleanliness audit every Sunday; personal waste bins emptied daily.",
      "Filtered hot water geysers in all ensuite attached bathrooms.",
      "Visitor entry logged at reception desk; no overnight outside guests.",
    ],
  }),

  base("luxora-girls-navrangpura", "Luxora Girls PG, Navrangpura", "girls", "navrangpura", {
    featured: true,
    address: "15, University Greens, Opp. Commerce Six Roads Metro Gate 2, Navrangpura, Ahmedabad",
    description: "The ideal academic stay for Gujarat University and CEPT students. Located just 5 minutes walk from Commerce Six Roads Metro station. Features modern study desks, ergonomic chairs, attached bathrooms, and delicious warm meal plans.",
    rooms: [
      room("sg-nav-1", "single", true, 11000, 10000, false),
      room("sg-nav-2", "double", true, 8500, 8000, true),
      room("sg-nav-3", "triple", false, 6200, 6000, true),
    ],
    facilities: fac(
      ["wifi", "cctv", "water", "housekeeping", "power-backup", "meals", "laundry"]
    ),
    metro: { station: "Commerce Six Roads Metro", distanceKm: 0.5, method: "route", verifiedAt: "2026-10-12" },
    rules: [
      "Secure biometric turnstiles at entrance; 24-hour lady guard on duty.",
      "Curfew at 10:00 PM; academic project extensions permitted with prior email notification.",
      "Three meals included on weekdays, brunch + dinner on weekends in the hygienic dining hall.",
      "No male visitors beyond the verified waiting lounge.",
    ],
  }),

  base("luxora-boys-thaltej", "Luxora Boys PG, Thaltej", "boys", "thaltej", {
    featured: false,
    address: "31, Silicon Square Avenue, Near Thaltej Metro Station, SG Highway, Ahmedabad",
    description: "A sleek, boutique executive residence designed for IT professionals working on SG Highway and Sola. Highlights include private high-speed mesh Wi-Fi per floor, soundproof study corners, modern gym corner, and laundry room.",
    rooms: [
      room("sb-tha-1", "single", true, 9800, 9500, true),
      room("sb-tha-2", "double", true, 7500, 7000, true),
      room("sb-tha-3", "triple", false, 5200, 5000, true),
    ],
    facilities: fac(
      ["wifi", "cctv", "water", "housekeeping", "power-backup", "parking"],
      ["laundry"]
    ),
    metro: { station: "Thaltej Metro Station", distanceKm: 0.6, method: "route", verifiedAt: "2026-10-11" },
    rules: [
      "Ideal for working professionals with flexible work shifts; 24-hour keycard access.",
      "Quiet hours after 11:30 PM in all bedroom corridors.",
      "Covered parking for two-wheelers and limited reserved four-wheeler slots.",
      "Security deposit 100% refundable upon 30 days notice.",
    ],
  }),

  base("luxora-girls-thaltej", "Luxora Girls PG, Thaltej", "girls", "thaltej", {
    featured: false,
    address: "7, Harmony Park, Off Hebatpur Road, Thaltej, Ahmedabad",
    description: "A peaceful, premium residence in leafy Thaltej. Large airy bedrooms with sunlit balconies, attached bathrooms, RO water purifier dispensers, full power inverter backup, and a picturesque rooftop garden for unwinding.",
    rooms: [
      room("sg-tha-1", "single", true, 10800, 10000, true),
      room("sg-tha-2", "double", true, 8200, 8000, true),
      room("sg-tha-3", "triple", false, 5800, 5500, true),
    ],
    facilities: fac(
      ["wifi", "cctv", "water", "housekeeping", "power-backup", "laundry"],
      ["meals"]
    ),
    metro: { station: "Thaltej Metro Station", distanceKm: 0.8, method: "route", verifiedAt: "2026-10-11" },
    rules: [
      "Strict biometric entry with round-the-clock female superintendent.",
      "10:00 PM evening gate timing with digital parent intimation system.",
      "Dedicated rooftop yoga & unwind deck open 6:00 AM – 9:00 PM.",
      "Clean RO drinking water and solar water heating in every washroom.",
    ],
  }),
];
