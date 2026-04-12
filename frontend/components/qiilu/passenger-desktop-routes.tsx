"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Briefcase,
  Car,
  CheckCircle2,
  CreditCard,
  Heart,
  Home,
  Building,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Search,
  ShieldCheck,
  FileText,
  Star,
  Sun,
  User,
  Wallet,
  Plus,
  MapPin,
  ArrowDownRight,
  Gift
} from "lucide-react";
import { fetchJson } from "@/lib/api";
import { clearSession, type SessionUser } from "@/lib/auth-session";
import { getSavedPlaces, removeSavedPlace, type SavedPlace } from "@/lib/passenger-favourites";
import { readImageFileAsDataUrl } from "@/lib/profile-image";
import { useTheme } from "@/lib/theme";

type RideItem = {
  id: string;
  status: string;
  pickup: string;
  destination: string;
  distanceKm: number;
  etaMinutes: number;
  estimatedFareGhs: number;
  actualFareGhs: number | null;
  paymentMethod: string;
  momoProvider: string | null;
  createdAt: string;
  driver: { id: string; name: string; phone: string } | null;
};

type IncidentItem = {
  id: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  createdAt: string;
};

type MeResponse = {
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    profileImageUrl?: string | null;
    trustedContacts?: string[];
    kycStatus?: string | null;
  };
};

type ShellProps = {
  user: SessionUser;
  title: string;
  active: "home" | "rides" | "messages" | "account";
  children: ReactNode;
};

export function PassengerDesktopShell({ user, title, active, children }: ShellProps) {
  const { isDark, ready, toggleTheme } = useTheme();
  const initials = useMemo(
    () =>
      user.name
        .split(" ")
        .map((item) => item[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user.name]
  );

  const logout = () => {
    fetchJson("/auth/logout", { method: "POST" })
      .catch(() => undefined)
      .finally(() => {
        clearSession();
        window.location.href = "/login";
      });
  };

  return (
    <div className="hidden min-h-screen bg-background text-foreground lg:flex">
      <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-border bg-card">
        <div>
          <div className="flex items-center gap-3 p-6">
            <Image src="/qiilu.png" alt="Qiilu" width={132} height={40} className="h-9 w-auto" priority />
          </div>
          <nav className="space-y-2 px-4 py-2">
            <DesktopNav href="/passenger" icon={Home} label="Home" active={active === "home"} />
            <DesktopNav href="/passenger/rides" icon={Car} label="My Rides" active={active === "rides"} />
            <DesktopNav href="/passenger/messages" icon={MessageSquare} label="Messages" active={active === "messages"} />
            <DesktopNav href="/passenger/favourites" icon={Heart} label="Favourites" active={false} />
            <DesktopNav href="/passenger/payment" icon={CreditCard} label="Payment" active={false} />
            <DesktopNav href="/passenger/safety" icon={ShieldCheck} label="Safety" active={false} />
          </nav>
        </div>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary font-bold text-white">
              {initials}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.phone}</div>
            </div>
            <button type="button" onClick={logout} className="text-xs font-bold text-primary">
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-muted/20">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-8">
          <h1 className="text-xl font-bold">{title}</h1>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-10 w-full rounded-full bg-muted/50 pl-9 pr-4 text-sm outline-none"
                placeholder="Search..."
              />
            </div>
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
              type="button"
            >
              {ready && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted">
              <Bell className="h-5 w-5 text-foreground" />
              <div className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-background bg-primary" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}

function DesktopNav({
  href,
  icon: Icon,
  label,
  active
}: {
  href: string;
  icon: typeof Home;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
        active
          ? "bg-primary/10 font-bold text-primary"
          : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}

export function PassengerRidesDesktopPage({ user }: { user: SessionUser }) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("past");
  const [rides, setRides] = useState<RideItem[]>([]);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ rides: RideItem[] }>("/passenger/rides")
      .then((payload) => {
        setRides(payload.rides);
        setSelectedRideId(payload.rides[0]?.id ?? null);
      })
      .catch(() => setRides([]));
  }, []);

  const filtered = rides.filter((ride) => {
    if (activeTab === "upcoming") return ["SEARCHING", "SCHEDULED", "ACCEPTED", "IN_PROGRESS"].includes(ride.status);
    if (activeTab === "past") return ride.status === "COMPLETED";
    return ride.status === "CANCELLED";
  });

  const selectedRide = filtered.find((ride) => ride.id === selectedRideId) ?? filtered[0] ?? null;

  return (
    <PassengerDesktopShell user={user} title="Ride History" active="rides">
      <div className="grid h-full min-h-[42rem] grid-cols-[minmax(0,1fr)_24rem] gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-y-auto p-8">
          <div className="mb-8 inline-flex rounded-xl border border-border bg-card p-1">
            {(["upcoming", "past", "cancelled"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-8 py-2 text-sm font-bold ${
                  activeTab === tab ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                type="button"
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {filtered.length ? (
              filtered.map((ride) => (
                <button
                  key={ride.id}
                  onClick={() => setSelectedRideId(ride.id)}
                  className={`rounded-2xl border-2 p-5 text-left transition-all ${
                    selectedRide?.id === ride.id
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                      : "border-border bg-card shadow-sm hover:border-foreground/20"
                  }`}
                  type="button"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded bg-lime-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-lime-500">
                        <CheckCircle2 className="h-3 w-3" /> {ride.status}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        }).format(new Date(ride.createdAt))}
                      </span>
                    </div>
                    <span className="text-lg font-bold">
                      GHS {(ride.actualFareGhs ?? ride.estimatedFareGhs).toFixed(2)}
                    </span>
                  </div>

                  <div className="mb-4 flex gap-3">
                    <div className="mt-1 flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div className="h-8 w-0.5 bg-border" />
                      <div className="h-2 w-2 rounded-full bg-foreground" />
                    </div>
                    <div>
                      <div className="mb-3 font-bold">{ride.pickup}</div>
                      <div className="font-bold text-muted-foreground">{ride.destination}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                        {ride.driver?.name?.charAt(0) ?? "Q"}
                      </div>
                      <span className="font-medium text-muted-foreground">
                        {ride.driver?.name ?? "Qiilu dispatch"}
                      </span>
                    </div>
                    <div className="rounded bg-muted px-2 py-1 text-xs font-bold">
                      {ride.paymentMethod === "MOMO" ? ride.momoProvider ?? "MoMo" : "Cash"}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-2 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                No {activeTab} rides yet.
              </div>
            )}
          </div>
        </div>

        <aside className="border-l border-border bg-card">
          <div className="h-48 bg-[#e5e3df] dark:bg-[#1a1c1e]" />
          <div className="p-6">
            <h2 className="mb-6 text-2xl font-bold">Trip Details</h2>
            {selectedRide ? (
              <div className="space-y-6">
                <div>
                  <div className="mb-3 text-sm font-bold text-muted-foreground">Route</div>
                  <div className="flex gap-4">
                    <div className="mt-1 flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                      <div className="h-10 w-0.5 bg-border" />
                      <div className="h-3 w-3 rounded-full bg-foreground ring-4 ring-foreground/10" />
                    </div>
                    <div>
                      <div className="mb-4">
                        <div className="text-base font-bold">{selectedRide.pickup}</div>
                      </div>
                      <div>
                        <div className="text-base font-bold">{selectedRide.destination}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="mb-3 text-sm font-bold text-muted-foreground">Driver</div>
                  <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted/50 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white">
                      {selectedRide.driver?.name?.charAt(0) ?? "Q"}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-bold">{selectedRide.driver?.name ?? "Qiilu dispatch"}</h4>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="mr-1 h-3 w-3 fill-current text-yellow-500" /> Car trip
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="mb-3 text-sm font-bold text-muted-foreground">Payment</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Estimated Fare</span>
                      <span className="font-medium">GHS {selectedRide.estimatedFareGhs.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Distance</span>
                      <span className="font-medium">{selectedRide.distanceKm.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="font-bold">Total Paid</span>
                      <span className="text-lg font-bold">
                        GHS {(selectedRide.actualFareGhs ?? selectedRide.estimatedFareGhs).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Select a ride to view its details.</div>
            )}
          </div>
        </aside>
      </div>
    </PassengerDesktopShell>
  );
}

export function PassengerMessagesDesktopPage({ user }: { user: SessionUser }) {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ incidents: IncidentItem[] }>("/support/incidents")
      .then((payload) => {
        setIncidents(payload.incidents);
        setActiveId(payload.incidents[0]?.id ?? null);
      })
      .catch(() => setIncidents([]));
  }, []);

  const active = incidents.find((item) => item.id === activeId) ?? null;

  return (
    <PassengerDesktopShell user={user} title="Messages" active="messages">
      <div className="grid h-full min-h-[42rem] grid-cols-[20rem_minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-r border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="h-10 w-full rounded-full bg-muted/50 pl-9 pr-4 text-sm outline-none" placeholder="Search messages..." />
            </div>
          </div>
          <div className="space-y-1 p-2">
            {incidents.length ? (
              incidents.map((incident) => (
                <button
                  key={incident.id}
                  onClick={() => setActiveId(incident.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                    activeId === incident.id ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  type="button"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary text-lg font-bold text-white">
                    {incident.category.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className={`truncate font-bold ${activeId === incident.id ? "text-primary" : ""}`}>
                        {incident.category}
                      </h3>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{incident.description}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-sm text-muted-foreground">No support threads yet.</div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col bg-background/50">
          {active ? (
            <>
              <div className="flex h-20 items-center justify-between border-b border-border bg-card px-8 shadow-sm">
                <div>
                  <h2 className="text-lg font-bold leading-tight">{active.category}</h2>
                  <div className="mt-0.5 text-xs font-bold text-primary">
                    {active.status} • {active.severity}
                  </div>
                </div>
                <div className="rounded-full border border-border bg-muted p-2">
                  <Bell className="h-5 w-5 text-foreground" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="mx-auto mb-6 w-fit rounded-full border border-border bg-card px-4 py-1.5 text-xs font-bold text-muted-foreground shadow-sm">
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }).format(new Date(active.createdAt))}
                </div>
                <div className="flex flex-col gap-6">
                  <div className="ml-auto max-w-[60%] rounded-2xl rounded-tr-sm bg-primary px-5 py-3 text-[15px] leading-relaxed text-primary-foreground shadow-md">
                    {active.description}
                  </div>
                  <div className="max-w-[60%] rounded-2xl rounded-tl-sm border border-border bg-card px-5 py-3 text-[15px] leading-relaxed text-foreground shadow-sm">
                    Qiilu support has received this report and will continue updating the incident status here.
                  </div>
                </div>
              </div>
              <div className="border-t border-border bg-card p-6">
                <div className="flex items-center gap-4 rounded-full border border-border bg-muted/50 p-2">
                  <input
                    className="h-12 flex-1 bg-transparent px-4 text-base outline-none"
                    placeholder="Type a message..."
                    disabled
                  />
                  <button className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white opacity-60" disabled type="button">
                    <MessageSquare className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="mb-4 h-16 w-16 opacity-20" />
              <h2 className="text-xl font-bold text-foreground">Your Messages</h2>
              <p>Select a conversation to start reviewing support activity</p>
            </div>
          )}
        </div>
      </div>
    </PassengerDesktopShell>
  );
}

export function PassengerAccountDesktopPage({ user }: { user: SessionUser }) {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [rides, setRides] = useState<RideItem[]>([]);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);

  useEffect(() => {
    fetchJson<MeResponse>("/auth/me")
      .then((payload) => setMe(payload.user))
      .catch(() => setMe(null));
    fetchJson<{ rides: RideItem[] }>("/passenger/rides")
      .then((payload) => setRides(payload.rides))
      .catch(() => setRides([]));
  }, []);

  const initials = user.name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const uploadProfileImage = async (file: File | null) => {
    if (!file) {
      return;
    }

    setUploadingProfileImage(true);
    setProfileMessage(null);

    try {
      const profileImageUrl = await readImageFileAsDataUrl(file);
      const payload = await fetchJson<MeResponse & { message: string }>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ profileImageUrl })
      });
      setMe(payload.user);
      setProfileMessage("Profile image updated.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not update profile image.");
    } finally {
      setUploadingProfileImage(false);
    }
  };

  return (
    <PassengerDesktopShell user={user} title="Account Settings" active="account">
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-10">
        <div className="col-span-4 space-y-6">
          <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
            <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-primary to-secondary text-5xl font-extrabold text-white shadow-lg shadow-primary/20">
              {me?.profileImageUrl ? (
                <Image src={me.profileImageUrl} alt={`${user.name} profile`} fill className="object-cover" unoptimized />
              ) : (
                initials
              )}
            </div>
            <h2 className="mb-1 text-2xl font-bold">{user.name}</h2>
            <p className="mb-4 font-medium text-muted-foreground">{user.phone}</p>
            <div className={`mb-8 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold uppercase ${
              me?.kycStatus === "APPROVED" ? "bg-secondary/10 text-secondary" : me?.kycStatus === "REJECTED" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            }`}>
              <CheckCircle2 className="h-4 w-4" /> {me?.kycStatus ?? "PENDING"}
            </div>
            <div className="mb-8">
              <label className="inline-flex cursor-pointer items-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                {uploadingProfileImage ? "Uploading..." : "Upload photo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(event) => void uploadProfileImage(event.target.files?.[0] ?? null)}
                />
              </label>
              {profileMessage ? <div className="mt-3 text-sm text-muted-foreground">{profileMessage}</div> : null}
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
              <div>
                <div className="mb-1 text-3xl font-extrabold">{rides.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Trips</div>
              </div>
              <div>
                <div className="mb-1 text-3xl font-extrabold">{me?.trustedContacts?.length ?? 0}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Trusted Contacts</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-8">
          <div className="rounded-[2rem] border border-border bg-card p-10 shadow-sm">
            <h3 className="mb-8 text-2xl font-bold">Personal Information</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Field label="First Name" value={user.name.split(" ")[0] ?? user.name} />
                <Field label="Last Name" value={user.name.split(" ").slice(1).join(" ") || "Not set"} />
              </div>
              <Field label="Phone Number" value={user.phone} />
              <Field label="Email Address" value={me?.email ?? "Not set"} />
              <div className="grid grid-cols-2 gap-6">
                <Field label="Preferred Payment" value="Mobile Money" />
                <Field label="Trusted Contacts" value={String(me?.trustedContacts?.length ?? 0)} />
              </div>
              <div className="pt-2">
                <Link href="/passenger/kyc/desktop" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
                  <FileText className="h-4 w-4" />
                  Open KYC workflow
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PassengerDesktopShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-muted-foreground">{label}</label>
      <div className="flex h-12 items-center rounded-xl bg-muted/50 px-4 text-base">{value}</div>
    </div>
  );
}

export function PassengerFavouritesDesktopPage({ user }: { user: SessionUser }) {
  const [activeTab, setActiveTab] = useState<"places" | "drivers">("places");
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);

  useEffect(() => {
    setSavedPlaces(getSavedPlaces());
  }, []);

  const placeCards = savedPlaces.map((place) => {
    const icon = place.kind === "pickup" ? Home : MapPin;
    const iconColor = place.kind === "pickup" ? "text-blue-500" : "text-lime-500";
    const iconBg = place.kind === "pickup" ? "bg-blue-500/10" : "bg-lime-500/10";
    const shortName = place.kind === "pickup" ? "Saved pickup" : "Saved destination";
    return { ...place, icon, iconColor, iconBg, shortName };
  });

  return (
    <PassengerDesktopShell user={user} title="Favourites" active="account">
      <div className="flex items-center justify-between mb-8">
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setActiveTab("places")}
            className={`rounded-lg px-8 py-2.5 text-sm font-bold ${
              activeTab === "places" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
            type="button"
          >
            Saved Places
          </button>
          <button
            onClick={() => setActiveTab("drivers")}
            className={`rounded-lg px-8 py-2.5 text-sm font-bold ${
              activeTab === "drivers" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
            type="button"
          >
            Favourite Drivers
          </button>
        </div>

        <button
          type="button"
          className="inline-flex h-12 items-center rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-md"
          onClick={() => window.location.assign("/passenger")}
        >
          <Plus className="mr-2 h-5 w-5" />
          {activeTab === "places" ? "Add New Place" : "Book a Driver"}
        </button>
      </div>

      {activeTab === "places" ? (
        placeCards.length ? (
          <div className="grid grid-cols-3 gap-6 xl:grid-cols-4">
            {placeCards.map((place) => (
              <div key={place.id} className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <button
                  type="button"
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                  onClick={() => setSavedPlaces(removeSavedPlace(place.id))}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${place.iconBg}`}>
                  <place.icon className={`h-8 w-8 ${place.iconColor}`} />
                </div>
                <h3 className="mb-1 text-lg font-bold">{place.label}</h3>
                <p className="mb-8 flex-1 text-sm text-muted-foreground">{place.shortName}</p>
                <button
                  type="button"
                  className="w-full rounded-xl border border-transparent bg-muted px-4 py-3 font-bold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  onClick={() => window.location.assign("/passenger")}
                >
                  Book Ride Here
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No saved places yet. Save a pickup or destination from the booking flow to see it here.
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          Favourite drivers are not persisted in the live backend yet, so Qiilu is keeping this screen honest for now.
        </div>
      )}
    </PassengerDesktopShell>
  );
}

export function PassengerPaymentsDesktopPage({ user }: { user: SessionUser }) {
  const [rides, setRides] = useState<RideItem[]>([]);

  useEffect(() => {
    fetchJson<{ rides: RideItem[] }>("/passenger/rides")
      .then((payload) => setRides(payload.rides))
      .catch(() => setRides([]));
  }, []);

  const completed = rides.filter((ride) => ride.status === "COMPLETED");
  const walletBalance = completed.reduce((total, ride) => total + (ride.actualFareGhs ?? ride.estimatedFareGhs), 0);

  return (
    <PassengerDesktopShell user={user} title="Wallet & Payments" active="account">
      <div className="mb-8 flex items-center justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-orange-600 p-10 text-white shadow-xl shadow-primary/20">
        <div>
          <div className="mb-2 flex items-center gap-2 text-lg font-medium text-white/80">
            <Wallet className="h-5 w-5" /> Current Balance
          </div>
          <div className="text-6xl font-extrabold tracking-tight">
            <span className="mr-2 text-3xl opacity-80">GHS</span>
            {walletBalance.toFixed(2)}
          </div>
        </div>
        <div className="flex gap-4">
          <button type="button" className="h-14 rounded-xl bg-white px-8 text-lg font-bold text-primary">
            <ArrowDownRight className="mr-2 inline h-5 w-5" /> Top Up
          </button>
          <button type="button" className="h-14 rounded-xl bg-white/20 px-8 text-lg font-bold text-white">
            <CreditCard className="mr-2 inline h-5 w-5" /> Cash
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-5 space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-6 text-xl font-bold">Payment Methods</h3>
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl border-2 border-primary bg-primary/5 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">Mobile Money</h4>
                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                  </div>
                </div>
                <div className="rounded bg-primary/20 px-3 py-1.5 text-xs font-bold uppercase text-primary">Primary</div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-border p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Wallet className="h-6 w-6" />
                </div>
                <h4 className="flex-1 text-lg font-bold">Cash</h4>
              </div>
            </div>
            <button
              type="button"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border font-bold text-muted-foreground"
            >
              <Plus className="h-5 w-5" /> Add New Method
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-bold">Promotions</h3>
            <div className="mb-6 flex gap-3">
              <input
                placeholder="Enter promo code"
                className="h-12 flex-1 rounded-xl border-none bg-muted px-4 text-base outline-none"
              />
              <button type="button" className="h-12 rounded-xl bg-primary px-8 font-bold text-primary-foreground shadow-md">
                Apply
              </button>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-secondary/20 bg-secondary/10 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20 text-secondary">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold text-secondary">Promo support ready</div>
                <div className="mt-0.5 text-sm font-medium text-secondary/80">
                  Apply a live Qiilu discount code during checkout when one is available.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-7">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">Recent Transactions</h3>
            </div>
            <div className="space-y-2">
              {completed.length ? (
                completed.slice(0, 8).map((ride) => (
                  <div key={ride.id} className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Car className="h-6 w-6 text-foreground" />
                      </div>
                      <div>
                        <div className="font-bold text-base">{ride.destination}</div>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          {new Intl.DateTimeFormat("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          }).format(new Date(ride.createdAt))}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold">
                      - GHS {(ride.actualFareGhs ?? ride.estimatedFareGhs).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                  No live transactions yet. Completed rides will appear here automatically.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PassengerDesktopShell>
  );
}
