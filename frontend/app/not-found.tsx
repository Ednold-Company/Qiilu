import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="marketing-shell">
      <section className="hero-card">
        <div className="eyebrow">Page not found</div>
        <h1>This route does not exist in Qiilu.</h1>
        <p>Return to the main app and continue with passenger or driver access from there.</p>
        <div className="cta-row">
          <Link className="primary-link" href="/">
            Go home
          </Link>
          <Link className="secondary-link" href="/login">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
