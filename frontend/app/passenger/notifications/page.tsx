"use client";

import { useEffect, useState } from "react";
import { Bell, Car, CheckCircle2, CreditCard, Gift, ShieldCheck, User } from "lucide-react";
import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import { MobileShell } from "@/components/qiilu/passenger-mobile-routes";
import { fetchJson } from "@/lib/api";

type RideItem = {
  id: string;
  status: string;
  pickup: string;
  destination: string;
  estimatedFareGhs: number;
  paymentMethod: string;
  momoProvider: string | null;
  createdAt: string;
};

type IncidentItem = {
  id: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  createdAt: string;
};

type NotificationItem = {
  id: string;
  type: "ride" | "payment" | "safety" | "system" | "promo";
  title: string;
  desc: string;
  time: string;
};

const iconMap = {
  ride: Car,
  payment: CreditCard,
  safety: ShieldCheck,
  system: User,
  promo: Gift
};

export default function PassengerNotificationsPage() {
  return (
    <PassengerGuard>
      {() => <PassengerNotificationsContent />}
    </PassengerGuard>
  );
}

function PassengerNotificationsContent() {
  const [filter, setFilter] = useState<"All" | "Rides" | "Promotions" | "Safety">("All");
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    Promise.all([
      fetchJson<{ rides: RideItem[] }>("/passenger/rides"),
      fetchJson<{ incidents: IncidentItem[] }>("/support/incidents")
    ])
      .then(([ridePayload, incidentPayload]) => {
        const rideNotifications = ridePayload.rides.slice(0, 4).map((ride) => ({
          id: `ride-${ride.id}`,
          type: ride.paymentMethod === "MOMO" ? ("payment" as const) : ("ride" as const),
          title:
            ride.status === "COMPLETED"
              ? "Trip Completed"
              : ride.status === "CANCELLED"
                ? "Ride Cancelled"
                : "Ride Update",
          desc:
            ride.status === "COMPLETED"
              ? `Trip to ${ride.destination} completed for GHS ${(ride.estimatedFareGhs).toFixed(2)}.`
              : `${ride.pickup} to ${ride.destination}`,
          time: new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
            -Math.max(1, Math.round((Date.now() - new Date(ride.createdAt).getTime()) / (1000 * 60))),
            "minute"
          )
        }));

        const safetyNotifications = incidentPayload.incidents.slice(0, 4).map((incident) => ({
          id: `incident-${incident.id}`,
          type: "safety" as const,
          title: `${incident.category}`,
          desc: `${incident.status} • ${incident.description}`,
          time: new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(incident.createdAt))
        }));

        const systemNotifications: NotificationItem[] = [
          {
            id: "system-profile",
            type: "system",
            title: "Account active",
            desc: "Qiilu profile, web app access, and realtime trip features are all ready.",
            time: "Now"
          },
          {
            id: "promo-empty",
            type: "promo",
            title: "Promotions are live-ready",
            desc: "Promo notifications will appear here when backend offers are added.",
            time: "Now"
          }
        ];

        setItems([...rideNotifications, ...safetyNotifications, ...systemNotifications]);
      })
      .catch(() => {
        setItems([
          {
            id: "system-fallback",
            type: "system",
            title: "Notifications unavailable",
            desc: "Qiilu could not load live notifications right now.",
            time: "Now"
          }
        ]);
      });
  }, []);

  const filtered = items.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Rides") return item.type === "ride" || item.type === "payment";
    if (filter === "Promotions") return item.type === "promo";
    return item.type === "safety";
  });

  return (
    <MobileShell title="Notifications" active="home">
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {(["All", "Rides", "Promotions", "Safety"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${
              filter === value ? "border-foreground bg-foreground text-background" : "border-border bg-card"
            }`}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length ? (
          filtered.map((item) => {
            const Icon = iconMap[item.type];

            return (
              <div key={item.id} className="relative flex gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h4 className="pr-4 text-sm font-bold">{item.title}</h4>
                  <p className="mb-2 mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">{item.time}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No notifications in this category yet.
          </div>
        )}
      </div>
    </MobileShell>
  );
}
