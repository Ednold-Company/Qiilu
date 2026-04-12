import React, { useState } from 'react';
import { 
  LayoutDashboard, ListOrdered, Car, MessageSquare, Wallet, BarChart3, Bell, Sun, Moon,
  Search, Send, Phone, Info, MoreVertical, Lock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function DriverMessagesDesktop() {
  const [dark, setDark] = useState(true);
  const [activeChat, setActiveChat] = useState<string>('1');

  const toggleTheme = () => setDark(!dark);

  const chats = [
    { id: '1', name: 'Kofi Mensah', status: 'Active Ride', msg: "Are you close?", time: 'Now', unread: 1, active: true },
    { id: '2', name: 'Ama Boateng', status: 'Completed', msg: "Thanks for the safe ride.", time: '10:30 AM', unread: 0, active: false },
    { id: '3', name: 'Partner Support', status: 'Support', msg: "Your weekly payout is processed.", time: 'Yesterday', unread: 0, active: true }
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
          <NavItem icon={Car} label="My Rides" />
          <NavItem icon={MessageSquare} label="Messages" active badge="1" />
          <NavItem icon={Wallet} label="Earnings Wallet" />
          <NavItem icon={BarChart3} label="Performance" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-border bg-card px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <h1 className="text-2xl font-bold">Messages</h1>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border relative">
              <Bell className="w-5 h-5" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-destructive border-2 border-background" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat List */}
          <div className="w-[350px] border-r border-border bg-card flex flex-col shrink-0">
            <div className="p-6 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9 h-12 rounded-full bg-muted/50 border-none text-base" placeholder="Search conversations..." />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chats.map(chat => (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChat(chat.id)} 
                  className={`p-4 flex items-center gap-4 rounded-2xl cursor-pointer transition-colors ${activeChat === chat.id ? 'bg-primary/10 border-primary/20 border' : 'border border-transparent hover:bg-muted/50'}`}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {chat.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`font-bold truncate text-base ${activeChat === chat.id ? 'text-foreground' : 'text-muted-foreground'}`}>{chat.name}</h3>
                      <span className="text-xs font-medium text-muted-foreground">{chat.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate ${chat.unread ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{chat.msg}</p>
                      {chat.unread > 0 && <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center ml-2 shrink-0">{chat.unread}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open Chat */}
          <div className="flex-1 bg-muted/10 flex flex-col relative">
            {activeChat === '1' ? (
              <>
                <div className="h-24 bg-card border-b border-border px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      K
                    </div>
                    <div>
                      <h2 className="font-bold text-xl leading-tight">Kofi Mensah</h2>
                      <div className="text-sm font-bold text-secondary flex items-center gap-1.5 mt-0.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" /> Active Trip • App Request
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl h-12 font-bold"><Phone className="w-4 h-4 mr-2" /> Call Passenger</Button>
                    <Button variant="ghost" className="w-12 h-12 rounded-xl"><MoreVertical className="w-5 h-5 text-muted-foreground" /></Button>
                  </div>
                </div>
                
                <div className="bg-primary/10 border-b border-primary/20 px-8 py-4 flex items-center justify-center gap-3 text-sm font-bold text-primary">
                  <Info className="w-5 h-5" /> Please maintain a professional tone. Keep communications strictly related to the ride.
                </div>

                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
                  <div className="self-center text-xs font-bold text-muted-foreground bg-card border border-border px-4 py-1.5 rounded-full shadow-sm">Today 14:28</div>
                  
                  <div className="self-start flex flex-col items-start gap-1 max-w-[60%]">
                    <div className="flex items-end gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">K</div>
                      <div className="bg-card border border-border text-foreground px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm text-base leading-relaxed">
                        Are you close? I'm standing by the main entrance.
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground ml-14">14:28</span>
                  </div>
                  
                  <div className="self-end flex flex-col items-end gap-1 max-w-[60%]">
                    <div className="bg-primary text-primary-foreground px-6 py-4 rounded-2xl rounded-tr-sm shadow-md text-base leading-relaxed">
                      Yes, 1 minute away 🚗. I have my hazard lights on.
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground mr-2">Read 14:30</span>
                  </div>
                </div>

                <div className="p-6 bg-card border-t border-border shrink-0">
                  <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-2xl border border-border focus-within:border-primary focus-within:bg-background transition-colors">
                    <Input className="flex-1 border-none bg-transparent h-14 px-4 shadow-none focus-visible:ring-0 text-base" placeholder="Type a message to Kofi..." />
                    <button className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md hover:bg-primary/90 transition-colors">
                      <Send className="w-6 h-6 ml-1" />
                    </button>
                  </div>
                </div>
              </>
            ) : activeChat === '2' ? (
               <div className="flex-1 flex flex-col relative">
                <div className="h-24 bg-card border-b border-border px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-xl opacity-80">
                      A
                    </div>
                    <div>
                      <h2 className="font-bold text-xl leading-tight">Ama Boateng</h2>
                      <div className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        Completed Trip
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <Lock className="w-12 h-12 mb-4 opacity-20" />
                  <h3 className="text-lg font-bold text-foreground">Chat Locked</h3>
                  <p>This trip has been completed. Messaging is disabled.</p>
                </div>
              </div>
            ) : null}
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