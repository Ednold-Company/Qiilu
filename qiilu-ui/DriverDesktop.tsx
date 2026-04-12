import React, { useState } from 'react';
import { 
  LayoutDashboard, MapPin, ListOrdered, MessageSquare, Wallet, User, Bell, Sun, Moon, 
  Power, TrendingUp, Car, Calendar, Navigation, Phone, ShieldAlert, ChevronRight, BarChart3,
  CheckCircle2, Clock, Star, Home, AlertTriangle, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DriverDesktop() {
  const [dark, setDark] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const toggleTheme = () => setDark(!dark);

  return (
    <div className={`w-full h-screen flex bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col justify-between shrink-0 z-20">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl tracking-tighter">Q</div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none">Qiilu</span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Driver Partner</span>
            </div>
          </div>

          <nav className="px-4 py-4 space-y-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" active />
            <NavItem icon={ListOrdered} label="Requests" badge="3" />
            <NavItem icon={Car} label="My Rides" />
            <NavItem icon={MessageSquare} label="Messages" />
            <NavItem icon={Wallet} label="Earnings Wallet" />
            <NavItem icon={BarChart3} label="Performance" />
          </nav>
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
            <div className="w-10 h-10 rounded-full bg-card border-2 border-background flex items-center justify-center font-bold">EK</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">Emmanuel K.</div>
              <div className="flex items-center text-xs font-medium text-yellow-500">
                4.8 ★ <span className="text-muted-foreground ml-1">Pro</span>
              </div>
            </div>
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
        
        {/* Header */}
        <header className="h-20 border-b border-border bg-card px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${isOnline ? 'bg-secondary/10 border-secondary/30 text-secondary' : 'bg-muted border-border text-muted-foreground'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-secondary animate-pulse' : 'bg-muted-foreground'}`} />
              <span className="text-sm font-bold uppercase tracking-wider">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setIsOnline(!isOnline)} 
              variant={isOnline ? "outline" : "default"}
              className={`rounded-full px-6 font-bold ${isOnline ? 'border-border' : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'}`}
            >
              <Power className="w-4 h-4 mr-2" />
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Button>
            <div className="h-8 w-px bg-border" />
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative cursor-pointer hover:bg-accent transition-colors">
              <Bell className="w-5 h-5" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-destructive border-2 border-muted" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 grid grid-cols-12 gap-8">
          
          {/* Left Column (Main) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
            
            {/* Earnings Hero */}
            <div className="bg-gradient-to-br from-primary to-orange-600 rounded-[2rem] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              
              <div className="relative z-10 flex justify-between items-end">
                <div>
                  <div className="text-white/80 font-medium mb-2 uppercase tracking-wide text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> This Week's Earnings
                  </div>
                  <div className="text-5xl font-extrabold tracking-tight">
                    <span className="text-2xl opacity-80 mr-2">GHS</span>320.00
                  </div>
                </div>
                <Button className="bg-white text-primary hover:bg-white/90 rounded-xl font-bold shadow-sm">
                  Cash Out
                </Button>
              </div>
              
              <div className="relative z-10 grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/20">
                <div>
                  <div className="text-white/70 text-sm mb-1">Completed Trips</div>
                  <div className="text-2xl font-bold">24</div>
                </div>
                <div>
                  <div className="text-white/70 text-sm mb-1">Hours Online</div>
                  <div className="text-2xl font-bold">18.5</div>
                </div>
                <div>
                  <div className="text-white/70 text-sm mb-1">Acceptance Rate</div>
                  <div className="text-2xl font-bold">96%</div>
                </div>
              </div>
            </div>

            {/* Incoming Requests */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                  </span>
                  Active Requests
                </h3>
                <Button variant="ghost" className="text-primary hover:text-primary">View All <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <RequestCard 
                  type="app" 
                  price="45.00" 
                  pickup="Labadi Beach" 
                  dropoff="Osu Oxford Street" 
                  dist="4.2 km" 
                  time="15" 
                  timeLeft={24} 
                />
                <RequestCard 
                  type="ussd" 
                  price="20.00" 
                  pickup="Makola Market" 
                  dropoff="Circle" 
                  dist="1.8 km" 
                  time="8" 
                  timeLeft={45} 
                />
                <RequestCard 
                  type="scheduled" 
                  price="85.00" 
                  pickup="KNUST Campus" 
                  dropoff="Kumasi Airport" 
                  dist="12.5 km" 
                  time="35" 
                  timeStr="Tomorrow, 08:00" 
                  timeLeft={null} 
                />
              </div>
            </div>

            {/* Map Preview (Active Ride) */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
              <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold">Next Pickup Location</h4>
                    <p className="text-sm text-muted-foreground">Labadi Beach Hotel, Accra</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-secondary">4 min</div>
                  <div className="text-sm font-medium">1.2 km away</div>
                </div>
              </div>
              <div className="flex-1 bg-[#e5e3df] dark:bg-[#1a1c1e] relative">
                <div className="absolute inset-0 opacity-20 dark:opacity-10" 
                    style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                
                {/* Mock Map Route */}
                <svg className="absolute inset-0 w-full h-full z-10" preserveAspectRatio="none">
                  <path d="M 200 100 Q 400 200 600 150" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round" strokeDasharray="10 10" />
                </svg>

                {/* Car Marker */}
                <div className="absolute top-[100px] left-[200px] z-20 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-10 h-10 bg-background rounded-full border-2 border-border shadow-lg flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-foreground transform rotate-45" />
                  </div>
                </div>

                {/* Destination Pin */}
                <div className="absolute top-[150px] left-[600px] z-20 flex flex-col items-center transform -translate-x-1/2 -translate-y-full">
                  <div className="bg-primary text-white text-xs px-3 py-1 rounded-full font-bold mb-1 shadow-lg">Pickup</div>
                  <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md" />
                </div>
              </div>
              <div className="p-4 border-t border-border flex justify-between items-center bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    SA
                  </div>
                  <div>
                    <h5 className="font-bold">Samuel A.</h5>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      Cash Trip • 4.9 ★
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl"><Phone className="w-4 h-4 mr-2" /> Call</Button>
                  <Button className="rounded-xl px-8 shadow-md">Arrived</Button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Sidebar) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            
            {/* Chart Widget */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Earnings Overview</h3>
                <select className="bg-muted text-sm border-none rounded-lg px-2 py-1 outline-none">
                  <option>This Week</option>
                  <option>Last Week</option>
                </select>
              </div>
              
              <div className="h-48 flex items-end justify-between gap-2 mb-4">
                {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                  <div key={i} className="w-full relative group">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      {h * 2}
                    </div>
                    <div 
                      className={`w-full rounded-t-sm transition-colors ${i === 6 ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'}`} 
                      style={{ height: `${h}%` }} 
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-medium border-t border-border pt-3">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span className="text-primary font-bold">Sun</span>
              </div>
            </div>

            {/* Recent Trips */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex-1">
              <h3 className="font-bold text-lg mb-6">Today's Trips</h3>
              
              <div className="space-y-4">
                {[
                  { time: '10:45 AM', price: '35.00', status: 'completed', dest: 'Accra Mall' },
                  { time: '09:20 AM', price: '42.50', status: 'completed', dest: 'Kotoka Airport' },
                  { time: '08:15 AM', price: '15.00', status: 'cancelled', dest: 'East Legon' },
                  { time: '07:30 AM', price: '50.00', status: 'completed', dest: 'Tema Com 1' },
                ].map((trip, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${trip.status === 'completed' ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'}`}>
                        {trip.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm">{trip.dest}</h5>
                        <p className="text-xs text-muted-foreground">{trip.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">GHS {trip.price}</div>
                      <div className={`text-[10px] font-bold uppercase ${trip.status === 'completed' ? 'text-secondary' : 'text-destructive'}`}>
                        {trip.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-6 rounded-xl">View Trip History</Button>
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

function RequestCard({ type, price, pickup, dropoff, dist, time, timeLeft, timeStr }: any) {
  const isApp = type === 'app';
  const isUssd = type === 'ussd';
  const isScheduled = type === 'scheduled';

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full">
      {timeLeft && (
        <div className="absolute top-0 left-0 w-full h-1 bg-muted">
          <div className="h-full bg-primary" style={{ width: `${(timeLeft / 60) * 100}%` }} />
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4 mt-2">
        <div>
          {isApp && <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">App Request</span>}
          {isUssd && <span className="bg-purple-500/10 text-purple-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">USSD (*920#)</span>}
          {isScheduled && <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Scheduled</span>}
          <div className="text-2xl font-extrabold mt-1 tracking-tight">GHS {price}</div>
        </div>
        {timeLeft ? (
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {timeLeft}s
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Calendar className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-center text-sm text-muted-foreground font-medium gap-3 mb-4">
        <span>{dist}</span> • <span>{time} mins</span>
        {timeStr && <span>• {timeStr}</span>}
      </div>

      <div className="space-y-3 mb-6 relative pl-3 border-l border-border flex-1">
        <div className="relative">
          <div className="absolute -left-[15px] top-1.5 w-2 h-2 rounded-full bg-primary" />
          <div className="text-sm font-bold leading-tight">{pickup}</div>
        </div>
        <div className="relative">
          <div className="absolute -left-[15px] top-1.5 w-2 h-2 rounded-full bg-foreground" />
          <div className="text-sm font-bold leading-tight">{dropoff}</div>
        </div>
      </div>

      {isScheduled ? (
        <Button className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold">
          Accept Schedule
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Button variant="outline" className="rounded-xl border-border">Reject</Button>
          <Button className="rounded-xl shadow-md font-bold">Accept</Button>
        </div>
      )}
    </div>
  );
}