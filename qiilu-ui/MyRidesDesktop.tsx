import React, { useState } from 'react';
import { 
  Home, Car, MessageSquare, Heart, CreditCard, ShieldCheck, Bell, Sun, Moon, Search, MapPin, CheckCircle2, Clock, Download, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MyRidesDesktop() {
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('past');
  const [selectedTrip, setSelectedTrip] = useState<number>(1);

  const toggleTheme = () => setDark(!dark);

  const trips = [
    { id: 1, price: '28.00', from: 'Teaching Hospital', to: 'Castle Beach', type: 'Qiilu Car', driver: 'Kwame A.', rating: '4.9', date: 'Oct 12, 14:30', status: 'completed', method: 'MoMo' },
    { id: 2, price: '120.00', from: 'Accra Mall', to: 'Kotoka Airport', type: 'Mini Van', driver: 'Ama B.', rating: '4.8', date: 'Oct 10, 09:15', status: 'completed', method: 'Cash' },
    { id: 3, price: '15.00', from: 'Osu Oxford St', to: 'Labadi Beach', type: 'Tricycle', driver: 'Kofi S.', rating: '4.7', date: 'Oct 8, 18:45', status: 'completed', method: 'MoMo' }
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
          <NavItem icon={Car} label="My Rides" active />
          <NavItem icon={MessageSquare} label="Messages" badge="2" />
          <NavItem icon={Heart} label="Favourites" />
          <NavItem icon={CreditCard} label="Payment" />
          <NavItem icon={ShieldCheck} label="Safety" />
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold">AK</div>
            <div className="flex-1">
              <div className="text-sm font-bold">Akosua K.</div>
              <div className="text-xs text-muted-foreground">View profile</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 z-20 shrink-0">
          <h1 className="text-xl font-bold">Ride History</h1>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9 h-10 rounded-full bg-muted/50 border-none" placeholder="Search locations or drivers..." />
            </div>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative cursor-pointer border border-border hover:bg-accent transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary border-2 border-background" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* List Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="flex bg-card border border-border rounded-xl p-1 mb-8 inline-flex">
              <button onClick={() => setActiveTab('upcoming')} className={`px-8 py-2 text-sm font-bold rounded-lg ${activeTab === 'upcoming' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Upcoming</button>
              <button onClick={() => setActiveTab('past')} className={`px-8 py-2 text-sm font-bold rounded-lg ${activeTab === 'past' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Past</button>
              <button onClick={() => setActiveTab('cancelled')} className={`px-8 py-2 text-sm font-bold rounded-lg ${activeTab === 'cancelled' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Cancelled</button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {trips.map((trip) => (
                <div 
                  key={trip.id} 
                  onClick={() => setSelectedTrip(trip.id)}
                  className={`bg-card border-2 rounded-2xl p-5 cursor-pointer transition-all ${selectedTrip === trip.id ? 'border-primary shadow-md shadow-primary/5' : 'border-border shadow-sm hover:border-foreground/20'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-lime-500/10 text-lime-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">{trip.date}</span>
                    </div>
                    <span className="font-bold text-lg">GHS {trip.price}</span>
                  </div>
                  
                  <div className="flex gap-3 mb-4">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="w-0.5 h-8 bg-border" />
                      <div className="w-2 h-2 rounded-full bg-foreground" />
                    </div>
                    <div>
                      <div className="font-bold mb-3">{trip.from}</div>
                      <div className="font-bold text-muted-foreground">{trip.to}</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-[10px]">{trip.driver.charAt(0)}</div>
                      <span className="font-medium text-muted-foreground">{trip.driver}</span>
                    </div>
                    <div className="bg-muted px-2 py-1 rounded font-bold text-xs">{trip.method}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Detail Panel */}
          <div className="w-[400px] border-l border-border bg-card shadow-[-10px_0_40px_rgba(0,0,0,0.05)] z-10 flex flex-col shrink-0">
            <div className="h-48 bg-[#e5e3df] dark:bg-[#1a1c1e] relative shrink-0">
              <div className="absolute inset-0 opacity-20 dark:opacity-10" 
                  style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <svg className="absolute inset-0 w-full h-full z-10" preserveAspectRatio="none">
                <path d="M 100 50 Q 200 150 300 100" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" />
              </svg>
              <div className="absolute top-[50px] left-[100px] w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md z-20 transform -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute top-[100px] left-[300px] w-4 h-4 rounded-full bg-foreground border-2 border-background shadow-md z-20 transform -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Trip Details</h2>
                <Button variant="outline" size="sm" className="rounded-lg h-8"><Download className="w-4 h-4 mr-2" /> Receipt</Button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-sm font-bold text-muted-foreground mb-3">Route</div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20" />
                      <div className="w-0.5 h-10 bg-border" />
                      <div className="w-3 h-3 rounded-full bg-foreground ring-4 ring-foreground/10" />
                    </div>
                    <div>
                      <div className="mb-4">
                        <div className="font-bold text-base">Teaching Hospital</div>
                        <div className="text-xs text-muted-foreground">14:30 PM</div>
                      </div>
                      <div>
                        <div className="font-bold text-base">Castle Beach</div>
                        <div className="text-xs text-muted-foreground">14:55 PM</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="text-sm font-bold text-muted-foreground mb-3">Driver</div>
                  <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-2xl border border-border">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">KA</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-base">Kwame Asante</h4>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" /> 4.9 • Qiilu Car
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="text-sm font-bold text-muted-foreground mb-3">Payment</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Base Fare</span>
                      <span className="font-medium">GHS 25.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Distance (5.2 km)</span>
                      <span className="font-medium">GHS 3.00</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <span className="font-bold">Total Paid</span>
                      <span className="font-bold text-lg">GHS 28.00</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border text-center">
                  <p className="text-sm font-bold mb-3">How was your ride?</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`w-8 h-8 ${star <= 5 ? 'text-yellow-500 fill-current' : 'text-muted-foreground'} cursor-pointer`} />
                    ))}
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