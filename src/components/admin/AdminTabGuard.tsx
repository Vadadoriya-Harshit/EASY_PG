"use client";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes auto-lock timeout

export default function AdminTabGuard({ currentSessionSid }: { currentSessionSid?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Inactivity Auto-Lock Timer (15 Minutes)
    const resetInactivity = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        sessionStorage.removeItem("luxora_admin_tab_active");
        fetch("/api/auth/logout", { method: "POST" }).finally(() => {
          router.replace("/admin/login");
        });
      }, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetInactivity, { passive: true }));
    resetInactivity();

    // 2. Tab Session Lifecycle Check:
    // If currentSessionSid exists from server, sync it to sessionStorage for this tab.
    // If the active tab session was invalidated or belongs to a different session, sign out cleanly.
    const activeTabSid = sessionStorage.getItem("luxora_admin_tab_active");

    if (currentSessionSid) {
      if (!activeTabSid) {
        sessionStorage.setItem("luxora_admin_tab_active", currentSessionSid);
      } else if (activeTabSid !== currentSessionSid) {
        sessionStorage.removeItem("luxora_admin_tab_active");
        fetch("/api/auth/logout", { method: "POST" }).finally(() => {
          window.location.href = "/admin/login";
        });
        return;
      }
    }

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetInactivity));
    };
  }, [currentSessionSid, pathname, router]);

  return null;
}
