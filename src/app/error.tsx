"use client";
import { useEffect } from "react";
import Link from "next/link";

/** Route-level error boundary: a friendly page instead of a stack trace. Nothing about the error is shown to visitors. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route error", error.digest || "");
  }, [error]);

  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm text-mute">We could not load this page right now. Please try again in a moment.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn btn-primary min-h-[44px]">Try again</button>
          <Link href="/" className="btn btn-ghost min-h-[44px]">Go home</Link>
        </div>
      </div>
    </div>
  );
}
