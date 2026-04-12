import React, { useState } from 'react';
import { Eye, EyeOff, Moon, Sun, ArrowLeft, Phone, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Login() {
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
            <div className="flex items-center gap-0.5">
              <div className="w-5 h-2.5 rounded-sm border border-foreground/70 relative">
                <div className="absolute inset-0.5 right-1 bg-foreground/70 rounded-[1px]" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-1 bg-foreground/70 rounded-r-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={() => setDark(!dark)}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            {dark ? <Sun className="w-4 h-4 text-foreground" /> : <Moon className="w-4 h-4 text-foreground" />}
          </button>
        </div>

        {/* Logo + headline */}
        <div className="px-6 pt-2 pb-4 shrink-0">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
              Q
            </div>
            <span className="font-bold text-2xl tracking-tight">Qiilu</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue your journey</p>
        </div>

        {/* Role toggle */}
        <div className="px-6 mb-5 shrink-0">
          <div className="flex bg-muted rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveRole('passenger')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeRole === 'passenger'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Passenger
            </button>
            <button
              onClick={() => setActiveRole('driver')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeRole === 'driver'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Driver
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 flex flex-col gap-4 shrink-0">
          {/* Phone field */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Phone Number
            </label>
            <div className="flex items-center bg-muted rounded-xl px-4 h-13 gap-3 border border-transparent focus-within:border-orange-500 transition-colors">
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
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 min-w-0"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Password
            </label>
            <div className="flex items-center bg-muted rounded-xl px-4 h-13 gap-3 border border-transparent focus-within:border-orange-500 transition-colors">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 min-w-0"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="shrink-0">
                {showPassword
                  ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                  : <Eye className="w-4 h-4 text-muted-foreground" />
                }
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <button className="text-sm text-orange-500 font-semibold">Forgot password?</button>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            className="w-full h-13 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Sign In <ChevronRight className="w-4 h-4" /></>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* MoMo login */}
          <button className="w-full h-12 bg-muted hover:bg-muted/80 border border-border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] font-black text-yellow-900">M</div>
            Sign in with MoMo
          </button>
        </div>

        {/* Footer */}
        <div className="mt-auto pb-6 px-6 text-center shrink-0">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button className="text-orange-500 font-bold">Sign up</button>
          </p>
        </div>
      </div>
    </div>
  );
}
