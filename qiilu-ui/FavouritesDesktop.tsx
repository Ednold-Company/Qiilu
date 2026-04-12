import React, { useState } from 'react';
import { 
  Home, Car, MessageSquare, Heart, CreditCard, ShieldCheck, Bell, Sun, Moon, MapPin, Briefcase, Building, Plus, Star, MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FavouritesDesktop() {
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'places' | 'drivers'>('places');

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
          <NavItem icon={Heart} label="Favourites" active />
          <NavItem icon={CreditCard} label="Payment" />
          <NavItem icon={ShieldCheck} label="Safety" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
        <header className="h-20 border-b border-border bg-card flex items-center justify-between px-10 z-20 shrink-0">
          <h1 className="text-2xl font-bold">Favourites</h1>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
              <Bell className="w-5 h-5 text-foreground" />
            </div>
          </div>
        </header>

        <div className="flex-1 p-10 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex bg-card border border-border rounded-xl p-1 inline-flex">
              <button onClick={() => setActiveTab('places')} className={`px-8 py-2.5 text-sm font-bold rounded-lg ${activeTab === 'places' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Saved Places</button>
              <button onClick={() => setActiveTab('drivers')} className={`px-8 py-2.5 text-sm font-bold rounded-lg ${activeTab === 'drivers' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Favourite Drivers</button>
            </div>
            
            <Button className="h-12 px-6 rounded-xl font-bold shadow-md">
              <Plus className="w-5 h-5 mr-2" /> 
              {activeTab === 'places' ? 'Add New Place' : 'Add Driver by ID'}
            </Button>
          </div>

          {activeTab === 'places' && (
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-6">
              {[
                { icon: Home, name: 'Home', address: 'East Legon, Accra', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { icon: Briefcase, name: 'Work', address: 'KNUST Campus, Kumasi', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { icon: Building, name: 'Cape Coast Castle', address: 'Victoria Rd, Cape Coast', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                { icon: MapPin, name: 'Kotokuraba Market', address: 'Kotokuraba Rd, Cape Coast', color: 'text-lime-500', bg: 'bg-lime-500/10' }
              ].map((place, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col h-full">
                  <button className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  <div className={`w-16 h-16 rounded-2xl ${place.bg} flex items-center justify-center mb-6`}>
                    <place.icon className={`w-8 h-8 ${place.color}`} />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{place.name}</h3>
                  <p className="text-sm text-muted-foreground mb-8 flex-1">{place.address}</p>
                  <Button className="w-full rounded-xl font-bold bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors border-transparent">
                    Book Ride Here
                  </Button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'drivers' && (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
              {[
                { name: 'Kwame Asante', initials: 'KA', rating: '4.9', car: 'Toyota Corolla', rides: 47, since: '2021' },
                { name: 'Ama Boateng', initials: 'AB', rating: '4.8', car: 'Honda Civic', rides: 23, since: '2022' },
                { name: 'Samuel Osei', initials: 'SO', rating: '5.0', car: 'Nissan Yaris', rides: 12, since: '2023' }
              ].map((driver, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                        {driver.initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">{driver.name}</h3>
                        <div className="flex items-center text-sm font-medium text-muted-foreground mt-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" /> {driver.rating} • {driver.car}
                        </div>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <div className="font-bold text-lg">{driver.rides}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">Trips Together</div>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <div className="font-bold text-lg">{driver.since}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">Riding Since</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="rounded-xl h-12 border-border hover:bg-muted"><MessageSquare className="w-4 h-4 mr-2" /> Message</Button>
                    <Button className="rounded-xl h-12 shadow-md">Book Driver</Button>
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