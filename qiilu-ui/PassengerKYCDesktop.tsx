import React, { useState } from 'react';
import { 
  ShieldCheck, Zap, Star, ShieldAlert, ChevronLeft, UploadCloud, CheckCircle2, 
  Camera, X, Loader2, Moon, Sun, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PassengerKYCDesktop() {
  const [dark, setDark] = useState(false);
  const [step, setStep] = useState(1);
  const [idType, setIdType] = useState('Ghana Card');
  
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [selfieCaptured, setSelfieCaptured] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleTheme = () => setDark(!dark);

  const handleCapture = () => {
    setCapturing(true);
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCapturing(false);
          setSelfieCaptured(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 2500);
  };

  const steps = [
    { id: 1, title: 'Welcome' },
    { id: 2, title: 'ID Upload' },
    { id: 3, title: 'Selfie Check' },
    { id: 4, title: 'Review' }
  ];

  return (
    <div className={`w-full h-screen flex bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      
      {/* Left Sidebar */}
      <div className="w-80 border-r border-border bg-gray-950 text-gray-100 flex flex-col justify-between shrink-0 z-20">
        <div>
          <div className="p-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-3xl tracking-tighter">Q</div>
            <span className="font-bold text-3xl tracking-tight text-white">Qiilu</span>
          </div>

          <div className="px-8 mt-4">
            <h2 className="text-xl font-bold text-white mb-8">KYC Verification</h2>
            
            <div className="relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-800" />
              
              {steps.map((s, i) => (
                <div key={s.id} className="relative flex items-center gap-4 mb-8 last:mb-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                    step > s.id || submitted ? 'bg-secondary text-secondary-foreground' :
                    step === s.id && !submitted ? 'bg-primary text-primary-foreground' :
                    'bg-gray-800 text-gray-500'
                  }`}>
                    {step > s.id || submitted ? <Check className="w-4 h-4" /> : <span className="font-bold text-sm">{s.id}</span>}
                  </div>
                  <span className={`font-semibold ${
                    step === s.id && !submitted ? 'text-white text-lg' :
                    step > s.id || submitted ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-gray-800">
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-6 h-6 text-secondary" />
              <span className="font-bold text-white">Trusted Platform</span>
            </div>
            <p className="text-sm text-gray-400">Join 2M+ verified riders keeping our community safe.</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-muted/20">
        
        {/* Top Header */}
        <header className="h-20 border-b border-border bg-background flex items-center justify-between px-8 z-20 sticky top-0">
          <h1 className="text-xl font-bold">Passenger Verification</h1>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          
          <div className="w-full max-w-3xl">
            
            {step === 1 && (
              <div className="bg-background border border-border rounded-[2rem] p-12 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-8">
                  <ShieldCheck className="w-10 h-10 text-secondary" />
                </div>
                <h2 className="text-3xl font-extrabold mb-4">Verify Your Identity</h2>
                <p className="text-lg text-muted-foreground mb-12 max-w-lg leading-relaxed">A quick one-time check to confirm your identity and keep everyone safe on Qiilu.</p>
                
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  <div className="bg-muted/50 p-6 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Faster bookings</h4>
                    <p className="text-sm text-muted-foreground">Verified riders get matched quicker with highly-rated drivers.</p>
                  </div>
                  <div className="bg-muted/50 p-6 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Star className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Access premium rides</h4>
                    <p className="text-sm text-muted-foreground">Unlock Comfort and Executive tiers for special occasions.</p>
                  </div>
                  <div className="bg-muted/50 p-6 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <ShieldAlert className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Dispute protection</h4>
                    <p className="text-sm text-muted-foreground">Priority support if anything goes wrong during your trip.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button className="h-14 px-10 rounded-xl text-lg font-bold shadow-lg" onClick={() => setStep(2)}>
                    Get Started
                  </Button>
                  <Button variant="ghost" className="h-14 px-8 rounded-xl text-lg font-bold text-muted-foreground">
                    Skip for now
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-background border border-border rounded-[2rem] p-12 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-3xl font-bold mb-8">Upload your {idType === 'Ghana Card' ? 'Ghana Card' : 'ID'}</h2>
                
                <div className="flex flex-wrap gap-3 mb-10">
                  {['Ghana Card', 'Passport', "Voter's ID", "Driver's Licence"].map(type => (
                    <button 
                      key={type}
                      onClick={() => setIdType(type)}
                      className={`px-6 py-3 rounded-full text-base font-bold border-2 transition-all ${idType === type ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="flex gap-6 mb-10">
                  <div 
                    onClick={() => setFrontUploaded(true)}
                    className={`w-[300px] aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center p-6 cursor-pointer transition-all ${frontUploaded ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-muted/30 hover:border-primary'}`}
                  >
                    {frontUploaded ? (
                      <>
                        <CheckCircle2 className="w-12 h-12 text-secondary mb-4" />
                        <span className="text-base font-bold truncate w-full text-center">ID_front.jpg</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                        <span className="text-base font-bold text-muted-foreground text-center">Tap to upload Front of ID</span>
                      </>
                    )}
                  </div>
                  <div 
                    onClick={() => setBackUploaded(true)}
                    className={`w-[300px] aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center p-6 cursor-pointer transition-all ${backUploaded ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-muted/30 hover:border-primary'}`}
                  >
                    {backUploaded ? (
                      <>
                        <CheckCircle2 className="w-12 h-12 text-secondary mb-4" />
                        <span className="text-base font-bold truncate w-full text-center">ID_back.jpg</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                        <span className="text-base font-bold text-muted-foreground text-center">Tap to upload Back of ID</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 p-6 rounded-xl border border-border mb-10 max-w-[624px]">
                  <h4 className="font-bold text-base mb-3">Photo Tips</h4>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                    <li>Ensure all 4 corners of the document are visible</li>
                    <li>Avoid reflections or glare from flash</li>
                    <li>Place document on a dark, plain background</li>
                  </ul>
                </div>

                <div className="flex justify-between items-center">
                  <Button variant="ghost" onClick={() => setStep(1)} className="font-bold text-muted-foreground h-12">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button 
                    disabled={!frontUploaded || !backUploaded} 
                    className="h-14 px-12 rounded-xl text-lg font-bold"
                    onClick={() => setStep(3)}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-background border border-border rounded-[2rem] p-12 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex flex-col items-center text-center">
                  <h2 className="text-3xl font-bold mb-10">Take a Selfie</h2>
                  
                  <div className="relative mb-10">
                    <div className={`w-64 h-64 rounded-full flex items-center justify-center overflow-hidden relative border-4 transition-all ${selfieCaptured ? 'border-secondary' : capturing ? 'border-primary' : 'border-muted'}`}>
                      {selfieCaptured ? (
                        <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
                          <CheckCircle2 className="w-24 h-24 text-secondary" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                          <Camera className={`w-16 h-16 ${capturing ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                        </div>
                      )}
                      
                      {!selfieCaptured && (
                        <div className="absolute inset-0 border-[12px] border-background/50 rounded-full border-dashed" style={{ clipPath: 'ellipse(40% 50% at 50% 50%)' }} />
                      )}
                      
                      {capturing && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-6xl font-extrabold text-primary">{countdown}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-lg font-medium mb-10">
                    {selfieCaptured ? "Selfie captured successfully!" : capturing ? "Hold still..." : "Align your face within the circle"}
                  </p>

                  <div className="bg-primary/5 text-primary text-sm font-bold px-6 py-4 rounded-xl mb-12">
                    Liveness Check: We may ask you to blink or turn your head slightly.
                  </div>

                  <div className="flex justify-between items-center w-full">
                    <Button variant="ghost" onClick={() => setStep(2)} className="font-bold text-muted-foreground h-12">
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    
                    {!selfieCaptured ? (
                      <Button 
                        disabled={capturing} 
                        className="h-14 px-12 rounded-xl text-lg font-bold min-w-[200px]"
                        onClick={handleCapture}
                      >
                        {capturing ? 'Capturing...' : 'Enable Camera'}
                      </Button>
                    ) : (
                      <div className="flex gap-4">
                        <Button variant="outline" className="h-14 px-8 rounded-xl font-bold border-border" onClick={() => setSelfieCaptured(false)}>
                          Retake Photo
                        </Button>
                        <Button className="h-14 px-12 rounded-xl text-lg font-bold" onClick={() => setStep(4)}>
                          Looks Good
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-background border border-border rounded-[2rem] p-12 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 animate-in zoom-in duration-500">
                    <div className="w-32 h-32 rounded-full bg-secondary/20 flex items-center justify-center mb-8">
                      <CheckCircle2 className="w-16 h-16 text-secondary" />
                    </div>
                    <h2 className="text-4xl font-bold mb-4">Documents Submitted!</h2>
                    <p className="text-xl text-muted-foreground mb-12 max-w-md">Your identity verification is currently under review. We will notify you once approved.</p>
                    <Button className="h-14 px-12 rounded-xl font-bold text-lg bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      Return to Dashboard
                    </Button>
                  </div>
                ) : submitting ? (
                  <div className="flex flex-col items-center justify-center text-center py-20">
                    <div className="relative w-32 h-32 mb-8">
                      <svg className="w-32 h-32 animate-spin text-secondary" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Reviewing your documents...</h2>
                    <p className="text-lg text-muted-foreground">This automated process usually takes 2–5 minutes.</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold mb-8">Review Submission</h2>
                    
                    <div className="grid md:grid-cols-2 gap-12 mb-10">
                      {/* Left Col - Thumbnails */}
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Identity Document</h4>
                          <div className="flex gap-4 mb-4">
                            <div className="flex-1 aspect-[4/3] bg-muted rounded-xl flex items-center justify-center relative overflow-hidden border border-border">
                               <span className="text-xs font-bold text-muted-foreground">ID FRONT</span>
                               <div className="absolute top-2 right-2"><CheckCircle2 className="w-5 h-5 text-secondary" /></div>
                            </div>
                            <div className="flex-1 aspect-[4/3] bg-muted rounded-xl flex items-center justify-center relative overflow-hidden border border-border">
                               <span className="text-xs font-bold text-muted-foreground">ID BACK</span>
                               <div className="absolute top-2 right-2"><CheckCircle2 className="w-5 h-5 text-secondary" /></div>
                            </div>
                          </div>
                          <div className="text-lg font-bold">{idType}</div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Selfie Verification</h4>
                          <div className="flex items-center gap-6 bg-muted/30 p-4 rounded-xl border border-border">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center relative">
                              <CheckCircle2 className="w-5 h-5 text-secondary absolute -bottom-1 -right-1 bg-card rounded-full" />
                            </div>
                            <div>
                              <div className="font-bold text-lg">Verified</div>
                              <div className="text-sm text-muted-foreground">Liveness check passed</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Col - Fields */}
                      <div className="space-y-6">
                        <div>
                          <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Full Name</label>
                          <Input defaultValue="Akosua Koomson" className="h-14 text-lg bg-muted/30 font-semibold" />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Document Number</label>
                          <Input placeholder="GHA-XXXXXXXXX-X" className="h-14 text-lg bg-muted/30 font-mono" />
                        </div>
                        
                        <div className="pt-6">
                          <label className="flex items-start gap-4 p-5 bg-muted/30 rounded-2xl cursor-pointer border border-transparent hover:border-border transition-colors">
                            <div className="mt-1">
                              <input 
                                type="checkbox" 
                                className="w-6 h-6 rounded border-border text-primary focus:ring-primary"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                              />
                            </div>
                            <span className="text-base text-muted-foreground font-medium leading-tight">
                              I confirm these documents belong to me and the extracted information is accurate. I understand providing false info violates terms of service.
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t border-border">
                      <Button variant="ghost" onClick={() => setStep(3)} className="font-bold text-muted-foreground h-12">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button 
                        disabled={!consent} 
                        className="h-14 px-12 rounded-xl text-lg font-bold"
                        onClick={handleSubmit}
                      >
                        Submit for Verification
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
