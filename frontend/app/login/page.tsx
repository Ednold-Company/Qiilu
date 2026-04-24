"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Moon,
  Phone,
  Star,
  Sun
} from "lucide-react";
import { MobileInstallPrompt } from "@/components/mobile-install-prompt";
import { fetchJson } from "@/lib/api";
import { setSession } from "@/lib/auth-session";
import { useTheme } from "@/lib/theme";

type LoginRole = "PASSENGER" | "DRIVER" | "ADMIN";
type SessionResponse = {
  token: string;
  user: { id: string; name: string; phone: string; role: "ADMIN" | "PASSENGER" | "DRIVER" };
};

export default function LoginPage() {
  const router = useRouter();
  const { isDark, toggleTheme, ready } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<LoginRole>("PASSENGER");
  const [error, setError] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setAdminMode(params.get("admin") === "1");
    }
  }, []);

  useEffect(() => {
    if (adminMode) {
      setActiveRole("ADMIN");
    } else if (activeRole === "ADMIN") {
      setActiveRole("PASSENGER");
    }
  }, [activeRole, adminMode]);

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await fetchJson<SessionResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          phone,
          password,
          role: activeRole
        })
      });

      setSession(session);
      router.push(
        session.user.role === "ADMIN"
          ? "/admin"
          : session.user.role === "DRIVER"
            ? "/driver"
            : "/passenger"
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const themeButton = ready && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;

  return (
    <>
      <div className="hidden h-screen w-full overflow-hidden bg-background text-foreground lg:flex">
        <div className="relative flex h-full w-[580px] shrink-0 flex-col overflow-hidden bg-gray-950">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(249,115,22,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.4) 1px, transparent 1px)",
              backgroundSize: "48px 48px"
            }}
          />
          <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 h-48 w-48 rounded-full bg-lime-500/15 blur-2xl" />

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 580 800" fill="none">
            <path
              d="M120 620 C120 620 180 500 260 420 C340 340 380 280 400 180"
              stroke="#f97316"
              strokeWidth="3"
              strokeDasharray="8 4"
              opacity="0.7"
            />
            <circle cx="120" cy="620" r="8" fill="#f97316" />
            <circle cx="120" cy="620" r="16" fill="#f97316" opacity="0.25" />
            <circle cx="400" cy="180" r="8" fill="#84cc16" />
            <circle cx="400" cy="180" r="16" fill="#84cc16" opacity="0.25" />
            <circle cx="270" cy="405" r="10" fill="white" />
            <circle cx="270" cy="405" r="20" fill="white" opacity="0.15" />
          </svg>

          <div className="absolute left-[135px] top-[600px]">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-orange-400" />
              Pickup point
            </div>
          </div>

          <div className="absolute left-[300px] top-[158px]">
            <div className="flex items-center gap-1.5 rounded-lg border border-lime-500/30 bg-lime-500/20 px-3 py-1.5 text-xs font-semibold text-lime-300 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-lime-400" />
              Destination
            </div>
          </div>

          <div className="absolute left-[180px] top-[360px]">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                Q
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white">Verified driver</p>
                <div className="flex items-center gap-1">
                  <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-[10px] text-white/70">Safety checked</span>
                </div>
              </div>
              <div className="ml-1 text-[10px] font-bold text-lime-400">Live</div>
            </div>
          </div>

          <div className="relative z-10 p-8">
            <div className="flex items-center gap-2.5">
              <Image src="/qiilu.png" alt="Qiilu" width={138} height={42} className="h-10 w-auto" priority />
            </div>
          </div>

          <div className="relative z-10 mt-auto p-8">
            <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-white">
              Move through
              <br />
              your city with
              <br />
              <span className="text-orange-400">confidence.</span>
            </h2>
            <p className="max-w-xs text-sm leading-relaxed text-white/60">
              Ghana&apos;s premium mobility platform. Safe rides, fair fares, always on time.
            </p>

            <div className="mt-6 flex gap-6">
              <div>
                <p className="text-xl font-bold text-white">Live</p>
                <p className="text-xs text-white/50">Dispatch</p>
              </div>
              <div className="w-px bg-white/15" />
              <div>
                <p className="text-xl font-bold text-white">MoMo</p>
                <p className="text-xs text-white/50">Ready</p>
              </div>
              <div className="w-px bg-white/15" />
              <div>
                <p className="text-xl font-bold text-white">USSD</p>
                <p className="text-xs text-white/50">Fallback</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-10 py-6 shrink-0">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link className="font-semibold text-orange-500 hover:underline" href="/signup">
                Sign up
              </Link>
            </p>
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
              type="button"
            >
              {themeButton}
            </button>
          </div>

          <div className="flex flex-1 flex-col justify-center px-16 pb-8">
            <div className="mx-auto w-full max-w-sm">
              <h1 className="mb-1 text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="mb-8 text-sm text-muted-foreground">Sign in to continue your journey</p>

              <div className="mb-7 flex gap-1 rounded-xl bg-muted p-1">
                <button
                  onClick={() => setActiveRole("PASSENGER")}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeRole === "PASSENGER"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  type="button"
                >
                  Passenger
                </button>
                <button
                  onClick={() => setActiveRole("DRIVER")}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeRole === "DRIVER"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  type="button"
                >
                  Driver Partner
                </button>
                {adminMode ? (
                  <button
                    onClick={() => setActiveRole("ADMIN")}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                      activeRole === "ADMIN"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    type="button"
                  >
                    Admin
                  </button>
                ) : null}
              </div>

              <AuthField label="Phone Number">
                <div className="flex h-12 items-center gap-3 rounded-xl border border-transparent bg-muted px-4 transition-colors focus-within:border-orange-500">
                  <div className="flex shrink-0 items-center gap-1.5 border-r border-border pr-3">
                    <span className="text-base">GH</span>
                    <span className="text-sm font-semibold text-muted-foreground">+233</span>
                  </div>
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Phone number"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                </div>
              </AuthField>

              <AuthField label="Password">
                <div className="flex h-12 items-center gap-3 rounded-xl border border-transparent bg-muted px-4 transition-colors focus-within:border-orange-500">
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                  <button
                    onClick={() => setShowPassword((value) => !value)}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                    type="button"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </AuthField>

              <div className="mb-6 flex justify-end">
                <button className="text-sm font-semibold text-orange-500 hover:underline" type="button">
                  Forgot password?
                </button>
              </div>

              {error ? <MessageBox>{error}</MessageBox> : null}

              <button
                onClick={submit}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition-all duration-200 hover:bg-orange-600 active:scale-[0.99]"
                type="button"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    {activeRole === "ADMIN" ? "Sign In to Admin" : "Sign In"} <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <button
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted text-sm font-semibold transition-colors hover:bg-muted/80"
                type="button"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-black text-yellow-900">
                  M
                </div>
                Continue with MoMo
              </button>

              <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
                By signing in you agree to Qiilu&apos;s{" "}
                <span className="cursor-pointer text-orange-500 hover:underline">Terms of Service</span> and{" "}
                <span className="cursor-pointer text-orange-500 hover:underline">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto min-h-screen max-w-[390px] bg-background text-foreground lg:hidden">
        <div className="flex items-center justify-between px-5 py-3 pt-8">
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"
            type="button"
          >
            {themeButton}
          </button>
        </div>

        <div className="px-6 pb-6 pt-2">
          <div className="mb-6 flex items-center gap-2">
            <Image src="/qiilu.png" alt="Qiilu" width={132} height={40} className="h-9 w-auto" priority />
          </div>

          <div className="mb-5 rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {adminMode ? "Administrative access" : "Passenger and driver access"}
            </div>
            <div className="text-xl font-bold">{adminMode ? "Admin sign-in for Qiilu operations." : "Sign in and continue from where you stopped."}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {adminMode ? "Restricted access for operations, KYC review, payouts, and incident handling." : "Live rides, payouts, safety tools, and web-first mobility in one app shell."}
            </div>
          </div>

          <div className="mb-5">
            <MobileInstallPrompt />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your journey</p>

          <div className="mb-5 mt-5 flex gap-1 rounded-xl bg-muted p-1">
            <button
              onClick={() => setActiveRole("PASSENGER")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200 ${
                activeRole === "PASSENGER" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
              type="button"
            >
              Passenger
            </button>
            <button
              onClick={() => setActiveRole("DRIVER")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200 ${
                activeRole === "DRIVER" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
              type="button"
            >
              Driver
            </button>
            {adminMode ? (
              <button
                onClick={() => setActiveRole("ADMIN")}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200 ${
                  activeRole === "ADMIN" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
                type="button"
              >
                Admin
              </button>
            ) : null}
          </div>

          <AuthField label="Phone Number">
            <div className="flex h-13 items-center gap-3 rounded-xl border border-transparent bg-muted px-4 transition-colors focus-within:border-orange-500">
              <div className="flex shrink-0 items-center gap-1.5 border-r border-border pr-3">
                <span className="text-sm font-semibold text-muted-foreground">+233</span>
              </div>
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </AuthField>

          <AuthField label="Password">
            <div className="flex h-13 items-center gap-3 rounded-xl border border-transparent bg-muted px-4 transition-colors focus-within:border-orange-500">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
              <button onClick={() => setShowPassword((value) => !value)} type="button">
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </AuthField>

          <div className="mb-4 flex justify-end">
            <button className="text-sm font-semibold text-orange-500" type="button">
              Forgot password?
            </button>
          </div>

          {error ? <MessageBox>{error}</MessageBox> : null}

          <button
            onClick={submit}
            className="mt-1 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-base font-bold text-white transition-all duration-200 hover:bg-orange-600 active:scale-[0.98]"
            type="button"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                {activeRole === "ADMIN" ? "Sign In to Admin" : "Sign In"} <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted text-sm font-semibold transition-colors hover:bg-muted/80"
            type="button"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-black text-yellow-900">
              M
            </div>
            Sign in with MoMo
          </button>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-bold text-orange-500">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function AuthField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function MessageBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
      {children}
    </div>
  );
}
