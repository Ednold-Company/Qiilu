import React, { useState } from 'react';
import { Eye, EyeOff, Moon, Sun, Phone, Lock, User, Mail, ChevronRight, Check, Car, Bike } from 'lucide-react';

export function SignupDesktop() {
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

  const nextStep = () => { if (step < 3) setStep((step + 1) as 1 | 2 | 3); };

  const strengthLevel = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-500'];

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="w-[1280px] h-[800px] bg-background text-foreground font-sans flex overflow-hidden">

        {/* Left panel */}
        <div className="w-[500px] h-full bg-gray-950 relative overflow-hidden flex flex-col shrink-0">
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: 'linear-gradient(rgba(249,115,22,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.5) 1px, transparent 1px)',
              backgroundSize: '48px 48px'
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-orange-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-24 right-8 w-40 h-40 bg-lime-500/10 rounded-full blur-2xl" />

          {/* Logo */}
          <div className="relative z-10 p-8">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-xl">Q</div>
              <span className="text-white font-bold text-2xl tracking-tight">Qiilu</span>
            </div>
          </div>

          {/* Steps visual */}
          <div className="relative z-10 px-8 flex-1 flex flex-col justify-center">
            <h2 className="text-white text-2xl font-bold mb-8 leading-tight">
              Join thousands of<br /><span className="text-orange-400">Ghanaians</span> on<br />the road.
            </h2>

            {/* Steps guide */}
            <div className="flex flex-col gap-5">
              {[
                { num: 1, label: 'Create your account', sub: 'Name, phone & password' },
                { num: 2, label: 'Verify your number', sub: 'Quick OTP confirmation' },
                { num: 3, label: 'Start riding', sub: 'Book your first trip' },
              ].map(({ num, label, sub }) => (
                <div key={num} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 ${
                    step > num
                      ? 'bg-lime-500 text-white'
                      : step === num
                      ? 'bg-orange-500 text-white ring-4 ring-orange-500/30'
                      : 'bg-white/10 text-white/40'
                  }`}>
                    {step > num ? <Check className="w-4 h-4" /> : num}
                  </div>
                  <div className={`transition-opacity duration-300 ${step >= num ? 'opacity-100' : 'opacity-40'}`}>
                    <p className="text-white text-sm font-semibold">{label}</p>
                    <p className="text-white/50 text-xs mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ride type icons */}
          <div className="relative z-10 px-8 pb-8">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Available in Cape Coast</p>
            <div className="flex gap-3">
              {[
                { icon: Car, label: 'Car' },
                { icon: Bike, label: 'Motor' },
                { icon: Car, label: 'Tricycle' },
                { icon: Car, label: 'Mini Van' },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white/60" />
                  </div>
                  <span className="text-white/40 text-[10px]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-10 py-5 shrink-0 border-b border-border">
            {/* Progress */}
            <div className="flex items-center gap-3">
              {[1, 2, 3].map(s => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                      step > s ? 'bg-lime-500 text-white' : step === s ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {step > s ? <Check className="w-3 h-3" /> : s}
                    </div>
                    <span className={`text-xs font-semibold ${step === s ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s === 1 ? 'Details' : s === 2 ? 'Verify' : 'Done'}
                    </span>
                  </div>
                  {s < 3 && <div className={`w-12 h-px ${step > s ? 'bg-lime-500' : 'bg-border'} transition-colors duration-500`} />}
                </React.Fragment>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Have an account?{' '}
                <button className="text-orange-500 font-semibold hover:underline">Sign in</button>
              </span>
              <button
                onClick={() => setDark(!dark)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 overflow-y-auto px-10 py-8">
            <div className="max-w-md mx-auto">

              {/* STEP 1 */}
              {step === 1 && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight mb-1">Create your account</h1>
                  <p className="text-muted-foreground text-sm mb-7">Join Qiilu and ride smarter across Ghana</p>

                  {/* Role toggle */}
                  <div className="flex bg-muted rounded-xl p-1 gap-1 mb-6">
                    <button
                      onClick={() => setActiveRole('passenger')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        activeRole === 'passenger' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}
                    >
                      Passenger
                    </button>
                    <button
                      onClick={() => setActiveRole('driver')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        activeRole === 'driver' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}
                    >
                      Driver Partner
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Full Name</label>
                      <div className="flex items-center bg-muted rounded-xl px-4 h-11 gap-2.5 border border-transparent focus-within:border-orange-500 transition-colors">
                        <User className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Kofi Mensah"
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Phone Number</label>
                      <div className="flex items-center bg-muted rounded-xl px-4 h-11 gap-2.5 border border-transparent focus-within:border-orange-500 transition-colors">
                        <div className="flex items-center gap-1 shrink-0 pr-2 border-r border-border">
                          <span className="text-sm">🇬🇭</span>
                          <span className="text-xs font-semibold text-muted-foreground">+233</span>
                        </div>
                        <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="24 123 4567"
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 min-w-0" />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Email Address <span className="normal-case font-normal">(optional)</span></label>
                    <div className="flex items-center bg-muted rounded-xl px-4 h-11 gap-2.5 border border-transparent focus-within:border-orange-500 transition-colors">
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="kofi@email.com"
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Password</label>
                    <div className="flex items-center bg-muted rounded-xl px-4 h-11 gap-2.5 border border-transparent focus-within:border-orange-500 transition-colors">
                      <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a strong password"
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
                      <button onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex gap-1 flex-1">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= strengthLevel ? strengthColor[strengthLevel] : 'bg-muted'}`} />
                          ))}
                        </div>
                        <span className={`text-xs font-semibold ${strengthLevel >= 3 ? 'text-lime-500' : strengthLevel === 2 ? 'text-yellow-500' : 'text-red-400'}`}>
                          {strengthLabel[strengthLevel]}
                        </span>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer mb-6">
                    <div onClick={() => setAgreed(!agreed)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${agreed ? 'bg-orange-500 border-orange-500' : 'border-border'}`}>
                      {agreed && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      I agree to Qiilu's{' '}
                      <span className="text-orange-500 font-medium cursor-pointer hover:underline">Terms of Service</span>
                      {' '}and{' '}
                      <span className="text-orange-500 font-medium cursor-pointer hover:underline">Privacy Policy</span>
                    </span>
                  </label>

                  <button onClick={nextStep}
                    className="w-full h-11 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <button className="w-full h-11 bg-muted hover:bg-muted/80 border border-border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] font-black text-yellow-900">M</div>
                    Sign up with MoMo
                  </button>
                </>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="text-center flex flex-col items-center">
                  <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mb-6">
                    <Phone className="w-9 h-9 text-orange-500" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight mb-2">Verify your number</h1>
                  <p className="text-muted-foreground text-sm mb-8">
                    We sent a 6-digit code to{' '}
                    <span className="text-foreground font-semibold">+233 24 123 4567</span>
                  </p>

                  <div className="flex gap-3 mb-6">
                    {otp.map((digit, i) => (
                      <div key={i} className={`w-13 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-200 ${
                        digit ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-border bg-muted text-muted-foreground'
                      }`}>
                        {digit || (i === otp.filter(Boolean).length ? <span className="w-0.5 h-5 bg-orange-500 animate-pulse rounded-full block" /> : '·')}
                      </div>
                    ))}
                  </div>

                  <div className="w-full bg-muted rounded-2xl px-5 py-3 mb-6 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Code expires in</span>
                    <span className="text-orange-500 font-bold text-sm">4:52</span>
                  </div>

                  <button onClick={() => { setOtp(['8','3','2','1','9','7']); setTimeout(nextStep, 400); }}
                    className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mb-4">
                    Verify &amp; Continue <ChevronRight className="w-4 h-4" />
                  </button>

                  <button className="text-sm text-muted-foreground">
                    Didn't receive it?{' '}
                    <span className="text-orange-500 font-semibold hover:underline cursor-pointer">Resend code</span>
                  </button>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="text-center flex flex-col items-center py-6">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-lime-500/15 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-lime-500 flex items-center justify-center shadow-xl shadow-lime-500/30">
                        <Check className="w-8 h-8 text-white" strokeWidth={3} />
                      </div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-black">Q</span>
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight mb-2">You're all set!</h1>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                    Welcome to Qiilu, <span className="text-foreground font-semibold">{name || 'Kofi'}</span>!<br />
                    Your account has been created successfully.
                  </p>

                  <div className="w-full bg-muted rounded-2xl p-5 text-left mb-5">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-3">Account summary</p>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Account type</span>
                      <span className="text-sm font-semibold capitalize">{activeRole}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Phone</span>
                      <span className="text-sm font-semibold">+233 24 123 4567</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">KYC Status</span>
                      <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">Pending</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Welcome credit</span>
                      <span className="text-sm font-bold text-lime-600">+ GHS 5.00</span>
                    </div>
                  </div>

                  <button className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                    {activeRole === 'driver' ? 'Go to Driver Dashboard' : 'Start Riding'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
