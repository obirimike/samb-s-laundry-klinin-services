import ErrorView from "@/components/ui/ErrorView";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

export default function ForbiddenPage() {
  return (
    <>
      <NavBar />
      <ErrorView
        statusCode="403"
        title="Access Denied"
        message="You don't have permission to access this page or perform this action. If you believe this is an error, please contact SAMB administration."
        primaryAction={{
          label: "Return to dashboard",
          href: "/account",
        }}
        secondaryAction={{
          label: "Return to homepage",
          href: "/",
        }}
        showSupport={true}
      />
      <Footer />
    </>
  );
}

