import React, { useState } from 'react';
import { 
  Home, Car, MessageSquare, Heart, CreditCard, ShieldCheck, Bell, Sun, Moon, Wallet, ArrowUpRight, ArrowDownRight, Plus, Gift, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PaymentsDesktop() {
  const [dark, setDark] = useState(false);

  const toggleTheme = () => setDark(!dark);

  return (
    <div className={`w-[1280px] h-[800px] flex bg-background text-foreground font-sans overflow-hidden border border-border rounded-xl shadow-2xl mx-auto my-10 ${dark ? 'dark' : ''}`}>
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col shrink-0 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl tracking-tighter">Q</div>
          <span className="font-bold text-2xl tracking-tight">Qiilu</span>
        </div>
        <nav className="px-4 py-2 space-y-2 flex-1">
          <NavItem icon={Home} label="Home" />
          <NavItem icon={Car} label="My Rides" />
          <NavItem icon={MessageSquare} label="Messages" />
          <NavItem icon={Heart} label="Favourites" />
          <NavItem icon={CreditCard} label="Payment" active />
          <NavItem icon={ShieldCheck} label="Safety" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
        <header className="h-20 border-b border-border bg-card flex items-center justify-between px-10 z-20 shrink-0">
          <h1 className="text-2xl font-bold">Wallet & Payments</h1>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border relative">
              <Bell className="w-5 h-5 text-foreground" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
            </div>
          </div>
        </header>

        <div className="flex-1 p-10 overflow-y-auto">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-primary to-orange-600 rounded-[2rem] p-10 text-white shadow-xl shadow-primary/20 mb-8 relative overflow-hidden flex items-center justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
            
            <div className="relative z-10">
              <div className="text-white/80 font-medium mb-2 flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5" /> Current Balance
              </div>
              <div className="text-6xl font-extrabold tracking-tight">
                <span className="text-3xl opacity-80 mr-2">GHS</span>23.50
              </div>
            </div>
            
            <div className="relative z-10 flex gap-4">
              <Button className="bg-white text-primary hover:bg-white/90 rounded-xl font-bold h-14 px-8 text-lg">
                <ArrowDownRight className="w-5 h-5 mr-2" /> Top Up
              </Button>
              <Button className="bg-white/20 text-white hover:bg-white/30 rounded-xl font-bold h-14 px-8 text-lg border-transparent">
                <ArrowUpRight className="w-5 h-5 mr-2" /> Cash Out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="col-span-5 space-y-8">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-xl mb-6">Payment Methods</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="border-2 border-primary rounded-xl p-4 flex items-center justify-between bg-primary/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Mobile Money</h4>
                        <p className="text-sm text-muted-foreground">024 •••• 5678</p>
                      </div>
                    </div>
                    <div className="bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded uppercase">Primary</div>
                  </div>
                  
                  <div className="border border-border rounded-xl p-4 flex items-center gap-4 hover:border-foreground/30 transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-lg flex-1">Cash</h4>
                  </div>
                </div>

                <Button variant="outline" className="w-full h-14 rounded-xl border-dashed border-2 font-bold text-muted-foreground hover:text-foreground flex gap-2">
                  <Plus className="w-5 h-5" /> Add New Method
                </Button>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-xl mb-4">Promotions</h3>
                <div className="flex gap-3 mb-6">
                  <Input placeholder="Enter promo code" className="bg-muted border-none h-12 rounded-xl text-base flex-1" />
                  <Button className="h-12 rounded-xl px-8 font-bold shadow-md">Apply</Button>
                </div>
                
                <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-secondary text-lg">QIILU10 Active</div>
                    <div className="text-sm font-medium text-secondary/80 mt-0.5">10% off your next ride (Max GHS 15)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-7 space-y-8">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl">Recent Transactions</h3>
                  <Button variant="ghost" className="text-primary font-bold">View All</Button>
                </div>
                
                <div className="space-y-2">
                  {[
                    { title: 'Ride to Kotokuraba Market', date: 'Oct 12, 14:30', amount: '-45.00', icon: Car, color: 'text-foreground' },
                    { title: 'Wallet Top Up', date: 'Oct 10, 10:00', amount: '+100.00', icon: ArrowDownRight, color: 'text-secondary' },
                    { title: 'Ride to Castle Beach', date: 'Oct 08, 16:45', amount: '-28.00', icon: Car, color: 'text-foreground' },
                    { title: 'Promo Code Applied', date: 'Oct 08, 16:45', amount: '+5.00', icon: Gift, color: 'text-secondary' },
                    { title: 'Ride to UCC Main Gate', date: 'Oct 05, 09:15', amount: '-15.00', icon: Car, color: 'text-foreground' },
                    { title: 'Ride to Accra Mall', date: 'Oct 01, 11:20', amount: '-60.00', icon: Car, color: 'text-foreground' },
                    { title: 'Wallet Top Up', date: 'Sep 30, 09:00', amount: '+150.00', icon: ArrowDownRight, color: 'text-secondary' },
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-colors">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <tx.icon className="w-6 h-6 text-foreground" />
                        </div>
                        <div>
                          <div className="font-bold text-base">{tx.title}</div>
                          <div className="text-sm text-muted-foreground mt-0.5">{tx.date}</div>
                        </div>
                      </div>
                      <div className={`font-bold text-lg ${tx.color}`}>
                        {tx.amount.startsWith('+') ? `+ GHS ${tx.amount.substring(1)}` : `- GHS ${tx.amount.substring(1)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, badge }: any) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </div>
      {badge && <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>}
    </div>
  );
}