import React, { useState } from 'react';
import { 
  Home, Car, MessageSquare, Heart, CreditCard, ShieldCheck, Bell, Sun, Moon, Search, Send, Phone, Info, MoreVertical
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function PassengerMessagesDesktop() {
  const [dark, setDark] = useState(false);
  const [activeChat, setActiveChat] = useState<string>('1');

  const toggleTheme = () => setDark(!dark);

  const chats = [
    { id: '1', name: 'Kwame Asante', role: 'Driver', status: 'Active Ride', msg: "I'm 2 minutes away", time: 'Now', unread: 1, active: true },
    { id: '2', name: 'Ama Kofi', role: 'Driver', status: 'Past Ride', msg: "Thank you for the tip!", time: 'Yesterday', unread: 0, active: false },
    { id: '3', name: 'Qiilu Support', role: 'Support', status: 'Bot', msg: "How can we help you today?", time: 'Mon', unread: 0, active: true }
  ];

  return (
    <div className={`w-[1280px] h-[800px] flex bg-background text-foreground font-sans overflow-hidden border border-border rounded-xl shadow-2xl mx-auto my-10 ${dark ? 'dark' : ''}`}>
      
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col shrink-0 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl tracking-tighter">Q</div>
          <span className="font-bold text-2xl tracking-tight">Qiilu</span>
        </div>
        <nav className="px-4 py-2 space-y-2 flex-1">
          <NavItem icon={Home} label="Home" />
          <NavItem icon={Car} label="My Rides" />
          <NavItem icon={MessageSquare} label="Messages" badge="1" active />
          <NavItem icon={Heart} label="Favourites" />
          <NavItem icon={CreditCard} label="Payment" />
          <NavItem icon={ShieldCheck} label="Safety" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-end px-8 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative cursor-pointer border border-border">
              <Bell className="w-5 h-5 text-foreground" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat List */}
          <div className="w-[320px] border-r border-border bg-card flex flex-col shrink-0">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9 h-10 rounded-full bg-muted/50 border-none" placeholder="Search messages..." />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {chats.map(chat => (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChat(chat.id)} 
                  className={`p-3 flex items-center gap-3 rounded-xl cursor-pointer transition-colors ${activeChat === chat.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {chat.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`font-bold truncate ${activeChat === chat.id ? 'text-primary' : 'text-foreground'}`}>{chat.name}</h3>
                      <span className="text-[10px] font-bold text-muted-foreground">{chat.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate ${chat.unread ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{chat.msg}</p>
                      {chat.unread > 0 && <div className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center ml-2">{chat.unread}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open Chat */}
          <div className="flex-1 bg-[#f8f9fa] dark:bg-background/50 flex flex-col relative">
            {activeChat === '1' ? (
              <>
                {/* Chat Header */}
                <div className="h-20 bg-card border-b border-border px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                      K
                    </div>
                    <div>
                      <h2 className="font-bold text-lg leading-tight">Kwame Asante</h2>
                      <div className="text-xs font-bold text-primary flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Active Ride • Toyota Corolla (GW-1234-22)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-full font-bold"><Phone className="w-4 h-4 mr-2" /> Call Driver</Button>
                    <Button variant="ghost" className="w-10 h-10 rounded-full p-0"><MoreVertical className="w-5 h-5 text-muted-foreground" /></Button>
                  </div>
                </div>
                
                {/* Context Banner */}
                <div className="bg-primary/10 border-b border-primary/20 px-8 py-3 flex items-center justify-center gap-3 text-sm font-semibold text-primary">
                  <Info className="w-4 h-4" /> Pick up: UCC Main Gate → Drop off: Kotokuraba Market
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
                  <div className="self-center text-xs font-bold text-muted-foreground bg-card border border-border px-4 py-1.5 rounded-full shadow-sm">Today 14:28</div>
                  
                  <div className="self-end flex flex-col items-end gap-1 max-w-[60%]">
                    <div className="bg-primary text-primary-foreground px-5 py-3 rounded-2xl rounded-tr-sm shadow-md text-[15px] leading-relaxed">
                      Are you at the main gate? I'm wearing a blue shirt.
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground mr-1">14:28</span>
                  </div>
                  
                  <div className="self-start flex flex-col items-start gap-1 max-w-[60%]">
                    <div className="flex items-end gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-xs shrink-0">K</div>
                      <div className="bg-card border border-border text-foreground px-5 py-3 rounded-2xl rounded-tl-sm shadow-sm text-[15px] leading-relaxed">
                        Yes, I see you. I'm 2 minutes away. I am driving a white Corolla with hazard lights on.
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground ml-11">14:30</span>
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-6 bg-card border-t border-border shrink-0">
                  <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-full border border-border focus-within:border-primary focus-within:bg-background transition-colors">
                    <Input className="flex-1 border-none bg-transparent h-12 px-4 shadow-none focus-visible:ring-0 text-base" placeholder="Type a message to Kwame..." />
                    <button className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-md hover:bg-primary/90 transition-colors">
                      <Send className="w-5 h-5 ml-1" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-xl font-bold text-foreground">Your Messages</h2>
                <p>Select a conversation to start chatting</p>
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