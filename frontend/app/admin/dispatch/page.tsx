"use client";

import { useCallback } from "react";
import { MapPinned } from "lucide-react";
import {
  AdminShell,
  PanelHeader,
  StatusPill,
  type DispatchRide,
  useAdminRealtime
} from "@/components/qiilu/admin-ops";
import { fetchJson } from "@/lib/api";

export default function AdminDispatchPage() {
  const loadDispatch = useCallback(
    () => fetchJson<{ liveRides: DispatchRide[] }>("/admin/dispatch"),
    []
  );
  const { data, message } = useAdminRealtime(loadDispatch, { liveRides: [] });
  const searching = data.liveRides.filter((ride) => ride.status === "SEARCHING").length;
  const assigned = data.liveRides.filter((ride) => ride.driver).length;

  return (
    <AdminShell
      title="Dispatch Command"
      subtitle="Follow live ride demand, assignment state, and request source without the rest of the admin queue getting in the way."
      metrics={[
        { label: "Live rides", value: `${data.liveRides.length}` },
        { label: "Searching", value: `${searching}` },
        { label: "Assigned", value: `${assigned}` },
        { label: "Sync status", value: message }
      ]}
      rail={
        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(249,115,22,0.14),rgba(59,130,246,0.10))] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <MapPinned className="h-4 w-4 text-primary" />
            Dispatch watch
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>Track rides that are still searching, confirm assignment flow, and watch for demand spikes in real time.</div>
            <div className="font-semibold text-foreground">{message}</div>
          </div>
        </div>
      }
    >
      <section className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
        <PanelHeader title="Live dispatch feed" meta="Rides currently searching, assigned, or in active motion across the network" />
        <div className="grid gap-3">
          {data.liveRides.length ? data.liveRides.map((ride) => (
            <div key={ride.id} className="rounded-[1.3rem] border border-border/80 bg-card/88 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {ride.requestSource}
                  </span>
                  <StatusPill
                    label={ride.status.replaceAll("_", " ")}
                    tone={
                      ride.status === "IN_PROGRESS"
                        ? "success"
                        : ride.status === "SEARCHING"
                          ? "warning"
                          : ride.status === "CANCELLED"
                            ? "danger"
                            : "info"
                    }
                  />
                </div>
                <strong className="text-lg">GHS {ride.estimatedFareGhs.toFixed(2)}</strong>
              </div>
              <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="font-bold">{ride.pickup} to {ride.destination}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Passenger: {ride.passenger.name} | {ride.passenger.phone}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground md:text-right">
                  Driver: {ride.driver?.name ?? "Unassigned"}
                </div>
              </div>
            </div>
          )) : <div className="rounded-[1.3rem] border border-dashed border-border p-6 text-center text-muted-foreground">No active rides in dispatch right now.</div>}
        </div>
      </section>
    </AdminShell>
  );
}
