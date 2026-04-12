import React, { useState } from 'react';
import { 
  Moon, Sun, Home, Car, Navigation, Wallet, User, CheckCircle2, ChevronDown, ChevronUp, MapPin, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DriverRides() {
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('past');
  const [expandedTrip, setExpandedTrip] = useState<number | null>(0);

  const toggleTheme = () => setDark(!dark);

  const pastTrips = [
    { id: 0, passenger: 'Kwame Asante', route: 'Labadi Beach → Osu', gross: '45.00', commission: '6.75', net: '38.25', type: 'App Request', method: 'MoMo', date: 'Today, 14:30' },
    { id: 1, passenger: 'Ama Kofi', route: 'Accra Mall → East Legon', gross: '35.00', commission: '5.25', net: '29.75', type: 'App Request', method: 'Cash', date: 'Today, 12:15' },
    { id: 2, passenger: 'Samuel Osei', route: 'Makola → Circle', gross: '20.00', commission: '3.00', net: '17.00', type: 'USSD (*920#)', method: 'MoMo', date: 'Yesterday, 18:45' },
    { id: 3, passenger: 'Grace Mensah', route: 'Kotoka Airport → Spintex', gross: '85.00', commission: '12.75', net: '72.25', type: 'App Request', method: 'MoMo', date: 'Yesterday, 10:00' },
    { id: 4, passenger: 'John Doe', route: 'UCC Gate → Cape Coast', gross: '25.00', commission: '3.75', net: '21.25', type: 'App Request', method: 'Cash', date: 'Oct 10, 08:30' }
  ];

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 flex justify-between items-center bg-card/90 backdrop-blur border-b border-border">
        <h1 className="text-xl font-bold">Ride History</h1>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
           {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="pt-28 px-4 pb-24 h-full overflow-y-auto bg-background">
        <div className="flex bg-card border border-border rounded-xl p-1 mb-6">
          <button onClick={() => setActiveTab('upcoming')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'upcoming' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Upcoming</button>
          <button onClick={() => setActiveTab('past')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'past' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Past</button>
          <button onClick={() => setActiveTab('cancelled')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'cancelled' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Cancelled</button>
        </div>

        {activeTab === 'past' && (
          <div className="space-y-4">
            {pastTrips.map((trip) => (
              <div key={trip.id} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-all">
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/30"
                  onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{trip.passenger}</div>
                        <div className="text-[10px] text-muted-foreground">{trip.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-secondary">GHS {trip.net}</div>
                      <div className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 uppercase inline-block mt-1">
                        -15% Comm
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 font-medium truncate max-w-[200px]">
                      <MapPin className="w-3 h-3" /> {trip.route}
                    </div>
                    {expandedTrip === trip.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {expandedTrip === trip.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/10">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gross Fare</span>
                        <span className="font-medium">GHS {trip.gross}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Qiilu Commission (15%)</span>
                        <span className="font-medium text-destructive">-GHS {trip.commission}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="font-bold">Net Earnings</span>
                        <span className="font-bold text-secondary">GHS {trip.net}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
                        <div className="bg-card border border-border p-2 rounded-lg text-center">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold">Payment</div>
                          <div className="font-bold text-sm">{trip.method}</div>
                        </div>
                        <div className="bg-card border border-border p-2 rounded-lg text-center">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold">Type</div>
                          <div className="font-bold text-sm">{trip.type}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="bg-blue-500/10 text-blue-500 text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><Calendar className="w-3 h-3" /> SCHEDULED</span>
                <span className="font-bold text-lg">GHS 85.00</span>
              </div>
              <h3 className="font-bold text-lg mb-1">Grace Mensah</h3>
              <p className="text-sm text-primary font-bold mb-4">Tomorrow at 08:00 AM</p>
              
              <div className="flex gap-3 mb-4">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-0.5 h-6 bg-border" />
                  <div className="w-2 h-2 rounded-full bg-foreground" />
                </div>
                <div>
                  <div className="font-bold text-sm mb-2">KNUST Campus</div>
                  <div className="font-bold text-sm text-muted-foreground">Kumasi Airport</div>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="bg-blue-500/10 text-blue-500 text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><Calendar className="w-3 h-3" /> SCHEDULED</span>
                <span className="font-bold text-lg">GHS 120.00</span>
              </div>
              <h3 className="font-bold text-lg mb-1">John Doe</h3>
              <p className="text-sm text-primary font-bold mb-4">Friday at 14:00 PM</p>
              
              <div className="flex gap-3">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-0.5 h-6 bg-border" />
                  <div className="w-2 h-2 rounded-full bg-foreground" />
                </div>
                <div>
                  <div className="font-bold text-sm mb-2">Accra Mall</div>
                  <div className="font-bold text-sm text-muted-foreground">Cape Coast Castle</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-card border-t border-border flex justify-around items-center px-4 pb-4 pt-2 z-30">
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground">
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>
        <button className="flex flex-col items-center text-primary">
          <Navigation className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-semibold">Rides</span>
        </button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground">
          <Wallet className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-semibold">Wallet</span>
        </button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground">
          <User className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-semibold">Account</span>
        </button>
      </div>
    </div>
  );
}