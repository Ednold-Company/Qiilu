"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Image from "next/image";
import {
  ArrowDownUp,
  Bell,
  Car,
  CheckCircle2,
  CreditCard,
  Home,
  Menu,
  MessageSquare,
  Navigation,
  ShieldAlert,
  User
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileInstallPrompt } from "@/components/mobile-install-prompt";

type Step = "booking" | "searching" | "riding";

type VehicleSummary = {
  label: string;
  seats: number;
  etaMinutes: number;
  priceGhs?: number;
};

type RideSummary = {
  etaMinutes: number;
  destination: string;
  paymentLabel: string;
  safetyPin: string | null;
  fareLabel: string;
  routeLabel: string;
  authorizationUrl?: string | null;
};

export function PassengerMobileExact({
  step,
  drawerOpen,
  onToggleDrawer,
  mapNode,
  showDropoffPin,
  pickup,
  destination,
  onPickupChange,
  onDestinationChange,
  onSwapRoute,
  quickDestinations,
  onQuickDestination,
  onUseLivePickup,
  selectedVehicle,
  fareLabel,
  feedback,
  paymentMethod,
  onPaymentMethodChange,
  canBook,
  onRequestRide,
  onCancelRide,
  isCancelling = false,
  initials,
  rideSummary
}: {
  step: Step;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  mapNode: ReactNode;
  showDropoffPin: boolean;
  pickup: string;
  destination: string;
  onPickupChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onSwapRoute: () => void;
  quickDestinations: string[];
  onQuickDestination: (label: string) => void;
  onUseLivePickup: () => void;
  selectedVehicle: VehicleSummary | null;
  fareLabel: string;
  feedback: string | null;
  paymentMethod: "MOMO" | "CASH";
  onPaymentMethodChange: (value: "MOMO" | "CASH") => void;
  canBook: boolean;
  onRequestRide: () => void;
  onCancelRide?: () => void;
  isCancelling?: boolean;
  initials: string;
  rideSummary: RideSummary | null;
}) {
  return (
    <div className="isolate relative h-[100svh] min-h-[100svh] w-full overflow-hidden bg-background text-foreground font-sans sm:mx-auto sm:max-w-[430px] sm:rounded-[2rem] sm:border-8 sm:border-gray-900 sm:shadow-2xl">
      <div className="absolute inset-0 bg-[#e5e3df] dark:bg-[#1a1c1e] z-0 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {mapNode}
        </div>

        {showDropoffPin ? (
          <div className="absolute top-[150px] left-[130px] z-[1100] flex flex-col items-center">
            <div className="bg-primary text-white text-xs px-2 py-1 rounded-full font-bold mb-1 shadow-lg">Dropoff</div>
            <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md" />
          </div>
        ) : null}
      </div>

      <div className="absolute top-0 left-0 w-full p-6 pt-12 z-[1100] flex justify-between items-center bg-gradient-to-b from-background/92 via-background/55 to-transparent">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onToggleDrawer} className="w-10 h-10 rounded-full bg-background/88 shadow-md backdrop-blur-sm flex items-center justify-center cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
          <div className="rounded-2xl bg-background/88 px-3 py-2 shadow-md backdrop-blur-sm">
            <Image src="/qiilu.png" alt="Qiilu" width={98} height={30} className="h-7 w-auto" priority />
          </div>
        </div>
        <div className="flex gap-2">
          <ThemeToggle className="w-10 h-10 rounded-full bg-background shadow-md flex items-center justify-center" />
          <div className="w-10 h-10 rounded-full bg-background shadow-md flex items-center justify-center relative">
            <Bell className="w-5 h-5" />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary border-2 border-background" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full z-[1100] flex flex-col justify-end pointer-events-none">
        {step === "booking" ? (
          <div className={`bg-background/82 backdrop-blur-xl rounded-t-[2rem] border-t border-border/70 shadow-[0_-10px_40px_rgba(0,0,0,0.16)] transition-transform duration-300 pointer-events-auto ${drawerOpen ? "translate-y-0" : "translate-y-[60%]"}`}>
            <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer" onClick={onToggleDrawer}>
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
            </div>

            <div className="px-6 pb-24">
              <div className="mb-4">
                <MobileInstallPrompt />
              </div>

              <h2 className="text-xl font-bold mb-4">Choose a ride</h2>

              <div className="bg-muted/50 rounded-2xl p-4 mb-6 relative">
                <div className="absolute left-6 top-[28px] bottom-[28px] w-0.5 bg-border z-0" />

                <div className="flex items-center gap-3 relative z-10 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 ring-4 ring-background" />
                  <Input value={pickup} onChange={(event) => onPickupChange(event.target.value)} placeholder="Pickup location" className="h-12 bg-background border-border/50 text-sm font-medium" />
                </div>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-foreground shrink-0 ring-4 ring-background" />
                  <Input value={destination} onChange={(event) => onDestinationChange(event.target.value)} placeholder="Where to?" className="h-12 bg-background border-border/50 text-sm font-medium" />
                </div>

                <button type="button" onClick={onSwapRoute} className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center shadow-sm z-20">
                  <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                <button type="button" onClick={onUseLivePickup} className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  Current location
                </button>
                {quickDestinations.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onQuickDestination(label)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${destination === label ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer border-primary bg-primary/5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                      <Car className="w-7 h-7 text-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground">{selectedVehicle?.label ?? "Qiilu Car"}</h4>
                        <div className="flex items-center text-xs text-muted-foreground font-medium">
                          <User className="w-3 h-3 mr-1" /> {selectedVehicle?.seats ?? 4}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {selectedVehicle ? `${selectedVehicle.etaMinutes} min away` : "Waiting for vehicle configuration"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                        <div className="font-bold text-lg">{fareLabel}</div>
                    <div className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md inline-block mt-1">Recommended</div>
                  </div>
                </div>
              </div>

              {feedback ? <div className="mb-4 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">{feedback}</div> : null}

              <div className="flex gap-4">
                <button type="button" onClick={() => onPaymentMethodChange("MOMO")} className={`flex items-center justify-center gap-2 w-1/3 h-14 rounded-2xl font-semibold border ${paymentMethod === "MOMO" ? "border-primary bg-primary/10 text-primary" : "bg-muted/50 border-border"}`}>
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span>MoMo</span>
                </button>
                <Button onClick={onRequestRide} disabled={!canBook} className="w-2/3 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/25">
                  Request {selectedVehicle?.label ?? "Qiilu Car"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {step === "searching" ? (
          <div className="bg-background/82 backdrop-blur-xl rounded-t-[2rem] border-t border-border/70 p-8 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.16)] pointer-events-auto flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-24 h-24 rounded-full border-4 border-muted border-t-primary animate-spin mb-6" />
            <h2 className="text-xl font-bold mb-2">Connecting to nearby drivers...</h2>
            <p className="text-muted-foreground text-center">Finding the closest Qiilu Car for you</p>
            {onCancelRide ? (
              <Button variant="outline" className="mt-6 rounded-2xl" onClick={onCancelRide} disabled={isCancelling}>
                {isCancelling ? "Cancelling..." : "Cancel request"}
              </Button>
            ) : null}
          </div>
        ) : null}

        {step === "riding" ? (
          <div className="bg-background/82 backdrop-blur-xl rounded-t-[2rem] border-t border-border/70 shadow-[0_-10px_40px_rgba(0,0,0,0.16)] pointer-events-auto">
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
            </div>

            <div className="px-6 pb-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-foreground">{rideSummary?.etaMinutes ?? 5} min</h2>
                  <p className="text-muted-foreground font-medium">{rideSummary?.destination || "Destination in progress"}</p>
                </div>
                <div className="px-3 py-1.5 bg-secondary/10 text-secondary font-bold rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> On Trip
                </div>
              </div>

              <div className="bg-muted/30 border border-border rounded-2xl p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5">
                    <div className="w-full h-full bg-card rounded-full border-2 border-background flex items-center justify-center text-lg font-bold">
                      {initials}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Assigned driver</h4>
                    <div className="flex items-center text-sm text-muted-foreground font-medium">
                      {rideSummary?.paymentLabel ?? "Mobile Money"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-background border border-border px-3 py-1 rounded-lg font-mono font-bold text-lg shadow-sm">
                    {rideSummary?.safetyPin ?? "Pending"}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">Qiilu Car</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <button className="flex flex-col items-center justify-center h-20 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                  <MessageSquare className="w-6 h-6 mb-1 text-primary" />
                  <span className="text-xs font-semibold">Message</span>
                </button>
                <button className="flex flex-col items-center justify-center h-20 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
                  <Navigation className="w-6 h-6 mb-1 text-primary" />
                  <span className="text-xs font-semibold">Share</span>
                </button>
                <button className="flex flex-col items-center justify-center h-20 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <ShieldAlert className="w-6 h-6 mb-1" />
                  <span className="text-xs font-semibold">SOS</span>
                </button>
              </div>

              <div className="bg-background rounded-2xl border border-border p-4">
                <div className="mb-3 font-bold">Trip details</div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Fare</span><strong>{rideSummary?.fareLabel ?? "GHS 0.00"}</strong></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Payment</span><strong>{rideSummary?.paymentLabel ?? "Mobile Money"}</strong></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Route</span><strong>{rideSummary?.routeLabel ?? "Pending route"}</strong></div>
                </div>
                {rideSummary?.authorizationUrl ? (
                  <Button variant="outline" className="mt-4 h-11 w-full rounded-xl" onClick={() => window.open(rideSummary.authorizationUrl ?? "", "_blank", "noopener,noreferrer")}>
                    Continue MoMo approval
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="absolute bottom-0 left-0 w-full h-20 border-t border-border bg-background/82 px-3 pb-4 pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl pointer-events-auto">
          <div className="grid h-full grid-cols-4 items-center">
          <Link href="/passenger" className="flex min-w-0 flex-col items-center justify-center text-center text-primary">
            <Home className="w-6 h-6 mb-1" />
            <span className="block max-w-full text-[10px] font-semibold leading-none">Home</span>
          </Link>
          <Link href="/passenger/rides" className={`flex min-w-0 flex-col items-center justify-center text-center ${step === "booking" ? "text-muted-foreground hover:text-foreground" : "text-primary"}`}>
            <Car className="w-6 h-6 mb-1" />
            <span className="block max-w-full text-[10px] font-semibold leading-none">Rides</span>
          </Link>
          <Link href="/passenger/messages" className="relative flex min-w-0 flex-col items-center justify-center text-center text-muted-foreground hover:text-foreground">
            <MessageSquare className="w-6 h-6 mb-1" />
            <div className="absolute top-0 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
            <span className="block max-w-full text-[10px] font-semibold leading-none">Messages</span>
          </Link>
          <Link href="/passenger/account" className="flex min-w-0 flex-col items-center justify-center text-center text-muted-foreground hover:text-foreground">
            <User className="w-6 h-6 mb-1" />
            <span className="block max-w-full text-[10px] font-semibold leading-none">Account</span>
          </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
