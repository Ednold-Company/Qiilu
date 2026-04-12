import React, { useState } from 'react';
import { 
  Menu, Bell, Moon, Sun, Home, Car, MessageSquare, User, MapPin, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MyRides() {
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  const toggleTheme = () => setDark(!dark);

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 flex justify-between items-center bg-background/90 backdrop-blur border-b border-border">
        <h1 className="text-xl font-bold">My Rides</h1>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
           {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Content */}
      <div className="pt-28 px-6 pb-24 h-full overflow-y-auto">
        <div className="flex bg-muted rounded-xl p-1 mb-6">
          <button onClick={() => setActiveTab('upcoming')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'upcoming' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Upcoming</button>
          <button onClick={() => setActiveTab('past')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'past' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Past</button>
          <button onClick={() => setActiveTab('cancelled')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'cancelled' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Cancelled</button>
        </div>

        <div className="space-y-4">
          {activeTab === 'upcoming' && (
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="bg-orange-500/10 text-orange-500 text-xs font-bold px-2 py-1 rounded">UPCOMING</span>
                <span className="font-bold">GHS 45.00</span>
              </div>
              <div className="flex gap-3 mb-4">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-0.5 h-6 bg-border" />
                  <div className="w-2 h-2 rounded-full bg-foreground" />
                </div>
                <div>
                  <div className="font-bold text-sm mb-2">UCC Main Gate</div>
                  <div className="font-bold text-sm text-muted-foreground">Kotokuraba Market</div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border text-sm">
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /> In 15 mins</div>
                <div className="bg-secondary/10 text-secondary px-2 py-1 rounded font-bold text-xs">MoMo</div>
              </div>
            </div>
          )}
          {activeTab === 'past' && (
            [
              { price: '28.00', from: 'Teaching Hospital', to: 'Castle Beach', type: 'Qiilu Car', driver: 'Kwame A. (4.9★)', date: 'Oct 12, 14:30' },
              { price: '120.00', from: 'Accra Mall', to: 'Kotoka Airport', type: 'Mini Van', driver: 'Ama B. (4.8★)', date: 'Oct 10, 09:15' },
              { price: '15.00', from: 'Osu Oxford St', to: 'Labadi Beach', type: 'Tricycle', driver: 'Kofi S. (4.7★)', date: 'Oct 8, 18:45' }
            ].map((trip, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-lime-500/10 text-lime-500 text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> COMPLETED</span>
                  <span className="font-bold">GHS {trip.price}</span>
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="w-0.5 h-6 bg-border" />
                    <div className="w-2 h-2 rounded-full bg-foreground" />
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-2">{trip.from}</div>
                    <div className="font-bold text-sm text-muted-foreground">{trip.to}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border text-sm">
                  <div className="text-muted-foreground text-xs">{trip.date} • {trip.driver}</div>
                  <div className="bg-muted px-2 py-1 rounded font-bold text-xs">Cash</div>
                </div>
              </div>
            ))
          )}
          {activeTab === 'cancelled' && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <XCircle className="w-12 h-12 text-muted-foreground mb-3 opacity-20" />
              <h3 className="font-bold text-lg">No cancelled rides</h3>
              <p className="text-sm text-muted-foreground">You have a great track record!</p>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button className="absolute bottom-24 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center">
        <Car className="w-6 h-6" />
      </button>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-background border-t border-border flex justify-around items-center px-6 pb-4 pt-2 z-30">
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground">
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>
        <button className="flex flex-col items-center text-primary">
          <Car className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-semibold">Rides</span>
        </button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground">
          <MessageSquare className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-semibold">Messages</span>
        </button>
        <button className="flex flex-col items-center text-muted-foreground hover:text-foreground">
          <User className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-semibold">Account</span>
        </button>
      </div>
    </div>
  );
}