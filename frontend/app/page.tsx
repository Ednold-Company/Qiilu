import Link from "next/link";

const highlights = [
  "Web-first passenger booking with a real map and live API-backed ride requests",
  "Driver operations dashboard with protected wallet, request queue, and trip controls",
  "Role-based signup and login with real account creation and secure sessions"
];

export default function HomePage() {
  return (
    <main className="marketing-shell">
      <section className="hero-card">
        <div className="eyebrow">Qiilu platform</div>
        <h1>Ride hailing for the web, with real accounts and live product flows.</h1>
        <p>
          Create an account as a passenger or driver, sign in, and use the live web apps
          instead of prototype-only screens.
        </p>
        <div className="cta-row">
          <Link className="primary-link" href="/signup">
            Create account
          </Link>
          <Link className="secondary-link" href="/login">
            Sign in
          </Link>
        </div>
      </section>

      <section className="info-grid">
        {highlights.map((item) => (
          <article key={item} className="info-card">
            <span className="status-dot" />
            <p>{item}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
