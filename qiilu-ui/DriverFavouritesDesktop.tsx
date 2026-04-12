import React, { useState } from 'react';
import { 
  LayoutDashboard, ListOrdered, Car, MessageSquare, Wallet, BarChart3, Bell, Sun, Moon,
  MapPin, Heart, ShieldBan, Navigation, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DriverFavouritesDesktop() {
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState<'locations' | 'passengers'>('locations');

  const toggleTheme = () => setDark(!dark);

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
          <h1 className="text-2xl font-bold">Favourites</h1>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
              <Bell className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="flex-1 p-10 overflow-y-auto">
          <div className="flex bg-card border border-border rounded-xl p-1 inline-flex mb-8 shadow-sm">
            <button onClick={() => setActiveTab('locations')} className={`px-8 py-3 text-sm font-bold rounded-lg ${activeTab === 'locations' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>Favourite Locations</button>
            <button onClick={() => setActiveTab('passengers')} className={`px-8 py-3 text-sm font-bold rounded-lg ${activeTab === 'passengers' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>Favourite Passengers</button>
          </div>

          {activeTab === 'locations' && (
            <div className="grid grid-cols-2 gap-6">
              {[
                { name: 'Accra Mall', address: 'Spintex Road, Accra', visits: 142 },
                { name: 'KNUST Main Gate', address: 'Kumasi', visits: 89 },
                { name: 'Kotoka Airport', address: 'Airport City, Accra', visits: 256 },
                { name: 'Labadi Beach', address: 'Labadi, Accra', visits: 67 },
                { name: 'Osu Oxford Street', address: 'Osu, Accra', visits: 112 },
                { name: 'Tema Community 1', address: 'Tema', visits: 45 }
              ].map((loc, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between shadow-sm hover:border-foreground/30 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1">{loc.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{loc.address}</p>
                      <span className="bg-secondary/10 text-secondary text-[10px] font-bold uppercase px-2 py-1 rounded">
                        {loc.visits} Dropoffs
                      </span>
                    </div>
                  </div>
                  <Button className="rounded-xl h-12 px-6 font-bold shadow-md"><Navigation className="w-5 h-5 mr-2" /> Navigate</Button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'passengers' && (
            <div className="grid grid-cols-3 gap-6">
              {[
                { name: 'Samuel Osei', initials: 'SO', trips: 14, rating: '5.0', tip: 'GHS 15', color: 'from-blue-500 to-cyan-500' },
                { name: 'Grace Mensah', initials: 'GM', trips: 8, rating: '4.9', tip: 'GHS 10', color: 'from-purple-500 to-pink-500' },
                { name: 'Kwesi Appiah', initials: 'KA', trips: 5, rating: '5.0', tip: 'GHS 5', color: 'from-orange-500 to-amber-500' },
                { name: 'Ama Boateng', initials: 'AB', trips: 11, rating: '4.8', tip: 'GHS 12', color: 'from-emerald-500 to-teal-500' }
              ].map((p, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${p.color} flex items-center justify-center text-white font-bold text-2xl shadow-inner`}>
                        {p.initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{p.name}</h3>
                        <div className="flex items-center text-sm font-medium text-muted-foreground mt-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" /> {p.rating} Avg Rating
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
                    <div className="bg-muted/50 rounded-xl p-3 text-center border border-border/50">
                      <div className="font-bold text-xl">{p.trips}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">Trips Together</div>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 text-center border border-border/50">
                      <div className="font-bold text-xl text-secondary">{p.tip}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">Avg Tip</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl h-12 border-border hover:bg-muted"><Heart className="w-4 h-4 mr-2" /> Remove</Button>
                    <Button variant="outline" className="flex-1 rounded-xl h-12 border-destructive/30 text-destructive hover:bg-destructive/10"><ShieldBan className="w-4 h-4 mr-2" /> Block</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

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