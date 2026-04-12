import React, { useState } from 'react';
import { Eye, EyeOff, Moon, Sun, ArrowLeft, Phone, Lock, User, Mail, ChevronRight, Check } from 'lucide-react';

export function Signup() {
  const [dark, setDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [activeRole, setActiveRole] = useState<'passenger' | 'driver'>('passenger');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const nextStep = () => {
    if (step < 3) setStep((step + 1) as 1 | 2 | 3);
  };

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="w-[390px] h-[844px] mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans flex flex-col">

        {/* Status bar */}
        <div className="flex justify-between items-center px-6 pt-3 pb-1 text-[11px] font-semibold text-foreground/70 shrink-0">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5 items-end h-3">
              <div className="w-0.5 h-1 bg-foreground/70 rounded-sm" />
              <div className="w-0.5 h-1.5 bg-foreground/70 rounded-sm" />
              <div className="w-0.5 h-2 bg-foreground/70 rounded-sm" />
              <div className="w-0.5 h-3 bg-foreground/70 rounded-sm" />
            </div>
            <span>GH</span>
            <div className="w-5 h-2.5 rounded-sm border border-foreground/70 relative">
              <div className="absolute inset-0.5 right-1 bg-foreground/70 rounded-[1px]" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-1 bg-foreground/70 rounded-r-sm" />
            </div>
          </div>
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : undefined}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={() => setDark(!dark)}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            {dark ? <Sun className="w-4 h-4 text-foreground" /> : <Moon className="w-4 h-4 text-foreground" />}
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 shrink-0 mb-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-300 ${
                    step > s
                      ? 'bg-lime-500 text-white'
                      : step === s
                      ? 'bg-orange-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s ? <Check className="w-3 h-3" /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${step > s ? 'bg-lime-500' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-[10px] font-semibold ${step === 1 ? 'text-orange-500' : 'text-muted-foreground'}`}>Details</span>
            <span className={`text-[10px] font-semibold ${step === 2 ? 'text-orange-500' : 'text-muted-foreground'}`}>Verify</span>
            <span className={`text-[10px] font-semibold ${step === 3 ? 'text-orange-500' : 'text-muted-foreground'}`}>Done</span>
          </div>
        </div>

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="px-6 flex flex-col gap-4 flex-1 overflow-y-auto">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Join Qiilu and ride smarter</p>
            </div>

            {/* Role toggle */}
            <div className="flex bg-muted rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveRole('passenger')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeRole === 'passenger' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Passenger
              </button>
              <button
                onClick={() => setActiveRole('driver')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeRole === 'driver' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Driver Partner
              </button>
            </div>

            {/* Full name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Full Name</label>
              <div className="flex items-center bg-muted rounded-xl px-4 h-12 gap-3 border border-transparent focus-within:border-orange-500 transition-colors">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Kofi Mensah"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Phone Number</label>
              <div className="flex items-center bg-muted rounded-xl px-4 h-12 gap-3 border border-transparent focus-within:border-orange-500 transition-colors">
                <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-border">
                  <span className="text-sm font-bold">🇬🇭</span>
                  <span className="text-sm font-semibold text-muted-foreground">+233</span>
                </div>
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="24 123 4567"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Email (optional)</label>
              <div className="flex items-center bg-muted rounded-xl px-4 h-12 gap-3 border border-transparent focus-within:border-orange-500 transition-colors">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="kofi@email.com"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Password</label>
              <div className="flex items-center bg-muted rounded-xl px-4 h-12 gap-3 border border-transparent focus-within:border-orange-500 transition-colors">
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="shrink-0">
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              {/* Password strength */}
              <div className="flex gap-1 mt-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`flex-1 h-1 rounded-full ${password.length >= i * 2 ? (password.length >= 8 ? 'bg-lime-500' : 'bg-orange-400') : 'bg-muted'}`} />
                ))}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => setAgreed(!agreed)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${agreed ? 'bg-orange-500 border-orange-500' : 'border-border'}`}
              >
                {agreed && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed">
                I agree to Qiilu's <span className="text-orange-500 font-semibold">Terms of Service</span> and <span className="text-orange-500 font-semibold">Privacy Policy</span>
              </span>
            </label>

            <button
              onClick={nextStep}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="px-6 flex flex-col gap-6 flex-1">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Verify your number</h1>
              <p className="text-sm text-muted-foreground mt-1">
                We sent a 6-digit code to <span className="text-foreground font-semibold">+233 24 123 4567</span>
              </p>
            </div>

            {/* OTP illustration */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center">
                <Phone className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            {/* OTP inputs */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block text-center">
                Enter verification code
              </label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <div
                    key={i}
                    className={`w-12 h-13 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-colors ${
                      digit ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-border bg-muted text-muted-foreground'
                    }`}
                  >
                    {digit || (i === otp.filter(Boolean).length ? <span className="w-0.5 h-5 bg-orange-500 animate-pulse rounded-full" /> : '·')}
                  </div>
                ))}
              </div>
            </div>

            {/* Mock keypad feedback */}
            <div className="bg-muted rounded-2xl p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Code expires in <span className="text-orange-500 font-bold">4:52</span>
              </p>
            </div>

            <button
              onClick={() => {
                setOtp(['8','3','2','1','9','7']);
                setTimeout(nextStep, 500);
              }}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              Verify Code <ChevronRight className="w-4 h-4" />
            </button>

            <button className="text-sm text-muted-foreground text-center">
              Didn't receive it? <span className="text-orange-500 font-bold">Resend code</span>
            </button>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="px-6 flex flex-col items-center justify-center flex-1 text-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-lime-500/15 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-lime-500 flex items-center justify-center shadow-lg shadow-lime-500/30">
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-white text-xs font-black">Q</span>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">You're all set!</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Welcome to Qiilu, <span className="text-foreground font-semibold">{name || 'Kofi'}</span>!<br />
                Your account has been created successfully.
              </p>
            </div>

            <div className="w-full bg-muted rounded-2xl p-4 text-left">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Account summary</p>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-semibold capitalize">{activeRole}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="text-sm font-semibold">+233 24 123 4567</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-muted-foreground">KYC Status</span>
                <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">Pending</span>
              </div>
            </div>

            <div className="flex gap-1 w-full">
              <div className="w-2 h-2 rounded-full bg-lime-500" />
              <p className="text-xs text-muted-foreground text-left">
                GHS 5.00 welcome credit added to your wallet
              </p>
            </div>

            <button className="w-full h-12 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
              Start Riding <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer for step 1 */}
        {step === 1 && (
          <div className="pb-6 px-6 text-center shrink-0 mt-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button className="text-orange-500 font-bold">Sign in</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
