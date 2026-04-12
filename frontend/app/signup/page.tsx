"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bike, Car, Check, ChevronRight, Eye, EyeOff, Lock, Mail, Moon, Phone, Sun, User } from "lucide-react";
import { MobileInstallPrompt } from "@/components/mobile-install-prompt";
import { fetchJson } from "@/lib/api";
import { setSession } from "@/lib/auth-session";
import { useTheme } from "@/lib/theme";

type SignupRole = "PASSENGER" | "DRIVER";
type Step = 1 | 2 | 3;
type SessionResponse = {
  token: string;
  user: { id: string; name: string; phone: string; email?: string | null; role: "ADMIN" | "PASSENGER" | "DRIVER" };
};

export default function SignupPage() {
  const router = useRouter();
  const { isDark, toggleTheme, ready } = useTheme();
  const [step, setStep] = useState<Step>(1);
  const [activeRole, setActiveRole] = useState<SignupRole>("PASSENGER");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;
  const otpDigits = Array.from({ length: 6 }, (_, index) => otpValue[index] ?? "");
  const themeIcon = ready && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;
  const conflictHint = getConflictHint(error);

  useEffect(() => {
    if (step !== 2) {
      return;
    }

    const handle = window.setTimeout(() => {
      otpInputRef.current?.focus();
      otpInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(handle);
  }, [step]);

  function resolveSignupValues() {
    const resolvedName = (nameInputRef.current?.value ?? name).trim();
    const resolvedPhone = (phoneInputRef.current?.value ?? phone).trim();
    const resolvedEmail = (emailInputRef.current?.value ?? email).trim().toLowerCase();
    const resolvedPassword = (passwordInputRef.current?.value ?? password).trim();

    setName(resolvedName);
    setPhone(resolvedPhone);
    setEmail(resolvedEmail);
    setPassword(resolvedPassword);

    return {
      resolvedName,
      resolvedPhone,
      resolvedEmail,
      resolvedPassword
    };
  }

  async function requestOtp() {
    const { resolvedName, resolvedPhone, resolvedEmail, resolvedPassword } = resolveSignupValues();
    if (!resolvedName || !resolvedPhone || !resolvedEmail || !resolvedPassword) {
      setError("Name, phone, email, and password are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setNote(null);
    try {
      const result = await fetchJson<{ expiresAt: string }>("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({
          email: resolvedEmail,
          phone: resolvedPhone,
          role: activeRole,
          purpose: "SIGNUP"
        })
      });
      setNote(`Code sent to ${resolvedEmail}. It expires at ${new Date(result.expiresAt).toLocaleTimeString()}.`);
      setStep(2);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not send verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    const { resolvedName, resolvedPhone, resolvedEmail, resolvedPassword } = resolveSignupValues();
    setLoading(true);
    setError(null);
    try {
      const session = await fetchJson<SessionResponse>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          email: resolvedEmail,
          phone: resolvedPhone,
          role: activeRole,
          code: otpValue,
          purpose: "SIGNUP",
          name: resolvedName,
          password: resolvedPassword
        })
      });
      setSession(session);
      setStep(3);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  function goToApp() {
    router.push(activeRole === "DRIVER" ? "/driver" : "/passenger");
  }

  function handleOtpChange(rawValue: string) {
    setOtpValue(rawValue.replace(/\D/g, "").slice(0, 6));
  }

  function handleOtpKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOtpValue("");
    }
  }

  function focusOtpInput() {
    otpInputRef.current?.focus();
    otpInputRef.current?.select();
  }

  return (
    <>
      <div className="hidden h-screen w-full overflow-hidden bg-background text-foreground lg:flex">
        <aside className="relative flex h-full w-[500px] shrink-0 flex-col overflow-hidden bg-gray-950">
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(249,115,22,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.5)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="absolute bottom-24 right-8 h-40 w-40 rounded-full bg-lime-500/10 blur-2xl" />
          <div className="relative z-10 p-8">
            <div className="flex items-center gap-2.5">
              <Image src="/qiilu.png" alt="Qiilu" width={138} height={42} className="h-10 w-auto" priority />
            </div>
          </div>
          <div className="relative z-10 flex flex-1 flex-col justify-center px-8">
            <h2 className="mb-8 text-2xl font-bold leading-tight text-white">
              Join thousands of
              <br />
              <span className="text-orange-400">Ghanaians</span> on
              <br />
              the road.
            </h2>
            <div className="flex flex-col gap-5">
              {[
                { num: 1, label: "Create your account", sub: "Name, phone, email & password" },
                { num: 2, label: "Verify your email", sub: "Quick OTP confirmation" },
                { num: 3, label: "Start riding", sub: "Book your first trip" }
              ].map((item) => (
                <div key={item.num} className="flex items-start gap-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step > item.num ? "bg-lime-500 text-white" : step === item.num ? "bg-orange-500 text-white ring-4 ring-orange-500/30" : "bg-white/10 text-white/40"}`}>
                    {step > item.num ? <Check className="h-4 w-4" /> : item.num}
                  </div>
                  <div className={step >= item.num ? "opacity-100" : "opacity-40"}>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-0.5 text-xs text-white/50">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 px-8 pb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">Available on Qiilu</p>
            <div className="flex gap-3">
              {[
                { icon: Car, label: "Car" },
                { icon: Bike, label: "Motor" },
                { icon: Car, label: "Tricycle" },
                { icon: Car, label: "Mini Van" }
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/8">
                    <Icon className="h-5 w-5 text-white/60" />
                  </div>
                  <span className="text-[10px] text-white/40">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-10 py-5">
            <div className="flex items-center gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${step > item ? "bg-lime-500 text-white" : step === item ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"}`}>
                      {step > item ? <Check className="h-3 w-3" /> : item}
                    </div>
                    <span className={`text-xs font-semibold ${step === item ? "text-foreground" : "text-muted-foreground"}`}>{item === 1 ? "Details" : item === 2 ? "Verify" : "Done"}</span>
                  </div>
                  {item < 3 ? <div className={`h-px w-12 ${step > item ? "bg-lime-500" : "bg-border"}`} /> : null}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Have an account? <Link href="/login" className="font-semibold text-orange-500 hover:underline">Sign in</Link></span>
              <button onClick={toggleTheme} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted" type="button">{ready && isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-10 py-8">
            <div className="mx-auto max-w-md">
              {step === 1 ? (
                <>
                  <h1 className="mb-1 text-2xl font-bold tracking-tight">Create your account</h1>
                  <p className="mb-7 text-sm text-muted-foreground">Join Qiilu and ride smarter across Ghana</p>
                  <RoleSwitch activeRole={activeRole} onChange={setActiveRole} />
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <Field label="Full Name"><InputShell icon={<User className="h-4 w-4 text-muted-foreground" />}><input ref={nameInputRef} name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onInput={(e) => setName((e.target as HTMLInputElement).value)} placeholder="Enter your full name" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" /></InputShell></Field>
                    <Field label="Phone Number"><InputShell icon={<Phone className="h-3.5 w-3.5 text-muted-foreground" />} prefix={<span className="text-xs font-semibold text-muted-foreground">+233</span>}><input ref={phoneInputRef} name="tel" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} onInput={(e) => setPhone((e.target as HTMLInputElement).value)} placeholder="Phone number" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" /></InputShell></Field>
                  </div>
                  <Field label="Email Address"><InputShell icon={<Mail className="h-4 w-4 text-muted-foreground" />}><input ref={emailInputRef} name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} placeholder="kofi@email.com" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" /></InputShell></Field>
                  <Field label="Password">
                    <InputShell icon={<Lock className="h-4 w-4 text-muted-foreground" />} end={<button onClick={() => setShowPassword((v) => !v)} type="button">{showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}</button>}>
                      <input ref={passwordInputRef} name="new-password" autoComplete="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} placeholder="Create a strong password" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
                    </InputShell>
                    {password ? <PasswordMeter strength={strength} /> : null}
                  </Field>
                  <label className="mb-6 flex cursor-pointer items-center gap-3">
                    <button onClick={() => setAgreed((v) => !v)} className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${agreed ? "border-orange-500 bg-orange-500" : "border-border"}`} type="button">{agreed ? <Check className="h-3 w-3 text-white" /> : null}</button>
                    <span className="text-sm text-muted-foreground">I agree to Qiilu&apos;s <span className="cursor-pointer font-medium text-orange-500 hover:underline">Terms of Service</span> and <span className="cursor-pointer font-medium text-orange-500 hover:underline">Privacy Policy</span></span>
                  </label>
                  {error ? <Message tone="error">{error}</Message> : null}
                  {conflictHint ? <ConflictCallout hint={conflictHint} /> : null}
                  <button onClick={requestOtp} disabled={loading || !name.trim() || !phone.trim() || !email.trim() || !password.trim() || !agreed} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60" type="button">{loading ? <Spinner /> : <>Continue <ChevronRight className="h-4 w-4" /></>}</button>
                </>
              ) : null}

              {step === 2 ? (
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/10"><Mail className="h-9 w-9 text-orange-500" /></div>
                  <h1 className="mb-2 text-2xl font-bold tracking-tight">Verify your email</h1>
                  <p className="mb-8 text-sm text-muted-foreground">We sent a 6-digit code to <span className="font-semibold text-foreground">{email || "your email"}</span></p>
                  <OtpInput
                    value={otpValue}
                    digits={otpDigits}
                    inputRef={otpInputRef}
                    onChange={handleOtpChange}
                    onKeyDown={handleOtpKeyDown}
                    onFocusRequest={focusOtpInput}
                    size="desktop"
                  />
                  {note ? <Message tone="neutral">{note}</Message> : null}
                  {error ? <Message tone="error">{error}</Message> : null}
                  <div className="mb-6 flex w-full items-center justify-between rounded-2xl bg-muted px-5 py-3"><span className="text-sm text-muted-foreground">Verification status</span><span className="text-sm font-bold text-orange-500">Awaiting code</span></div>
                  <button onClick={verifyOtp} disabled={loading || otpValue.length !== 6} className="mb-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60" type="button">{loading ? <Spinner /> : <>Verify &amp; Continue <ChevronRight className="h-4 w-4" /></>}</button>
                  <button onClick={requestOtp} className="text-sm text-muted-foreground" disabled={loading} type="button">Didn&apos;t receive it? <span className="font-semibold text-orange-500 hover:underline">Resend code</span></button>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="relative mb-6">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-lime-500/15"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-500 shadow-xl shadow-lime-500/30"><Check className="h-8 w-8 text-white" strokeWidth={3} /></div></div>
                    <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 shadow-lg"><span className="text-sm font-black text-white">Q</span></div>
                  </div>
                  <h1 className="mb-2 text-2xl font-bold tracking-tight">You&apos;re all set!</h1>
                  <p className="mb-8 text-sm leading-relaxed text-muted-foreground">Welcome to Qiilu{name ? `, ${name}` : ""}.<br />Your account has been created successfully.</p>
                  <div className="mb-5 w-full rounded-2xl bg-muted p-5 text-left">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account summary</p>
                    <SummaryRow label="Account type" value={activeRole === "DRIVER" ? "driver" : "passenger"} />
                    <SummaryRow label="Phone" value={phone ? `+233 ${phone}` : "Provided at signup"} />
                    <SummaryRow label="KYC Status" value={<span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-500">Pending</span>} />
                    <SummaryRow label="Status" value={<span className="text-sm font-bold text-lime-600">Ready to continue</span>} border={false} />
                  </div>
                  <button onClick={goToApp} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition-all hover:bg-orange-600" type="button">{activeRole === "DRIVER" ? "Go to Driver Dashboard" : "Start Riding"} <ChevronRight className="h-4 w-4" /></button>
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>

      <div className="mx-auto min-h-screen max-w-[390px] bg-background text-foreground lg:hidden">
        <div className="flex items-center justify-between px-5 py-3 pt-8">
          <button onClick={() => setStep((current) => current > 1 ? ((current - 1) as Step) : current)} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted" type="button"><ArrowLeft className="h-4 w-4" /></button>
          <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted" type="button">{themeIcon}</button>
        </div>
        <div className="mb-4 px-6"><ProgressMobile step={step} /></div>
        <div className="px-6">
          <div className="mb-5 flex items-center gap-2">
            <Image src="/qiilu.png" alt="Qiilu" width={132} height={40} className="h-9 w-auto" priority />
          </div>
          <div className="mb-5 rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Join Qiilu</div>
            <div className="text-xl font-bold">Create your account and start moving smarter.</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Sign up once, verify your email, and use the same installable web app for booking or driving.
            </div>
          </div>
          <div className="mb-5">
            <MobileInstallPrompt />
          </div>
        </div>

        {step === 1 ? (
          <div className="flex flex-col gap-4 px-6 pb-6">
            <div><h1 className="text-2xl font-bold tracking-tight">Create account</h1><p className="mt-0.5 text-sm text-muted-foreground">Join Qiilu and ride smarter</p></div>
            <RoleSwitch activeRole={activeRole} onChange={setActiveRole} compact />
            <Field label="Full Name"><InputShell icon={<User className="h-4 w-4 text-muted-foreground" />}><input ref={nameInputRef} name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onInput={(e) => setName((e.target as HTMLInputElement).value)} placeholder="Enter your full name" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" /></InputShell></Field>
            <Field label="Phone Number"><InputShell icon={<Phone className="h-4 w-4 text-muted-foreground" />} prefix={<span className="text-sm font-semibold text-muted-foreground">+233</span>}><input ref={phoneInputRef} name="tel" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} onInput={(e) => setPhone((e.target as HTMLInputElement).value)} placeholder="Phone number" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" /></InputShell></Field>
            <Field label="Email"><InputShell icon={<Mail className="h-4 w-4 text-muted-foreground" />}><input ref={emailInputRef} name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} placeholder="kofi@email.com" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" /></InputShell></Field>
            <Field label="Password"><InputShell icon={<Lock className="h-4 w-4 text-muted-foreground" />} end={<button onClick={() => setShowPassword((v) => !v)} type="button">{showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}</button>}><input ref={passwordInputRef} name="new-password" autoComplete="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} placeholder="Create a strong password" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" /></InputShell><div className="mt-2 flex gap-1">{[1,2,3,4].map((bar) => <div key={bar} className={`h-1 flex-1 rounded-full ${bar <= Math.min(strength,4) ? password.length >= 8 ? "bg-lime-500" : "bg-orange-400" : "bg-muted"}`} />)}</div></Field>
            <label className="flex cursor-pointer items-start gap-3"><button onClick={() => setAgreed((v) => !v)} className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border-2 ${agreed ? "border-orange-500 bg-orange-500" : "border-border"}`} type="button">{agreed ? <Check className="h-3 w-3 text-white" /> : null}</button><span className="text-xs leading-relaxed text-muted-foreground">I agree to Qiilu&apos;s <span className="font-semibold text-orange-500">Terms of Service</span> and <span className="font-semibold text-orange-500">Privacy Policy</span></span></label>
            {error ? <Message tone="error">{error}</Message> : null}
            {conflictHint ? <ConflictCallout hint={conflictHint} /> : null}
            <button onClick={requestOtp} disabled={loading || !name.trim() || !phone.trim() || !email.trim() || !password.trim() || !agreed} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-base font-bold text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60" type="button">{loading ? <Spinner /> : <>Continue <ChevronRight className="h-4 w-4" /></>}</button>
            <div className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-bold text-orange-500">Sign in</Link></div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-6 px-6 pb-6">
            <div><h1 className="text-2xl font-bold tracking-tight">Verify your email</h1><p className="mt-1 text-sm text-muted-foreground">We sent a 6-digit code to <span className="font-semibold text-foreground">{email || "your email"}</span></p></div>
            <div className="flex justify-center"><div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/10"><Mail className="h-8 w-8 text-orange-500" /></div></div>
            <div>
              <label className="mb-3 block text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enter verification code</label>
              <OtpInput
                value={otpValue}
                digits={otpDigits}
                inputRef={otpInputRef}
                onChange={handleOtpChange}
                onKeyDown={handleOtpKeyDown}
                onFocusRequest={focusOtpInput}
                size="mobile"
              />
            </div>
            {note ? <Message tone="neutral">{note}</Message> : null}
            {error ? <Message tone="error">{error}</Message> : null}
            <div className="rounded-2xl bg-muted p-4 text-center"><p className="text-xs text-muted-foreground">Verification status <span className="font-bold text-orange-500">Awaiting code</span></p></div>
            <button onClick={verifyOtp} disabled={loading || otpValue.length !== 6} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-base font-bold text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60" type="button">{loading ? <Spinner /> : <>Verify Code <ChevronRight className="h-4 w-4" /></>}</button>
            <button onClick={requestOtp} className="text-center text-sm text-muted-foreground" disabled={loading} type="button">Didn&apos;t receive it? <span className="font-bold text-orange-500">Resend code</span></button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col items-center justify-center gap-5 px-6 pb-6 text-center">
            <div className="relative"><div className="flex h-24 w-24 items-center justify-center rounded-full bg-lime-500/15"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-500 shadow-lg shadow-lime-500/30"><Check className="h-8 w-8 text-white" strokeWidth={3} /></div></div><div className="absolute -right-2 -top-2 rounded-full bg-white p-1.5 shadow-md"><Image src="/qiilu.png" alt="Qiilu" width={36} height={36} className="h-6 w-auto" /></div></div>
            <div><h1 className="text-2xl font-bold tracking-tight">You&apos;re all set!</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Welcome to Qiilu{name ? `, ${name}` : ""}.<br />Your account has been created successfully.</p></div>
            <div className="w-full rounded-2xl bg-muted p-4 text-left"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account summary</p><SummaryRow label="Role" value={activeRole === "DRIVER" ? "driver" : "passenger"} /><SummaryRow label="Phone" value={phone ? `+233 ${phone}` : "Provided at signup"} /><SummaryRow label="KYC Status" value={<span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-500">Pending</span>} border={false} /></div>
            <button onClick={goToApp} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-base font-bold text-white transition-all hover:bg-orange-600" type="button">{activeRole === "DRIVER" ? "Go to Driver Dashboard" : "Start Riding"} <ChevronRight className="h-4 w-4" /></button>
          </div>
        ) : null}
      </div>
    </>
  );
}

function RoleSwitch({ activeRole, onChange, compact = false }: { activeRole: SignupRole; onChange: (role: SignupRole) => void; compact?: boolean }) {
  return (
    <div className={`mb-6 flex gap-1 rounded-xl bg-muted p-1 ${compact ? "mb-0" : ""}`}>
      <button onClick={() => onChange("PASSENGER")} className={`flex-1 rounded-lg ${compact ? "py-2" : "py-2.5"} text-sm font-semibold ${activeRole === "PASSENGER" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`} type="button">Passenger</button>
      <button onClick={() => onChange("DRIVER")} className={`flex-1 rounded-lg ${compact ? "py-2" : "py-2.5"} text-sm font-semibold ${activeRole === "DRIVER" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`} type="button">Driver Partner</button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4"><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>{children}</div>;
}

function InputShell({ icon, prefix, end, children }: { icon: React.ReactNode; prefix?: React.ReactNode; end?: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex h-11 items-center gap-2.5 rounded-xl border border-transparent bg-muted px-4 transition-colors focus-within:border-orange-500 md:h-11 [&:has(input:focus)]:border-orange-500">{prefix ? <div className="flex shrink-0 items-center gap-1 border-r border-border pr-2">{prefix}</div> : null}{icon}{children}{end}</div>;
}

function PasswordMeter({ strength }: { strength: number }) {
  const label = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const color = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-lime-500"][strength];
  return <div className="mt-2 flex items-center gap-3"><div className="flex flex-1 gap-1">{[1,2,3,4].map((bar) => <div key={bar} className={`h-1 flex-1 rounded-full ${bar <= strength ? color : "bg-muted"}`} />)}</div><span className={`text-xs font-semibold ${strength >= 3 ? "text-lime-500" : strength === 2 ? "text-yellow-500" : "text-red-400"}`}>{label}</span></div>;
}

function Message({ tone, children }: { tone: "neutral" | "error"; children: React.ReactNode }) {
  return <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${tone === "error" ? "border-red-500/20 bg-red-500/10 text-red-500" : "border-border bg-muted/60 text-muted-foreground"}`}>{children}</div>;
}

function getConflictHint(error: string | null) {
  if (!error) {
    return null;
  }

  if (error.includes("phone already exists")) {
    return "phone" as const;
  }

  if (error.includes("email already exists")) {
    return "email" as const;
  }

  return null;
}

function ConflictCallout({ hint }: { hint: "phone" | "email" }) {
  return (
    <div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/8 px-4 py-3 text-sm">
      <p className="font-semibold text-foreground">
        {hint === "phone"
          ? "This phone number already has a Qiilu account."
          : "This email already has a Qiilu account."}
      </p>
      <p className="mt-1 text-muted-foreground">
        You can sign in instead of creating a new account.
      </p>
      <Link href="/login" className="mt-3 inline-flex items-center gap-2 font-semibold text-orange-500 hover:underline">
        Go to login
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function OtpInput({
  value,
  digits,
  inputRef,
  onChange,
  onKeyDown,
  onFocusRequest,
  size
}: {
  value: string;
  digits: string[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocusRequest: () => void;
  size: "desktop" | "mobile";
}) {
  const boxClassName =
    size === "desktop"
      ? "h-14 w-13 rounded-xl text-xl"
      : "h-13 w-12 rounded-xl text-lg";

  return (
    <div className="mb-6">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          className="absolute inset-0 h-full w-full opacity-0"
          maxLength={6}
          aria-label="One time password"
        />
        <button
          type="button"
          onClick={onFocusRequest}
          className="flex w-full justify-center gap-3"
          aria-label="Enter verification code"
        >
          {digits.map((digit, index) => {
            const isActive = index === Math.min(value.length, 5);
            const isFilled = Boolean(digit);

            return (
              <span
                key={index}
                className={`${boxClassName} flex items-center justify-center border-2 font-bold transition-all ${
                  isFilled
                    ? "border-orange-500 bg-orange-500/10 text-orange-500"
                    : isActive
                      ? "border-orange-400 bg-muted text-foreground"
                      : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {digit || ""}
              </span>
            );
          })}
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}

function SummaryRow({ label, value, border = true }: { label: string; value: React.ReactNode; border?: boolean }) {
  return <div className={`flex items-center justify-between py-2 ${border ? "border-b border-border" : ""}`}><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-semibold capitalize">{value}</span></div>;
}

function ProgressMobile({ step }: { step: Step }) {
  return <>
    <div className="flex items-center gap-2">{[1,2,3].map((item) => <div key={item} className="flex flex-1 items-center gap-2"><div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${step > item ? "bg-lime-500 text-white" : step === item ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"}`}>{step > item ? <Check className="h-3 w-3" /> : item}</div>{item < 3 ? <div className={`h-0.5 flex-1 rounded-full ${step > item ? "bg-lime-500" : "bg-muted"}`} /> : null}</div>)}</div>
    <div className="mt-1 flex justify-between"><span className={`text-[10px] font-semibold ${step === 1 ? "text-orange-500" : "text-muted-foreground"}`}>Details</span><span className={`text-[10px] font-semibold ${step === 2 ? "text-orange-500" : "text-muted-foreground"}`}>Verify</span><span className={`text-[10px] font-semibold ${step === 3 ? "text-orange-500" : "text-muted-foreground"}`}>Done</span></div>
  </>;
}
