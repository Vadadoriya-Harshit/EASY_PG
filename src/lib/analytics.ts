"use client";
/** Privacy-aware, cookie-less event counter. Sends event names only, never personal data. */
export function track(event: string) {
  try {
    const body = JSON.stringify({ event });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {}
}
