import React, { useState } from 'react';
import { 
  LayoutDashboard, ListOrdered, Car, MessageSquare, Wallet, BarChart3, Bell, Sun, Moon,
  User, Settings, ShieldCheck, FileText, CreditCard, HelpCircle, CheckCircle2, Star, Upload, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DriverAccountDesktop() {
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  const toggleTheme = () => setDark(!dark);

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'vehicle', label: 'Vehicle Details', icon: Car },
    { id: 'documents', label: 'Documents & KYC', icon: FileText },
    { id: 'payment', label: 'Bank & MoMo', icon: CreditCard },
    { id: 'safety', label: 'Safety Hub', icon: ShieldCheck },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className={`w-[1280px] h-[800px] flex bg-background text-foreground font-sans overflow-hidden border border-border rounded-xl shadow-2xl mx-auto my-10 ${dark ? 'dark' : ''}`}>
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col shrink-0 z-20">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl tracking-tighter">Q</div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight leading-none">Qiilu</span>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Driver Partner</span>
          </div>
        </div>
        <nav className="px-4 py-4 space-y-1 flex-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" />
          <NavItem icon={ListOrdered} label="Requests" />
          <NavItem icon={Car} label="My Rides" />
          <NavItem icon={MessageSquare} label="Messages" />
          <NavItem icon={Wallet} label="Earnings Wallet" />
          <NavItem icon={BarChart3} label="Performance" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
        <header className="h-20 border-b border-border bg-card px-10 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <h1 className="text-2xl font-bold">Driver Profile</h1>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border relative">
              <Bell className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="flex-1 p-10 overflow-y-auto">
          <div className="grid grid-cols-12 gap-8 max-w-6xl mx-auto">
            
            {/* Left Column: Profile Card */}
            <div className="col-span-4 space-y-6">
              <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary to-orange-500" />
                
                <div className="relative z-10 flex flex-col items-center mt-6">
                  <div className="w-32 h-32 rounded-full bg-card border-4 border-background shadow-xl flex items-center justify-center text-4xl font-extrabold text-foreground mb-4">
                    EK
                  </div>
                  <h2 className="font-bold text-2xl mb-1">Emmanuel Kofi</h2>
                  <p className="text-muted-foreground font-medium mb-3">+233 55 123 9876</p>
                  
                  <div className="bg-secondary/10 text-secondary text-xs font-bold px-3 py-1.5 rounded-full inline-flex uppercase items-center gap-1 mb-8">
                    <CheckCircle2 className="w-4 h-4" /> Pro Partner
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full border-t border-border pt-6">
                    <div>
                      <div className="text-3xl font-extrabold mb-1 flex justify-center items-center gap-1">
                        4.8 <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      </div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Rating</div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold mb-1">312</div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Trips</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4">Active Vehicle</h3>
                <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-xl border border-border">
                  <div className="w-14 h-14 rounded-xl bg-background border border-border flex items-center justify-center">
                    <Car className="w-8 h-8 text-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base">Toyota Corolla</h4>
                    <div className="text-sm font-mono font-bold text-muted-foreground mt-0.5">GR-2345-21</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {tabs.map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors border-l-4 ${activeTab === tab.id ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-transparent hover:bg-muted text-muted-foreground hover:text-foreground font-medium'}`}
                  >
                    <div className="flex items-center gap-4">
                      <tab.icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Dynamic Form */}
            <div className="col-span-8">
              <div className="bg-card border border-border rounded-[2rem] p-10 shadow-sm h-full">
                
                {activeTab === 'profile' && (
                  <div>
                    <h3 className="text-2xl font-bold mb-8">Profile Information</h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-muted-foreground">First Name</label>
                          <Input defaultValue="Emmanuel" className="bg-muted/50 border-none h-12 text-base" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-muted-foreground">Last Name</label>
                          <Input defaultValue="Kofi" className="bg-muted/50 border-none h-12 text-base" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground">Phone Number (Verified)</label>
                        <Input defaultValue="+233 55 123 9876" disabled className="bg-muted/30 border-none h-12 text-base text-muted-foreground opacity-70" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground">Email Address</label>
                        <Input defaultValue="emmanuel.kofi@example.com" type="email" className="bg-muted/50 border-none h-12 text-base" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground">Home Address</label>
                        <Input defaultValue="Block 4, Tema Community 2" className="bg-muted/50 border-none h-12 text-base" />
                      </div>
                      <div className="pt-6 flex justify-end">
                        <Button className="h-12 px-8 rounded-xl font-bold shadow-md">Update Profile</Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div>
                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Documents & KYC</h3>
                        <p className="text-muted-foreground">Manage your verification documents to stay active.</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-secondary mb-1">Verification 3/4 Complete</div>
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="w-[75%] h-full bg-secondary" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { name: "Driver's License", status: "Verified", color: "text-secondary", bg: "bg-secondary/10", file: "license_front.jpg" },
                        { name: "Ghana Card (National ID)", status: "Verified", color: "text-secondary", bg: "bg-secondary/10", file: "ghana_card.jpg" },
                        { name: "Vehicle Insurance", status: "Verified", color: "text-secondary", bg: "bg-secondary/10", file: "insurance_2023.pdf" },
                        { name: "Road Worthiness Certificate", status: "Action Required", color: "text-destructive", bg: "bg-destructive/10", file: null }
                      ].map((doc, i) => (
                        <div key={i} className="border border-border rounded-2xl p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                              <FileText className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                              <h4 className="font-bold text-base">{doc.name}</h4>
                              {doc.file ? (
                                <p className="text-sm text-muted-foreground">{doc.file}</p>
                              ) : (
                                <p className="text-sm text-destructive font-medium">Please upload valid document</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${doc.bg} ${doc.color}`}>
                              {doc.status}
                            </div>
                            {doc.file ? (
                              <Button variant="outline" className="rounded-xl font-bold">Update</Button>
                            ) : (
                              <Button className="rounded-xl font-bold shadow-md"><Upload className="w-4 h-4 mr-2" /> Upload</Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional tabs omitted for brevity */}
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
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-primary/20 text-primary font-bold border-l-4 border-primary' : 'border-l-4 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground font-medium'}`}>
      <Icon className="w-5 h-5" />
      <span className="flex-1">{label}</span>
      {badge && <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>}
    </div>
  );
}