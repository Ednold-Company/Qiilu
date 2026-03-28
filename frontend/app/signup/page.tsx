"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchJson } from "@/lib/api";
import { setSession } from "@/lib/auth-session";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"PASSENGER" | "DRIVER">("PASSENGER");
  const [name, setName] = useState("");
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
      }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, phone, password, role })
      });

      setSession(session);
      router.push(role === "DRIVER" ? "/driver" : "/passenger");
    } catch {
      setError("Signup failed. Try a different phone number or complete all fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-lockup">
          <div className="brand-mark">Qiilu</div>
          <div className="brand-sub">Create account</div>
        </div>
        <h1>Join Qiilu</h1>
        <p>Create a passenger or driver account to use the live web platform.</p>

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
            <span>Full name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
          </label>
          <label>
            <span>Phone number</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+233..." />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create password" />
          </label>
        </div>

        {error ? <div className="feedback-banner warning">{error}</div> : null}

        <button className="cta-button auth-cta" type="button" onClick={submit} disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="auth-footnote">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
