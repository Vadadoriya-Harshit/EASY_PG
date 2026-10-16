"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import FullScreenLoader from "./FullScreenLoader";

export default function RouteTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);

  // When pathname or search params settle, turn off navigating state
  useEffect(() => {
    setNavigating(false);
  }, [pathname, searchParams]);

  // Intercept standard internal links to show brief transition state
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      // Only trigger for same-origin internal navigations
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:") &&
        targetAttr !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        // If clicking the current exact page, don't show loader
        const currentFullPath = `${window.location.pathname}${window.location.search}`;
        if (href !== currentFullPath) {
          setNavigating(true);
        }
      }
    };

    window.addEventListener("click", handleAnchorClick, { capture: true });
    return () => window.removeEventListener("click", handleAnchorClick, { capture: true });
  }, []);

  if (!navigating) return null;

  return (
    <FullScreenLoader
      message="Navigating Luxora PG..."
      subtext="Fetching verified residence data & photos..."
    />
  );
}
