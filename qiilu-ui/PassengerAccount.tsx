import React, { useState } from 'react';
import { 
  Moon, Sun, Home, Car, MessageSquare, User, ChevronRight, Settings, CreditCard, Heart, ShieldCheck, Bell, Globe, HelpCircle, FileText, LogOut, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PassengerAccount() {
  const [dark, setDark] = useState(false);
  const toggleTheme = () => setDark(!dark);

  const links = [
    { icon: Settings, label: 'Edit Profile' },
    { icon: CreditCard, label: 'Payment Methods' },
    { icon: Heart, label: 'Favourites' },
    { icon: ShieldCheck, label: 'Safety Settings' },
    { icon: Bell, label: 'Notifications' },
    { icon: Globe, label: 'Language & Region' },
    { icon: HelpCircle, label: 'Help & Support' },
    { icon: FileText, label: 'Privacy Policy' },
  ];

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 flex justify-between items-center bg-background/90 backdrop-blur border-b border-border">
        <h1 className="text-xl font-bold">Account</h1>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
           {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="pt-28 px-6 pb-24 h-full overflow-y-auto">
        <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm mb-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shadow-primary/20">
              AK
            </div>
            <div>
              <h2 className="font-bold text-2xl tracking-tight">Akosua Koomson</h2>
              <p className="text-sm font-medium text-muted-foreground mt-1">+233 24 765 4321</p>
              <div className="flex items-center gap-1 mt-2 bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-1 rounded-full inline-flex uppercase">
                <CheckCircle2 className="w-3 h-3" /> KYC Verified
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-extrabold">67</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Trips</div>
            </div>
            <div className="text-center border-l border-r border-border">
              <div className="text-2xl font-extrabold">4.8</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold">3</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Years</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[2rem] p-2 shadow-sm mb-6">
          {links.map((link, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl cursor-pointer transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground">
                  <link.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm">{link.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-[2rem] p-2 shadow-sm mb-8">
          <div className="flex items-center justify-between p-4 hover:bg-destructive/10 text-destructive rounded-xl cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm">Logout</span>
            </div>
          </div>
        </div>

        <div className="text-center pb-8">
          <button className="text-xs font-bold text-muted-foreground hover:text-destructive transition-colors uppercase tracking-wider">
            Delete Account
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-20 bg-background border-t border-border flex justify-around items-center px-6 pb-4 pt-2 z-30">
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Home className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Home</span></button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Car className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Rides</span></button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><MessageSquare className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Messages</span></button>
        <button className="flex flex-col items-center text-primary"><User className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Account</span></button>
      </div>
    </div>
  );
}