import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/auth/SignOutButton";
import MobileNavigationMenu from "@/components/layout/MobileNavigationMenu";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Our Services" },
  { href: "/about", label: "About Us" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

export default async function NavBar() {
  const session = await auth();
  const user = session?.user;
  const isSignedIn = Boolean(user?.id);
  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "STAFF";

  const dashboardHref = isAdmin ? "/admin" : "/account";
  const dashboardLabel = isAdmin ? "Admin Dashboard" : "My Account";
  const bookingHref = isSignedIn ? "/book" : "/login";
  const bookingLabel = isSignedIn ? "Book a Service" : "Sign In to Book";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          aria-label="SAMB&apos;s Laundry and Klinin Services homepage"
        >
          <span className="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-full border border-blue-200 bg-blue-900 shadow-sm">
            <Image
              src="/images/logo/samb-logo.jpeg"
              alt="SAMB's Laundry and Klinin Services logo"
              fill
              sizes="44px"
              className="object-cover"
              priority
            />
          </span>

          <span className="min-w-0">
            <span className="block text-base font-extrabold tracking-tight text-slate-900">
              SAMB&apos;S
            </span>
            <span className="block text-[11px] font-medium text-slate-500 sm:text-xs">
              Laundry &amp; Klinin Services
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isStaff ? (
            <>
              <Link
                href="/staff"
                className="rounded-xl bg-[#031c43] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Staff Dashboard
              </Link>
              <SignOutButton className="px-4 py-2.5" />
            </>
          ) : isSignedIn ? (
            <>
              <Link
                href={dashboardHref}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {dashboardLabel}
              </Link>
              <Link
                href={bookingHref}
                className="rounded-xl bg-[#031c43] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                {bookingLabel}
              </Link>
              {!isAdmin && <SignOutButton className="px-4 py-2.5" />}
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Create Account
              </Link>
              <Link
                href={bookingHref}
                className="rounded-xl bg-[#031c43] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                {bookingLabel}
              </Link>
            </>
          )}
        </div>

        <MobileNavigationMenu
          links={links}
          isSignedIn={isSignedIn}
          isStaff={isStaff}
          isAdmin={isAdmin}
          dashboardHref={dashboardHref}
          dashboardLabel={dashboardLabel}
          bookingHref={bookingHref}
          bookingLabel={bookingLabel}
        />
      </div>
    </header>
  );
}