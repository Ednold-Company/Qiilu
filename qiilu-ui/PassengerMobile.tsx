import React, { useState } from 'react';
import { 
  Menu, Bell, Moon, Sun, MapPin, Search, ArrowDownUp,
  Car, Bike, Bus, User, Settings, MessageSquare, Home, CreditCard, Navigation, CheckCircle2, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PassengerMobile() {
  const [dark, setDark] = useState(false);
  const [step, setStep] = useState<'booking' | 'searching' | 'riding'>('booking');
  const [selectedRide, setSelectedRide] = useState<number | null>(0);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const toggleTheme = () => setDark(!dark);

  const rideOptions = [
    { id: 0, name: 'Qiilu Car', icon: Car, seats: 4, time: '3 min', price: 'GHS 45.00', recommended: true },
    { id: 1, name: 'Tricycle', icon: Bike, seats: 2, time: '5 min', price: 'GHS 20.00', recommended: false },
    { id: 2, name: 'Mini Van', icon: Bus, seats: 12, time: '8 min', price: 'GHS 60.00', recommended: false },
  ];

  const handleRequest = () => {
    setStep('searching');
    setTimeout(() => {
      setStep('riding');
    }, 2000);
  };

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      
      {/* Map Background Mock */}
      <div className="absolute inset-0 bg-[#e5e3df] dark:bg-[#1a1c1e] z-0 overflow-hidden">
        {/* Map grid/roads pattern */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Route Line Mock */}
        {step === 'riding' && (
          <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 390 844">
            <path d="M 195 400 Q 250 350 220 250 T 150 150" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round" strokeDasharray="10 10" className="animate-[dash_20s_linear_infinite]" />
          </svg>
        )}
        
        {/* Location Pins */}
        <div className="absolute top-[150px] left-[130px] z-20 flex flex-col items-center">
          <div className="bg-primary text-white text-xs px-2 py-1 rounded-full font-bold mb-1 shadow-lg">Dropoff</div>
          <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md" />
        </div>
        
        {step === 'riding' && (
          <div className="absolute top-[350px] left-[195px] z-20 animate-pulse">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <Car className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 flex justify-between items-center bg-gradient-to-b from-background/80 to-transparent">
        <div className="w-10 h-10 rounded-full bg-background shadow-md flex items-center justify-center cursor-pointer">
          <Menu className="w-5 h-5" />
        </div>
        <div className="flex gap-2">
          <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-background shadow-md flex items-center justify-center">
             {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="w-10 h-10 rounded-full bg-background shadow-md flex items-center justify-center relative">
            <Bell className="w-5 h-5" />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary border-2 border-background" />
          </div>
        </div>
      </div>

      {/* UI Panels */}
      <div className="absolute bottom-0 left-0 w-full z-30 flex flex-col justify-end pointer-events-none">
        
        {/* Step: Booking */}
        {step === 'booking' && (
          <div className={`bg-background rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 pointer-events-auto ${drawerOpen ? 'translate-y-0' : 'translate-y-[60%]'}`}>
            <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setDrawerOpen(!drawerOpen)}>
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
            </div>
            
            <div className="px-6 pb-24">
              <h2 className="text-xl font-bold mb-4">Choose a ride</h2>
              
              {/* Location Inputs */}
              <div className="bg-muted/50 rounded-2xl p-4 mb-6 relative">
                <div className="absolute left-6 top-[28px] bottom-[28px] w-0.5 bg-border z-0" />
                
                <div className="flex items-center gap-3 relative z-10 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 ring-4 ring-background" />
                  <div className="flex-1 bg-background rounded-xl px-4 py-3 border border-border/50 text-sm font-medium">
                    UCC Main Gate
                  </div>
                </div>
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-foreground shrink-0 ring-4 ring-background" />
                  <div className="flex-1 bg-background rounded-xl px-4 py-3 border border-border/50 text-sm font-medium text-muted-foreground">
                    Kotokuraba Market
                  </div>
                </div>

                <button className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center shadow-sm z-20">
                  <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Ride Options */}
              <div className="space-y-3 mb-6">
                {rideOptions.map((ride) => (
                  <div 
                    key={ride.id}
                    onClick={() => setSelectedRide(ride.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedRide === ride.id ? 'border-primary bg-primary/5' : 'border-transparent bg-background shadow-sm hover:border-border'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                        <ride.icon className="w-7 h-7 text-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-foreground">{ride.name}</h4>
                          <div className="flex items-center text-xs text-muted-foreground font-medium">
                            <User className="w-3 h-3 mr-1" /> {ride.seats}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">{ride.time} away</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{ride.price}</div>
                      {ride.recommended && <div className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md inline-block mt-1">Recommended</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment & Request */}
              <div className="flex gap-4">
                <button className="flex items-center justify-center gap-2 w-1/3 h-14 rounded-2xl bg-muted/50 font-semibold border border-border">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span>MoMo</span>
                </button>
                <Button onClick={handleRequest} className="w-2/3 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/25">
                  Request {rideOptions.find(r => r.id === selectedRide)?.name}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Searching */}
        {step === 'searching' && (
          <div className="bg-background rounded-t-[2rem] p-8 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pointer-events-auto flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-24 h-24 rounded-full border-4 border-muted border-t-primary animate-spin mb-6" />
            <h2 className="text-xl font-bold mb-2">Connecting to nearby drivers...</h2>
            <p className="text-muted-foreground text-center">Finding the closest Qiilu Car for you</p>
          </div>
        )}

        {/* Step: Riding */}
        {step === 'riding' && (
          <div className="bg-background rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pointer-events-auto">
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
            </div>
            
            <div className="px-6 pb-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-foreground">5 min</h2>
                  <p className="text-muted-foreground font-medium">Dropoff at 14:30</p>
                </div>
                <div className="px-3 py-1.5 bg-secondary/10 text-secondary font-bold rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> On Trip
                </div>
              </div>

              {/* Driver Card */}
              <div className="bg-muted/30 border border-border rounded-2xl p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5">
                    <div className="w-full h-full bg-card rounded-full border-2 border-background flex items-center justify-center text-lg font-bold">
                      KA
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Kwame Asante</h4>
                    <div className="flex items-center text-sm text-muted-foreground font-medium">
                      4.9 <Star className="w-3 h-3 text-yellow-500 fill-current mx-1" /> (1.2k trips)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-background border border-border px-3 py-1 rounded-lg font-mono font-bold text-lg shadow-sm">
                    GR-2345-21
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">Toyota Corolla • White</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button className="flex flex-col items-center justify-center h-20 rounded-2xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border transition-colors">
                  <MessageSquare className="w-6 h-6 mb-1 text-primary" />
                  <span className="text-xs font-semibold">Message</span>
                </button>
                <button className="flex flex-col items-center justify-center h-20 rounded-2xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border transition-colors">
                  <Navigation className="w-6 h-6 mb-1 text-primary" />
                  <span className="text-xs font-semibold">Share</span>
                </button>
                <button className="flex flex-col items-center justify-center h-20 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 border border-transparent transition-colors">
                  <ShieldCheck className="w-6 h-6 mb-1" />
                  <span className="text-xs font-semibold">SOS</span>
                </button>
              </div>

              {/* Details */}
              <div className="bg-background rounded-2xl border border-border p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">Mobile Money</span>
                </div>
                <span className="font-bold text-lg">GHS 45.00</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Nav */}
        <div className="absolute bottom-0 left-0 w-full h-20 bg-background border-t border-border flex justify-around items-center px-6 pb-4 pt-2 pointer-events-auto">
          <button className="flex flex-col items-center text-primary">
            <Home className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-semibold">Home</span>
          </button>
          <button className="flex flex-col items-center text-muted-foreground hover:text-foreground">
            <Car className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-semibold">Rides</span>
          </button>
          <button className="flex flex-col items-center text-muted-foreground hover:text-foreground relative">
            <MessageSquare className="w-6 h-6 mb-1" />
            <div className="absolute top-0 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
            <span className="text-[10px] font-semibold">Messages</span>
          </button>
          <button className="flex flex-col items-center text-muted-foreground hover:text-foreground">
            <User className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-semibold">Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}