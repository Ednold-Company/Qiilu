import React, { useState } from 'react';
import { 
  Moon, Sun, Home, Navigation, Wallet, User, MessageSquare, ArrowLeft, Phone, Info, Send
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export function DriverMessages() {
  const [dark, setDark] = useState(true);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const toggleTheme = () => setDark(!dark);

  const chats = [
    { id: '1', name: 'Kofi Mensah', status: 'Active Ride', msg: "Are you close?", time: 'Now', unread: 1, color: 'from-blue-500 to-purple-500' },
    { id: '2', name: 'Ama Boateng', status: 'Scheduled', msg: "I'll be waiting at the main gate.", time: '10:30 AM', unread: 0, color: 'from-orange-400 to-amber-500' },
    { id: '3', name: 'Qiilu Partner Support', status: 'Support', msg: "Your weekly payout has been processed.", time: 'Yesterday', unread: 0, color: 'from-green-500 to-emerald-500' }
  ];

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      {!activeChat ? (
        <>
          <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 flex justify-between items-center bg-card/90 backdrop-blur border-b border-border">
            <h1 className="text-xl font-bold">Messages</h1>
            <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div className="pt-28 px-4 pb-24 h-full overflow-y-auto">
            <div className="space-y-3">
              {chats.map(chat => (
                <div key={chat.id} onClick={() => setActiveChat(chat.id)} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${chat.color} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                    {chat.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold truncate">{chat.name}</h3>
                      <span className="text-xs text-muted-foreground">{chat.time}</span>
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
          
          <div className="absolute bottom-0 left-0 w-full h-20 bg-card border-t border-border flex justify-around items-center px-4 pb-4 pt-2 z-30">
            <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Home className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Home</span></button>
            <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Navigation className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Rides</span></button>
            <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Wallet className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Wallet</span></button>
            <button className="flex flex-col items-center text-primary"><MessageSquare className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Messages</span></button>
          </div>
        </>
      ) : (
        <div className="flex flex-col h-full bg-background relative z-40">
          <div className="p-6 pt-12 bg-card border-b border-border flex items-center gap-4 shadow-sm">
            <button onClick={() => setActiveChat(null)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h2 className="font-bold text-lg">Kofi Mensah</h2>
              <p className="text-xs text-secondary font-bold">Active Ride • Picking up</p>
            </div>
            <button className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-muted p-3 flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
            <Info className="w-4 h-4" /> Please maintain a professional tone
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
            <div className="self-center text-xs text-muted-foreground bg-card border border-border px-3 py-1 rounded-full">Today 14:28</div>
            
            <div className="self-start flex flex-col gap-1">
              <div className="bg-card border border-border text-foreground p-3 rounded-2xl rounded-tl-sm max-w-[280px] shadow-sm">
                Are you close?
              </div>
            </div>

            <div className="self-end flex flex-col gap-1 items-end">
              <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm max-w-[280px] shadow-sm">
                Yes, 1 minute away 🚗
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">Read 14:30</div>
            </div>
          </div>

          <div className="p-4 bg-card border-t border-border flex gap-3 pb-8">
            <Input className="flex-1 rounded-full h-12 bg-background border border-border focus:border-primary" placeholder="Type a message..." />
            <button className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-md hover:bg-primary/90 transition-colors">
              <Send className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}