import React, { useState } from 'react';
import { 
  Moon, Sun, Home, Navigation, Wallet, User, MapPin, Heart, Plus, Star, ShieldBan
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DriverFavourites() {
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState<'locations' | 'passengers'>('locations');

  const toggleTheme = () => setDark(!dark);

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 flex justify-between items-center bg-card/90 backdrop-blur border-b border-border">
        <h1 className="text-xl font-bold">Favourites</h1>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
           {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="pt-28 px-4 pb-24 h-full overflow-y-auto">
        <div className="flex bg-card border border-border rounded-xl p-1 mb-6">
          <button onClick={() => setActiveTab('locations')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'locations' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Locations</button>
          <button onClick={() => setActiveTab('passengers')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'passengers' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Passengers</button>
        </div>

        {activeTab === 'locations' && (
          <div className="space-y-4">
            {[
              { name: 'Accra Mall', address: 'Spintex Road, Accra', visits: 142 },
              { name: 'KNUST Main Gate', address: 'Kumasi', visits: 89 },
              { name: 'Kotoka Airport', address: 'Airport City, Accra', visits: 256 },
              { name: 'Labadi Beach', address: 'Labadi, Accra', visits: 67 }
            ].map((loc, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{loc.name}</h3>
                    <p className="text-xs text-muted-foreground truncate w-32">{loc.address}</p>
                    <p className="text-[10px] font-bold text-secondary uppercase mt-1">{loc.visits} dropoffs</p>
                  </div>
                </div>
                <Button className="rounded-xl font-bold px-4">Navigate</Button>
              </div>
            ))}
            
            <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 font-bold text-muted-foreground hover:text-foreground flex gap-2">
              <Plus className="w-5 h-5" /> Add Favorite Location
            </Button>
          </div>
        )}

        {activeTab === 'passengers' && (
          <div className="space-y-4">
            {[
              { name: 'Samuel Osei', initials: 'SO', trips: 14, rating: '5.0', tip: 'GHS 15' },
              { name: 'Grace Mensah', initials: 'GM', trips: 8, rating: '4.9', tip: 'GHS 10' },
              { name: 'Kwesi Appiah', initials: 'KA', trips: 5, rating: '5.0', tip: 'GHS 5' }
            ].map((p, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {p.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{p.name}</h3>
                      <div className="text-xs font-medium text-muted-foreground">
                        {p.trips} trips together
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-bold justify-end">
                      {p.rating} <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Avg Tip: {p.tip}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl h-10 border-border text-xs"><Heart className="w-4 h-4 mr-2" /> Unfavorite</Button>
                  <Button variant="outline" className="flex-1 rounded-xl h-10 border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"><ShieldBan className="w-4 h-4 mr-2" /> Block</Button>
                </div>
              </div>
            ))}
          </div>
        )}
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