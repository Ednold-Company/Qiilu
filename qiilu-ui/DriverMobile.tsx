import React, { useState } from 'react';
import { 
  Menu, Moon, Sun, MapPin, 
  Car, User, Navigation, ShieldCheck, Power, Phone, MessageSquare, Wallet, CheckCircle, XCircle,
  Home, Clock, Star, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DriverMobile() {
  const [dark, setDark] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [step, setStep] = useState<'idle' | 'incoming' | 'active'>('incoming');

  const toggleTheme = () => setDark(!dark);
  
  const acceptRide = () => setStep('active');
  const rejectRide = () => setStep('idle');

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      
      {/* Map Background */}
      <div className="absolute inset-0 bg-[#e5e3df] dark:bg-[#111315] z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20 dark:opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Car marker */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-500 ${isOnline ? 'bg-secondary/20 animate-pulse' : 'bg-muted'}`}>
            <div className="w-8 h-8 bg-background rounded-full border-2 border-border shadow-lg flex items-center justify-center">
              <Navigation className="w-4 h-4 text-foreground fill-current transform rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Overlay */}
      <div className="absolute top-0 left-0 w-full z-30 flex flex-col pointer-events-none">
        {/* Top Bar */}
        <div className="flex justify-between items-center p-6 pt-12 bg-gradient-to-b from-background/90 to-transparent pointer-events-auto">
          <div className="w-10 h-10 rounded-full bg-background/80 backdrop-blur shadow-md flex items-center justify-center cursor-pointer border border-border">
            <Menu className="w-5 h-5" />
          </div>
          
          {/* Online Toggle */}
          <button 
            onClick={() => { setIsOnline(!isOnline); if(step === 'incoming') setStep('idle'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold shadow-lg transition-all ${isOnline ? 'bg-secondary text-secondary-foreground shadow-secondary/25' : 'bg-muted text-muted-foreground'}`}
          >
            <Power className="w-4 h-4" />
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>

          <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-background/80 backdrop-blur shadow-md flex items-center justify-center border border-border">
             {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Stats Card (Visible when idle/online) */}
        {step === 'idle' && isOnline && (
          <div className="mx-4 mt-2 bg-card rounded-2xl p-5 border border-border shadow-xl pointer-events-auto">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Today's Earnings</h3>
            <div className="flex items-end justify-between mb-4">
              <div className="text-4xl font-extrabold tracking-tight">
                <span className="text-xl text-muted-foreground mr-1">GHS</span>
                142.50
              </div>
              <div className="flex items-center gap-1 text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">
                <Car className="w-3 h-3" /> 8 trips
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Rating</span>
                <span className="font-bold flex items-center gap-1">4.9 <StarIcon /></span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Acceptance</span>
                <span className="font-bold">94%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom UI Panels */}
      <div className="absolute bottom-0 left-0 w-full z-30 flex flex-col justify-end pointer-events-none">
        
        {/* Offline Overlay */}
        {!isOnline && (
          <div className="bg-background p-8 pb-32 rounded-t-[2rem] shadow-2xl text-center pointer-events-auto border-t border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Power className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're offline</h2>
            <p className="text-muted-foreground mb-6">Go online to start receiving ride requests.</p>
            <Button size="lg" className="w-full rounded-full h-14 text-lg" onClick={() => setIsOnline(true)}>
              Go Online
            </Button>
          </div>
        )}

        {/* Incoming Request */}
        {isOnline && step === 'incoming' && (
          <div className="bg-background rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] pointer-events-auto border-t border-border overflow-hidden pb-24">
            {/* Progress Bar Timer */}
            <div className="h-1.5 w-full bg-muted">
              <div className="h-full bg-primary animate-[shrink_15s_linear_forwards] origin-left" style={{ width: '100%' }} />
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="inline-block bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded mb-2">
                    APP REQUEST
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight">GHS 45.00</h2>
                  <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                    <User className="w-4 h-4" /> 15 mins • 4.2 km
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <span className="font-bold text-lg">14s</span>
                </div>
              </div>

              <div className="space-y-4 mb-6 relative pl-4 border-l-2 border-border ml-2">
                <div className="relative">
                  <div className="absolute -left-[23px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary" />
                  <div className="text-sm font-bold">UCC Main Gate</div>
                  <div className="text-xs text-muted-foreground">3 mins away</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[23px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground" />
                  <div className="text-sm font-bold">Kotokuraba Market</div>
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-xl flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Wallet className="w-4 h-4 text-primary" /> Mobile Money
                </div>
                <div className="flex items-center gap-2 font-medium text-sm">
                  <User className="w-4 h-4 text-muted-foreground" /> 4.8 <StarIcon />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-16 rounded-2xl text-lg font-bold bg-background" onClick={rejectRide}>
                  Reject
                </Button>
                <Button className="h-16 rounded-2xl text-lg font-bold shadow-lg shadow-primary/25" onClick={acceptRide}>
                  Accept
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Active Ride */}
        {isOnline && step === 'active' && (
          <div className="bg-background rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] pointer-events-auto pb-24 border-t border-border">
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
            </div>

            <div className="px-6">
              <div className="bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-between mb-4 shadow-lg shadow-primary/20">
                <div>
                  <div className="text-xs font-semibold opacity-80 uppercase tracking-wider mb-1">Current Action</div>
                  <h3 className="text-xl font-bold">Pick up rider</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Navigation className="w-6 h-6 fill-current" />
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-border mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg">
                    EK
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Emmanuel K.</h4>
                    <div className="text-sm text-muted-foreground flex items-center">
                      4.8 <StarIcon /> • Cash Trip
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-border transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center hover:bg-secondary/20 transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/25 mb-4">
                Arrived at Pickup
              </Button>
              
              <button className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-destructive font-bold hover:bg-destructive/5 transition-colors">
                <ShieldCheck className="w-5 h-5" /> Emergency SOS
              </button>
            </div>
          </div>
        )}

        {/* Bottom Nav */}
        <div className="absolute bottom-0 left-0 w-full h-20 bg-background border-t border-border flex justify-around items-center px-4 pb-4 pt-2 pointer-events-auto">
          <button className={`flex flex-col items-center ${step === 'idle' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Home className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-semibold">Home</span>
          </button>
          <button className={`flex flex-col items-center ${step === 'incoming' || step === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
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
    </div>
  );
}

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-500 mx-0.5">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  )
}
