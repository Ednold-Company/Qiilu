import React, { useState } from 'react';
import { 
  Moon, Sun, Bell, Car, CreditCard, ShieldCheck, Gift, CheckCircle2, Home, MessageSquare, User, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Notifications() {
  const [dark, setDark] = useState(false);
  const [filter, setFilter] = useState('All');

  const toggleTheme = () => setDark(!dark);

  const notifications = [
    { type: 'ride', title: 'Driver Assigned', desc: 'Kwame is 2 mins away in a white Toyota Corolla.', time: '2m ago', unread: true, icon: Car, color: 'bg-primary' },
    { type: 'promo', title: 'GHS 5 Off Your Next Ride', desc: 'Use code WEEKEND5 for a discount on your next trip.', time: '2h ago', unread: true, icon: Gift, color: 'bg-secondary' },
    { type: 'ride', title: 'Trip Completed', desc: 'You have arrived at Kotokuraba Market. Rate your driver.', time: 'Yesterday', unread: false, icon: CheckCircle2, color: 'bg-blue-500' },
    { type: 'payment', title: 'Payment Received', desc: 'GHS 45.00 was successfully charged via Mobile Money.', time: 'Yesterday', unread: false, icon: CreditCard, color: 'bg-purple-500' },
    { type: 'safety', title: 'SOS Alert Resolved', desc: 'Your emergency contact has been notified of your safe arrival.', time: 'Mon', unread: false, icon: ShieldCheck, color: 'bg-orange-500' },
    { type: 'system', title: 'Account Verified', desc: 'Your KYC documents have been approved. Welcome to Qiilu!', time: 'Oct 10', unread: false, icon: User, color: 'bg-lime-500' },
  ];

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Notifications</h1>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary">
              <Check className="w-5 h-5" />
            </button>
            <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Rides', 'Promotions', 'Safety'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border ${filter === f ? 'bg-foreground text-background border-foreground' : 'bg-card border-border hover:bg-muted'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-40 px-4 pb-24 h-full overflow-y-auto space-y-4">
        <h3 className="font-bold text-sm text-muted-foreground px-2">Today</h3>
        {notifications.slice(0, 2).map((n, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${n.unread ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'} flex gap-4 relative`}>
            {n.unread && <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full" />}
            <div className={`w-12 h-12 rounded-full ${n.color} bg-opacity-20 flex items-center justify-center shrink-0`}>
              <n.icon className={`w-6 h-6 text-${n.color.split('-')[1]}-500`} />
            </div>
            <div>
              <h4 className="font-bold text-sm pr-4">{n.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 mb-2 leading-relaxed">{n.desc}</p>
              <div className="text-[10px] font-bold text-muted-foreground uppercase">{n.time}</div>
            </div>
          </div>
        ))}
        
        <h3 className="font-bold text-sm text-muted-foreground px-2 mt-6">Earlier</h3>
        {notifications.slice(2).map((n, i) => (
          <div key={i} className={`p-4 rounded-2xl border bg-card border-border flex gap-4 relative`}>
            <div className={`w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0`}>
              <n.icon className={`w-6 h-6 text-foreground`} />
            </div>
            <div>
              <h4 className="font-bold text-sm">{n.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 mb-2 leading-relaxed">{n.desc}</p>
              <div className="text-[10px] font-bold text-muted-foreground uppercase">{n.time}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-20 bg-background border-t border-border flex justify-around items-center px-6 pb-4 pt-2 z-30">
        <button className="flex flex-col items-center text-primary"><Home className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Home</span></button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Car className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Rides</span></button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><MessageSquare className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Messages</span></button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><User className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Account</span></button>
      </div>
    </div>
  );
}