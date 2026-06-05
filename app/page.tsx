import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Briefcase,
  Car,
  Clock,
  HeadphonesIcon,
  Moon,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { ServiceAreas } from "@/components/shared/service-areas";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <Hero />
        <HowItWorks />
        <SafetyFirst />
        <WhyChooseUs />
        <TailoredJourneys />
        <ServiceAreas />
        <DriverPartnerBanner />
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
    <section className="mx-auto max-w-7xl px-4 pt-10 pb-16 md:px-8 md:pt-16 md:pb-20">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-primary md:text-5xl lg:text-[56px]">
            Join the ManaDriver Community.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">
            Whether you need a trusted driver or want to earn as one — you
            belong here. Join thousands of people across India who rely on
            ManaDriver for seamless, safe, and professional journeys every day.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="h-12 bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90"
              render={<Link href="/signup" />}
            >
              Join Us
              <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 border-border bg-background px-8 text-base text-primary"
              render={<Link href="/signup" />}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Visual */}
        <div className="relative min-h-[420px] overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-container shadow-xl md:h-[500px] lg:h-[560px]">
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-secondary/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 size-64 rounded-full bg-secondary/20 blur-3xl" />
          <div className="relative flex h-full flex-col justify-end p-8 md:p-10">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <Car
                className="size-10 text-primary-foreground"
                aria-hidden="true"
              />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-primary-foreground md:text-3xl">
              Your driver is on the way
            </h3>
            <p className="mt-2 max-w-md text-sm text-primary-foreground/70">
              Verified, background-checked chauffeurs ready for your everyday
              commute, weekend trip, or business travel.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <ShieldCheck
                  className="size-5 text-primary-foreground"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm font-semibold text-primary-foreground">
                  Verified Driver
                </p>
                <p className="text-xs text-primary-foreground/70">
                  Background-checked
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <Clock
                  className="size-5 text-primary-foreground"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm font-semibold text-primary-foreground">
                  Pay by Hour
                </p>
                <p className="text-xs text-primary-foreground/70">
                  Or full day / month
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                      */
/* ------------------------------------------------------------------ */
const CUSTOMER_STEPS = [
  {
    title: "Select Service",
    body: "Choose between hourly, daily, outstation, or specific drop services.",
  },
  {
    title: "Confirm Details",
    body: "Provide your location, car type, and duration. See the estimate upfront.",
  },
  {
    title: "Driver Assigned",
    body: "A verified driver arrives at your doorstep at the scheduled time.",
  },
];

const DRIVER_STEPS = [
  {
    title: "Register & Verify",
    body: "Submit your documents and complete our thorough verification process.",
  },
  {
    title: "Accept Jobs",
    body: "Browse available bookings in your area and accept those that fit your schedule.",
  },
  {
    title: "Earn Daily",
    body: "Complete rides professionally and receive payments directly to your bank account.",
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-h2 font-bold text-primary md:text-3xl">
          How It Works
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Whether you&apos;re booking a ride or joining as a driver, getting
          started takes just a few simple steps.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StepsCard title="For Customers" steps={CUSTOMER_STEPS} accent="secondary" />
        <StepsCard title="For Drivers" steps={DRIVER_STEPS} accent="primary" />
      </div>
    </section>
  );
}

function StepsCard({
  title,
  steps,
  accent,
}: {
  title: string;
  steps: { title: string; body: string }[];
  accent: "primary" | "secondary";
}) {
  const numberClasses =
    accent === "secondary"
      ? "bg-secondary text-secondary-foreground"
      : "bg-primary text-primary-foreground";
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
      <h3 className="text-h3 border-b border-border pb-4 font-semibold text-primary">
        {title}
      </h3>
      <ol className="flex flex-col gap-6">
        {steps.map((step, i) => (
          <li key={step.title} className="flex items-start gap-4">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${numberClasses}`}
            >
              {i + 1}
            </span>
            <div>
              <p className="text-base font-semibold text-primary">
                {step.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Safety First                                                      */
/* ------------------------------------------------------------------ */
const SAFETY_CHECKS = [
  {
    Icon: BadgeCheck,
    title: "Identity Check",
    body: "Aadhaar, PAN, and valid driving license verification.",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    Icon: ShieldCheck,
    title: "Police Verification",
    body: "Thorough background and criminal record checks.",
    iconBg: "bg-secondary/15 text-secondary",
  },
  {
    Icon: Car,
    title: "Skill Assessment",
    body: "Practical driving tests for various car models.",
    iconBg: "bg-status-temporary/15 text-status-temporary",
  },
  {
    Icon: Brain,
    title: "Behavioral Interview",
    body: "Evaluating professionalism and customer service skills.",
    iconBg: "bg-destructive/10 text-destructive",
  },
];

function SafetyFirst() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-20">
      <div className="rounded-3xl border border-border bg-muted/40 p-8 md:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h2 font-bold text-primary md:text-3xl">
            Safety First, Always.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            We take your security seriously. Our 4-step verification ensures
            only the best drivers join our platform.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SAFETY_CHECKS.map(({ Icon, title, body, iconBg }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-background p-6 text-center shadow-sm"
            >
              <div
                className={`flex size-14 items-center justify-center rounded-full ${iconBg}`}
              >
                <Icon className="size-7" aria-hidden="true" />
              </div>
              <h3 className="text-h3 font-semibold text-primary">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
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
const FEATURES = [
  {
    Icon: ShieldCheck,
    title: "Verified Pros",
    body: "Every driver undergoes a rigorous background check to ensure your safety.",
    iconBg: "bg-secondary/15 text-secondary",
  },
  {
    Icon: Clock,
    title: "Flexible Booking",
    body: "Book for a few hours, a full day, or set up a recurring schedule effortlessly.",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    Icon: Wallet,
    title: "Clear Pricing",
    body: "Know the cost upfront with our transparent fee structure. No hidden surprises.",
    iconBg: "bg-status-temporary/15 text-status-temporary",
  },
  {
    Icon: HeadphonesIcon,
    title: "24/7 Support",
    body: "Our dedicated support team is always available to assist you with any journey.",
    iconBg: "bg-destructive/10 text-destructive",
  },
];

function WhyChooseUs() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-20"
      id="features"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-h2 font-bold text-primary md:text-3xl">
          Why Choose ManaDriver?
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Built on a foundation of trust and utility, our platform ensures
          every journey is managed with precision.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ Icon, title, body, iconBg }) => (
          <div
            key={title}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className={`flex size-12 items-center justify-center rounded-full ${iconBg}`}
            >
              <Icon className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-h3 font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Tailored Journeys                                                 */
/* ------------------------------------------------------------------ */
const JOURNEYS = [
  {
    Icon: Briefcase,
    title: "Daily Commute",
    body: "Reliable drivers for your everyday office runs. Reclaim your time in traffic.",
  },
  {
    Icon: Moon,
    title: "Night Outs",
    body: "Enjoy your evening safely. We'll drive your car home securely.",
  },
  {
    Icon: Car,
    title: "Outstation Trips",
    body: "Experienced highway drivers for your weekend getaways or long journeys.",
  },
  {
    Icon: Users,
    title: "Eldercare Rides",
    body: "Patient and careful drivers trained to assist elderly passengers.",
  },
];

function TailoredJourneys() {
  return (
    <section
      id="services"
      className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-20"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-h2 font-bold text-primary md:text-3xl">
          Tailored for Every Journey
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Whatever your need, we have a specialized driver ready for you.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
        {JOURNEYS.map(({ Icon, title, body }) => (
          <div
            key={title}
            className="flex items-center gap-6 rounded-2xl border border-border bg-card p-7 shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
              <Icon className="size-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-h3 font-semibold text-primary">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Driver partner banner                                             */
/* ------------------------------------------------------------------ */
function DriverPartnerBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground md:p-12">
        <div
          className="absolute inset-0 opacity-10"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
          <div className="flex-1">
            <h2 className="text-2xl leading-tight font-bold md:text-3xl">
              Ready to Join Us?
            </h2>
            <p className="mt-3 max-w-xl text-base text-primary-foreground/75">
              Whether you&apos;re looking to earn as a professional driver or
              hire one on demand — ManaDriver welcomes you. Flexible, trusted,
              and built for everyone.
            </p>
          </div>
          <Button
            size="lg"
            className="h-12 bg-background px-8 text-base text-primary shadow-md hover:bg-muted [a]:hover:bg-muted hover:text-primary"
            render={<Link href="/signup" />}
          >
            Join ManaDriver
            <UserCheck className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}

