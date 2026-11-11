import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | SAMB's Laundry & Cleaning Services",
  description:
    "Get in touch with SAMB's Laundry and Cleaning Services. Send us a message, email us directly, or call our customer line for inquiries and custom service quotes.",
};

const contactChannels = [
  {
    icon: Phone,
    title: "Call Us Directly",
    description: "Speak with our friendly customer desk during working hours.",
    items: [
      { label: "+233 (0) 54 024 0754", href: "tel:+233540240754", note: "Primary Line" },
      { label: "+233 (0) 54 885 2176", href: "tel:+233548852176", note: "Customer Support" },
    ],
    action: {
      label: "Call Now",
      href: "tel:+233548123456",
      icon: PhoneCall,
      color: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  },
  {
    icon: MessageSquare,
    title: "Chat on WhatsApp",
    description: "Quick responses for booking inquiries, quotes, and directions.",
    items: [
      {
        label: "+233 54 024 0754",
        href: "https://wa.me/233548123456?text=Hello%20SAMB%27s%20Services%2C%20I%20would%20like%20to%20inquire%20about%20your%20services.",
        note: "Instant WhatsApp Chat",
      },
    ],
    action: {
      label: "Open WhatsApp",
      href: "https://wa.me/233540240754?text=Hello%20SAMB%27s%20Services%2C%20I%20would%20like%20to%20inquire%20about%20your%20services.",
      icon: MessageSquare,
      color: "bg-emerald-600 hover:bg-emerald-700 text-white",
      external: true,
    },
  },
  {
    icon: Mail,
    title: "Send an Email",
    description: "For formal quote requests, partnerships, and detailed queries.",
    items: [
      {
        label: "info@sambsklinin.com",
        href: "mailto:info@sambservices.com?subject=Inquiry%20via%20SAMB%27s%20Website",
        note: "General Enquiries",
      },
      {
        label: "support@sambservices.com",
        href: "mailto:support@sambservices.com?subject=Customer%20Support%20Request",
        note: "Customer Care",
      },
    ],
    action: {
      label: "Email Us",
      href: "mailto:info@sambservices.com?subject=Inquiry%20via%20SAMB%27s%20Website",
      icon: Mail,
      color: "bg-slate-900 hover:bg-slate-800 text-white",
    },
  },
];

const operatingDetails = [
  {
    icon: Clock,
    title: "Working Hours",
    lines: [
      "Monday – Saturday: 8:00 AM – 6:00 PM (GMT)",
      "Sunday: By appointment / Emergency support only",
    ],
    color: "text-blue-700",
  },
  {
    icon: MapPin,
    title: "Service Coverage",
    lines: [
      "Greater Accra Metropolitan Area & surrounding districts across Ghana.",
    ],
    color: "text-blue-700",
  },
  {
    icon: ShieldCheck,
    title: "Guaranteed Response",
    lines: [
      "All online inquiries and form submissions are logged into our admin dashboard and acknowledged promptly.",
    ],
    color: "text-emerald-600",
  },
];

const highlights = [
  "Fast response within 1–2 business hours",
  "Free quotes tailored to your space and requirements",
  "Trained, background-checked professional staff",
  "Serving Greater Accra and surrounding districts",
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-slate-950 px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="absolute inset-0 bg-[#031c43]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-300">
            <Sparkles size={14} />
            Customer Service &amp; Support
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Get in touch with SAMB&apos;s
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Have a question about our cleaning, laundry care, domestic support,
            or pest control? Fill out the form, send an email, or give our team
            a direct call.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-xs text-blue-100 backdrop-blur-sm"
              >
                <CheckCircle2 size={16} className="shrink-0 text-blue-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Left Column: Direct Contact Channels & Operating Details */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Direct Contact Channels
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Reach out to us through any of the channels below for immediate assistance.
              </p>

              <div className="mt-6 divide-y divide-slate-100">
                {contactChannels.map((channel) => {
                  const Icon = channel.icon;
                  const ActionIcon = channel.action.icon;

                  return (
                    <article key={channel.title} className="py-5 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-sm">
                          <Icon size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-slate-900">
                            {channel.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {channel.description}
                          </p>

                          <div className="mt-3 space-y-1.5">
                            {channel.items.map((item) => (
                              <div
                                key={item.label}
                                className="flex flex-wrap items-center justify-between gap-2 text-sm"
                              >
                                <a
                                  href={item.href}
                                  target={item.href.startsWith("http") ? "_blank" : undefined}
                                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                  className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                                >
                                  {item.label}
                                </a>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                  {item.note}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3">
                            <a
                              href={channel.action.href}
                              target={channel.action.external ? "_blank" : undefined}
                              rel={channel.action.external ? "noopener noreferrer" : undefined}
                              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${channel.action.color}`}
                            >
                              <ActionIcon size={14} />
                              <span>{channel.action.label}</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Hours and Coverage Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h3 className="text-lg font-bold text-slate-900">
                Operating Hours &amp; Service Coverage
              </h3>

              <div className="mt-4 space-y-4 text-sm text-slate-600">
                {operatingDetails.map((detail) => {
                  const Icon = detail.icon;
                  return (
                    <div key={detail.title} className="flex items-start gap-3">
                      <Icon size={18} className={`mt-0.5 shrink-0 ${detail.color}`} />
                      <div>
                        <p className="font-semibold text-slate-900">{detail.title}</p>
                        {detail.lines.map((l) => (
                          <p key={l} className="mt-0.5 text-xs text-slate-500">
                            {l}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Link Card for Existing Customers */}
            <div className="rounded-3xl bg-[#031c43] p-6 text-white shadow-md sm:p-8">
              <h3 className="text-lg font-bold">Ready to schedule a service?</h3>
              <p className="mt-2 text-xs leading-relaxed text-blue-200">
                Skip the inquiry form and submit a direct booking request with your preferred date and requirements.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-blue-950 transition hover:bg-blue-50"
                >
                  Browse Services <ArrowRight size={14} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  Sign In to Account
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Professional Interactive Form */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
