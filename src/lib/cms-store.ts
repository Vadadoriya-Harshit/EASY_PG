/**
 * Server-side CMS persistence (MongoDB when configured, in-memory otherwise).
 * Types and defaults live in ./cms-defaults so client bundles do not pull in the database driver.
 */
import { DEFAULT_CMS_DATA, normalizeHomeSections, type SiteCmsData } from "./cms-defaults";
export * from "./cms-defaults";
import { CmsModel, connect } from "./models";

// Global in-memory server cache
const g = globalThis as any;
g.__sorathCmsStore ??= structuredClone(DEFAULT_CMS_DATA);

export async function fetchCmsData(): Promise<SiteCmsData> {
  if (process.env.MONGODB_URI) {
    try {
      await connect();
      const doc = await CmsModel().findOne({ key: "site_cms" }).lean();
      if (doc) {
        const { _id, key, ...rest } = doc as any;
        g.__sorathCmsStore = {
          ...DEFAULT_CMS_DATA,
          ...rest,
          navigation: { ...DEFAULT_CMS_DATA.navigation, ...(rest.navigation || {}) },
          hero: { ...DEFAULT_CMS_DATA.hero, ...(rest.hero || {}) },
          areas: { ...DEFAULT_CMS_DATA.areas, ...(rest.areas || {}) },
          contact: {
            ...DEFAULT_CMS_DATA.contact,
            ...(rest.contact || {}),
            branches: rest.contact?.branches || DEFAULT_CMS_DATA.contact.branches,
          },
          about: {
            ...DEFAULT_CMS_DATA.about,
            ...(rest.about || {}),
            pillars: rest.about?.pillars || DEFAULT_CMS_DATA.about.pillars,
            securitySteps: rest.about?.securitySteps || DEFAULT_CMS_DATA.about.securitySteps,
          },
          faq: {
            ...DEFAULT_CMS_DATA.faq,
            ...(rest.faq || {}),
            categories: rest.faq?.categories || DEFAULT_CMS_DATA.faq.categories,
          },
          footer: { ...DEFAULT_CMS_DATA.footer, ...(rest.footer || {}) },
          amenities: rest.amenities || DEFAULT_CMS_DATA.amenities,
          homeSections: normalizeHomeSections(rest.homeSections),
          seo: { ...DEFAULT_CMS_DATA.seo, ...(rest.seo || {}) },
        };
        return g.__sorathCmsStore;
      }
      // DB reachable but no document yet: serve defaults (first run)
      return structuredClone(DEFAULT_CMS_DATA);
    } catch (e: any) {
      // Do not pretend the defaults are the live content. Let the caller (page revalidation) keep its last good copy.
      console.error("[cms] could not read content:", e?.message);
      throw e;
    }
  }
  return g.__sorathCmsStore;
}

export function getCmsData(): SiteCmsData {
  return g.__sorathCmsStore || DEFAULT_CMS_DATA;
}

export async function updateCmsData(newData: Partial<SiteCmsData>): Promise<SiteCmsData> {
  const current: SiteCmsData = process.env.MONGODB_URI ? await fetchCmsData() : g.__sorathCmsStore || DEFAULT_CMS_DATA;
  const updated: SiteCmsData = {
    ...current,
    ...newData,
    navigation: { ...current.navigation, ...(newData.navigation || {}) },
    hero: { ...current.hero, ...(newData.hero || {}) },
    areas: { ...current.areas, ...(newData.areas || {}) },
    contact: {
      ...current.contact,
      ...(newData.contact || {}),
      branches: newData.contact?.branches || current.contact.branches,
    },
    about: {
      ...current.about,
      ...(newData.about || {}),
      pillars: newData.about?.pillars || current.about.pillars,
      securitySteps: newData.about?.securitySteps || current.about.securitySteps,
    },
    faq: {
      ...current.faq,
      ...(newData.faq || {}),
      categories: newData.faq?.categories || current.faq.categories,
    },
    footer: { ...current.footer, ...(newData.footer || {}) },
    amenities: newData.amenities || current.amenities,
    homeSections: normalizeHomeSections(newData.homeSections || current.homeSections),
    seo: { ...current.seo, ...(newData.seo || {}) },
    lastSaved: new Date().toISOString(),
  };

  if (process.env.MONGODB_URI) {
    // Persist first; if the database write fails the admin must see an error instead of a false "saved".
    await connect();
    await CmsModel().findOneAndUpdate({ key: "site_cms" }, { ...updated, key: "site_cms" }, { upsert: true });
  }
  g.__sorathCmsStore = updated;
  return updated;
}

export async function resetCmsData(): Promise<SiteCmsData> {
  if (process.env.MONGODB_URI) {
    await connect();
    await CmsModel().findOneAndUpdate({ key: "site_cms" }, { ...DEFAULT_CMS_DATA, key: "site_cms" }, { upsert: true });
  }
  g.__sorathCmsStore = structuredClone(DEFAULT_CMS_DATA);
  return g.__sorathCmsStore;
}
