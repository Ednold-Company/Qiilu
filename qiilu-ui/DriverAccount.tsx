import React, { useState } from 'react';
import { 
  Moon, Sun, Home, Navigation, Wallet, User, CheckCircle2, ChevronRight, Settings, Car as CarIcon, FileText, CreditCard, ShieldCheck, HelpCircle, LogOut, Star
} from 'lucide-react';

export function DriverAccount() {
  const [dark, setDark] = useState(true);
  const toggleTheme = () => setDark(!dark);

  const links = [
    { icon: Settings, label: 'Edit Profile' },
    { icon: CarIcon, label: 'Vehicle Information' },
    { icon: FileText, label: 'Documents & KYC' },
    { icon: CreditCard, label: 'Bank & MoMo Details' },
    { icon: ShieldCheck, label: 'Safety Hub' },
    { icon: HelpCircle, label: 'Help & Support' },
  ];

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 flex justify-between items-center bg-card/90 backdrop-blur border-b border-border">
        <h1 className="text-xl font-bold">Driver Profile</h1>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
           {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="pt-28 px-4 pb-24 h-full overflow-y-auto space-y-6">
        
        {/* Profile Card */}
        <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm relative">
          <div className="absolute top-4 right-4 bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </div>
          
          <div className="flex flex-col items-center mt-2 mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-3xl shadow-lg border-4 border-background mb-4">
              EK
            </div>
            <h2 className="font-bold text-2xl tracking-tight">Emmanuel Kofi</h2>
            <p className="text-sm font-medium text-muted-foreground">+233 55 123 9876</p>
            <div className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mt-3">
              Driver Partner Pro
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-border">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center text-lg font-extrabold mb-1">
                4.8 <Star className="w-4 h-4 text-yellow-500 fill-current ml-1" />
              </div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Rating</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <div className="text-lg font-extrabold mb-1">312</div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Trips</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <div className="text-lg font-extrabold mb-1 text-secondary">96%</div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Acceptance</div>
            </div>
          </div>
        </div>

        {/* Vehicle Card */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
              <CarIcon className="w-7 h-7 text-foreground" />
            </div>
            <div>
              <h3 className="font-bold">Toyota Corolla</h3>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">GR-2345-21 • Silver</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Stats Row */}
        <div className="bg-gradient-to-r from-primary to-orange-500 rounded-2xl p-4 text-white shadow-lg shadow-primary/20 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs font-medium opacity-80 mb-1">Today</div>
            <div className="font-bold">GHS 142</div>
          </div>
          <div className="text-center border-l border-white/20">
            <div className="text-xs font-medium opacity-80 mb-1">Week</div>
            <div className="font-bold">GHS 980</div>
          </div>
          <div className="text-center border-l border-white/20">
            <div className="text-xs font-medium opacity-80 mb-1">Month</div>
            <div className="font-bold">GHS 3.4k</div>
          </div>
        </div>

        {/* Settings Links */}
        <div className="bg-card border border-border rounded-[2rem] p-2 shadow-sm">
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

        <div className="bg-card border border-border rounded-2xl p-2 shadow-sm">
          <div className="flex items-center justify-between p-4 hover:bg-destructive/10 text-destructive rounded-xl cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm">Sign Out</span>
            </div>
          </div>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 w-full h-20 bg-card border-t border-border flex justify-around items-center px-4 pb-4 pt-2 z-30">
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Home className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Home</span></button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Navigation className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Rides</span></button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Wallet className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Wallet</span></button>
        <button className="flex flex-col items-center text-primary"><User className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Account</span></button>
      </div>
    </div>
  );
}