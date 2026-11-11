"use client";

import { useEffect } from "react";
import ErrorView from "@/components/ui/ErrorView";


export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Account section error:", error);
  }, [error]);

  return (
    <>
      <ErrorView
        statusCode="500"
        title="Something Went Wrong"
        message="Unable to load this section of your account. Please try again or return to your account overview."
        onRetry={reset}
        primaryAction={{
          label: "My Account",
          href: "/account",
        }}
        secondaryAction={{
          label: "Return Home",
          href: "/",
        }}
        showSupport={true}
      />
    </>
  );
}

