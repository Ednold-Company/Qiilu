import React, { useState } from 'react';
import { 
  Home, MapPin, Car, MessageSquare, Heart, User, Bell, Sun, Moon, CreditCard, Clock, ChevronRight, CheckCircle2, ShieldCheck, Bus, Bike
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PassengerDesktop() {
  const [dark, setDark] = useState(false);
  const [step, setStep] = useState<'booking' | 'riding'>('booking');

  const toggleTheme = () => setDark(!dark);

  return (
    <div className={`w-full h-screen flex bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-border bg-card flex flex-col justify-between shrink-0 z-20">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl tracking-tighter">Q</div>
            <span className="font-bold text-2xl tracking-tight">Qiilu</span>
          </div>

          <nav className="px-4 py-2 space-y-2">
            <NavItem icon={Home} label="Home" active />
            <NavItem icon={Car} label="My Rides" />
            <NavItem icon={MessageSquare} label="Messages" badge="2" />
            <NavItem icon={Heart} label="Favourites" />
            <NavItem icon={CreditCard} label="Payment" />
            <NavItem icon={ShieldCheck} label="Safety" />
          </nav>
        </div>

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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-6 z-20 sticky top-0">
          <h1 className="text-lg font-bold">Book a Ride</h1>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative cursor-pointer border border-border hover:bg-accent transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary border-2 border-background" />
            </div>
          </div>
        </header>

        {/* Content Layout: Map + Panel */}
        <div className="flex-1 flex relative overflow-hidden">
          
          {/* Map Area */}
          <div className="flex-1 relative bg-[#e5e3df] dark:bg-[#1a1c1e]">
            {/* Map Pattern */}
            <div className="absolute inset-0 opacity-20 dark:opacity-10" 
                style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            
            {/* Route Mock */}
            {step === 'riding' && (
              <>
                <svg className="absolute inset-0 w-full h-full z-10" preserveAspectRatio="none">
                  <path d="M 300 500 Q 500 300 700 200" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round" strokeDasharray="10 10" className="animate-[dash_20s_linear_infinite]" />
                </svg>
                {/* Car Marker */}
                <div className="absolute top-[300px] left-[500px] z-20 animate-pulse transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                      <Car className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Pins */}
            <div className="absolute top-[200px] left-[700px] z-20 flex flex-col items-center transform -translate-x-1/2 -translate-y-full">
              <div className="bg-foreground text-background text-xs px-3 py-1.5 rounded-full font-bold mb-2 shadow-lg whitespace-nowrap">Kotoka Airport</div>
              <div className="w-4 h-4 rounded-full bg-foreground border-2 border-background shadow-md" />
            </div>
            
            <div className="absolute top-[500px] left-[300px] z-20 flex flex-col items-center transform -translate-x-1/2 -translate-y-full">
              <div className="bg-primary text-white text-xs px-3 py-1.5 rounded-full font-bold mb-2 shadow-lg whitespace-nowrap">Accra Mall</div>
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md" />
            </div>

          </div>

          {/* Right Panel */}
          <div className="w-[450px] border-l border-border bg-background shadow-[-10px_0_40px_rgba(0,0,0,0.05)] z-20 flex flex-col shrink-0">
            
            {step === 'booking' && (
              <div className="p-6 flex flex-col h-full overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">Where can we take you?</h2>
                
                {/* Location Form */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-8 relative">
                  <div className="absolute left-[31px] top-10 bottom-10 w-0.5 bg-border z-0" />
                  
                  <div className="relative z-10 flex items-center gap-4 mb-4">
                    <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-card shrink-0" />
                    <Input placeholder="Pickup location" defaultValue="Accra Mall, Spintex Rd" className="h-12 bg-muted/50 focus:bg-background border-transparent" />
                  </div>
                  
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-foreground ring-4 ring-card shrink-0" />
                    <Input placeholder="Dropoff destination" defaultValue="Kotoka International Airport" className="h-12 bg-muted/50 focus:bg-background border-transparent" />
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-4">Available Options</h3>
                
                {/* Ride Types Grid */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                  {['All', 'Economy', 'Comfort', 'Large'].map((tab, i) => (
                    <button key={i} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border ${i === 0 ? 'bg-foreground text-background border-foreground' : 'bg-card border-border text-foreground hover:bg-muted'}`}>
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Ride Cards */}
                <div className="space-y-3 flex-1">
                  {[
                    { name: 'Qiilu Car', icon: Car, time: '3 min', price: 'GHS 45.00', seats: 4, highlight: true },
                    { name: 'Comfort', icon: Car, time: '5 min', price: 'GHS 60.00', seats: 4 },
                    { name: 'Mini Van', icon: Bus, time: '12 min', price: 'GHS 120.00', seats: 8 },
                  ].map((ride, i) => (
                    <div key={i} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${ride.highlight ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border bg-card hover:border-foreground/30'}`}>
                      <div className="flex items-center gap-4">
                        <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${ride.name}`} className="w-16 h-12 object-contain mix-blend-multiply dark:invert" alt="Car" />
                        <div>
                          <h4 className="font-bold">{ride.name}</h4>
                          <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                            <span>{ride.time} away</span>
                            <span className="flex items-center"><User className="w-3 h-3 mr-0.5" /> {ride.seats}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{ride.price}</div>
                        {ride.highlight && <div className="text-[10px] font-bold text-primary uppercase mt-1">Recommended</div>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Mobile Money</div>
                        <div className="text-xs text-muted-foreground">024 •••• 1234</div>
                      </div>
                    </div>
                    <button className="text-sm font-semibold text-primary">Change</button>
                  </div>
                  <Button size="lg" className="w-full h-14 text-lg rounded-xl shadow-lg" onClick={() => setStep('riding')}>
                    Confirm Qiilu Car
                  </Button>
                </div>
              </div>
            )}

            {step === 'riding' && (
              <div className="flex flex-col h-full bg-card">
                <div className="bg-primary p-8 text-primary-foreground">
                  <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-bold mb-4">
                    <CheckCircle2 className="w-4 h-4" /> Driver is on the way
                  </div>
                  <h2 className="text-4xl font-extrabold mb-2">3 min</h2>
                  <p className="opacity-90">Arriving at Accra Mall</p>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  {/* Driver Profile */}
                  <div className="bg-background rounded-2xl border border-border p-5 mb-6 shadow-sm relative -mt-12">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 p-1">
                          <div className="w-full h-full bg-card rounded-full border-2 border-background flex items-center justify-center text-xl font-bold">
                            AM
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-xl">Ama Mensah</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <StarIcon /> 4.9 (2,403 trips)
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center bg-muted/50 rounded-xl p-4 mb-4">
                      <div>
                        <div className="text-sm font-bold">Toyota Corolla</div>
                        <div className="text-xs text-muted-foreground">White</div>
                      </div>
                      <div className="font-mono font-bold text-lg px-3 py-1 bg-background border border-border rounded-lg">
                        GW-1234-22
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-12 rounded-xl border-border"><MessageSquare className="w-4 h-4 mr-2" /> Message</Button>
                      <Button variant="secondary" className="h-12 rounded-xl text-secondary-foreground"><Clock className="w-4 h-4 mr-2" /> Share ETA</Button>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="bg-background border border-border rounded-2xl p-5 mb-auto">
                    <h3 className="font-bold mb-4">Trip Details</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">Fare</div>
                        <div className="font-bold">GHS 45.00</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">Payment</div>
                        <div className="font-bold">Mobile Money</div>
                      </div>
                      <div className="pt-4 border-t border-border flex gap-4">
                        <Button variant="ghost" className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10">Cancel Ride</Button>
                        <Button variant="ghost" className="flex-1 text-primary hover:text-primary hover:bg-primary/10">SOS Support</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500 mr-1">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  )
}
