"use client";

import { useCallback } from "react";
import { CarFront } from "lucide-react";
import {
  AdminShell,
  PanelHeader,
  StatusPill,
  type AdminSummaryBucket,
  useAdminRealtime
} from "@/components/qiilu/admin-ops";
import { fetchJson } from "@/lib/api";

type DispatchDriver = {
  id: string;
  name: string;
  phone: string;
  availability: string;
  kycStatus: string | null;
  lastSeenAt: string | null;
};

type DriverOpsPayload = {
  summary: {
    users: AdminSummaryBucket[];
    driversOnline: number;
  };
  dispatch: {
    drivers: DispatchDriver[];
  };
};

function getBucketCount(items: AdminSummaryBucket[], key: string) {
  return items.find((item) => item.role === key || item.status === key)?._count._all ?? 0;
}

export default function AdminDriversPage() {
  const loadDriverOps = useCallback(async (): Promise<DriverOpsPayload> => {
    const [summary, dispatch] = await Promise.all([
      fetchJson<DriverOpsPayload["summary"]>("/admin/summary"),
      fetchJson<DriverOpsPayload["dispatch"]>("/admin/dispatch")
    ]);

    return { summary, dispatch };
  }, []);

  const { data, message } = useAdminRealtime<DriverOpsPayload>(loadDriverOps, {
    summary: { users: [], driversOnline: 0 },
    dispatch: { drivers: [] }
  });

  const driverCount = getBucketCount(data.summary.users, "DRIVER");
  const availableCount = data.dispatch.drivers.filter((driver) => driver.availability === "AVAILABLE").length;
  const onTripCount = data.dispatch.drivers.filter((driver) => driver.availability === "ON_TRIP").length;
  const approvedKycCount = data.dispatch.drivers.filter((driver) => driver.kycStatus === "APPROVED").length;

  return (
    <AdminShell
      title="Driver Supply Desk"
      subtitle="Watch driver availability, KYC readiness, and last-seen freshness from one dedicated supply management view."
      metrics={[
        { label: "Total drivers", value: `${driverCount}` },
        { label: "Online now", value: `${data.summary.driversOnline}` },
        { label: "Available", value: `${availableCount}` },
        { label: "On trip", value: `${onTripCount}` }
      ]}
      rail={
        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(34,197,94,0.12),rgba(59,130,246,0.10))] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <CarFront className="h-4 w-4 text-primary" />
            Supply watch
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>Keep an eye on live supply, identify which drivers are truly ready for dispatch, and spot stale last-seen signals quickly.</div>
            <div className="font-semibold text-foreground">{message}</div>
            <div className="rounded-2xl border border-border/80 bg-background/70 p-3">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">KYC-ready supply</div>
              <div className="mt-2 text-2xl font-extrabold tracking-tight">{approvedKycCount}</div>
              <div className="text-xs text-muted-foreground">drivers already cleared for live operations</div>
            </div>
          </div>
        </div>
      }
    >
      <section className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
        <PanelHeader title="Driver availability" meta="Current supply snapshot, KYC readiness, and last-seen visibility across the network" />
        <div className="grid gap-3">
          {data.dispatch.drivers.length ? data.dispatch.drivers.map((driver) => (
            <div key={driver.id} className="rounded-[1.3rem] border border-border/80 bg-card/88 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-bold">{driver.name}</div>
                  <div className="text-sm text-muted-foreground">{driver.phone}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill
                    label={driver.availability.replaceAll("_", " ").toLowerCase()}
                    tone={
                      driver.availability === "AVAILABLE"
                        ? "success"
                        : driver.availability === "ON_TRIP"
                          ? "info"
                          : "neutral"
                    }
                  />
                  <StatusPill
                    label={driver.kycStatus ?? "pending review"}
                    tone={
                      driver.kycStatus === "APPROVED"
                        ? "success"
                        : driver.kycStatus === "REJECTED"
                          ? "danger"
                          : "warning"
                    }
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                <div className="rounded-2xl border border-border/80 bg-muted/30 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dispatch state</div>
                  <div className="mt-1 font-semibold text-foreground">{driver.availability.replaceAll("_", " ")}</div>
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/30 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Verification</div>
                  <div className="mt-1 font-semibold text-foreground">{driver.kycStatus ?? "Pending review"}</div>
                </div>
                <div className="rounded-2xl border border-border/80 bg-muted/30 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Last seen</div>
                  <div className="mt-1 font-semibold text-foreground">
                    {driver.lastSeenAt ? new Date(driver.lastSeenAt).toLocaleString() : "No signal yet"}
                  </div>
                </div>
              </div>
            </div>
          )) : <div className="rounded-[1.3rem] border border-dashed border-border p-6 text-center text-muted-foreground">No drivers tracked yet.</div>}
        </div>
      </section>
    </AdminShell>
  );
}
