import React, { useState } from 'react';
import { 
  LayoutDashboard, ListOrdered, Car, MessageSquare, Wallet, BarChart3, Bell, Sun, Moon,
  Search, MapPin, Calendar, Clock, ChevronRight, CheckCircle2, ShieldAlert, Download, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DriverRidesDesktop() {
  const [dark, setDark] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<number>(0);

  const toggleTheme = () => setDark(!dark);

  const trips = [
    { id: 0, passenger: 'Kwame Asante', route: 'Labadi Beach → Osu', gross: '45.00', commission: '6.75', net: '38.25', type: 'App Request', method: 'MoMo', date: 'Today, 14:30', status: 'completed' },
    { id: 1, passenger: 'Ama Kofi', route: 'Accra Mall → East Legon', gross: '35.00', commission: '5.25', net: '29.75', type: 'App Request', method: 'Cash', date: 'Today, 12:15', status: 'completed' },
    { id: 2, passenger: 'Samuel Osei', route: 'Makola → Circle', gross: '20.00', commission: '3.00', net: '17.00', type: 'USSD (*920#)', method: 'MoMo', date: 'Yesterday, 18:45', status: 'completed' },
    { id: 3, passenger: 'Grace Mensah', route: 'Kotoka Airport → Spintex', gross: '85.00', commission: '12.75', net: '72.25', type: 'App Request', method: 'MoMo', date: 'Yesterday, 10:00', status: 'completed' },
    { id: 4, passenger: 'John Doe', route: 'UCC Gate → Cape Coast', gross: '25.00', commission: '3.75', net: '21.25', type: 'App Request', method: 'Cash', date: 'Oct 10, 08:30', status: 'cancelled' },
    { id: 5, passenger: 'Nana Yaa', route: 'Tema Com 1 → Accra Mall', gross: '90.00', commission: '13.50', net: '76.50', type: 'Scheduled', method: 'MoMo', date: 'Oct 09, 15:20', status: 'completed' }
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
          <NavItem icon={Car} label="My Rides" active />
          <NavItem icon={MessageSquare} label="Messages" />
          <NavItem icon={Wallet} label="Earnings Wallet" />
          <NavItem icon={BarChart3} label="Performance" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
        <header className="h-20 border-b border-border bg-card px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <h1 className="text-2xl font-bold">Ride History</h1>
          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9 h-10 rounded-full bg-muted/50 border-none" placeholder="Search passenger or location..." />
            </div>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
              <Bell className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* List Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="flex items-center gap-4 mb-8">
              <select className="bg-card border border-border rounded-xl px-4 py-2 font-medium text-sm outline-none">
                <option>All Statuses</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
              <select className="bg-card border border-border rounded-xl px-4 py-2 font-medium text-sm outline-none">
                <option>All Types</option>
                <option>App Request</option>
                <option>USSD (*920#)</option>
                <option>Scheduled</option>
              </select>
              <select className="bg-card border border-border rounded-xl px-4 py-2 font-medium text-sm outline-none">
                <option>Last 7 Days</option>
                <option>This Month</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {trips.map((trip) => (
                <div 
                  key={trip.id} 
                  onClick={() => setSelectedTrip(trip.id)}
                  className={`bg-card border-2 rounded-2xl p-5 cursor-pointer transition-all ${selectedTrip === trip.id ? 'border-primary shadow-md' : 'border-border shadow-sm hover:border-foreground/20'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${trip.status === 'completed' ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'}`}>
                        {trip.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold">{trip.passenger}</div>
                        <div className="text-xs text-muted-foreground">{trip.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-secondary">GHS {trip.net}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">Net Earned</div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2 text-sm font-medium mb-4 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0 text-foreground" />
                    <span className="truncate">{trip.route}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{trip.type}</span>
                    <span className="bg-muted text-foreground text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{trip.method}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details Panel */}
          <div className="w-[450px] border-l border-border bg-card shadow-[-10px_0_40px_rgba(0,0,0,0.05)] z-10 flex flex-col shrink-0">
            <div className="h-48 bg-[#e5e3df] dark:bg-[#1a1c1e] relative shrink-0">
              <div className="absolute inset-0 opacity-20 dark:opacity-10" 
                  style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <svg className="absolute inset-0 w-full h-full z-10" preserveAspectRatio="none">
                <path d="M 100 100 Q 200 50 350 150" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" />
              </svg>
              <div className="absolute top-[100px] left-[100px] w-4 h-4 rounded-full bg-foreground border-2 border-background shadow-md z-20 transform -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute top-[150px] left-[350px] w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md z-20 transform -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {trips.filter(t => t.id === selectedTrip).map(trip => (
                <div key={trip.id} className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">{trip.passenger}</h2>
                      <p className="text-muted-foreground">{trip.date}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${trip.status === 'completed' ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'}`}>
                      {trip.status}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative pl-6 py-2 border-l-2 border-border ml-2">
                      <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full bg-foreground border-4 border-card" />
                      <div className="absolute -left-[9px] bottom-3 w-4 h-4 rounded-full bg-primary border-4 border-card" />
                      
                      <div className="mb-6">
                        <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Pickup</div>
                        <div className="font-bold text-base">{trip.route.split(' → ')[0]}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Dropoff</div>
                        <div className="font-bold text-base">{trip.route.split(' → ')[1]}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 border border-border rounded-2xl p-5">
                    <h3 className="font-bold text-lg mb-4">Fare Breakdown</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Gross Fare Paid</span>
                        <span className="font-medium text-foreground">GHS {trip.gross}</span>
                      </div>
                      <div className="flex justify-between items-center text-destructive">
                        <span>Qiilu Commission (15%)</span>
                        <span className="font-medium">-GHS {trip.commission}</span>
                      </div>
                      <div className="pt-3 border-t border-border flex justify-between items-center">
                        <span className="font-bold text-base text-foreground">Net Earnings</span>
                        <span className="font-extrabold text-xl text-secondary">GHS {trip.net}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border p-4 rounded-2xl text-center">
                      <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Payment Method</div>
                      <div className="font-bold">{trip.method}</div>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-2xl text-center">
                      <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Trip Type</div>
                      <div className="font-bold">{trip.type}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button variant="outline" className="rounded-xl h-12"><Share2 className="w-4 h-4 mr-2" /> Share Details</Button>
                    <Button className="rounded-xl h-12 shadow-md"><Download className="w-4 h-4 mr-2" /> Receipt</Button>
                  </div>
                </div>
              ))}
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