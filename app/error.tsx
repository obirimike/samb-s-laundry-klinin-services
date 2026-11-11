
"use client";

import { useEffect } from "react";
import ErrorView from "@/components/ui/ErrorView";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App segment error:", error);
  }, [error]);

  return (
    <ErrorView
      statusCode="500"
      title="Something Went Wrong"
      message="We encountered an unexpected problem while processing your request. Please try again or return to the homepage."
      onRetry={reset}
      primaryAction={{
        label: "Return to homepage",
        href: "/",
      }}
      showSupport={true}
    />
  );
}
