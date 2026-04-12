import React, { useState } from 'react';
import { 
  Home, Car, MessageSquare, Heart, CreditCard, ShieldCheck, Bell, Sun, Moon,
  User, Mail, Phone, Lock, Globe, BellRing, LogOut, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export function PassengerAccountDesktop() {
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  const toggleTheme = () => setDark(!dark);

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'notifications', label: 'Notification Preferences', icon: BellRing },
    { id: 'language', label: 'Language & Region', icon: Globe },
    { id: 'security', label: 'Password & Security', icon: Lock },
  ];

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
          <NavItem icon={CreditCard} label="Payment" />
          <NavItem icon={ShieldCheck} label="Safety" />
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer transition-colors border border-border">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold">AK</div>
            <div className="flex-1">
              <div className="text-sm font-bold">Akosua K.</div>
              <div className="text-xs text-primary font-bold">Profile</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
        <header className="h-20 border-b border-border bg-card flex items-center justify-between px-10 z-20 shrink-0">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
              <Bell className="w-5 h-5 text-foreground" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          <div className="grid grid-cols-12 gap-10 max-w-6xl mx-auto">
            
            {/* Left Column: Profile Card */}
            <div className="col-span-4 space-y-6">
              <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-5xl shadow-lg shadow-primary/20 mx-auto mb-6">
                  AK
                </div>
                <h2 className="font-bold text-2xl mb-1">Akosua Koomson</h2>
                <p className="text-muted-foreground font-medium mb-4">+233 24 765 4321</p>
                <div className="bg-secondary/10 text-secondary text-xs font-bold px-3 py-1.5 rounded-full inline-flex uppercase items-center gap-1 mb-8">
                  <CheckCircle2 className="w-4 h-4" /> KYC Verified
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
                  <div>
                    <div className="text-3xl font-extrabold mb-1">67</div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Trips</div>
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold mb-1">4.8</div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Rating</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {tabs.map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors border-l-4 ${activeTab === tab.id ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-transparent hover:bg-muted text-muted-foreground hover:text-foreground font-medium'}`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Settings Form */}
            <div className="col-span-8">
              <div className="bg-card border border-border rounded-[2rem] p-10 shadow-sm">
                
                {activeTab === 'personal' && (
                  <div>
                    <h3 className="text-2xl font-bold mb-8">Personal Information</h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-muted-foreground">First Name</label>
                          <Input defaultValue="Akosua" className="bg-muted/50 border-none h-12 text-base" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-muted-foreground">Last Name</label>
                          <Input defaultValue="Koomson" className="bg-muted/50 border-none h-12 text-base" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground">Phone Number</label>
                        <Input defaultValue="+233 24 765 4321" className="bg-muted/50 border-none h-12 text-base" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground">Email Address</label>
                        <Input defaultValue="akosua.k@example.com" type="email" className="bg-muted/50 border-none h-12 text-base" />
                      </div>
                      <div className="pt-6 flex justify-end">
                        <Button className="h-12 px-8 rounded-xl font-bold shadow-md">Save Changes</Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div>
                    <h3 className="text-2xl font-bold mb-8">Notification Preferences</h3>
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-lg mb-1">Ride Updates</h4>
                          <p className="text-sm text-muted-foreground">Driver arrival, trip status, receipts</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-lg mb-1">Promotions & Offers</h4>
                          <p className="text-sm text-muted-foreground">Discounts, special campaigns, rewards</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-lg mb-1">Email Receipts</h4>
                          <p className="text-sm text-muted-foreground">Receive a copy of your receipt via email</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional tabs could go here */}

                {/* Danger Zone Always visible at bottom */}
                <div className="mt-16 pt-8 border-t border-border">
                  <h3 className="text-lg font-bold text-destructive mb-4">Danger Zone</h3>
                  <div className="flex items-center justify-between bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
                    <div>
                      <h4 className="font-bold text-destructive mb-1">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">Permanently remove your account and data.</p>
                    </div>
                    <Button variant="destructive" className="rounded-xl font-bold">Delete Account</Button>
                  </div>
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