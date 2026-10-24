/**
 * CMS content types and defaults. Safe to import from client components (no server-only imports).
 */

export interface HeroSlide {
  image: string;
  label: string;
  tag: string;
  location: string;
  beds: string;
}

export interface AreaContent {
  slug: string;
  name: string;
  image: string;
  tag: string;
  landmark: string;
  metroStation: string;
  distance: string;
  intro: string;
}

export interface AmenityContent {
  id: string;
  title: string;
  tag: string;
  description: string;
  image: string;
  features: string[];
}

export interface NavMenuItem {
  title: string;
  desc: string;
  href: string;
  icon: string;
  tag?: string;
}

export interface NavGroupConfig {
  label: string;
  items: NavMenuItem[];
}

export type SocialKey = "instagram" | "facebook" | "linkedin" | "youtube" | "twitter";
export const SOCIAL_LABELS: Record<SocialKey, string> = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", youtube: "YouTube", twitter: "X (Twitter)" };

export interface BranchOffice {
  name: string;
  address: string;
  metro: string;
}

export interface AboutPillar {
  icon: string;
  title: string;
  desc: string;
}

export interface SecurityStep {
  step: string;
  title: string;
  desc: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  category: string;
  items: FaqItem[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  property: string;
  rating: number;
  text: string;
  verifiedStay: string;
  avatarText?: string;
  avatarUrl?: string;
  accentColor?: string;
}

export interface SiteCmsData {
  // 1. Navigation Menu & Announcements
  navigation: {
    announcement: string;
    announcementLink: string;
    ctaLabel: string;
    ctaHref: string;
    groups: NavGroupConfig[];
  };

  // 2. Hero Section
  hero: {
    line1: string;
    line2: string;
    line3: string;
    subtitle: string;
    badge1: string;
    badge2: string;
    slides: HeroSlide[];
  };

  // 3. Area Showcase
  areas: Record<string, AreaContent>;

  // 4. Lifestyle & Amenities
  amenities: AmenityContent[];

  // 5. Site Settings & Contact Desk
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    visitingHours: string;
    announcement: string;
    branches: BranchOffice[];
    /** Public profile links shown in the footer. Empty means "not set": the icon is hidden. */
    socials?: Partial<Record<SocialKey, string>>;
  };

  // 6. About Page Story, Guarantees & Protocols
  about: {
    heroTitle: string;
    heroSubtitle: string;
    heroBadge: string;
    statBeds: string;
    statRating: string;
    statResidents: string;
    statYears: string;
    originBadge: string;
    originTitle: string;
    originP1: string;
    originP2: string;
    originImage: string;
    pillars: AboutPillar[];
    securitySteps: SecurityStep[];
  };

  // 7. Frequently Asked Questions
  faq: {
    title: string;
    intro: string;
    categories: FaqCategory[];
  };

  // 8. Footer Section
  footer: {
    newsletterHeading: string;
    newsletterSub: string;
    disclaimer: string;
    copyrightNotice: string;
  };

  // 9. Homepage section order & visibility (drag-and-drop managed)
  homeSections: HomeSectionConfig[];

  // 10. Resident Testimonials
  testimonials?: TestimonialItem[];

  // 11. Site-wide SEO defaults
  seo: {
    title: string;
    description: string;
    ogImage: string;
  };

  lastSaved?: string;
}

export type HomeSectionId = "featured" | "lifestyle" | "tour" | "calculator" | "tools" | "metro" | "areas" | "testimonials" | "stats" | "contact";
export interface HomeSectionConfig { id: HomeSectionId; visible: boolean }

export const HOME_SECTION_LABELS: Record<HomeSectionId, string> = {
  featured: "Featured properties",
  lifestyle: "Lifestyle & amenities",
  tour: "Virtual room tour",
  calculator: "Cost calculator",
  tools: "Decision tools (match / compare)",
  metro: "Metro & food explorer banner",
  areas: "Neighbourhood guide",
  testimonials: "Resident reviews",
  stats: "At-a-glance numbers",
  contact: "Inquiry form",
};

export const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = (Object.keys(HOME_SECTION_LABELS) as HomeSectionId[]).map((id) => ({ id, visible: true }));

/** Keeps stored order, drops unknown ids, appends sections added in newer versions. */
export function normalizeHomeSections(input?: HomeSectionConfig[] | null): HomeSectionConfig[] {
  const known = new Set(DEFAULT_HOME_SECTIONS.map((x) => x.id));
  const seen = new Set<string>();
  const out: HomeSectionConfig[] = [];
  for (const x of input || []) {
    if (known.has(x.id) && !seen.has(x.id)) { seen.add(x.id); out.push({ id: x.id, visible: x.visible !== false }); }
  }
  for (const d of DEFAULT_HOME_SECTIONS) if (!seen.has(d.id)) out.push({ ...d });
  return out;
}

export const DEFAULT_CMS_DATA: SiteCmsData = {
  navigation: {
    announcement: "Admissions Open 2026-27: Verified Boys & Girls PGs in Satellite, Vastrapur, Navrangpura & Thaltej. 0% Brokerage.",
    announcementLink: "/pgs",
    ctaLabel: "Schedule Visit",
    ctaHref: "/contact",
    groups: [
      {
        label: "Accommodations",
        items: [
          {
            title: "All PG Residences",
            desc: "Browse our complete verified inventory in Ahmedabad",
            href: "/pgs",
            icon: "Building2",
          },
          {
            title: "Boys PG Stays",
            desc: "24/7 biometric night entry, bike parking & study desks",
            href: "/pgs/boys",
            icon: "Users",
            tag: "Popular",
          },
          {
            title: "Girls PG Stays",
            desc: "24/7 on-site female wardens, biometric gates & safe societies",
            href: "/pgs/girls",
            icon: "ShieldCheck",
            tag: "Verified Safe",
          },
          {
            title: "Neighbourhood Hubs",
            desc: "Satellite, Vastrapur, Navrangpura & Thaltej",
            href: "/areas",
            icon: "MapPin",
          },
        ],
      },
      {
        label: "Explore & Living",
        items: [
          {
            title: "Metro & Nashta Explorer",
            desc: "Route-checked walking distances to metro & local food joints",
            href: "/nearby",
            icon: "Train",
            tag: "Verified",
          },
          {
            title: "Facilities & Services",
            desc: "Complete matrix of included amenities vs paid options",
            href: "/facilities",
            icon: "Layers",
          },
          {
            title: "Photo & 360° Gallery",
            desc: "High-resolution photos of rooms, study lounges & terrace",
            href: "/gallery",
            icon: "Compass",
          },
        ],
      },
      {
        label: "Decision Tools",
        items: [
          {
            title: "Smart PG Matcher",
            desc: "5-question quiz to find your ideal room & budget",
            href: "/match",
            icon: "Sparkles",
            tag: "AI Quiz",
          },
          {
            title: "Compare 3 Stays",
            desc: "Side-by-side rent, sharing, facilities & house rules",
            href: "/compare",
            icon: "GitCompareArrows",
          },
        ],
      },
    ],
  },
  hero: {
    line1: "Your next home,",
    line2: "near where you",
    line3: "study and work.",
    subtitle: "Curated student & executive residences across Satellite, Vastrapur, Navrangpura & Thaltej. Clear room rent, verified metro walking routes, and respectful house rules.",
    badge1: "PG in Ahmedabad for Students & Professionals",
    badge2: "Zero Brokerage · 100% Owner Verified",
    slides: [
      {
        image: "/images/hero-building.jpg",
        label: "Flagship Residence Exterior",
        tag: "Flagship Campus",
        location: "Satellite, Ahmedabad",
        beds: "Single & Double",
      },
      {
        image: "/images/room-single.jpg",
        label: "Executive Single Suite with Study Pod",
        tag: "Private Suite",
        location: "Satellite & Navrangpura",
        beds: "Private Single AC",
      },
      {
        image: "/images/study-lounge.jpg",
        label: "24/7 Co-working Study Lounge",
        tag: "Productivity Hub",
        location: "All Residences (100 Mbps)",
        beds: "Work Desks & Wi-Fi",
      },
      {
        image: "/images/rooftop-terrace.jpg",
        label: "Aesthetic Rooftop Sunset Deck",
        tag: "Skyline Lounge",
        location: "Thaltej & Satellite",
        beds: "Community Space",
      },
      {
        image: "/images/dining-hall.jpg",
        label: "Hygienic Dining Cafeteria",
        tag: "3 Fresh Meals Daily",
        location: "Navrangpura & Satellite",
        beds: "Full Meal Plan",
      },
    ],
  },
  areas: {
    satellite: {
      slug: "satellite",
      name: "Satellite",
      image: "/images/hero-building.jpg",
      tag: "Flagship Hub",
      landmark: "Near ISRO & Jodhpur Cross Roads",
      metroStation: "Doordarshan Kendra Metro",
      distance: "1.1 km route",
      intro: "Quiet, established residential area near ISRO and SG Highway. Easy access to Prahlad Nagar and Shivranjani.",
    },
    navrangpura: {
      slug: "navrangpura",
      name: "Navrangpura",
      image: "/images/study-lounge.jpg",
      tag: "Academic Capital",
      landmark: "Near CEPT, Gujarat University & HL College",
      metroStation: "Commerce Six Roads Metro",
      distance: "0.5 km route",
      intro: "Ahmedabad's prime student and institutional hub. Walking distance to Gujarat University, CEPT and Commerce Six Roads.",
    },
    vastrapur: {
      slug: "vastrapur",
      name: "Vastrapur",
      image: "/images/rooftop-terrace.jpg",
      tag: "Vibrant Lake & IIM-A",
      landmark: "Near IIM Ahmedabad & Alpha One Mall",
      metroStation: "Gurukul Road Metro",
      distance: "1.4 km route",
      intro: "Green, lively neighbourhood around Vastrapur Lake. Close to IIM-A, Ahmedabad University and prime shopping.",
    },
    thaltej: {
      slug: "thaltej",
      name: "Thaltej",
      image: "/images/room-single.jpg",
      tag: "Executive Tech Corridor",
      landmark: "Near SG Highway, Zydus & Palladium",
      metroStation: "Thaltej Metro Station",
      distance: "0.6 km route",
      intro: "Modern residential belt along SG Highway with direct metro connectivity. Ideal for IT and corporate professionals.",
    },
  },
  amenities: [
    {
      id: "study",
      title: "24/7 Co-working Study Lounges",
      tag: "Academic Focus",
      description: "Ergonomic study chairs, dual 100 Mbps redundant fibre connections, soundproofing, and private charging ports.",
      image: "/images/study-lounge.jpg",
      features: ["Acoustic treatment", "100 Mbps Fibre", "Power backup", "Individual study pods"],
    },
    {
      id: "food",
      title: "Hygienic Dining & 3 Fresh Meals",
      tag: "Pure Nutrition",
      description: "Cooked in clean, commercial-grade stainless steel kitchens. Rotating Gujarati, North Indian, and Jain menus.",
      image: "/images/dining-hall.jpg",
      features: ["Breakfast, lunch & dinner", "RO purified drinking water", "Unlimited servings", "Weekly special dessert"],
    },
    {
      id: "rooftop",
      title: "Aesthetic Rooftop Deck & Community",
      tag: "Lifestyle & Wellness",
      description: "Open-air sunset hangout space for evening discussions, yoga sessions, acoustic nights, and unwinding.",
      image: "/images/rooftop-terrace.jpg",
      features: ["Panoramic skyline view", "Turf & seating lounge", "Festival gatherings", "Table tennis & board games"],
    },
    {
      id: "washroom",
      title: "Attached Ceramic Modern Washrooms",
      tag: "Hygiene Standard",
      description: "Equipped with branded sanitaryware, 24/7 solar + instant geyser hot water, anti-skid tiles, and daily sanitization.",
      image: "/images/bathroom.jpg",
      features: ["Hot water geysers", "Mirror & vanity shelf", "Exhaust ventilation", "Daily housekeeping"],
    },
  ],
  contact: {
    phone: "+91 98250 12345",
    whatsapp: "919825012345",
    email: "contact@luxorapg.com",
    address: "Luxora House, Opp. Shivranjani Cross Road, Satellite, Ahmedabad, Gujarat 380015",
    visitingHours: "10:00 AM – 7:30 PM (Daily)",
    announcement: "Admissions Open 2026-27: Verified Boys & Girls PGs in Satellite, Vastrapur, Navrangpura & Thaltej. 0% Brokerage.",
    branches: [
      {
        name: "Satellite Residence (Flagship)",
        address: "24, Golden Tulip Lane, Opp. ISRO Staff Quarters, Satellite, Ahmedabad",
        metro: "Doordarshan Kendra Metro (0.9 km)",
      },
      {
        name: "Vastrapur Residence",
        address: "8, Lake View Residency, Behind Alpha One Mall, Vastrapur, Ahmedabad",
        metro: "Gurukul Road Metro (1.4 km)",
      },
      {
        name: "Navrangpura Academic Residence",
        address: "15, University Greens, Opp. Commerce Six Roads Metro Gate 2, Navrangpura, Ahmedabad",
        metro: "Commerce Six Roads Metro (0.5 km)",
      },
      {
        name: "Thaltej Executive Residence",
        address: "31, Silicon Square Avenue, Near Thaltej Metro Station, SG Highway, Ahmedabad",
        metro: "Thaltej Metro Station (0.6 km)",
      },
    ],
  },
  about: {
    heroTitle: "Revolutionising PG Living in Ahmedabad",
    heroSubtitle: "From a single 12-bed facility in Satellite in 2021 to Gujarat's leading verified student and executive co-living network.",
    heroBadge: "The Luxora Story & Mission",
    statBeds: "500+ Beds Managed",
    statRating: "4.8★ Resident Rating",
    statResidents: "1,200+ Alumni",
    statYears: "5+ Years of Excellence",
    originBadge: "The Luxora Origin Story",
    originTitle: "Built out of frustration with broker scams & hidden fees",
    originP1: "Anyone who has searched for a paying-guest room in Ahmedabad knows the frustration: deceptive photos that look nothing like reality, brokers demanding thousands in non-refundable commission, and surprise utility bills at the end of the month.",
    originP2: "At Luxora PG, we dismantled that broken model. We own and operate dedicated residences across Satellite, Vastrapur, Navrangpura, and Thaltej. We publish high-resolution actual photos, exact room dimensions, real meter rates, and route-checked walking distances to metro stations.",
    originImage: "/images/hero-building.jpg",
    pillars: [
      {
        icon: "ShieldCheck",
        title: "Radical Rent Transparency",
        desc: "Every rupee is documented. Sub-meters for AC, zero hidden maintenance dues, and 100% refundable deposits returned within 5 banking days upon 30-day notice.",
      },
      {
        icon: "Lock",
        title: "Multi-Tiered Safety Shield",
        desc: "24/7 biometric gates, HD CCTV in public corridors, on-site female superintendents at girls' residences, and digital visitor logging.",
      },
      {
        icon: "Wifi",
        title: "Enterprise Dual-Line Wi-Fi",
        desc: "Commercial 100 Mbps fiber lines with automatic load-balancing. Zero dead zones in bedrooms, study carrels, and dining lounges.",
      },
      {
        icon: "Utensils",
        title: "Nutritious Homestyle Meals",
        desc: "FSSAI-compliant kitchens preparing fresh vegetarian breakfasts and dinners, with strict adherence to Jain and Swaminarayan requirements.",
      },
      {
        icon: "Sparkles",
        title: "Hospital-Grade Hygiene",
        desc: "Daily floor mopping, sanitized bathrooms with hot water geysers, in-house automatic washing machines, and multi-stage commercial RO water.",
      },
      {
        icon: "Sun",
        title: "Aesthetic Rooftop Community",
        desc: "Open-sky turf lawns with fairy-lit pergolas for morning yoga, sunset reading, and peaceful unwinding away from college stress.",
      },
    ],
    securitySteps: [
      {
        step: "01",
        title: "Biometric Turnstile Access",
        desc: "Residents enter via fingerprint or encrypted RFID keycards. Outside entry is strictly prevented without staff verification.",
      },
      {
        step: "02",
        title: "24/7 Female Wardens in Residence",
        desc: "All girls' properties have dedicated full-time female resident wardens living on the premises to address safety, health, and logistical needs.",
      },
      {
        step: "03",
        title: "Continuous HD CCTV Surveillance",
        desc: "All building entrances, bike parking zones, staircases, and dining corridors are monitored 24/7 with 30-day secure digital cloud backups.",
      },
      {
        step: "04",
        title: "Digital Visitor & Parent Protocol",
        desc: "Visitors must present photo government ID at the ground-floor reception. Overnight outside guests are restricted to safeguard roommate privacy.",
      },
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    intro: "Clear, honest answers about rent breakdown, refundable deposits, gate timings, food plans, and student culture.",
    categories: [
      {
        category: "Rent, Deposits & Move-in",
        items: [
          {
            q: "What is the security deposit and how does the refund process work?",
            a: "The security deposit is strictly equal to one month's rent. It is 100% refundable upon providing a 30-day prior written move-out notice. Once a joint room inspection is completed, the full refund is transferred via NEFT/UPI to your registered bank account within 5 banking business days. We do not make arbitrary deductions.",
          },
          {
            q: "Are there any hidden maintenance fees or brokerage charges?",
            a: "None. Luxora PG operates with zero brokerage because you are dealing directly with property management. Maintenance of RO purifiers, lifts, common area lighting, Wi-Fi mesh, and housekeeping is included in your monthly rent.",
          },
          {
            q: "How is electricity billed?",
            a: "Every room is equipped with an independent digital sub-meter. Non-AC essentials (lights, ceiling fans, mobile chargers) are included in the base rent. Air conditioner units are billed transparently per kilowatt-hour consumed at standard government tariff rates (₹10/unit). You can inspect your sub-meter anytime.",
          },
          {
            q: "What documents are required to book a room?",
            a: "We require one government photo ID (Aadhaar card or Passport), proof of study/employment (college admission letter, student ID, or employer offer letter/work badge), and contact details of a parent or legal guardian.",
          },
        ],
      },
      {
        category: "Safety, Security & Timings",
        items: [
          {
            q: "What are the entry timings and gate curfew rules?",
            a: "At Boys PGs, biometric keycard entry is accessible 24/7. For late night arrivals past 11:00 PM, residents simply log their arrival digitally on the security turnstile. At Girls PGs, the main gate timing is 10:00 PM. Academic project extensions or late office shifts are accommodated via digital late-pass.",
          },
          {
            q: "What are the security measures in place?",
            a: "All properties feature 24/7 high-definition CCTV coverage in all external and corridor public spaces, biometric fingerprint/RFID turnstiles, and trained security personnel. Girls' residences have full-time on-site female wardens.",
          },
          {
            q: "Can outside visitors or friends come to my room?",
            a: "Parents and family members are welcome in the ground-floor reception lounge between 10:00 AM and 7:00 PM with an ID register sign-in. Outside guests are not permitted inside residential bedrooms.",
          },
        ],
      },
      {
        category: "Food, Hygiene & Facilities",
        items: [
          {
            q: "Does Luxora PG serve meals or do I need external tiffin?",
            a: "Properties with in-house cafeterias offer nutritious 2-meal or 3-meal options with fresh Gujarati and North Indian vegetarian menus. Jain and Swaminarayan food options are prepared on request.",
          },
          {
            q: "How fast and reliable is the internet connection?",
            a: "Every property is wired with commercial enterprise dual-line fiber connections (100 Mbps each) configured with automatic failover and Wi-Fi 6 mesh routers.",
          },
          {
            q: "How often are rooms and bathrooms cleaned?",
            a: "Daily housekeeping sweeps and mops bedroom floors and empties personal trash bins. Attached ensuite washrooms are deep-cleaned twice a week using hospital-grade disinfectants.",
          },
        ],
      },
    ],
  },
  footer: {
    newsletterHeading: "Get Instant WhatsApp & Email Vacancy Alerts",
    newsletterSub: "New admissions at CEPT, Gujarat University, Nirma, and IIM-A fill up rapidly. Receive early notifications for upcoming semester room vacancies and exclusive move-in waivers.",
    disclaimer: "Luxora PG is a registered student & executive housing brand in Ahmedabad, Gujarat. All room dimensions, deposit terms, and amenities are verified by on-site property managers.",
    copyrightNotice: "© 2026 Luxora PG Ahmedabad. All rights reserved. Zero Brokerage Guaranteed.",
  },
  homeSections: DEFAULT_HOME_SECTIONS.map((x) => ({ ...x })),
  testimonials: [
    {
      id: "rev-1",
      name: "Aakash Patel",
      role: "Senior Software Engineer, SG Highway IT Park",
      property: "Luxora Boys PG, Satellite",
      rating: 5,
      text: "The Wi-Fi never drops even during my late-night sprint deployments. Having Doordarshan Kendra metro just 10 mins walk away saves me at least 45 minutes of daily commute in Ahmedabad traffic. Zero brokerage and exact sub-meter billing.",
      verifiedStay: "Resident for 11 months",
      avatarText: "AP",
      accentColor: "from-blue-600 to-indigo-600",
    },
    {
      id: "rev-2",
      name: "Pooja Trivedi",
      role: "M.Arch Student, CEPT University",
      property: "Luxora Girls PG, Navrangpura",
      rating: 5,
      text: "Finding a girls' PG in Navrangpura that actually respects student architecture project timings was tough until Luxora. The biometric entry, 24/7 on-site lady warden, and walking distance to Commerce Six Roads Metro make it unbeatable.",
      verifiedStay: "Resident for 9 months",
      avatarText: "PT",
      accentColor: "from-pink-600 to-rose-600",
    },
    {
      id: "rev-3",
      name: "Rohan Deshmukh",
      role: "CAT Aspirant & IIM Ahmedabad Candidate",
      property: "Luxora Boys PG, Vastrapur",
      rating: 5,
      text: "The 24/7 co-working study lounge is a complete game-changer. Total silence after 10:30 PM, ergonomic high-back chairs, and zero disturbance from loud roommates. Got my deposit refunded cleanly without any dispute.",
      verifiedStay: "Resident for 7 months",
      avatarText: "RD",
      accentColor: "from-purple-600 to-brand",
    },
  ],
  seo: {
    title: "PG in Ahmedabad | Boys & Girls PG Accommodation | Luxora PG",
    description: "Find boys and girls PG accommodation in Ahmedabad: compare rent, single, double and triple sharing, facilities and metro distance, then book a free visit.",
    ogImage: "/images/hero-building.jpg",
  },
};
