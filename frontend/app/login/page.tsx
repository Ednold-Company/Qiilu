"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchJson } from "@/lib/api";
import { setSession } from "@/lib/auth-session";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"PASSENGER" | "DRIVER">("PASSENGER");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await fetchJson<{
        token: string;
        user: { id: string; name: string; phone: string; role: "PASSENGER" | "DRIVER" };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone, password, role })
      });

      setSession(session);
      router.push(role === "DRIVER" ? "/driver" : "/passenger");
    } catch {
      setError("Login failed. Check your phone number, role, and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-lockup">
          <div className="brand-mark">Qiilu</div>
          <div className="brand-sub">Sign in</div>
        </div>
        <h1>Access your account</h1>
        <p>Use the phone number and password you created during signup.</p>

        <div className="auth-role-row">
          <button type="button" className={`history-tab ${role === "PASSENGER" ? "active" : ""}`} onClick={() => setRole("PASSENGER")}>
            Passenger
          </button>
          <button type="button" className={`history-tab ${role === "DRIVER" ? "active" : ""}`} onClick={() => setRole("DRIVER")}>
            Driver
          </button>
        </div>

        <div className="auth-form">
          <label>
            <span>Phone number</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+233..." />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
          </label>
        </div>

        {error ? <div className="feedback-banner warning">{error}</div> : null}

        <button className="cta-button auth-cta" type="button" onClick={submit} disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="auth-footnote">
          Don&apos;t have an account? <Link href="/signup">Create one</Link>
        </p>
      </section>
    </main>
  );
}
