import React, { useState } from 'react';
import { 
  LayoutDashboard, ListOrdered, Car, MessageSquare, Wallet, BarChart3, Bell, Sun, Moon,
  TrendingUp, Activity, CreditCard, CheckCircle2, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DriverWalletDesktop() {
  const [dark, setDark] = useState(true);
  const toggleTheme = () => setDark(!dark);

  const earningsData = [
    { date: 'Oct 12 (Today)', trips: 8, gross: '142.50', comm: '26.00', net: '116.50', status: 'Pending' },
    { date: 'Oct 11', trips: 14, gross: '280.00', comm: '42.00', net: '238.00', status: 'Paid' },
    { date: 'Oct 10', trips: 12, gross: '215.00', comm: '32.25', net: '182.75', status: 'Paid' },
    { date: 'Oct 09', trips: 10, gross: '190.00', comm: '28.50', net: '161.50', status: 'Paid' },
    { date: 'Oct 08', trips: 15, gross: '310.00', comm: '46.50', net: '263.50', status: 'Paid' },
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
          <NavItem icon={MessageSquare} label="Messages" />
          <NavItem icon={Wallet} label="Earnings Wallet" active />
          <NavItem icon={BarChart3} label="Performance" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
        <header className="h-20 border-b border-border bg-card px-10 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <h1 className="text-2xl font-bold">Earnings Dashboard</h1>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
              <Bell className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          {/* Top Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-primary to-orange-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/4" />
              <div className="text-white/80 font-medium mb-1 text-sm uppercase tracking-wider">Today's Earnings</div>
              <div className="text-4xl font-extrabold tracking-tight">GHS 142.50</div>
              <div className="mt-4 text-sm font-bold bg-white/20 inline-block px-2 py-1 rounded">8 Trips</div>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-center">
              <div className="text-muted-foreground font-medium mb-1 text-sm uppercase tracking-wider">This Week</div>
              <div className="text-4xl font-extrabold tracking-tight">GHS 980.00</div>
              <div className="mt-4 text-sm font-bold text-secondary flex items-center gap-1"><TrendingUp className="w-4 h-4" /> +12% from last week</div>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-center">
              <div className="text-muted-foreground font-medium mb-1 text-sm uppercase tracking-wider">This Month</div>
              <div className="text-4xl font-extrabold tracking-tight">GHS 3,420.00</div>
              <div className="mt-4 text-sm font-bold text-secondary flex items-center gap-1"><TrendingUp className="w-4 h-4" /> +5% from last month</div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Main Area: Chart & Table */}
            <div className="col-span-8 space-y-8">
              
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-bold text-xl">Earnings Last 7 Days</h3>
                  <select className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-bold outline-none">
                    <option>This Week</option>
                    <option>Last Week</option>
                  </select>
                </div>
                
                <div className="h-64 flex items-end justify-between gap-4 mb-4">
                  {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                    <div key={i} className="w-full relative group h-full flex items-end">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
                        GHS {h * 3.5}
                      </div>
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-500 ${i === 6 ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'}`} 
                        style={{ height: `${h}%` }} 
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-bold uppercase tracking-wider border-t border-border pt-4">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span className="text-primary">Sun</span>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/20">
                  <h3 className="font-bold text-xl">Detailed Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-bold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-center">Trips</th>
                        <th className="px-6 py-4 text-right">Gross Fare</th>
                        <th className="px-6 py-4 text-right text-destructive">Commission</th>
                        <th className="px-6 py-4 text-right font-extrabold text-foreground">Net Earned</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {earningsData.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-medium">{row.date}</td>
                          <td className="px-6 py-4 text-center">{row.trips}</td>
                          <td className="px-6 py-4 text-right">GHS {row.gross}</td>
                          <td className="px-6 py-4 text-right text-destructive">-GHS {row.comm}</td>
                          <td className="px-6 py-4 text-right font-bold text-secondary">GHS {row.net}</td>
                          <td className="px-6 py-4 text-center">
                            {row.status === 'Paid' ? (
                              <span className="bg-secondary/10 text-secondary px-2 py-1 rounded text-xs font-bold uppercase">Paid</span>
                            ) : (
                              <span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 justify-center"><Clock className="w-3 h-3" /> Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Panel: Cashout */}
            <div className="col-span-4 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-xl mb-6">Cash Out</h3>
                
                <div className="bg-muted/30 border border-border rounded-xl p-4 mb-6">
                  <div className="text-sm font-bold text-muted-foreground mb-1 uppercase tracking-wider">Available to Withdraw</div>
                  <div className="text-3xl font-extrabold text-primary">GHS 116.50</div>
                </div>

                <div className="space-y-4 mb-6">
                  <label className="text-sm font-bold text-muted-foreground">Amount</label>
                  <Input defaultValue="116.50" className="h-14 text-xl font-bold rounded-xl" />
                </div>

                <div className="space-y-4 mb-8">
                  <label className="text-sm font-bold text-muted-foreground">Payout Method</label>
                  <div className="border-2 border-primary rounded-xl p-4 flex items-center justify-between bg-primary/5 cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold">Mobile Money</h4>
                        <p className="text-xs text-muted-foreground">055 •••• 3421</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                </div>

                <Button className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20">
                  Request Payout
                </Button>
                
                <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground font-medium bg-muted/50 p-3 rounded-lg">
                  <Clock className="w-4 h-4 shrink-0 text-foreground" />
                  <p>Transfers to Mobile Money usually complete within 2 hours during business days.</p>
                </div>
              </div>
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