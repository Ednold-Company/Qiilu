import React, { useState } from 'react';
import { 
  Moon, Sun, Home, Car, MessageSquare, User, Wallet, ArrowDownRight, ArrowUpRight, CreditCard, Plus, Gift, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Payments() {
  const [dark, setDark] = useState(false);
  const toggleTheme = () => setDark(!dark);

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 flex justify-between items-center bg-background/90 backdrop-blur">
        <h1 className="text-xl font-bold">Payments</h1>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
           {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="pt-24 px-6 pb-24 h-full overflow-y-auto">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary to-orange-600 rounded-[2rem] p-6 text-white shadow-xl shadow-primary/20 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="text-white/80 font-medium mb-1 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Wallet Balance
          </div>
          <div className="text-4xl font-extrabold tracking-tight mb-6">
            <span className="text-xl opacity-80 mr-1">GHS</span>23.50
          </div>
          <div className="flex gap-3 relative z-10">
            <Button className="flex-1 bg-white text-primary hover:bg-white/90 rounded-xl font-bold h-12">
              <ArrowDownRight className="w-4 h-4 mr-2" /> Top Up
            </Button>
            <Button className="flex-1 bg-white/20 text-white hover:bg-white/30 rounded-xl font-bold h-12 border-transparent">
              <ArrowUpRight className="w-4 h-4 mr-2" /> Cash Out
            </Button>
          </div>
        </div>

        {/* Payment Methods */}
        <h3 className="font-bold text-lg mb-4">Payment Methods</h3>
        <div className="space-y-3 mb-8">
          <div className="bg-card border-2 border-primary rounded-2xl p-4 flex items-center justify-between shadow-sm shadow-primary/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold">Mobile Money</h4>
                <p className="text-sm text-muted-foreground">024 •••• 5678</p>
              </div>
            </div>
            <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">Primary</div>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <h4 className="font-bold flex-1">Cash</h4>
          </div>

          <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 font-bold text-muted-foreground hover:text-foreground flex gap-2">
            <Plus className="w-5 h-5" /> Add New Method
          </Button>
        </div>

        {/* Promo & Referral */}
        <h3 className="font-bold text-lg mb-4">Promotions</h3>
        <div className="bg-card border border-border rounded-2xl p-4 mb-3 flex gap-3 shadow-sm">
          <Input placeholder="Enter promo code" className="bg-muted border-none h-12 rounded-xl" />
          <Button className="h-12 rounded-xl px-6 font-bold">Apply</Button>
        </div>
        <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 mb-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <div className="font-bold text-sm text-secondary">QIILU10 Active</div>
            <div className="text-xs font-medium mt-0.5">10% off your next ride</div>
          </div>
        </div>

        {/* Transactions */}
        <h3 className="font-bold text-lg mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {[
            { title: 'Ride to Kotokuraba Market', date: 'Oct 12, 14:30', amount: '-45.00', icon: Car, color: 'text-foreground' },
            { title: 'Wallet Top Up', date: 'Oct 10, 10:00', amount: '+100.00', icon: ArrowDownRight, color: 'text-secondary' },
            { title: 'Ride to Castle Beach', date: 'Oct 08, 16:45', amount: '-28.00', icon: Car, color: 'text-foreground' },
            { title: 'Promo Code Applied', date: 'Oct 08, 16:45', amount: '+5.00', icon: Gift, color: 'text-secondary' },
            { title: 'Ride to UCC Main Gate', date: 'Oct 05, 09:15', amount: '-15.00', icon: Car, color: 'text-foreground' },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <tx.icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <div className="font-bold text-sm">{tx.title}</div>
                  <div className="text-xs text-muted-foreground">{tx.date}</div>
                </div>
              </div>
              <div className={`font-bold ${tx.color}`}>
                {tx.amount}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-20 bg-background border-t border-border flex justify-around items-center px-6 pb-4 pt-2 z-30">
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Home className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Home</span></button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Car className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Rides</span></button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><MessageSquare className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Messages</span></button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><User className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Account</span></button>
      </div>
    </div>
  );
}