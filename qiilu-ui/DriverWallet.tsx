import React, { useState } from 'react';
import { 
  Moon, Sun, Home, Navigation, Wallet, User, ArrowUpRight, CreditCard, Clock, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DriverWallet() {
  const [dark, setDark] = useState(true);
  const toggleTheme = () => setDark(!dark);

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 flex justify-between items-center bg-background/90 backdrop-blur">
        <h1 className="text-xl font-bold">Earnings Wallet</h1>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
           {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="pt-28 px-4 pb-24 h-full overflow-y-auto space-y-6">
        
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-secondary to-primary rounded-[2rem] p-6 text-white shadow-xl shadow-secondary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          
          <div className="relative z-10">
            <div className="text-white/90 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Net Earnings (Today)
            </div>
            <div className="text-5xl font-extrabold tracking-tight mb-2">
              <span className="text-2xl opacity-80 mr-1">GHS</span>116.50
            </div>
            <div className="text-sm font-medium bg-white/20 inline-block px-3 py-1 rounded-full mb-6">
              This Week: GHS 980.00
            </div>
            
            <Button className="w-full bg-white text-secondary-foreground hover:bg-white/90 rounded-xl font-bold h-14 text-lg shadow-lg">
              Cash Out Now
            </Button>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Today's Breakdown</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Trips Completed</span>
              <span className="font-bold">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Gross Fares</span>
              <span className="font-bold">GHS 142.50</span>
            </div>
            <div className="flex justify-between items-center text-destructive">
              <span className="font-medium">Qiilu Commission (15%)</span>
              <span className="font-bold">- GHS 26.00</span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="font-bold">Net Earnings</span>
              <span className="font-bold text-secondary text-lg">GHS 116.50</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold">Linked Payout Method</h4>
              <p className="text-sm text-muted-foreground">MoMo • 055 •••• 3421</p>
            </div>
          </div>
          <button className="text-sm font-bold text-primary">Edit</button>
        </div>

        {/* Chart (Tailwind DIVs) */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Last 7 Days</h3>
          <div className="h-40 flex items-end justify-between gap-2 mb-2">
            {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
              <div key={i} className="w-full relative group">
                <div 
                  className={`w-full rounded-t-md transition-colors ${i === 6 ? 'bg-secondary' : 'bg-secondary/20 hover:bg-secondary/40'}`} 
                  style={{ height: `${h}%` }} 
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase border-t border-border pt-2">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span className="text-secondary">S</span>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-primary-foreground/80 leading-relaxed">
            Payouts take up to 2 hours to reflect in your Mobile Money wallet.
          </p>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 w-full h-20 bg-card border-t border-border flex justify-around items-center px-4 pb-4 pt-2 z-30">
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Home className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Home</span></button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Navigation className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Rides</span></button>
        <button className="flex flex-col items-center text-primary"><Wallet className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Wallet</span></button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><User className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Account</span></button>
      </div>
    </div>
  );
}