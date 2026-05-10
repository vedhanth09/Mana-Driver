import Link from "next/link";
import {
  ArrowRight,
  Bolt,
  Calendar,
  Car,
  Clock,
  HeadphonesIcon,
  Languages,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  UserCheck,
  Wallet,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { CITIES } from "@/lib/constants/cities";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <Hero />
        <SafetyTrustBand />
        <WhyChooseUs />
        <Services />
        <Safety />
        <ServiceAreas />
        <FAQ />
        <DriverPartnerBanner />
        <BusinessBanner />
        <AppDownload />
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                              */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-secondary/5" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-16 pb-20 md:grid-cols-2 md:px-8 md:pt-24 md:pb-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5">
            <Sparkles className="size-4 text-secondary" aria-hidden="true" />
            <span className="text-xs font-bold tracking-wide text-secondary uppercase">
              India&apos;s trusted driver platform
            </span>
          </div>
          <h1 className="text-4xl leading-tight font-extrabold text-primary md:text-5xl lg:text-6xl">
            Your Car. <br />
            A Professional Driver. <br />
            <span className="text-primary/80">On Demand.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Book a trusted driver in minutes — hourly, temporary, or permanent.
            Verified chauffeurs for your personal vehicle, across major Indian
            cities.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-14 bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90"
              render={<Link href="/signup" />}
            >
              Book a Driver Now
              <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 border-primary px-8 text-base text-primary"
              render={<Link href="/signup" />}
            >
              Become a Driver
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              <span className="size-9 rounded-full border-2 border-background bg-primary/30" />
              <span className="size-9 rounded-full border-2 border-background bg-secondary" />
              <span className="size-9 rounded-full border-2 border-background bg-status-temporary/60" />
            </div>
            <div>
              <div className="flex items-center gap-0.5 text-status-temporary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                4.9 / 5 from verified rides
              </p>
            </div>
          </div>
        </div>

        {/* Visual */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-10 shadow-2xl">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-secondary/30 blur-3xl" />
            <div className="relative">
              <Car className="size-16 text-primary-foreground" aria-hidden="true" />
              <h3 className="mt-6 text-h2 text-primary-foreground">
                Arriving in 15 min
              </h3>
              <p className="mt-1 text-sm text-primary-foreground/80">
                Ramesh K. is on the way. Verified driver · 4.9★
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 text-primary-foreground">
                <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold">Verified Driver</p>
                  <p className="text-xs text-primary-foreground/70">
                    Background-checked
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                  <Clock className="size-5" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold">Pay by Hour</p>
                  <p className="text-xs text-primary-foreground/70">
                    Or full day / month
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Safety trust band (dark teal)                                     */
/* ------------------------------------------------------------------ */
function SafetyTrustBand() {
  const items = [
    { Icon: ShieldCheck, label: "100% Verified" },
    { Icon: UserCheck, label: "Trained Professionals" },
    { Icon: HeadphonesIcon, label: "24×7 Support" },
    { Icon: ThumbsUp, label: "Rated by Community" },
  ];
  return (
    <section className="bg-primary py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <p className="text-center text-xs font-bold tracking-widest text-primary-foreground/70 uppercase">
          Uncompromising standards
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {items.map(({ Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 text-primary-foreground"
            >
              <Icon className="size-6" aria-hidden="true" />
              <span className="text-base font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Why Choose Us                                                     */
/* ------------------------------------------------------------------ */
function WhyChooseUs() {
  const features = [
    {
      Icon: ShieldCheck,
      title: "Verified Drivers",
      body: "Every driver passes Aadhaar, PAN, and license verification before joining.",
    },
    {
      Icon: Clock,
      title: "Flexible Hire",
      body: "Book by the hour, day, or hire a permanent driver. Your schedule, your terms.",
    },
    {
      Icon: MapPin,
      title: "All-India Coverage",
      body: "Live in 12 cities and rapidly expanding. Find a driver wherever you are.",
    },
    {
      Icon: Star,
      title: "Rated & Reviewed",
      body: "Transparent ratings on every trip. You always know who&apos;s driving your car.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8" id="features">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-h2 font-bold text-primary md:text-3xl">
          Why Choose ManaDriver?
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Built on trust and utility — every journey is managed with precision
          and care.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map(({ Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
              <Icon className="size-6" aria-hidden="true" />
            </div>
            <h3 className="text-h3 mt-5 font-semibold text-primary">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Services                                                          */
/* ------------------------------------------------------------------ */
function Services() {
  const tiles = [
    {
      Icon: Bolt,
      title: "Instant Booking",
      body: "Need a driver right now? Get matched with a nearby professional in minutes.",
    },
    {
      Icon: MapPin,
      title: "Outstation",
      body: "Heading out of town? Hire a driver for multi-day trips and ride relaxed.",
    },
    {
      Icon: Calendar,
      title: "Daily Commute",
      body: "Reclaim your time. Let us handle the traffic on your daily office runs.",
    },
    {
      Icon: Sparkles,
      title: "Premium",
      body: "Senior chauffeurs trained for luxury vehicles and corporate clients.",
    },
  ];
  return (
    <section
      id="services"
      className="border-y border-border bg-card/50 py-20"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h2 font-bold text-primary md:text-3xl">
            Tailored for Every Journey
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Choose the service that fits your trip.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-background p-6 shadow-sm transition-transform hover:-translate-y-1"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Icon className="size-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-h3 mt-5 font-semibold text-primary">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Safety section                                                    */
/* ------------------------------------------------------------------ */
function Safety() {
  const points = [
    {
      Icon: ShieldCheck,
      title: "Document Verified",
      body: "Aadhaar, PAN, and driving license verified for every driver.",
    },
    {
      Icon: UserCheck,
      title: "Background Checked",
      body: "Comprehensive criminal background screening before approval.",
    },
    {
      Icon: ThumbsUp,
      title: "Rated by Community",
      body: "Real ratings from real customers after every completed job.",
    },
    {
      Icon: HeadphonesIcon,
      title: "24×7 Support",
      body: "Help is always a tap away — for both drivers and customers.",
    },
  ];
  const stats = [
    { value: "10,000+", label: "Trips completed" },
    { value: "4.8★", label: "Average rating" },
    { value: "12", label: "Cities live" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <div className="rounded-3xl bg-primary p-8 text-primary-foreground md:p-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h2 font-bold md:text-3xl">Safety First, Always</h2>
          <p className="mt-3 text-primary-foreground/80">
            We don&apos;t compromise when it comes to who drives your car.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {points.map(({ Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-white/10">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <p className="text-base font-semibold">{title}</p>
              <p className="text-sm text-primary-foreground/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-6 text-center"
          >
            <p className="text-2xl font-extrabold text-primary md:text-3xl">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Service areas                                                     */
/* ------------------------------------------------------------------ */
function ServiceAreas() {
  return (
    <section className="bg-card/50 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h2 font-bold text-primary md:text-3xl">
            Available Across India
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Live in 12 metropolitan cities — and growing fast.
          </p>
        </div>
        <div className="relative mt-12 overflow-hidden rounded-3xl border border-border bg-background p-10 md:p-16">
          {/* Decorative dot grid (illustrative map background) */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(circle, var(--color-primary) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative flex flex-wrap justify-center gap-3">
            {CITIES.map((city) => (
              <span
                key={city}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-primary shadow-sm"
              >
                <span className="size-1.5 rounded-full bg-secondary" />
                {city}
              </span>
            ))}
          </div>
          <p className="relative mt-10 text-center text-xs font-bold tracking-widest text-muted-foreground uppercase">
            + more cities coming soon
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                               */
/* ------------------------------------------------------------------ */
const FAQS = [
  {
    q: "How are drivers verified on ManaDriver?",
    a: "Every driver completes Aadhaar, PAN, and driving license verification, plus a background check, before they can accept any job on the platform.",
  },
  {
    q: "Can I book the same driver for multiple days?",
    a: "Yes. Choose Temporary or Permanent when posting a job. Temporary covers multi-day trips; Permanent covers full-time monthly hires.",
  },
  {
    q: "Which cities is ManaDriver available in?",
    a: `We are live in ${CITIES.slice(0, 6).join(", ")} and ${CITIES.length - 6} other cities — with more launching every quarter.`,
  },
  {
    q: "What languages do drivers speak?",
    a: "Drivers list the languages they speak (English, Hindi, and Telugu in Phase 1). You can filter by language when posting a job.",
  },
  {
    q: "How does payment work?",
    a: "Phase 1 of the platform settles payments off-app, directly between you and the driver. In-app payments are coming next.",
  },
  {
    q: "What if I need to cancel?",
    a: "You can cancel any active job from your dashboard with an optional reason. Both parties are notified immediately.",
  },
];

function FAQ() {
  return (
    <section id="about" className="mx-auto max-w-3xl px-4 py-20 md:px-8">
      <div className="text-center">
        <h2 className="text-h2 font-bold text-primary md:text-3xl">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Everything you need to know before booking.
        </p>
      </div>
      <Accordion className="mt-10">
        {FAQS.map((item, i) => (
          <AccordionItem key={i} value={`q-${i}`}>
            <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">{item.a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Driver partner banner                                             */
/* ------------------------------------------------------------------ */
function DriverPartnerBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="overflow-hidden rounded-3xl bg-card p-10 md:flex md:items-center md:gap-10 md:p-14">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1">
            <span className="text-xs font-bold tracking-wide text-primary uppercase">
              For Drivers
            </span>
          </div>
          <h2 className="mt-4 text-h2 font-bold text-primary md:text-3xl">
            Earn on your own terms. Drive when you want.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Join the ManaDriver partner network. Flexible hours, premium
            clientele, transparent payouts.
          </p>
        </div>
        <div className="mt-6 md:mt-0">
          <Button
            size="lg"
            className="h-14 bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90"
            render={<Link href="/signup" />}
          >
            Join as a Driver
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Business banner                                                   */
/* ------------------------------------------------------------------ */
function BusinessBanner() {
  return (
    <section
      id="business"
      className="mx-auto max-w-7xl px-4 pb-16 md:px-8"
    >
      <div className="overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground md:flex md:items-center md:gap-10 md:p-14">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1">
            <span className="text-xs font-bold tracking-wide text-primary-foreground uppercase">
              For Business
            </span>
          </div>
          <h2 className="mt-4 text-h2 font-bold md:text-3xl">
            Long-term drivers for your fleet.
          </h2>
          <p className="mt-3 text-base text-primary-foreground/80">
            Need permanent chauffeurs for executives or company vehicles? Our
            business team can match you with vetted, long-tenure drivers.
          </p>
        </div>
        <div className="mt-6 md:mt-0">
          <Button
            size="lg"
            variant="outline"
            className="h-14 border-white bg-transparent px-8 text-base text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            render={<Link href="mailto:business@manadriver.example" />}
          >
            Contact Us
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  App download                                                      */
/* ------------------------------------------------------------------ */
function AppDownload() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
      <div className="rounded-3xl border border-border bg-card p-10 text-center md:p-14">
        <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-secondary/15">
          <Languages className="size-6 text-secondary" aria-hidden="true" />
        </div>
        <h2 className="text-h2 mt-4 font-bold text-primary md:text-3xl">
          Coming soon on mobile
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Native iOS and Android apps are on the way. Until then, the web
          experience is fully responsive.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            disabled
            className="inline-flex h-14 items-center gap-3 rounded-xl bg-primary px-6 text-primary-foreground opacity-60"
          >
            <Wallet className="size-5" aria-hidden="true" />
            <div className="text-left leading-tight">
              <p className="text-[10px] uppercase opacity-70">Download on the</p>
              <p className="text-base font-bold">App Store</p>
            </div>
          </button>
          <button
            type="button"
            disabled
            className="inline-flex h-14 items-center gap-3 rounded-xl bg-primary px-6 text-primary-foreground opacity-60"
          >
            <Wallet className="size-5" aria-hidden="true" />
            <div className="text-left leading-tight">
              <p className="text-[10px] uppercase opacity-70">Get it on</p>
              <p className="text-base font-bold">Google Play</p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
