"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Car,
  ChevronRight,
  CreditCard,
  Menu,
  Moon,
  ShieldCheck,
  Smartphone,
  Star,
  Sun,
  Wallet,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";

export function LandingScreen() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, ready, toggleTheme } = useTheme();

  const themeIcon = ready && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-300">
      <nav className="sticky top-0 z-50 w-full border-b border-border/70 bg-card/88 shadow-sm backdrop-blur-lg">
        <div className="flex h-20 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Image src="/qiilu.png" alt="Qiilu" width={138} height={42} className="h-10 w-auto" priority />
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/passenger" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Ride
            </Link>
            <Link href="/driver" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Drive
            </Link>
            <a href="#safety" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Safety
            </a>
            <a href="#cities" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Cities
            </a>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              type="button"
            >
              {themeIcon}
            </button>
            <Link href="/login">
              <Button variant="ghost" className="font-semibold">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-full px-6 font-semibold shadow-lg shadow-primary/25">
                Sign up
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-muted-foreground"
              type="button"
            >
              {themeIcon}
            </button>
            <button onClick={() => setMobileMenuOpen((value) => !value)} className="p-2 text-foreground" type="button">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-border bg-card p-4 shadow-sm md:hidden">
            <div className="flex flex-col gap-4">
              <Link href="/passenger" className="rounded-lg p-2 text-lg font-medium hover:bg-muted">
                Ride
              </Link>
              <Link href="/driver" className="rounded-lg p-2 text-lg font-medium hover:bg-muted">
                Drive
              </Link>
              <Link href="/admin" className="rounded-lg p-2 text-lg font-medium hover:bg-muted">
                Ops
              </Link>
              <Link href="/signup">
                <Button className="mt-4 w-full">Sign up</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </nav>

      <section className="relative overflow-hidden pb-32 pt-20">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.png"
            alt="Accra city street"
            fill
            priority
            className="object-cover object-right"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/20 dark:from-background dark:via-background/86 dark:to-background/35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(241,119,6,0.18),transparent_30%),linear-gradient(90deg,rgba(255,248,240,0.82)_0%,rgba(248,249,252,0.64)_55%,rgba(242,245,251,0.2)_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(241,119,6,0.16),transparent_26%),linear-gradient(120deg,rgba(16,20,25,0.88)_0%,rgba(20,25,32,0.7)_55%,rgba(17,23,32,0.28)_100%)]" />
        </div>
        <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 [background-image:linear-gradient(rgba(17,24,39,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,0.08)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                Now live on web with passenger, driver, and ops flows
              </div>
              <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl">
                Move through your city with <span className="text-primary">confidence.</span>
              </h1>
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Africa&apos;s premium mobility platform. Book a ride, manage driver operations,
                pay with Mobile Money, and keep every trip visible through one installable web experience.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/passenger">
                  <Button size="lg" className="h-14 rounded-full px-8 text-lg shadow-xl shadow-primary/20">
                    Book a Ride
                  </Button>
                </Link>
                <Link href="/driver">
                  <Button size="lg" variant="outline" className="h-14 rounded-full border-border bg-background/50 px-8 text-lg backdrop-blur-sm">
                    Drive with Qiilu
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-br from-primary/30 to-secondary/30 opacity-50 blur-xl" />
              <div className="relative rounded-[2rem] border border-border/50 bg-card p-8 shadow-2xl">
                <h3 className="mb-6 text-2xl font-bold">Where to?</h3>
                <div className="relative mb-6 space-y-4">
                  <div className="absolute bottom-8 left-[19px] top-8 z-0 w-0.5 bg-border" />
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-background bg-muted">
                      <div className="h-3 w-3 rounded-full bg-foreground" />
                    </div>
                    <Input defaultValue="UCC Main Gate" className="h-12 border-transparent bg-muted/50 text-lg focus:bg-background" />
                  </div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-background bg-muted">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <Input placeholder="Where to?" className="h-12 border-transparent bg-muted/50 text-lg focus:bg-background" />
                  </div>
                </div>
                <Link href="/passenger">
                  <Button className="h-12 w-full rounded-xl text-lg">See Prices</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-24">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">A live product surface for every job</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              The UI set now maps to real parts of the platform instead of static mockups.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[
              { name: "Passenger booking", desc: "Live route estimates and ride creation", icon: Car },
              { name: "Driver wallet", desc: "Real balances, payouts, and trip history", icon: Wallet },
              { name: "Mobile Money", desc: "Payment flows for rider and driver", icon: CreditCard },
              { name: "Safety ops", desc: "KYC, support, and incident workflows", icon: ShieldCheck }
            ].map((item) => (
              <div key={item.name} className="group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-border/50 bg-card p-6 text-center transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted transition-transform group-hover:scale-110 group-hover:bg-primary/10">
                  <item.icon className="h-8 w-8 text-foreground transition-colors group-hover:text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="py-24">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="relative overflow-hidden rounded-[2.5rem] aspect-square lg:aspect-auto lg:h-[600px]">
              <Image
                src="/safety.png"
                alt="Safety first"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            <div className="space-y-12">
              <div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  Safety first
                </div>
                <h3 className="mt-5 text-4xl font-bold">Your safety is our priority</h3>
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                  Every live screen now supports the trust model behind Qiilu: verified drivers,
                  support incidents, trusted-contact features, and payment traces that can be reviewed by operations.
                </p>
              </div>

              {[
                {
                  title: "Verified drivers",
                  text: "Driver onboarding, KYC, and account status are part of the live platform flow.",
                  icon: ShieldCheck,
                  tone: "bg-primary/10 text-primary"
                },
                {
                  title: "Low-bandwidth support",
                  text: "Qiilu keeps a path open for web plus USSD access when mobile data is unreliable.",
                  icon: Smartphone,
                  tone: "bg-secondary/10 text-secondary"
                },
                {
                  title: "Flexible payments",
                  text: "Mobile Money and cash handling both surface through the same live booking and wallet system.",
                  icon: CreditCard,
                  tone: "bg-primary/10 text-primary"
                }
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="mb-2 text-xl font-bold">{item.title}</h4>
                    <p className="text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-border bg-card py-24">
        <div className="absolute right-0 top-0 h-full w-1/2 translate-x-32 -skew-x-12 bg-primary/5" />
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="mb-6 text-4xl font-bold md:text-5xl">Drive and earn on your own terms</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join Qiilu&apos;s driver side with wallet visibility, payout actions, trip stages,
                live request queues, and operations support built into the same web system.
              </p>
              <ul className="mb-8 space-y-4">
                {["Lower commission visibility", "Daily MoMo payout requests", "24/7 ops support", "Realtime queue updates"].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-medium text-foreground">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/20">
                      <div className="h-2 w-2 rounded-full bg-secondary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/driver">
                <Button size="lg" className="h-14 rounded-full px-8 text-lg">
                  Become a Driver <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-gradient-to-tr from-primary/20 to-transparent" />
              <Image
                src="/driver.png"
                alt="Happy Qiilu driver"
                width={1475}
                height={1475}
                className="relative w-full rounded-[2rem] object-cover shadow-2xl aspect-square md:aspect-[4/3]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-24">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <h2 className="mb-16 text-center text-3xl font-bold md:text-4xl">Loved by riders and operators alike</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                name: "Passenger flow",
                loc: "Live booking",
                text: "Real route estimates, live maps, and actual ride creation now sit underneath the UI instead of demo cards."
              },
              {
                name: "Driver flow",
                loc: "Realtime operations",
                text: "Wallets, request queues, trip history, and availability states are wired through the backend."
              },
              {
                name: "Admin flow",
                loc: "Ops visibility",
                text: "KYC review, payout handling, and support incidents are part of the same product surface."
              }
            ].map((item) => (
              <div key={item.name} className="rounded-[2rem] border border-border bg-muted/30 p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-1 text-primary">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star key={value} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="mb-8 text-lg leading-relaxed">&quot;{item.text}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold">{item.name}</h5>
                    <p className="text-sm text-muted-foreground">{item.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card pb-10 pt-20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-2">
              <div className="mb-6 flex items-center gap-2">
                <Image src="/qiilu.png" alt="Qiilu" width={120} height={36} className="h-8 w-auto" />
              </div>
              <p className="mb-6 max-w-sm text-muted-foreground">
                Africa&apos;s premium urban mobility platform. Safe, reliable, and comfortable trips with a live web system underneath.
              </p>
              <div className="flex items-center gap-4">
                {["Safety", "Support", "Status"].map((label) => (
                  <span key={label} className="flex h-10 items-center justify-center rounded-full bg-muted px-4 text-sm font-bold uppercase text-foreground">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-4 font-bold">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                <li><Link href="/driver" className="text-muted-foreground hover:text-primary">Drive</Link></li>
                <li><Link href="/passenger" className="text-muted-foreground hover:text-primary">Ride</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-bold">Products</h4>
              <ul className="space-y-3">
                <li><Link href="/passenger" className="text-muted-foreground hover:text-primary">Passenger App</Link></li>
                <li><Link href="/driver" className="text-muted-foreground hover:text-primary">Driver App</Link></li>
                <li><Link href="/admin" className="text-muted-foreground hover:text-primary">Admin Ops</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-bold">Legal</h4>
              <ul className="space-y-3">
                <li><span className="text-muted-foreground">Terms of Service</span></li>
                <li><span className="text-muted-foreground">Privacy Policy</span></li>
                <li><span className="text-muted-foreground">Cookie Policy</span></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
            <p className="text-sm text-muted-foreground">© 2026 Qiilu Mobility Ltd. All rights reserved.</p>
            <Button variant="outline" className="rounded-full">
              Ghana (EN)
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
