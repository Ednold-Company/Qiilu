import React, { useState } from 'react';
import { 
  Car, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  Menu, 
  X, 
  ChevronRight, 
  Star,
  Moon,
  Sun,
  Smartphone,
  Facebook,
  Twitter,
  Instagram
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Landing() {
  const [dark, setDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => setDark(!dark);

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
        
        {/* Navigation */}
        <nav className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl tracking-tighter">
                  Q
                </div>
                <span className="font-bold text-2xl tracking-tight text-foreground">Qiilu</span>
              </div>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-8">
                <a href="#ride" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Ride</a>
                <a href="#drive" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Drive</a>
                <a href="#safety" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Safety</a>
                <a href="#cities" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cities</a>
              </div>

              <div className="hidden md:flex items-center gap-4">
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <Button variant="ghost" className="font-semibold">Log in</Button>
                <Button className="rounded-full px-6 font-semibold shadow-lg shadow-primary/25">Sign up</Button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center gap-4">
                <button onClick={toggleTheme} className="p-2 text-muted-foreground">
                  {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-foreground">
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border bg-background p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
              <a href="#ride" className="text-lg font-medium p-2 hover:bg-muted rounded-lg">Ride</a>
              <a href="#drive" className="text-lg font-medium p-2 hover:bg-muted rounded-lg">Drive</a>
              <Button className="w-full mt-4">Sign up</Button>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent z-10" />
            <img 
              src="/__mockup/images/hero-bg.png" 
              alt="Accra city street" 
              className="w-full h-full object-cover object-right"
            />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary font-semibold text-sm mb-6 border border-secondary/20">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  Now live in Cape Coast & Accra
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                  Move through your city with <span className="text-primary">confidence.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                  Africa's premium mobility platform. Whether you're commuting to work or heading across town, Qiilu gets you there safely, comfortably, and on time.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="rounded-full text-lg h-14 px-8 shadow-xl shadow-primary/20">
                    Book a Ride
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full text-lg h-14 px-8 bg-background/50 backdrop-blur-sm border-border hover:bg-muted">
                    Drive with Qiilu
                  </Button>
                </div>
              </div>

              {/* Hero Booking Card */}
              <div className="hidden lg:block relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-[2rem] blur-xl opacity-50" />
                <div className="relative bg-card border border-border/50 rounded-[2rem] p-8 shadow-2xl">
                  <h3 className="text-2xl font-bold mb-6">Where to?</h3>
                  <div className="space-y-4 mb-6 relative">
                    <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-border z-0" />
                    
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 border border-background">
                        <div className="w-3 h-3 rounded-full bg-foreground" />
                      </div>
                      <Input placeholder="Enter pickup location" className="h-12 bg-muted/50 border-transparent focus:bg-background text-lg" defaultValue="UCC Main Gate" />
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 border border-background">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <Input placeholder="Where to?" className="h-12 bg-muted/50 border-transparent focus:bg-background text-lg" />
                    </div>
                  </div>
                  <Button className="w-full h-12 text-lg rounded-xl">See Prices</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ride Types */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">A ride for every occasion</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Choose from our diverse fleet of vehicles tailored for Ghanaian roads and your specific needs.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: 'Qiilu Car', icon: Car, desc: 'Comfortable everyday rides' },
                { name: 'Tricycle', icon: Car, desc: 'Quick short trips' },
                { name: 'Motor', icon: Car, desc: 'Beat the traffic' },
                { name: 'Bicycle', icon: Car, desc: 'Eco-friendly options' },
                { name: 'Mini Van', icon: Car, desc: 'Group travel' },
                { name: 'Bus', icon: Car, desc: 'City-wide transit' },
              ].map((type, i) => (
                <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all group cursor-pointer text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-transform">
                    <type.icon className="w-8 h-8 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{type.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{type.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Safety & Features */}
        <section className="py-24" id="safety">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative rounded-[2.5rem] overflow-hidden bg-muted aspect-square lg:aspect-auto lg:h-[600px]">
                <img src="/__mockup/images/safety.png" alt="Safety first" className="w-full h-full object-cover" />
              </div>
              
              <div className="space-y-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Your safety is our priority</h2>
                  <p className="text-lg text-muted-foreground">Every feature is designed to ensure you reach your destination securely and comfortably.</p>
                </div>

                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Verified Drivers</h4>
                      <p className="text-muted-foreground">Every Qiilu driver undergoes comprehensive background checks and vehicle inspections before hitting the road.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                      <Smartphone className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Live Tracking</h4>
                      <p className="text-muted-foreground">Share your trip status with loved ones. They can follow your ride in real-time from pickup to drop-off.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Flexible Payments</h4>
                      <p className="text-muted-foreground">Pay seamlessly with Mobile Money (MTN, Vodafone, AirtelTigo), debit card, or cash.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Driver CTA */}
        <section className="py-24 bg-card border-y border-border relative overflow-hidden" id="drive">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-32" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Drive and earn on your own terms</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join thousands of drivers across Ghana earning good money with Qiilu. Be your own boss, set your own schedule, and get paid daily.
                </p>
                <ul className="space-y-4 mb-8">
                  {['Lower commission rates', 'Daily MoMo payouts', '24/7 driver support', 'In-app navigation'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                      <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-secondary" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="rounded-full text-lg h-14 px-8">
                  Become a Driver <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-[2rem] transform translate-x-4 translate-y-4" />
                <img src="/__mockup/images/driver.png" alt="Happy Qiilu driver" className="relative rounded-[2rem] shadow-2xl object-cover aspect-square md:aspect-[4/3] w-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Loved by riders across Ghana</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: 'Ama Serwaa', loc: 'Accra', text: 'The most reliable ride app I have used in Accra. Drivers are polite and cars are always clean.' },
                { name: 'Kwesi Mensah', loc: 'Kumasi', text: 'I use Qiilu to commute to KNUST every day. The fares are transparent and very affordable.' },
                { name: 'Abena Osei', loc: 'Cape Coast', text: 'The MoMo payment integration is seamless. No more arguing with drivers over change!' }
              ].map((t, i) => (
                <div key={i} className="bg-muted/30 p-8 rounded-[2rem] border border-border">
                  <div className="flex items-center gap-1 text-primary mb-6">
                    {[1,2,3,4,5].map(star => <Star key={star} className="w-5 h-5 fill-current" />)}
                  </div>
                  <p className="text-lg mb-8 leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold">{t.name}</h5>
                      <p className="text-sm text-muted-foreground">{t.loc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card pt-20 pb-10 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
              <div className="col-span-2 lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">Q</div>
                  <span className="font-bold text-xl">Qiilu</span>
                </div>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Africa's premium urban mobility platform. Safe, reliable, and comfortable rides at the tap of a button.
                </p>
                <div className="flex items-center gap-4">
                  <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                  <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                  <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">Company</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">About Us</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Press</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">Products</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Ride</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Drive</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Business</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Delivery</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">Legal</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">© 2024 Qiilu Mobility Ltd. All rights reserved.</p>
              <div className="flex gap-4">
                <Button variant="outline" className="rounded-full">Ghana (EN)</Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
