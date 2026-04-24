"use client";

import { useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AdminShell,
  PanelHeader,
  StatusPill,
  type Incident,
  useAdminRealtime
} from "@/components/qiilu/admin-ops";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api";

export default function AdminSafetyPage() {
  const loadIncidents = useCallback(
    () => fetchJson<{ incidents: Incident[] }>("/admin/incidents"),
    []
  );
  const { data, setData, message, setMessage } = useAdminRealtime(loadIncidents, { incidents: [] });

  const resolveIncident = async (incidentId: string, status: "INVESTIGATING" | "RESOLVED" | "CLOSED") => {
    await fetchJson(`/admin/incidents/${incidentId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ status })
    });
    const next = await loadIncidents();
    setData(next);
    setMessage(`Incident moved to ${status.toLowerCase()}.`);
  };

  const criticalCount = data.incidents.filter((item) => item.severity === "CRITICAL").length;
  const openCount = data.incidents.filter((item) => item.status === "OPEN").length;

  return (
    <AdminShell
      title="Safety Response Desk"
      subtitle="Monitor incidents, fraud flags, and emergency escalations with a dedicated view for triage and resolution."
      metrics={[
        { label: "Open cases", value: `${openCount}` },
        { label: "Critical cases", value: `${criticalCount}` },
        { label: "Total incidents", value: `${data.incidents.length}` },
        { label: "Sync status", value: message }
      ]}
      rail={
        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(249,115,22,0.10))] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Safety watch
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>This page is tuned for incident triage so the operations team can respond faster without leaving the safety context.</div>
            <div className="font-semibold text-foreground">{message}</div>
          </div>
        </div>
      }
    >
      <section className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
        <PanelHeader title="Safety incidents" meta="Escalations, fraud flags, and emergency support cases" />
        <div className="grid gap-3">
          {data.incidents.length ? data.incidents.map((incident) => (
            <div key={incident.id} className="rounded-[1.3rem] border border-border/80 bg-card/88 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-300">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold">{incident.category}</div>
                    <div className="text-sm text-muted-foreground">{incident.reporter.name} | {incident.reporter.role.toLowerCase()}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill
                    label={incident.severity}
                    tone={
                      incident.severity === "CRITICAL"
                        ? "danger"
                        : incident.severity === "HIGH"
                          ? "warning"
                          : "neutral"
                    }
                  />
                  <StatusPill
                    label={incident.status}
                    tone={
                      incident.status === "RESOLVED" || incident.status === "CLOSED"
                        ? "success"
                        : incident.status === "INVESTIGATING"
                          ? "info"
                          : "warning"
                    }
                  />
                </div>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{incident.description}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-full" onClick={() => resolveIncident(incident.id, "INVESTIGATING")}>
                  Investigate
                </Button>
                <Button className="rounded-full" onClick={() => resolveIncident(incident.id, "RESOLVED")}>
                  Resolve
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => resolveIncident(incident.id, "CLOSED")}>
                  Close
                </Button>
              </div>
            </div>
          )) : <div className="rounded-[1.3rem] border border-dashed border-border p-6 text-center text-muted-foreground">No support incidents reported.</div>}
        </div>
      </section>
    </AdminShell>
  );
}
