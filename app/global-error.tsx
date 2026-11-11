"use client";

import { useEffect } from "react";
import ErrorView from "@/components/ui/ErrorView";

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-50 antialiased font-sans">
        <ErrorView
          statusCode="500"
          title="Something Went Wrong"
          message="An unexpected system problem occurred. Please try again or return to the homepage."
          onRetry={reset}
          primaryAction={{
            label: "Return to homepage",
            href: "/",
          }}
          showSupport={true}
        />
      </body>
    </html>
  );
}

