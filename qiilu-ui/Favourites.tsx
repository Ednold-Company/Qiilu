import React, { useState } from 'react';
import { 
  Moon, Sun, Home, Car, MessageSquare, User, MapPin, Star, Plus, Briefcase, Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Favourites() {
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'places' | 'drivers'>('places');

  const toggleTheme = () => setDark(!dark);

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 flex justify-between items-center bg-background/90 backdrop-blur border-b border-border">
        <h1 className="text-xl font-bold">Favourites</h1>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
           {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="pt-28 px-6 pb-24 h-full overflow-y-auto">
        <div className="flex bg-muted rounded-xl p-1 mb-6">
          <button onClick={() => setActiveTab('places')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'places' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Saved Places</button>
          <button onClick={() => setActiveTab('drivers')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'drivers' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Drivers</button>
        </div>

        {activeTab === 'places' && (
          <div className="space-y-4">
            {[
              { icon: Home, name: 'Home', address: 'East Legon, Accra', color: 'bg-blue-500' },
              { icon: Briefcase, name: 'Work', address: 'KNUST Campus', color: 'bg-purple-500' },
              { icon: Building, name: 'Cape Coast Castle', address: 'Victoria Rd, Cape Coast', color: 'bg-orange-500' },
              { icon: MapPin, name: 'Kotokuraba Market', address: 'Kotokuraba Rd, Cape Coast', color: 'bg-lime-500' }
            ].map((place, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${place.color} bg-opacity-10 flex items-center justify-center text-foreground`}>
                    <place.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">{place.name}</h3>
                    <p className="text-xs text-muted-foreground">{place.address}</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="rounded-full px-4 h-8 text-xs font-bold">Book</Button>
              </div>
            ))}
            
            <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 font-bold text-muted-foreground hover:text-foreground flex gap-2">
              <Plus className="w-5 h-5" /> Add New Place
            </Button>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="space-y-4">
            {[
              { name: 'Kwame Asante', initials: 'KA', rating: '4.9', car: 'Toyota Corolla', rides: 47 },
              { name: 'Ama Boateng', initials: 'AB', rating: '4.8', car: 'Honda Civic', rides: 23 }
            ].map((driver, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                      {driver.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{driver.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" /> {driver.rating} • {driver.car}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 mb-4 text-sm flex items-center gap-2">
                  <span className="font-bold">{driver.rides}</span> rides together
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="rounded-xl"><MessageSquare className="w-4 h-4 mr-2" /> Message</Button>
                  <Button className="rounded-xl shadow-md">Book Driver</Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 font-bold text-muted-foreground hover:text-foreground flex gap-2">
              <Plus className="w-5 h-5" /> Add Driver by ID
            </Button>
          </div>
        )}
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