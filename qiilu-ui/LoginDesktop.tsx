import React, { useState } from 'react';
import { Eye, EyeOff, Moon, Sun, Phone, Lock, ChevronRight, MapPin, Navigation, Star } from 'lucide-react';

export function LoginDesktop() {
  const [dark, setDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<'passenger' | 'driver'>('passenger');

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1800);
  };

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="w-[1280px] h-[800px] bg-background text-foreground font-sans flex overflow-hidden">

        {/* Left panel — brand visual */}
        <div className="w-[580px] h-full bg-gray-950 relative overflow-hidden flex flex-col shrink-0">
          {/* Animated map grid background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(249,115,22,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.4) 1px, transparent 1px)',
              backgroundSize: '48px 48px'
            }}
          />
          {/* Glow spots */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-lime-500/15 rounded-full blur-2xl" />

          {/* Mock route line */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 580 800" fill="none">
            <path
              d="M120 620 C120 620 180 500 260 420 C340 340 380 280 400 180"
              stroke="#f97316" strokeWidth="3" strokeDasharray="8 4" opacity="0.7"
            />
            {/* Origin dot */}
            <circle cx="120" cy="620" r="8" fill="#f97316" />
            <circle cx="120" cy="620" r="16" fill="#f97316" opacity="0.25" />
            {/* Destination pin */}
            <circle cx="400" cy="180" r="8" fill="#84cc16" />
            <circle cx="400" cy="180" r="16" fill="#84cc16" opacity="0.25" />
            {/* Car dot */}
            <circle cx="270" cy="405" r="10" fill="white" />
            <circle cx="270" cy="405" r="20" fill="white" opacity="0.15" />
          </svg>

          {/* Location labels */}
          <div className="absolute" style={{ left: 135, top: 600 }}>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              UCC Main Gate
            </div>
          </div>
          <div className="absolute" style={{ left: 300, top: 158 }}>
            <div className="bg-lime-500/20 backdrop-blur-sm border border-lime-500/30 rounded-lg px-3 py-1.5 text-lime-300 text-xs font-semibold flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-lime-400" />
              Teaching Hospital
            </div>
          </div>
          {/* Driver card */}
          <div className="absolute" style={{ left: 180, top: 360 }}>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">KA</div>
              <div>
                <p className="text-white text-[11px] font-semibold">Kwame A.</p>
                <div className="flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-white/70 text-[10px]">4.9</span>
                </div>
              </div>
              <div className="ml-1 text-lime-400 text-[10px] font-bold">2 min</div>
            </div>
          </div>

          {/* Logo */}
          <div className="relative z-10 p-8">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-xl">Q</div>
              <span className="text-white font-bold text-2xl tracking-tight">Qiilu</span>
            </div>
          </div>

          {/* Bottom text */}
          <div className="relative z-10 mt-auto p-8">
            <h2 className="text-white text-3xl font-bold leading-tight tracking-tight mb-3">
              Move through<br />your city with<br /><span className="text-orange-400">confidence.</span>
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Ghana's premium mobility platform. Safe rides, fair fares, always on time.
            </p>

            {/* Stats row */}
            <div className="flex gap-6 mt-6">
              <div>
                <p className="text-white text-xl font-bold">50K+</p>
                <p className="text-white/50 text-xs">Riders</p>
              </div>
              <div className="w-px bg-white/15" />
              <div>
                <p className="text-white text-xl font-bold">3K+</p>
                <p className="text-white/50 text-xs">Drivers</p>
              </div>
              <div className="w-px bg-white/15" />
              <div>
                <p className="text-white text-xl font-bold">4.9</p>
                <p className="text-white/50 text-xs">Avg rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between px-10 py-6 shrink-0">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button className="text-orange-500 font-semibold hover:underline">Sign up</button>
            </p>
            <button
              onClick={() => setDark(!dark)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Form content */}
          <div className="flex-1 flex flex-col justify-center px-16 pb-8">
            <div className="max-w-sm w-full mx-auto">
              <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome back</h1>
              <p className="text-muted-foreground text-sm mb-8">Sign in to continue your journey</p>

              {/* Role toggle */}
              <div className="flex bg-muted rounded-xl p-1 gap-1 mb-7">
                <button
                  onClick={() => setActiveRole('passenger')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeRole === 'passenger'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Passenger
                </button>
                <button
                  onClick={() => setActiveRole('driver')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeRole === 'driver'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Driver Partner
                </button>
              </div>

              {/* Phone */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Phone Number
                </label>
                <div className="flex items-center bg-muted rounded-xl px-4 h-12 gap-3 border border-transparent focus-within:border-orange-500 transition-colors">
                  <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-border">
                    <span className="text-base">🇬🇭</span>
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

              {/* Password */}
              <div className="mb-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Password
                </label>
                <div className="flex items-center bg-muted rounded-xl px-4 h-12 gap-3 border border-transparent focus-within:border-orange-500 transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end mb-6">
                <button className="text-sm text-orange-500 font-semibold hover:underline">Forgot password?</button>
              </div>

              {/* Sign in button */}
              <button
                onClick={handleLogin}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ChevronRight className="w-4 h-4" /></>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* MoMo */}
              <button className="w-full h-11 bg-muted hover:bg-muted/80 border border-border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] font-black text-yellow-900">M</div>
                Continue with MoMo
              </button>

              {/* Legal */}
              <p className="text-center text-xs text-muted-foreground mt-8 leading-relaxed">
                By signing in you agree to Qiilu's{' '}
                <span className="text-orange-500 cursor-pointer hover:underline">Terms of Service</span>
                {' '}and{' '}
                <span className="text-orange-500 cursor-pointer hover:underline">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
