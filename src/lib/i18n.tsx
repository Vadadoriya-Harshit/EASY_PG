"use client";
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export type Language = "en" | "hi" | "gu";

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
];

export const TRANSLATIONS = {
  en: {
    // Brand & Logo
    brandName: "Luxora PG",
    tagline: "FEEL AT HOME, LIVE IN LUXURY",
    taglineShort: "Feel At Home, Live In Luxury",
    admissionsOpen: "Admissions Open 2026-27",
    zeroBrokerage: "Zero Brokerage",
    ownerVerified: "100% Owner Verified",
    verifiedStays: "Verified Ahmedabad Coliving",

    // Top announcement bar
    admissionsBanner: "Verified Boys & Girls PGs in Satellite, Vastrapur, Navrangpura & Thaltej",
    whatsappCoord: "WhatsApp",
    callHelpline: "Call Helpline",

    // Nav Links & Categories
    accommodations: "Residences",
    exploreLiving: "Explore",
    decisionTools: "Tools",
    popular: "Popular",
    verifiedSafe: "Verified Safe",
    aiQuiz: "AI Quiz",
    allPgs: "All PGs",
    boysPg: "Boys PG",
    girlsPg: "Girls PG",
    areas: "Areas",
    metroFood: "Metro & Food",
    facilities: "Facilities",
    gallery: "Gallery",
    compare: "Compare",
    smartMatch: "Smart Match",
    about: "About",
    contact: "Contact",
    scheduleVisit: "Book Visit",
    bookFreeTour: "Book Visit",

    // Hero Section
    heroLine1: "Your next home,",
    heroLine2: "near where you",
    heroLine3: "study and work.",
    heroSubtitle: "Curated student & executive residences across Satellite, Vastrapur, Navrangpura & Thaltej. Clear room rent, verified metro walking routes, and respectful house rules.",
    heroBadge1: "Gujarat’s Most Transparent PG Discovery",
    heroBadge2: "Zero Brokerage · 100% Owner Verified",
    exploreBoysBtn: "Explore Boys PGs",
    exploreGirlsBtn: "Explore Girls PGs",
    virtualTourBtn: "Guided Virtual Tour",
    searchPlaceholder: "Search by college, IT park, metro or area (e.g. CEPT, IIM, Satellite, Thaltej)...",

    // Filters & Metrics
    allLocalities: "All Localities",
    sharingType: "Sharing Type",
    singleRoom: "Single Private Room",
    doubleRoom: "Double Twin-Sharing",
    tripleRoom: "Triple Sharing",
    dormitory: "4-Bed Dormitory",
    filterRent: "Budget Range",
    acOption: "AC Room",
    nonAcOption: "Non-AC",
    foodIncluded: "Meals Included",

    // Lifestyle & Facilities
    theLuxoraStandard: "The Luxora Standard",
    lifestyleHeading: "A PG experience designed around real student needs",
    lifestyleSub: "Explore the facilities that make Luxora residences the top-rated student and executive stays in Ahmedabad.",
    highSpeedWifi: "High-Speed Wi-Fi",
    hygienicMeals: "Hygienic Home Meals",
    biometricSecurity: "24/7 Biometric Security",
    dailyHousekeeping: "Daily Housekeeping",
    laundryService: "Laundry & Ironing",
    roDrinkingWater: "RO Drinking Water",
    powerBackup: "100% Power Backup",
    studyLounge: "Quiet Co-working Study Pods",

    // Testimonials & Trust
    verificationGuarantee: "The Luxora Verification Guarantee",
    verifiedReviewsDesc: "All reviews are collected directly from residents with confirmed lease agreements. Zero incentivized or fake testimonials.",
    atAGlance: "Luxora PG at a glance",
    activeResidences: "Active Residences",
    keyLocalities: "Key Localities",
    boysGirlsPgs: "Boys & Girls PGs",
    zeroBrokerageFee: "Zero Brokerage Fee",

    // Footer
    footerDesc: "Luxora PG is Ahmedabad’s premier verified student and professional co-living network. Built on radical pricing transparency, zero brokerage, biometric security, and authentic photo representations. Not just a PG, it's your home.",
    directManagement: "100% Direct Property Management",
    visitingHours: "Visiting Hours: 10:00 AM – 7:30 PM (Daily)",
    residencesCol: "Residences",
    exploreCol: "Explore & Living",
    helplineCol: "Helpline & Branches",
    mainReception: "Main Reception Desk",
    staffPortal: "Staff CMS & Lead Portal",
    allRightsReserved: "Luxora PG Discovery Platform. All rights reserved.",
    privacyPolicy: "Privacy Policy",
    termsOfStay: "Terms of Stay",
    visitingGuidelines: "Visiting Guidelines",

    // Common CTAs
    inquireNow: "Inquire Now",
    callNow: "Call Now",
    whatsappChat: "WhatsApp Chat",
    viewDetails: "View Details",
    selectLanguage: "Language",
    searchBtn: "Search Residences",
  },

  hi: {
    // Brand & Logo
    brandName: "लक्सोरा पीजी",
    tagline: "FEEL AT HOME, LIVE IN LUXURY",
    taglineShort: "Feel At Home, Live In Luxury",
    admissionsOpen: "प्रवेश प्रारंभ 2026-27",
    zeroBrokerage: "शून्य ब्रोकरेज",
    ownerVerified: "100% मालिक द्वारा सत्यापित",
    verifiedStays: "सत्यापित अहमदाबाद को-लिविंग",

    // Top announcement bar
    admissionsBanner: "सैटेलाइट, वस्त्रापुर, नवरंगपुरा और थलतेज में सत्यापित बॉयज़ और गर्ल्स पीजी",
    whatsappCoord: "व्हाट्सएप",
    callHelpline: "हेल्पलाइन कॉल करें",

    // Nav Links & Categories
    accommodations: "आवास",
    exploreLiving: "एक्सप्लोर",
    decisionTools: "टूल्स",
    popular: "लोकप्रिय",
    verifiedSafe: "सत्यापित",
    aiQuiz: "एआई क्विज",
    allPgs: "सभी पीजी",
    boysPg: "बॉयज़ पीजी",
    girlsPg: "गर्ल्स पीजी",
    areas: "इलाके",
    metroFood: "मेट्रो व भोजन",
    facilities: "सुविधाएं",
    gallery: "गैलरी",
    compare: "तुलना",
    smartMatch: "स्मार्ट मैच",
    about: "परिचय",
    contact: "संपर्क",
    scheduleVisit: "विजिट बुक",
    bookFreeTour: "विजिट बुक",

    // Hero Section
    heroLine1: "आपका अगला घर,",
    heroLine2: "आपकी पढ़ाई और काम के",
    heroLine3: "बिल्कुल करीब।",
    heroSubtitle: "सैटेलाइट, वस्त्रापुर, नवरंगपुरा और थलतेज में प्रीमियम छात्र और कार्यकारी आवास। पारदर्शी किराया, मेट्रो पैदल दूरी और सुरक्षित घर जैसे नियम।",
    heroBadge1: "गुजरात का सबसे पारदर्शी पीजी नेटवर्क",
    heroBadge2: "शून्य ब्रोकरेज · 100% सत्यापित",
    exploreBoysBtn: "बॉयज़ पीजी देखें",
    exploreGirlsBtn: "गर्ल्स पीजी देखें",
    virtualTourBtn: "वर्चुअल रूम टूर",
    searchPlaceholder: "कॉलेज, ऑफिस, मेट्रो या इलाके से खोजें (जैसे CEPT, IIM, सैटेलाइट, थलतेज)...",

    // Filters & Metrics
    allLocalities: "सभी इलाके",
    sharingType: "कमरे का प्रकार",
    singleRoom: "सिंगल प्राइवेट रूम",
    doubleRoom: "डबल ट्विन-शेयरिंग",
    tripleRoom: "ट्रिपल शेयरिंग",
    dormitory: "4-बेड डॉर्मिटरी",
    filterRent: "बजट रेंज",
    acOption: "एसी कमरा",
    nonAcOption: "नॉन-एसी",
    foodIncluded: "भोजन शामिल",

    // Lifestyle & Facilities
    theLuxoraStandard: "द लक्सोरा स्टैंडर्ड",
    lifestyleHeading: "छात्रों की वास्तविक जरूरतों के लिए डिज़ाइन किया गया पीजी",
    lifestyleSub: "उन प्रीमियम सुविधाओं को देखें जो लक्सोरा को अहमदाबाद में सर्वश्रेष्ठ छात्र और कामकाजी आवास बनाती हैं।",
    highSpeedWifi: "हाई-स्पीड वाई-फाई",
    hygienicMeals: "घर जैसा पौष्टिक भोजन",
    biometricSecurity: "24/7 बायोमेट्रिक सुरक्षा",
    dailyHousekeeping: "दैनिक कमरे की सफाई",
    laundryService: "लॉन्ड्री और इस्त्री सेवा",
    roDrinkingWater: "आरओ पेयजल",
    powerBackup: "100% पावर बैकअप",
    studyLounge: "शांत 24/7 स्टडी लाउंज",

    // Testimonials & Trust
    verificationGuarantee: "द लक्सोरा सत्यापन गारंटी",
    verifiedReviewsDesc: "सभी समीक्षाएं वास्तविक रहने वाले छात्रों से सत्यापित पट्टे के साथ ली गई हैं। शून्य फर्जी समीक्षाएं।",
    atAGlance: "लक्सोरा पीजी एक नज़र में",
    activeResidences: "सक्रिय आवास",
    keyLocalities: "प्रमुख इलाके",
    boysGirlsPgs: "बॉयज़ और गर्ल्स पीजी",
    zeroBrokerageFee: "शून्य दलाली शुल्क",

    // Footer
    footerDesc: "लक्सोरा पीजी अहमदाबाद का प्रमुख सत्यापित छात्र और प्रोफेशनल को-लिविंग नेटवर्क है। पूर्ण मूल्य पारदर्शिता, शून्य दलाली और बायोमेट्रिक सुरक्षा पर निर्मित। सिर्फ एक पीजी नहीं, आपका अपना घर।",
    directManagement: "100% प्रत्यक्ष संपत्ति प्रबंधन",
    visitingHours: "विजिट का समय: सुबह 10:00 से शाम 7:30 बजे (दैनिक)",
    residencesCol: "आवास और हॉस्टल",
    exploreCol: "एक्सप्लोर और लिविंग",
    helplineCol: "हेल्पलाइन और शाखाएं",
    mainReception: "मुख्य स्वागत डेस्क",
    staffPortal: "स्टाफ सीएमएस पोर्टल",
    allRightsReserved: "लक्सोरा पीजी डिस्कवरी प्लेटफॉर्म। सर्वाधिकार सुरक्षित।",
    privacyPolicy: "गोपनीयता नीति",
    termsOfStay: "नियम और शर्तें",
    visitingGuidelines: "विजिट दिशानिर्देश",

    // Common CTAs
    inquireNow: "पूछताछ करें",
    callNow: "कॉल करें",
    whatsappChat: "व्हाट्सएप चैट",
    viewDetails: "विवरण देखें",
    selectLanguage: "भाषा",
    searchBtn: "आवास खोजें",
  },

  gu: {
    // Brand & Logo
    brandName: "લક્ઝોરા પીજી",
    tagline: "FEEL AT HOME, LIVE IN LUXURY",
    taglineShort: "Feel At Home, Live In Luxury",
    admissionsOpen: "એડમિશન શરૂ 2026-27",
    zeroBrokerage: "ઝીરો બ્રોકરેજ (દલાલી મુક્ત)",
    ownerVerified: "100% માલિક દ્વારા ચકાસાયેલ",
    verifiedStays: "ચકાસાયેલ અમદાવાદ કો-લિવિંગ",

    // Top announcement bar
    admissionsBanner: "એડમિશન શરૂ: સેટેલાઇટ, વસ્ત્રાપુર, નવરંગપુરા અને થલતેજમાં પ્રીમિયમ બોય્ઝ અને ગર્લ્સ પીજી",
    whatsappCoord: "વોટ્સએપ કોઓર્ડિનેટર",
    callHelpline: "હેલ્પલાઇન કોલ કરો",

    // Nav Links & Categories
    accommodations: "રહેઠાણ વિકલ્પો",
    exploreLiving: "એક્સપ્લોર અને સુવિધાઓ",
    decisionTools: "સર્ચ ટૂલ્સ",
    popular: "લોકપ્રિય",
    verifiedSafe: "ચકાસાયેલ સુરક્ષિત",
    aiQuiz: "એઆઈ ક્વિઝ",
    allPgs: "બધા પીજી",
    boysPg: "બોય્ઝ પીજી",
    girlsPg: "ગર્લ્સ પીજી",
    areas: "વિસ્તારો",
    metroFood: "મેટ્રો અને ફૂડ",
    facilities: "સુવિધાઓ",
    gallery: "ફોટો ગેલેરી",
    compare: "સરખામણી કરો",
    smartMatch: "સ્માર્ટ મેચ",
    about: "અમારા વિશે",
    contact: "સંપર્ક ડેસ્ક",
    scheduleVisit: "રૂબરૂ મુલાકાત બુક કરો",
    bookFreeTour: "ફ્રી ટૂર બુક કરો",

    // Hero Section
    heroLine1: "તમારું આગલું ઘર,",
    heroLine2: "તમારા અભ્યાસ અને કામના",
    heroLine3: "સૌથી નજીક.",
    heroSubtitle: "સેટેલાઇટ, વસ્ત્રાપુર, નવરંગપુરા અને થલતેજમાં શ્રેષ્ઠ વિદ્યાર્થી અને એક્ઝિક્યુટિવ આવાસ. ચોખ્ખું ભાડું, મેટ્રો વૉકિંગ રૂટ્સ અને ઘર જેવી સુરક્ષા.",
    heroBadge1: "ગુજરાતનું સૌથી પારદર્શક પીજી નેટવર્ક",
    heroBadge2: "ઝીરો બ્રોકરેજ · 100% વેરિફાઇડ",
    exploreBoysBtn: "બોય્ઝ પીજી જુઓ",
    exploreGirlsBtn: "ગર્લ્સ પીજી જુઓ",
    virtualTourBtn: "વર્ચ્યુઅલ રૂમ ટૂર",
    searchPlaceholder: "કોલેજ, ઓફિસ, મેટ્રો અથવા વિસ્તાર દ્વારા શોધો (દા.ત. CEPT, IIM, સેટેલાઇટ, થલતેજ)...",

    // Filters & Metrics
    allLocalities: "બધા વિસ્તારો",
    sharingType: "રૂમનો પ્રકાર",
    singleRoom: "સિંગલ પ્રાઇવેટ રૂમ",
    doubleRoom: "ડબલ ટ્વિન-શેરિંગ",
    tripleRoom: "ટ્રિપલ શેરિંગ",
    dormitory: "4-બેડ ડોર્મિટરી",
    filterRent: "બજેટ રેન્જ",
    acOption: "એસી રૂમ",
    nonAcOption: "નોન-એસી રૂમ",
    foodIncluded: "ભોજન સાથે",

    // Lifestyle & Facilities
    theLuxoraStandard: "ધ લક્ઝોરા સ્ટાન્ડર્ડ",
    lifestyleHeading: "વિદ્યાર્થીઓની વાસ્તવિક જરૂરિયાતોને ધ્યાનમાં રાખીને બનાવેલ પીજી",
    lifestyleSub: "તે ખાસ સુવિધાઓ જુઓ જે લક્ઝોરાને અમદાવાદમાં ટોચનું વિદ્યાર્થી અને એક્ઝિક્યુટિવ રોકાણ બનાવે છે.",
    highSpeedWifi: "હાઇ-સ્પીડ વાઇ-ફાઇ",
    hygienicMeals: "ઘર જેવું શુદ્ધ પૌષ્ટિક ભોજન",
    biometricSecurity: "24/7 બાયોમેટ્રિક સુરક્ષા",
    dailyHousekeeping: "દૈનિક સફાઈ સેવા",
    laundryService: "લોન્ડ્રી અને ઇસ્ત્રી સેવા",
    roDrinkingWater: "આરઓ પીવાનું પાણી",
    powerBackup: "100% પાવર બેકઅપ",
    studyLounge: "શાંત 24/7 સ્ટડી લાઉન્જ",

    // Testimonials & Trust
    verificationGuarantee: "લક્ઝોરા વેરિફિકેશન ગેરંટી",
    verifiedReviewsDesc: "બધા પ્રતિસાદ રહેતા વિદ્યાર્થીઓ પાસેથી સીધા લેવામાં આવ્યા છે. કોઈ ફેક કે પેઇડ રિવ્યુ નહીં.",
    atAGlance: "લક્ઝોરા પીજી એક નજરે",
    activeResidences: "સક્રિય રેસિડેન્સ",
    keyLocalities: "મુખ્ય વિસ્તારો",
    boysGirlsPgs: "બોય્ઝ અને ગર્લ્સ પીજી",
    zeroBrokerageFee: "ઝીરો દલાલી ફી",

    // Footer
    footerDesc: "લક્ઝોરા પીજી અમદાવાદનું અગ્રણી વેરિફાઇડ વિદ્યાર્થી અને પ્રોફેશનલ કો-લિવિંગ નેટવર્ક છે. સંપૂર્ણ પારદર્શિતા, ઝીરો બ્રોકરેજ અને બાયોમેટ્રિક સુરક્ષા સાથે. માત્ર પીજી નહીં, તમારું પોતાનું ઘર.",
    directManagement: "100% સીધું પ્રોપર્ટી મેનેજમેન્ટ",
    visitingHours: "મુલાકાતનો સમય: સવારે 10:00 થી સાંજે 7:30 (દરરોજ)",
    residencesCol: "પીજી અને હોસ્ટેલ",
    exploreCol: "એક્સપ્લોર અને લિવિંગ",
    helplineCol: "હેલ્પલાઇન અને શાખાઓ",
    mainReception: "મુખ્ય રિસેપ્શન ડેસ્ક",
    staffPortal: "સ્ટાફ સીએમએસ પોર્ટલ",
    allRightsReserved: "લક્ઝોરા પીજી ડિસ્કવરી પ્લેટફોર્મ. સર્વાધિકાર સુરક્ષિત.",
    privacyPolicy: "પ્રાઇવસી પોલિસી",
    termsOfStay: "નિયમો અને શરતો",
    visitingGuidelines: "મુલાકાતના નિયમો",

    // Common CTAs
    inquireNow: "પૂછપરછ કરો",
    callNow: "કોલ કરો",
    whatsappChat: "વોટ્સએપ ચેટ",
    viewDetails: "વિગત જુઓ",
    selectLanguage: "ભાષા",
    searchBtn: "પીજી શોધો",
  },
};

export type TranslationKey = keyof typeof TRANSLATIONS.en;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isGujarati: boolean;
  isHindi: boolean;
  isEnglish: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => { },
  t: (key) => TRANSLATIONS.en[key] || String(key),
  isGujarati: false,
  isHindi: false,
  isEnglish: true,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("luxora-lang") as Language;
      if (saved && (saved === "en" || saved === "hi" || saved === "gu")) {
        setLangState(saved);
        document.documentElement.lang = saved;
      }
    } catch { }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("luxora-lang", newLang);
      document.documentElement.lang = newLang;
      window.dispatchEvent(new Event("luxora-lang-changed"));
    } catch { }
  };

  const t = useMemo(() => {
    return (key: TranslationKey): string => {
      const activeDict = TRANSLATIONS[lang] || TRANSLATIONS.en;
      return activeDict[key] || TRANSLATIONS.en[key] || String(key);
    };
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      isGujarati: lang === "gu",
      isHindi: lang === "hi",
      isEnglish: lang === "en",
    }),
    [lang, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      lang: "en" as Language,
      setLang: () => { },
      t: (key: TranslationKey) => TRANSLATIONS.en[key] || String(key),
      isGujarati: false,
      isHindi: false,
      isEnglish: true,
    };
  }
  return context;
}
