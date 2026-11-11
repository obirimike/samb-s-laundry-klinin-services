import ErrorView from "@/components/ui/ErrorView";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <NavBar />
      <ErrorView
        statusCode="404"
        title="Page Not Found"
        message="The page you're looking for doesn't exist, may have been moved, or is no longer available."
        primaryAction={{
          label: "Return to homepage",
          href: "/",
        }}
        secondaryAction={{
          label: "Browse services",
          href: "/services",
        }}
        showSupport={true}
      />
      <Footer />
    </>
  );
}
