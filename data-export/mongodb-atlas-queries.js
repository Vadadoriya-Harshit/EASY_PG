/**
 * =========================================================================
 * MONGODB ATLAS 1-CLICK SEED SCRIPT (MONGOSH / ATLAS WEB SHELL)
 * Copy & Paste this entire script into MongoDB Atlas Web Shell or Compass.
 * =========================================================================
 */

// 1. Ensure collection indexes
db.areas.createIndex({ slug: 1 }, { unique: true });
db.properties.createIndex({ slug: 1 }, { unique: true });
db.cms.createIndex({ key: 1 }, { unique: true });
db.inquiries.createIndex({ id: 1 }, { unique: true });

// 2. Insert Areas
print("Seeding areas...");
const areas = [
  {
    "slug": "satellite",
    "name": "Satellite",
    "city": "Ahmedabad",
    "intro": "Prime residential & student corridor near ISRO, Jodhpur Char Rasta, and SG Highway corporate hub. Excellent connectivity via Doordarshan Kendra Metro and BRTS feeder lines.",
    "landmarks": [
      "Doordarshan Kendra Metro",
      "Jodhpur Cross Roads",
      "Star Bazaar",
      "ISRO Colony"
    ],
    "active": true
  },
  {
    "slug": "vastrapur",
    "name": "Vastrapur",
    "city": "Ahmedabad",
    "intro": "Vibrant educational & youth district surrounding the serene Vastrapur Lake, IIM Ahmedabad campus, and Alpha One Mall. Famous for quiet study cafes and evening street food hubs.",
    "landmarks": [
      "Vastrapur Lake",
      "IIM Ahmedabad",
      "Ahmedabad University",
      "Alpha One Mall"
    ],
    "active": true
  },
  {
    "slug": "navrangpura",
    "name": "Navrangpura",
    "city": "Ahmedabad",
    "intro": "The university heart of Ahmedabad hosting Gujarat University, CEPT University, and premier coaching centers. Walking distance from Commerce Six Roads Metro station.",
    "landmarks": [
      "Commerce Six Roads Metro",
      "Gujarat University Library",
      "CEPT Campus",
      "LD College of Engineering"
    ],
    "active": true
  },
  {
    "slug": "thaltej",
    "name": "Thaltej",
    "city": "Ahmedabad",
    "intro": "Modern, quiet, upscale neighbourhood near Thaltej Metro Station (Blue Line terminus) and SG Highway IT corridor. Ideal for IT professionals and postgraduates wanting calm surroundings.",
    "landmarks": [
      "Thaltej Metro Station",
      "Acropolis Mall",
      "SG Highway IT Park",
      "Sola Civil Circle"
    ],
    "active": true
  }
];
for (const a of areas) {
  db.areas.updateOne({ slug: a.slug }, { $set: a }, { upsert: true });
}

// 3. Insert Properties
print("Seeding properties...");
const properties = [
  {
    "slug": "luxora-boys-satellite",
    "name": "Luxora Boys PG, Satellite",
    "gender": "boys",
    "area": "satellite",
    "address": "24, Golden Tulip Lane, Opp. ISRO Staff Quarters, Satellite, Ahmedabad",
    "description": "Our flagship boys residence in Satellite, engineered for university students and IT engineers. Features air-conditioned study pods, dedicated motorbike parking with CCTV surveillance, high-speed commercial Wi-Fi, and 2-minute walking access to Jodhpur Cross Road food hub.",
    "status": "active",
    "verified": true,
    "featured": true,
    "rooms": [
      {
        "id": "sb-sat-1",
        "type": "single",
        "ac": true,
        "rent": 9500,
        "rentUnit": "per-bed",
        "deposit": 9500,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [
          "Electricity as per separate room sub-meter (₹10/unit)"
        ],
        "availability": "now"
      },
      {
        "id": "sb-sat-2",
        "type": "double",
        "ac": true,
        "rent": 7800,
        "rentUnit": "per-bed",
        "deposit": 7500,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [
          "Electricity as per separate room sub-meter (₹10/unit)"
        ],
        "availability": "now"
      },
      {
        "id": "sb-sat-3",
        "type": "triple",
        "ac": false,
        "rent": 5500,
        "rentUnit": "per-bed",
        "deposit": 5000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [],
        "availability": "now"
      }
    ],
    "facilities": [
      {
        "key": "wifi",
        "name": "High-Speed Wi-Fi",
        "status": "included"
      },
      {
        "key": "meals",
        "name": "Hygienic Meals",
        "status": "paid"
      },
      {
        "key": "laundry",
        "name": "Laundry & Ironing",
        "status": "paid"
      },
      {
        "key": "housekeeping",
        "name": "Daily Housekeeping",
        "status": "included"
      },
      {
        "key": "cctv",
        "name": "24/7 CCTV & Security",
        "status": "included"
      },
      {
        "key": "parking",
        "name": "Vehicle Parking",
        "status": "included"
      },
      {
        "key": "power-backup",
        "name": "100% Power Backup",
        "status": "included"
      },
      {
        "key": "water",
        "name": "RO Drinking Water",
        "status": "included"
      }
    ],
    "media": [
      {
        "type": "image",
        "url": "/images/hero-building.jpg",
        "alt": "Luxora PG modern architecture exterior facade at dusk",
        "caption": "Exterior Facade",
        "tag": "Building"
      },
      {
        "type": "image",
        "url": "/images/room-single.jpg",
        "alt": "Luxury single room with study desk, warm headboard lighting",
        "caption": "Executive Single Room",
        "tag": "Room"
      },
      {
        "type": "image",
        "url": "/images/room-double.jpg",
        "alt": "Spacious twin-sharing bedroom with individual study tables and wardrobes",
        "caption": "Premium Double Sharing",
        "tag": "Room"
      },
      {
        "type": "image",
        "url": "/images/study-lounge.jpg",
        "alt": "Quiet co-working and study lounge with 100 Mbps Wi-Fi pods",
        "caption": "24/7 Co-working Study Pods",
        "tag": "Study Lounge"
      },
      {
        "type": "image",
        "url": "/images/dining-hall.jpg",
        "alt": "Spotless hygienic dining cafeteria serving fresh nutritious food",
        "caption": "Hygienic Dining Hall",
        "tag": "Dining"
      },
      {
        "type": "image",
        "url": "/images/rooftop-terrace.jpg",
        "alt": "Aesthetic rooftop terrace garden with fairy lights and city sunset view",
        "caption": "Rooftop Garden Terrace",
        "tag": "Rooftop"
      },
      {
        "type": "image",
        "url": "/images/bathroom.jpg",
        "alt": "Ensuite luxury bathroom with glass shower cabin and vanity mirror",
        "caption": "Ensuite Modern Bathroom",
        "tag": "Washroom"
      }
    ],
    "rules": [
      "Biometric gate entry; night entry past 11:00 PM permitted with digital self-log.",
      "Dedicated high-speed study lounge with silence policy after 10:30 PM.",
      "Motorcycle parking with numbered slots and 24/7 HD CCTV recording.",
      "Electricity sub-meter charged at ₹10/unit; RO drinking water provided 24x7 without extra fee."
    ],
    "nearby": [
      {
        "id": "sat-m1",
        "category": "metro",
        "name": "Doordarshan Kendra Metro Station",
        "address": "Drive In Rd, Thaltej-Satellite Link",
        "distanceKm": 0.9,
        "distanceMethod": "route",
        "source": "Ahmedabad Metro Phase 1 Verified",
        "lastVerified": "2026-10-10",
        "external": true
      },
      {
        "id": "sat-b1",
        "category": "breakfast",
        "name": "Iscon Gathiya & Jalebi",
        "address": "Jodhpur Cross Road, Satellite",
        "distanceKm": 0.4,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-11",
        "external": true
      },
      {
        "id": "sat-t1",
        "category": "tiffin",
        "name": "Annapurna Home Tiffin Services",
        "address": "B/H Shivranjani Society, Satellite",
        "distanceKm": 0.6,
        "distanceMethod": "route",
        "source": "Resident Feedback",
        "lastVerified": "2026-10-09",
        "external": true
      },
      {
        "id": "sat-g1",
        "category": "grocery",
        "name": "Reliance Smart Point & Amul Parlour",
        "address": "Star Bazaar Road, Satellite",
        "distanceKm": 0.3,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-12",
        "external": true
      },
      {
        "id": "sat-p1",
        "category": "pharmacy",
        "name": "Apollo 24|7 Pharmacy",
        "address": "Opp. Seema Hall, Anandnagar Rd",
        "distanceKm": 0.5,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-12",
        "external": true
      }
    ],
    "updatedAt": "2026-10-15T12:18:12.017Z",
    "metro": {
      "station": "Doordarshan Kendra Metro",
      "distanceKm": 0.9,
      "method": "route",
      "verifiedAt": "2026-10-10"
    }
  },
  {
    "slug": "luxora-girls-satellite",
    "name": "Luxora Girls PG, Satellite",
    "gender": "girls",
    "area": "satellite",
    "address": "B-12, Green Haven Enclave, Near Jodhpur Char Rasta, Satellite, Ahmedabad",
    "description": "A secure, premium girls PG in a well-lit gated residential society. Offers 24/7 on-site female resident warden, biometric door locks, high-speed Wi-Fi, daily housekeeping, and optional nutritious home-style breakfast and dinner.",
    "status": "active",
    "verified": true,
    "featured": true,
    "rooms": [
      {
        "id": "sg-sat-1",
        "type": "single",
        "ac": true,
        "rent": 10500,
        "rentUnit": "per-bed",
        "deposit": 10000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [
          "Electricity as per separate room sub-meter (₹10/unit)"
        ],
        "availability": "now"
      },
      {
        "id": "sg-sat-2",
        "type": "double",
        "ac": true,
        "rent": 8200,
        "rentUnit": "per-bed",
        "deposit": 8000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [
          "Electricity as per separate room sub-meter (₹10/unit)"
        ],
        "availability": "now"
      },
      {
        "id": "sg-sat-3",
        "type": "triple",
        "ac": false,
        "rent": 6000,
        "rentUnit": "per-bed",
        "deposit": 6000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [],
        "availability": "now"
      }
    ],
    "facilities": [
      {
        "key": "wifi",
        "name": "High-Speed Wi-Fi",
        "status": "included"
      },
      {
        "key": "meals",
        "name": "Hygienic Meals",
        "status": "paid"
      },
      {
        "key": "laundry",
        "name": "Laundry & Ironing",
        "status": "included"
      },
      {
        "key": "housekeeping",
        "name": "Daily Housekeeping",
        "status": "included"
      },
      {
        "key": "cctv",
        "name": "24/7 CCTV & Security",
        "status": "included"
      },
      {
        "key": "parking",
        "name": "Vehicle Parking",
        "status": "not-available"
      },
      {
        "key": "power-backup",
        "name": "100% Power Backup",
        "status": "included"
      },
      {
        "key": "water",
        "name": "RO Drinking Water",
        "status": "included"
      }
    ],
    "media": [
      {
        "type": "image",
        "url": "/images/hero-building.jpg",
        "alt": "Luxora PG modern architecture exterior facade at dusk",
        "caption": "Exterior Facade",
        "tag": "Building"
      },
      {
        "type": "image",
        "url": "/images/room-single.jpg",
        "alt": "Luxury single room with study desk, warm headboard lighting",
        "caption": "Executive Single Room",
        "tag": "Room"
      },
      {
        "type": "image",
        "url": "/images/room-double.jpg",
        "alt": "Spacious twin-sharing bedroom with individual study tables and wardrobes",
        "caption": "Premium Double Sharing",
        "tag": "Room"
      },
      {
        "type": "image",
        "url": "/images/study-lounge.jpg",
        "alt": "Quiet co-working and study lounge with 100 Mbps Wi-Fi pods",
        "caption": "24/7 Co-working Study Pods",
        "tag": "Study Lounge"
      },
      {
        "type": "image",
        "url": "/images/dining-hall.jpg",
        "alt": "Spotless hygienic dining cafeteria serving fresh nutritious food",
        "caption": "Hygienic Dining Hall",
        "tag": "Dining"
      },
      {
        "type": "image",
        "url": "/images/rooftop-terrace.jpg",
        "alt": "Aesthetic rooftop terrace garden with fairy lights and city sunset view",
        "caption": "Rooftop Garden Terrace",
        "tag": "Rooftop"
      },
      {
        "type": "image",
        "url": "/images/bathroom.jpg",
        "alt": "Ensuite luxury bathroom with glass shower cabin and vanity mirror",
        "caption": "Ensuite Modern Bathroom",
        "tag": "Washroom"
      }
    ],
    "rules": [
      "24/7 female warden in residence; entry gate closes at 10:00 PM (late passes available via parent approval portal).",
      "Biometric entry for residents; guest policy restricted to ground floor reception lobby.",
      "Daily room cleaning, twice-weekly linen wash, and hygienic RO water on all floors.",
      "Strict security monitoring with 16 high-definition cameras in all external and corridor common areas."
    ],
    "nearby": [
      {
        "id": "sat-m1",
        "category": "metro",
        "name": "Doordarshan Kendra Metro Station",
        "address": "Drive In Rd, Thaltej-Satellite Link",
        "distanceKm": 0.9,
        "distanceMethod": "route",
        "source": "Ahmedabad Metro Phase 1 Verified",
        "lastVerified": "2026-10-10",
        "external": true
      },
      {
        "id": "sat-b1",
        "category": "breakfast",
        "name": "Iscon Gathiya & Jalebi",
        "address": "Jodhpur Cross Road, Satellite",
        "distanceKm": 0.4,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-11",
        "external": true
      },
      {
        "id": "sat-t1",
        "category": "tiffin",
        "name": "Annapurna Home Tiffin Services",
        "address": "B/H Shivranjani Society, Satellite",
        "distanceKm": 0.6,
        "distanceMethod": "route",
        "source": "Resident Feedback",
        "lastVerified": "2026-10-09",
        "external": true
      },
      {
        "id": "sat-g1",
        "category": "grocery",
        "name": "Reliance Smart Point & Amul Parlour",
        "address": "Star Bazaar Road, Satellite",
        "distanceKm": 0.3,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-12",
        "external": true
      },
      {
        "id": "sat-p1",
        "category": "pharmacy",
        "name": "Apollo 24|7 Pharmacy",
        "address": "Opp. Seema Hall, Anandnagar Rd",
        "distanceKm": 0.5,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-12",
        "external": true
      }
    ],
    "updatedAt": "2026-10-15T12:18:12.017Z",
    "metro": {
      "station": "Doordarshan Kendra Metro",
      "distanceKm": 0.9,
      "method": "route",
      "verifiedAt": "2026-10-10"
    }
  },
  {
    "slug": "luxora-boys-vastrapur",
    "name": "Luxora Boys PG, Vastrapur",
    "gender": "boys",
    "area": "vastrapur",
    "address": "8, Lake View Residency, Behind Alpha One Mall, Vastrapur, Ahmedabad",
    "description": "Located 400 metres from Vastrapur Lake, this PG is popular among IIM aspirants, CAT students, and startup founders. Spacious rooms with large sunny balconies, co-working workstations, and 24-hour backup generator.",
    "status": "active",
    "verified": true,
    "featured": true,
    "rooms": [
      {
        "id": "sb-vas-1",
        "type": "double",
        "ac": true,
        "rent": 8000,
        "rentUnit": "per-bed",
        "deposit": 8000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [
          "Electricity as per separate room sub-meter (₹10/unit)"
        ],
        "availability": "now"
      },
      {
        "id": "sb-vas-2",
        "type": "triple",
        "ac": true,
        "rent": 6500,
        "rentUnit": "per-bed",
        "deposit": 6000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [
          "Electricity as per separate room sub-meter (₹10/unit)"
        ],
        "availability": "now"
      },
      {
        "id": "sb-vas-3",
        "type": "dormitory",
        "ac": false,
        "rent": 4500,
        "rentUnit": "per-bed",
        "deposit": 4000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [],
        "availability": "now"
      }
    ],
    "facilities": [
      {
        "key": "wifi",
        "name": "High-Speed Wi-Fi",
        "status": "included"
      },
      {
        "key": "meals",
        "name": "Hygienic Meals",
        "status": "paid"
      },
      {
        "key": "laundry",
        "name": "Laundry & Ironing",
        "status": "paid"
      },
      {
        "key": "housekeeping",
        "name": "Daily Housekeeping",
        "status": "included"
      },
      {
        "key": "cctv",
        "name": "24/7 CCTV & Security",
        "status": "included"
      },
      {
        "key": "parking",
        "name": "Vehicle Parking",
        "status": "included"
      },
      {
        "key": "power-backup",
        "name": "100% Power Backup",
        "status": "included"
      },
      {
        "key": "water",
        "name": "RO Drinking Water",
        "status": "included"
      }
    ],
    "media": [
      {
        "type": "image",
        "url": "/images/hero-building.jpg",
        "alt": "Luxora PG modern architecture exterior facade at dusk",
        "caption": "Exterior Facade",
        "tag": "Building"
      },
      {
        "type": "image",
        "url": "/images/room-single.jpg",
        "alt": "Luxury single room with study desk, warm headboard lighting",
        "caption": "Executive Single Room",
        "tag": "Room"
      },
      {
        "type": "image",
        "url": "/images/room-double.jpg",
        "alt": "Spacious twin-sharing bedroom with individual study tables and wardrobes",
        "caption": "Premium Double Sharing",
        "tag": "Room"
      },
      {
        "type": "image",
        "url": "/images/study-lounge.jpg",
        "alt": "Quiet co-working and study lounge with 100 Mbps Wi-Fi pods",
        "caption": "24/7 Co-working Study Pods",
        "tag": "Study Lounge"
      },
      {
        "type": "image",
        "url": "/images/dining-hall.jpg",
        "alt": "Spotless hygienic dining cafeteria serving fresh nutritious food",
        "caption": "Hygienic Dining Hall",
        "tag": "Dining"
      },
      {
        "type": "image",
        "url": "/images/rooftop-terrace.jpg",
        "alt": "Aesthetic rooftop terrace garden with fairy lights and city sunset view",
        "caption": "Rooftop Garden Terrace",
        "tag": "Rooftop"
      },
      {
        "type": "image",
        "url": "/images/bathroom.jpg",
        "alt": "Ensuite luxury bathroom with glass shower cabin and vanity mirror",
        "caption": "Ensuite Modern Bathroom",
        "tag": "Washroom"
      }
    ],
    "rules": [
      "Strict silence maintained in library and study area at all times.",
      "Cleanliness audit every Sunday; personal waste bins emptied daily.",
      "Filtered hot water geysers in all ensuite attached bathrooms.",
      "Visitor entry logged at reception desk; no overnight outside guests."
    ],
    "nearby": [
      {
        "id": "vas-m1",
        "category": "metro",
        "name": "Gurukul Road Metro Station",
        "address": "Drive-In Road",
        "distanceKm": 1.4,
        "distanceMethod": "route",
        "source": "Ahmedabad Metro",
        "lastVerified": "2026-10-10",
        "external": true
      },
      {
        "id": "vas-b1",
        "category": "breakfast",
        "name": "Karnavati Dabeli & Live Dhokla Center",
        "address": "Vastrapur Lake Food Street",
        "distanceKm": 0.3,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-11",
        "external": true
      },
      {
        "id": "vas-t1",
        "category": "tiffin",
        "name": "Swad Kathiyawadi & Gujarati Tiffin",
        "address": "Near Mansi Circle, Vastrapur",
        "distanceKm": 0.7,
        "distanceMethod": "route",
        "source": "Resident Feedback",
        "lastVerified": "2026-10-08",
        "external": true
      },
      {
        "id": "vas-g1",
        "category": "grocery",
        "name": "Nature Basket & D-Mart Ready",
        "address": "Premchand Nagar Rd, Vastrapur",
        "distanceKm": 0.5,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-10",
        "external": true
      }
    ],
    "updatedAt": "2026-10-15T12:18:12.017Z",
    "metro": {
      "station": "Gurukul Road Metro",
      "distanceKm": 1.4,
      "method": "route",
      "verifiedAt": "2026-10-10"
    }
  },
  {
    "slug": "luxora-girls-navrangpura",
    "name": "Luxora Girls PG, Navrangpura",
    "gender": "girls",
    "area": "navrangpura",
    "address": "15, University Greens, Opp. Commerce Six Roads Metro Gate 2, Navrangpura, Ahmedabad",
    "description": "The ideal academic stay for Gujarat University and CEPT students. Located just 5 minutes walk from Commerce Six Roads Metro station. Features modern study desks, ergonomic chairs, attached bathrooms, and delicious warm meal plans.",
    "status": "active",
    "verified": true,
    "featured": true,
    "rooms": [
      {
        "id": "sg-nav-1",
        "type": "single",
        "ac": true,
        "rent": 11000,
        "rentUnit": "per-bed",
        "deposit": 10000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [
          "Electricity as per separate room sub-meter (₹10/unit)"
        ],
        "availability": "unknown"
      },
      {
        "id": "sg-nav-2",
        "type": "double",
        "ac": true,
        "rent": 8500,
        "rentUnit": "per-bed",
        "deposit": 8000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [
          "Electricity as per separate room sub-meter (₹10/unit)"
        ],
        "availability": "now"
      },
      {
        "id": "sg-nav-3",
        "type": "triple",
        "ac": false,
        "rent": 6200,
        "rentUnit": "per-bed",
        "deposit": 6000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [],
        "availability": "now"
      }
    ],
    "facilities": [
      {
        "key": "wifi",
        "name": "High-Speed Wi-Fi",
        "status": "included"
      },
      {
        "key": "meals",
        "name": "Hygienic Meals",
        "status": "included"
      },
      {
        "key": "laundry",
        "name": "Laundry & Ironing",
        "status": "included"
      },
      {
        "key": "housekeeping",
        "name": "Daily Housekeeping",
        "status": "included"
      },
      {
        "key": "cctv",
        "name": "24/7 CCTV & Security",
        "status": "included"
      },
      {
        "key": "parking",
        "name": "Vehicle Parking",
        "status": "not-available"
      },
      {
        "key": "power-backup",
        "name": "100% Power Backup",
        "status": "included"
      },
      {
        "key": "water",
        "name": "RO Drinking Water",
        "status": "included"
      }
    ],
    "media": [
      {
        "type": "image",
        "url": "/images/hero-building.jpg",
        "alt": "Luxora PG modern architecture exterior facade at dusk",
        "caption": "Exterior Facade",
        "tag": "Building"
      },
      {
        "type": "image",
        "url": "/images/room-single.jpg",
        "alt": "Luxury single room with study desk, warm headboard lighting",
        "caption": "Executive Single Room",
        "tag": "Room"
      },
      {
        "type": "image",
        "url": "/images/room-double.jpg",
        "alt": "Spacious twin-sharing bedroom with individual study tables and wardrobes",
        "caption": "Premium Double Sharing",
        "tag": "Room"
      },
      {
        "type": "image",
        "url": "/images/study-lounge.jpg",
        "alt": "Quiet co-working and study lounge with 100 Mbps Wi-Fi pods",
        "caption": "24/7 Co-working Study Pods",
        "tag": "Study Lounge"
      },
      {
        "type": "image",
        "url": "/images/dining-hall.jpg",
        "alt": "Spotless hygienic dining cafeteria serving fresh nutritious food",
        "caption": "Hygienic Dining Hall",
        "tag": "Dining"
      },
      {
        "type": "image",
        "url": "/images/rooftop-terrace.jpg",
        "alt": "Aesthetic rooftop terrace garden with fairy lights and city sunset view",
        "caption": "Rooftop Garden Terrace",
        "tag": "Rooftop"
      },
      {
        "type": "image",
        "url": "/images/bathroom.jpg",
        "alt": "Ensuite luxury bathroom with glass shower cabin and vanity mirror",
        "caption": "Ensuite Modern Bathroom",
        "tag": "Washroom"
      }
    ],
    "rules": [
      "Secure biometric turnstiles at entrance; 24-hour lady guard on duty.",
      "Curfew at 10:00 PM; academic project extensions permitted with prior email notification.",
      "Three meals included on weekdays, brunch + dinner on weekends in the hygienic dining hall.",
      "No male visitors beyond the verified waiting lounge."
    ],
    "nearby": [
      {
        "id": "nav-m1",
        "category": "metro",
        "name": "Commerce Six Roads Metro Station",
        "address": "University Road, Navrangpura",
        "distanceKm": 0.5,
        "distanceMethod": "route",
        "source": "Ahmedabad Metro Official",
        "lastVerified": "2026-10-12",
        "external": true
      },
      {
        "id": "nav-b1",
        "category": "breakfast",
        "name": "Jay Bhavani Vadapav & Tea Post",
        "address": "Commerce Six Roads, Navrangpura",
        "distanceKm": 0.2,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-12",
        "external": true
      },
      {
        "id": "nav-t1",
        "category": "tiffin",
        "name": "Maa Ki Rasoi Pure Veg Mess",
        "address": "Near LD College Gate, Navrangpura",
        "distanceKm": 0.6,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-11",
        "external": true
      },
      {
        "id": "nav-p1",
        "category": "pharmacy",
        "name": "Medkart Pharmacy (Generic & Brand)",
        "address": "Mithakhali Six Roads, Navrangpura",
        "distanceKm": 0.7,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-10",
        "external": true
      }
    ],
    "updatedAt": "2026-10-15T12:18:12.017Z",
    "metro": {
      "station": "Commerce Six Roads Metro",
      "distanceKm": 0.5,
      "method": "route",
      "verifiedAt": "2026-10-12"
    }
  },
  {
    "slug": "luxora-boys-thaltej",
    "name": "Luxora Boys PG, Thaltej",
    "gender": "boys",
    "area": "thaltej",
    "address": "31, Silicon Square Avenue, Near Thaltej Metro Station, SG Highway, Ahmedabad",
    "description": "A sleek, boutique executive residence designed for IT professionals working on SG Highway and Sola. Highlights include private high-speed mesh Wi-Fi per floor, soundproof study corners, modern gym corner, and laundry room.",
    "status": "active",
    "verified": true,
    "featured": false,
    "rooms": [
      {
        "id": "sb-tha-1",
        "type": "single",
        "ac": true,
        "rent": 9800,
        "rentUnit": "per-bed",
        "deposit": 9500,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [
          "Electricity as per separate room sub-meter (₹10/unit)"
        ],
        "availability": "now"
      },
      {
        "id": "sb-tha-2",
        "type": "double",
        "ac": true,
        "rent": 7500,
        "rentUnit": "per-bed",
        "deposit": 7000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [
          "Electricity as per separate room sub-meter (₹10/unit)"
        ],
        "availability": "now"
      },
      {
        "id": "sb-tha-3",
        "type": "triple",
        "ac": false,
        "rent": 5200,
        "rentUnit": "per-bed",
        "deposit": 5000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [],
        "availability": "now"
      }
    ],
    "facilities": [
      {
        "key": "wifi",
        "name": "High-Speed Wi-Fi",
        "status": "included"
      },
      {
        "key": "meals",
        "name": "Hygienic Meals",
        "status": "not-available"
      },
      {
        "key": "laundry",
        "name": "Laundry & Ironing",
        "status": "paid"
      },
      {
        "key": "housekeeping",
        "name": "Daily Housekeeping",
        "status": "included"
      },
      {
        "key": "cctv",
        "name": "24/7 CCTV & Security",
        "status": "included"
      },
      {
        "key": "parking",
        "name": "Vehicle Parking",
        "status": "included"
      },
      {
        "key": "power-backup",
        "name": "100% Power Backup",
        "status": "included"
      },
      {
        "key": "water",
        "name": "RO Drinking Water",
        "status": "included"
      }
    ],
    "media": [
      {
        "type": "image",
        "url": "/images/hero-building.jpg",
        "alt": "Luxora PG modern architecture exterior facade at dusk",
        "caption": "Exterior Facade",
        "tag": "Building"
      },
      {
        "type": "image",
        "url": "/images/room-single.jpg",
        "alt": "Luxury single room with study desk, warm headboard lighting",
        "caption": "Executive Single Room",
        "tag": "Room"
      },
      {
        "type": "image",
        "url": "/images/room-double.jpg",
        "alt": "Spacious twin-sharing bedroom with individual study tables and wardrobes",
        "caption": "Premium Double Sharing",
        "tag": "Room"
      },
      {
        "type": "image",
        "url": "/images/study-lounge.jpg",
        "alt": "Quiet co-working and study lounge with 100 Mbps Wi-Fi pods",
        "caption": "24/7 Co-working Study Pods",
        "tag": "Study Lounge"
      },
      {
        "type": "image",
        "url": "/images/dining-hall.jpg",
        "alt": "Spotless hygienic dining cafeteria serving fresh nutritious food",
        "caption": "Hygienic Dining Hall",
        "tag": "Dining"
      },
      {
        "type": "image",
        "url": "/images/rooftop-terrace.jpg",
        "alt": "Aesthetic rooftop terrace garden with fairy lights and city sunset view",
        "caption": "Rooftop Garden Terrace",
        "tag": "Rooftop"
      },
      {
        "type": "image",
        "url": "/images/bathroom.jpg",
        "alt": "Ensuite luxury bathroom with glass shower cabin and vanity mirror",
        "caption": "Ensuite Modern Bathroom",
        "tag": "Washroom"
      }
    ],
    "rules": [
      "Ideal for working professionals with flexible work shifts; 24-hour keycard access.",
      "Quiet hours after 11:30 PM in all bedroom corridors.",
      "Covered parking for two-wheelers and limited reserved four-wheeler slots.",
      "Security deposit 100% refundable upon 30 days notice."
    ],
    "nearby": [
      {
        "id": "tha-m1",
        "category": "metro",
        "name": "Thaltej Metro Station (Terminal)",
        "address": "Near Zydus Hospital Cross Rd, Thaltej",
        "distanceKm": 0.6,
        "distanceMethod": "route",
        "source": "Ahmedabad Metro",
        "lastVerified": "2026-10-11",
        "external": true
      },
      {
        "id": "tha-b1",
        "category": "breakfast",
        "name": "Gwalia Sweets & South Indian Tiffin",
        "address": "Hebatpur Road, Thaltej",
        "distanceKm": 0.5,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-10",
        "external": true
      },
      {
        "id": "tha-t1",
        "category": "tiffin",
        "name": "Shreeji Punjabi & Jain Tiffin Center",
        "address": "Baghban Party Plot Road, Thaltej",
        "distanceKm": 0.8,
        "distanceMethod": "route",
        "source": "Resident Feedback",
        "lastVerified": "2026-10-09",
        "external": true
      },
      {
        "id": "tha-g1",
        "category": "grocery",
        "name": "Amul Ice Cream & Daily Fresh Grocery",
        "address": "Thaltej Shilaj Road",
        "distanceKm": 0.4,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-11",
        "external": true
      }
    ],
    "updatedAt": "2026-10-15T12:18:12.017Z",
    "metro": {
      "station": "Thaltej Metro Station",
      "distanceKm": 0.6,
      "method": "route",
      "verifiedAt": "2026-10-11"
    }
  },
  {
    "slug": "luxora-girls-thaltej",
    "name": "Luxora Girls PG, Thaltej",
    "gender": "girls",
    "area": "thaltej",
    "address": "7, Harmony Park, Off Hebatpur Road, Thaltej, Ahmedabad",
    "description": "A peaceful, premium residence in leafy Thaltej. Large airy bedrooms with sunlit balconies, attached bathrooms, RO water purifier dispensers, full power inverter backup, and a picturesque rooftop garden for unwinding.",
    "status": "active",
    "verified": true,
    "featured": false,
    "rooms": [
      {
        "id": "sg-tha-1",
        "type": "single",
        "ac": true,
        "rent": 10800,
        "rentUnit": "per-bed",
        "deposit": 10000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [
          "Electricity as per separate room sub-meter (₹10/unit)"
        ],
        "availability": "now"
      },
      {
        "id": "sg-tha-2",
        "type": "double",
        "ac": true,
        "rent": 8200,
        "rentUnit": "per-bed",
        "deposit": 8000,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [
          "Electricity as per separate room sub-meter (₹10/unit)"
        ],
        "availability": "now"
      },
      {
        "id": "sg-tha-3",
        "type": "triple",
        "ac": false,
        "rent": 5800,
        "rentUnit": "per-bed",
        "deposit": 5500,
        "included": [
          "Spring-fit orthopedic mattress",
          "Dedicated study desk & ergonomic chair",
          "Personal full-length wardrobe with lock",
          "High-speed Wi-Fi access"
        ],
        "extraCharges": [],
        "availability": "now"
      }
    ],
    "facilities": [
      {
        "key": "wifi",
        "name": "High-Speed Wi-Fi",
        "status": "included"
      },
      {
        "key": "meals",
        "name": "Hygienic Meals",
        "status": "paid"
      },
      {
        "key": "laundry",
        "name": "Laundry & Ironing",
        "status": "included"
      },
      {
        "key": "housekeeping",
        "name": "Daily Housekeeping",
        "status": "included"
      },
      {
        "key": "cctv",
        "name": "24/7 CCTV & Security",
        "status": "included"
      },
      {
        "key": "parking",
        "name": "Vehicle Parking",
        "status": "not-available"
      },
      {
        "key": "power-backup",
        "name": "100% Power Backup",
        "status": "included"
      },
      {
        "key": "water",
        "name": "RO Drinking Water",
        "status": "included"
      }
    ],
    "media": [
      {
        "type": "image",
        "url": "/images/hero-building.jpg",
        "alt": "Luxora PG modern architecture exterior facade at dusk",
        "caption": "Exterior Facade",
        "tag": "Building"
      },
      {
        "type": "image",
        "url": "/images/room-single.jpg",
        "alt": "Luxury single room with study desk, warm headboard lighting",
        "caption": "Executive Single Room",
        "tag": "Room"
      },
      {
        "type": "image",
        "url": "/images/room-double.jpg",
        "alt": "Spacious twin-sharing bedroom with individual study tables and wardrobes",
        "caption": "Premium Double Sharing",
        "tag": "Room"
      },
      {
        "type": "image",
        "url": "/images/study-lounge.jpg",
        "alt": "Quiet co-working and study lounge with 100 Mbps Wi-Fi pods",
        "caption": "24/7 Co-working Study Pods",
        "tag": "Study Lounge"
      },
      {
        "type": "image",
        "url": "/images/dining-hall.jpg",
        "alt": "Spotless hygienic dining cafeteria serving fresh nutritious food",
        "caption": "Hygienic Dining Hall",
        "tag": "Dining"
      },
      {
        "type": "image",
        "url": "/images/rooftop-terrace.jpg",
        "alt": "Aesthetic rooftop terrace garden with fairy lights and city sunset view",
        "caption": "Rooftop Garden Terrace",
        "tag": "Rooftop"
      },
      {
        "type": "image",
        "url": "/images/bathroom.jpg",
        "alt": "Ensuite luxury bathroom with glass shower cabin and vanity mirror",
        "caption": "Ensuite Modern Bathroom",
        "tag": "Washroom"
      }
    ],
    "rules": [
      "Strict biometric entry with round-the-clock female superintendent.",
      "10:00 PM evening gate timing with digital parent intimation system.",
      "Dedicated rooftop yoga & unwind deck open 6:00 AM – 9:00 PM.",
      "Clean RO drinking water and solar water heating in every washroom."
    ],
    "nearby": [
      {
        "id": "tha-m1",
        "category": "metro",
        "name": "Thaltej Metro Station (Terminal)",
        "address": "Near Zydus Hospital Cross Rd, Thaltej",
        "distanceKm": 0.6,
        "distanceMethod": "route",
        "source": "Ahmedabad Metro",
        "lastVerified": "2026-10-11",
        "external": true
      },
      {
        "id": "tha-b1",
        "category": "breakfast",
        "name": "Gwalia Sweets & South Indian Tiffin",
        "address": "Hebatpur Road, Thaltej",
        "distanceKm": 0.5,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-10",
        "external": true
      },
      {
        "id": "tha-t1",
        "category": "tiffin",
        "name": "Shreeji Punjabi & Jain Tiffin Center",
        "address": "Baghban Party Plot Road, Thaltej",
        "distanceKm": 0.8,
        "distanceMethod": "route",
        "source": "Resident Feedback",
        "lastVerified": "2026-10-09",
        "external": true
      },
      {
        "id": "tha-g1",
        "category": "grocery",
        "name": "Amul Ice Cream & Daily Fresh Grocery",
        "address": "Thaltej Shilaj Road",
        "distanceKm": 0.4,
        "distanceMethod": "route",
        "source": "Field Survey",
        "lastVerified": "2026-10-11",
        "external": true
      }
    ],
    "updatedAt": "2026-10-15T12:18:12.017Z",
    "metro": {
      "station": "Thaltej Metro Station",
      "distanceKm": 0.8,
      "method": "route",
      "verifiedAt": "2026-10-11"
    }
  }
];
for (const p of properties) {
  db.properties.updateOne({ slug: p.slug }, { $set: p }, { upsert: true });
}

// 4. Insert Site CMS
print("Seeding site CMS content...");
const cms = {
  "key": "site_cms",
  "hero": {
    "line1": "Your next home,",
    "line2": "near where you",
    "line3": "study and work.",
    "subtitle": "Curated student & executive residences across Satellite, Vastrapur, Navrangpura & Thaltej. Clear room rent, verified metro walking routes, and respectful house rules.",
    "badge1": "Gujarat’s Most Transparent PG Discovery",
    "badge2": "Zero Brokerage · 100% Owner Verified",
    "slides": [
      {
        "image": "/images/hero-building.jpg",
        "label": "Flagship Residence Exterior",
        "tag": "Flagship Campus",
        "location": "Satellite, Ahmedabad",
        "beds": "Single & Double"
      },
      {
        "image": "/images/room-single.jpg",
        "label": "Executive Single Suite with Study Pod",
        "tag": "Private Suite",
        "location": "Satellite & Navrangpura",
        "beds": "Private Single AC"
      },
      {
        "image": "/images/study-lounge.jpg",
        "label": "24/7 Co-working Study Lounge",
        "tag": "Productivity Hub",
        "location": "All Residences (100 Mbps)",
        "beds": "Work Desks & Wi-Fi"
      },
      {
        "image": "/images/rooftop-terrace.jpg",
        "label": "Aesthetic Rooftop Sunset Deck",
        "tag": "Skyline Lounge",
        "location": "Thaltej & Satellite",
        "beds": "Community Space"
      },
      {
        "image": "/images/dining-hall.jpg",
        "label": "Hygienic Dining Cafeteria",
        "tag": "3 Fresh Meals Daily",
        "location": "Navrangpura & Satellite",
        "beds": "Full Meal Plan"
      }
    ]
  },
  "areas": {
    "satellite": {
      "slug": "satellite",
      "name": "Satellite",
      "image": "/images/hero-building.jpg",
      "tag": "Flagship Hub",
      "landmark": "Near ISRO & Jodhpur Cross Roads",
      "metroStation": "Doordarshan Kendra Metro",
      "distance": "1.1 km route",
      "intro": "Quiet, established residential area near ISRO and SG Highway. Easy access to Prahlad Nagar and Shivranjani."
    },
    "navrangpura": {
      "slug": "navrangpura",
      "name": "Navrangpura",
      "image": "/images/study-lounge.jpg",
      "tag": "Academic Capital",
      "landmark": "Near CEPT, Gujarat University & HL College",
      "metroStation": "Commerce Six Roads Metro",
      "distance": "0.5 km route",
      "intro": "Ahmedabad's prime student and institutional hub. Walking distance to Gujarat University, CEPT and Commerce Six Roads."
    },
    "vastrapur": {
      "slug": "vastrapur",
      "name": "Vastrapur",
      "image": "/images/rooftop-terrace.jpg",
      "tag": "Vibrant Lake & IIM-A",
      "landmark": "Near IIM Ahmedabad & Alpha One Mall",
      "metroStation": "Gurukul Road Metro",
      "distance": "1.4 km route",
      "intro": "Green, lively neighbourhood around Vastrapur Lake. Close to IIM-A, Ahmedabad University and prime shopping."
    },
    "thaltej": {
      "slug": "thaltej",
      "name": "Thaltej",
      "image": "/images/room-single.jpg",
      "tag": "Executive Tech Corridor",
      "landmark": "Near SG Highway, Zydus & Palladium",
      "metroStation": "Thaltej Metro Station",
      "distance": "0.6 km route",
      "intro": "Modern residential belt along SG Highway with direct metro connectivity. Ideal for IT and corporate professionals."
    }
  },
  "amenities": [
    {
      "id": "study",
      "title": "24/7 Co-working Study Lounges",
      "tag": "Academic Focus",
      "description": "Ergonomic study chairs, dual 100 Mbps redundant fibre connections, soundproofing, and private charging ports.",
      "image": "/images/study-lounge.jpg",
      "features": [
        "Acoustic treatment",
        "100 Mbps Fibre",
        "Power backup",
        "Individual study pods"
      ]
    },
    {
      "id": "food",
      "title": "Hygienic Dining & 3 Fresh Meals",
      "tag": "Pure Nutrition",
      "description": "Cooked in clean, commercial-grade stainless steel kitchens. Rotating Gujarati, North Indian, and Jain menus.",
      "image": "/images/dining-hall.jpg",
      "features": [
        "Breakfast, lunch & dinner",
        "RO purified drinking water",
        "Unlimited servings",
        "Weekly special dessert"
      ]
    },
    {
      "id": "rooftop",
      "title": "Aesthetic Rooftop Deck & Community",
      "tag": "Lifestyle & Wellness",
      "description": "Open-air sunset hangout space for evening discussions, yoga sessions, acoustic nights, and unwinding.",
      "image": "/images/rooftop-terrace.jpg",
      "features": [
        "Panoramic skyline view",
        "Turf & seating lounge",
        "Festival gatherings",
        "Table tennis & board games"
      ]
    },
    {
      "id": "washroom",
      "title": "Attached Ceramic Modern Washrooms",
      "tag": "Hygiene Standard",
      "description": "Equipped with branded sanitaryware, 24/7 solar + instant geyser hot water, anti-skid tiles, and daily sanitization.",
      "image": "/images/bathroom.jpg",
      "features": [
        "Hot water geysers",
        "Mirror & vanity shelf",
        "Exhaust ventilation",
        "Daily housekeeping"
      ]
    }
  ],
  "contact": {
    "phone": "+91 98250 12345",
    "whatsapp": "919825012345",
    "email": "contact@luxorapg.com",
    "address": "Luxora House, Opp. Shivranjani Cross Road, Satellite, Ahmedabad, Gujarat 380015",
    "visitingHours": "10:00 AM – 7:30 PM (Daily)",
    "announcement": "Admissions Open 2026-27: Verified Boys & Girls PGs in Satellite, Vastrapur, Navrangpura & Thaltej. 0% Brokerage."
  },
  "about": {
    "heroTitle": "Revolutionising PG Living in Ahmedabad",
    "heroSubtitle": "From a single 12-bed facility in Satellite in 2021 to Gujarat's leading verified student and executive co-living network.",
    "heroBadge": "The Luxora Story & Mission",
    "statBeds": "500+ Beds Managed",
    "statRating": "4.8★ Resident Rating"
  }
};
db.cms.updateOne({ key: "site_cms" }, { $set: cms }, { upsert: true });

print("✅ MongoDB Atlas Seed Completed Successfully!");
print("Total Areas: " + db.areas.countDocuments());
print("Total Properties: " + db.properties.countDocuments());
print("Total CMS Documents: " + db.cms.countDocuments());
