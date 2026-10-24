import { getProperty, listAreas } from "./repo";
import { processQueue } from "./vacancy";

/** Sends every due vacancy notification (new and retries). Used after an availability change and by the cron endpoint. */
export async function deliverQueuedVacancyAlerts(opts: { max?: number; deadlineMs?: number } = {}) {
  const areas = await listAreas({ includeInactive: true });
  const names = new Map(areas.map((a) => [a.slug, a.name]));
  return processQueue(
    {
      getProperty: (slug) => getProperty(slug, true),
      areaName: async (slug) => names.get(slug),
    },
    opts
  );
}
