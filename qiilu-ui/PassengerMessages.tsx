import React, { useState } from 'react';
import { 
  Menu, Moon, Sun, Home, Car, MessageSquare, User, ArrowLeft, Phone, Send, Info
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export function PassengerMessages() {
  const [dark, setDark] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const toggleTheme = () => setDark(!dark);

  const chats = [
    { id: '1', name: 'Kwame Asante', role: 'Driver', status: 'Active Ride', msg: "I'm 2 minutes away", time: 'Now', unread: 1, active: true },
    { id: '2', name: 'Ama Kofi', role: 'Driver', status: 'Past Ride', msg: "Thank you for the tip!", time: 'Yesterday', unread: 0, active: false },
    { id: '3', name: 'Qiilu Support', role: 'Support', status: 'Bot', msg: "How can we help you today?", time: 'Mon', unread: 0, active: true }
  ];

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      
      {!activeChat ? (
        <>
          <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 flex justify-between items-center bg-background/90 backdrop-blur border-b border-border">
            <h1 className="text-xl font-bold">Messages</h1>
            <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div className="pt-28 px-4 pb-24 h-full overflow-y-auto">
            <div className="space-y-3">
              {chats.map(chat => (
                <div key={chat.id} onClick={() => setActiveChat(chat.id)} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shrink-0">
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
          
          <div className="absolute bottom-0 left-0 w-full h-20 bg-background border-t border-border flex justify-around items-center px-6 pb-4 pt-2 z-30">
            <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Home className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Home</span></button>
            <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><Car className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Rides</span></button>
            <button className="flex flex-col items-center text-primary"><MessageSquare className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Messages</span></button>
            <button className="flex flex-col items-center text-muted-foreground hover:text-foreground"><User className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold">Account</span></button>
          </div>
        </>
      ) : (
        <div className="flex flex-col h-full bg-background relative z-40">
          <div className="p-6 pt-12 bg-background border-b border-border flex items-center gap-4">
            <button onClick={() => setActiveChat(null)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h2 className="font-bold text-lg">Kwame Asante</h2>
              <p className="text-xs text-primary font-bold">Toyota Corolla • GW-1234-22</p>
            </div>
            <button className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-primary/10 text-primary p-3 flex items-center gap-3 text-sm font-semibold">
            <Info className="w-4 h-4" /> Ongoing trip: UCC Main Gate → Kotokuraba Market
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
            <div className="self-center text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">Today 14:28</div>
            <div className="self-end bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm max-w-[80%]">
              Are you at the main gate?
            </div>
            <div className="self-start bg-muted text-foreground p-3 rounded-2xl rounded-tl-sm max-w-[80%]">
              Yes, I'm 2 minutes away. I am driving a white Corolla.
            </div>
          </div>

          <div className="p-4 bg-background border-t border-border flex gap-3 pb-8">
            <Input className="flex-1 rounded-full h-12 bg-muted border-none" placeholder="Type a message..." />
            <button className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}