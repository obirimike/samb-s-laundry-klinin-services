
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  Briefcase,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Star,
  UserCheck,
  UserPlus,
  Users,
  UserRound,
  MessageSquare,
  History,
} from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";

const navigationItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/recruitment", label: "Recruitment", icon: Briefcase },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/assignments", label: "Assignments", icon: UserPlus },
  { href: "/admin/staff", label: "Staff", icon: UserCheck },
  { href: "/admin/calendar", label: "Booking calendar", icon: CalendarDays },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/services", label: "Services", icon: BriefcaseBusiness },
  { href: "/admin/quotes", label: "Quotes & pricing", icon: BadgeDollarSign },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/audit-logs", label: "Audit log", icon: History },
  { href: "/account/profile", label: "Profile settings", icon: UserRound },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    // When switching admin views, ensure the main content area resets scroll to top
    const mainScroll = document.getElementById("admin-main-content");
    if (mainScroll) {
      mainScroll.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [pathname]);

  return (
    <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="mb-4 shrink-0 lg:mb-6">
        <p className="text-base font-extrabold tracking-tight text-slate-900">
          SAMB&apos;S
        </p>
        <p className="text-xs font-medium text-slate-500">
          Laundry management
        </p>
      </div>

      <nav
        aria-label="Admin navigation"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-2 sm:px-2 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]"
      >
        <p className="mb-3 hidden px-3 text-xs font-bold uppercase tracking-wider text-slate-400 lg:block">
          Workspace
        </p>

        <ul className="flex flex-wrap gap-2 pb-1 md:flex-nowrap md:overflow-x-auto lg:flex-col lg:overflow-visible lg:pb-0">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/admin"
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href} className="min-w-[140px] flex-1 lg:min-w-0 lg:flex-none">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4 shrink-0 border-t border-slate-200 pt-4 lg:mt-auto lg:pt-5">
        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Account
        </p>

        <div className="px-1 lg:px-0">
          <SignOutButton className="w-full justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100" />
        </div>
      </div>
    </aside>
  );
}
