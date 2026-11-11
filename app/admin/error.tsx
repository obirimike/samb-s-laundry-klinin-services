"use client";

import { useEffect } from "react";
import ErrorView from "@/components/ui/ErrorView";


export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin section error:", error);
  }, [error]);

  return (
    <>
      <ErrorView
        statusCode="500"
        title="Admin Workspace Error"
        message="An unexpected error occurred while loading this administrative view. Please retry or return to the overview."
        onRetry={reset}
        primaryAction={{
          label: "Admin Dashboard",
          href: "/admin",
        }}
        secondaryAction={{
          label: "Return Home",
          href: "/",
        }}
        showSupport={false}
      />
    </>
  );
}

