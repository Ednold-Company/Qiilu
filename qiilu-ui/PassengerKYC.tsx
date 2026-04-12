import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Zap, Star, ShieldAlert, ChevronLeft, UploadCloud, CheckCircle2, 
  Camera, X, Loader2, Moon, Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PassengerKYC() {
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

  return (
    <div className={`w-[390px] h-[844px] max-h-screen mx-auto overflow-hidden relative border-8 border-gray-900 rounded-[3rem] shadow-2xl bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 pt-12 z-30 flex justify-between items-center bg-background/90 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3">
          {step > 1 && !submitted && (
            <button onClick={() => setStep(step - 1)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-bold text-lg">Identity Verification</h1>
        </div>
        <button onClick={toggleTheme} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="pt-28 px-6 pb-24 h-full overflow-y-auto">
        {!submitted && (
          <div className="mb-6 flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">Verify Your Identity</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">A quick one-time check to keep everyone safe on Qiilu</p>
            
            <div className="space-y-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Faster bookings</h4>
                  <p className="text-sm text-muted-foreground">Verified riders get matched quicker.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Access premium rides</h4>
                  <p className="text-sm text-muted-foreground">Unlock Comfort and Executive tiers.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Dispute protection</h4>
                  <p className="text-sm text-muted-foreground">Priority support if anything goes wrong.</p>
                </div>
              </div>
            </div>

            <Button className="w-full h-14 rounded-2xl text-lg font-bold bg-primary text-primary-foreground shadow-lg mb-4" onClick={() => setStep(2)}>
              Get Started
            </Button>
            <button className="w-full text-sm font-medium text-muted-foreground py-2">
              Skip for now
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-bold mb-6">Upload your {idType === 'Ghana Card' ? 'Ghana Card' : 'ID'}</h2>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {['Ghana Card', 'Passport', "Voter's ID", "Driver's Licence"].map(type => (
                <button 
                  key={type}
                  onClick={() => setIdType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${idType === type ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div 
                onClick={() => setFrontUploaded(true)}
                className={`aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${frontUploaded ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-muted/30 hover:border-primary'}`}
              >
                {frontUploaded ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-secondary mb-2" />
                    <span className="text-xs font-bold truncate w-full text-center">ID_front.jpg</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-xs font-bold text-muted-foreground text-center">Tap to upload Front of ID</span>
                  </>
                )}
              </div>
              <div 
                onClick={() => setBackUploaded(true)}
                className={`aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${backUploaded ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-muted/30 hover:border-primary'}`}
              >
                {backUploaded ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-secondary mb-2" />
                    <span className="text-xs font-bold truncate w-full text-center">ID_back.jpg</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-xs font-bold text-muted-foreground text-center">Tap to upload Back of ID</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-xl border border-border">
              <h4 className="font-bold text-sm mb-2">Photo Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                <li>Ensure all 4 corners visible</li>
                <li>No blur or glare</li>
                <li>Plain background</li>
              </ul>
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              <Button 
                disabled={!frontUploaded || !backUploaded} 
                className="w-full h-14 rounded-2xl text-lg font-bold"
                onClick={() => setStep(3)}
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center text-center mt-4">
            <h2 className="text-2xl font-bold mb-8">Take a Selfie</h2>
            
            <div className="relative mb-8">
              <div className={`w-48 h-48 rounded-full flex items-center justify-center overflow-hidden relative border-4 transition-all ${selfieCaptured ? 'border-secondary' : capturing ? 'border-primary' : 'border-muted'}`}>
                {selfieCaptured ? (
                  <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-16 h-16 text-secondary" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                    <Camera className={`w-12 h-12 ${capturing ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                  </div>
                )}
                
                {/* Face outline overlay */}
                {!selfieCaptured && (
                  <div className="absolute inset-0 border-[8px] border-background/50 rounded-full border-dashed" style={{ clipPath: 'ellipse(40% 50% at 50% 50%)' }} />
                )}
                
                {/* Countdown ring */}
                {capturing && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-5xl font-extrabold text-primary">{countdown}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm font-medium mb-8">
              {selfieCaptured ? "Selfie captured successfully!" : capturing ? "Hold still..." : "Align your face within the circle"}
            </p>

            <div className="bg-primary/5 text-primary text-xs font-bold px-4 py-3 rounded-xl mb-auto">
              We may ask you to blink or turn your head
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              {!selfieCaptured ? (
                <Button 
                  disabled={capturing} 
                  className="w-full h-14 rounded-2xl text-lg font-bold"
                  onClick={handleCapture}
                >
                  {capturing ? 'Capturing...' : 'Enable Camera'}
                </Button>
              ) : (
                <div className="flex gap-3 w-full">
                  <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-border" onClick={() => setSelfieCaptured(false)}>
                    Retake
                  </Button>
                  <Button className="flex-[2] h-14 rounded-2xl font-bold" onClick={() => setStep(4)}>
                    Looks Good
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center mt-20 animate-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Documents Submitted!</h2>
                <p className="text-muted-foreground mb-8">Your identity verification is under review. This usually takes a few minutes.</p>
                <Button className="w-full h-14 rounded-2xl font-bold text-lg bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Return to Home
                </Button>
              </div>
            ) : submitting ? (
              <div className="flex flex-col items-center justify-center text-center mt-20">
                <div className="relative w-24 h-24 mb-6">
                  <svg className="w-24 h-24 animate-spin text-secondary" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold mb-2">Reviewing your documents...</h2>
                <p className="text-muted-foreground">This usually takes 2–5 minutes</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-6">Review Submission</h2>
                
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-6 mb-6">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">Identity Document</h4>
                    <div className="flex gap-3 mb-3">
                      <div className="flex-1 aspect-[4/3] bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
                         <span className="text-[10px] font-bold text-muted-foreground">FRONT</span>
                         <div className="absolute top-1 right-1"><CheckCircle2 className="w-3 h-3 text-secondary" /></div>
                      </div>
                      <div className="flex-1 aspect-[4/3] bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
                         <span className="text-[10px] font-bold text-muted-foreground">BACK</span>
                         <div className="absolute top-1 right-1"><CheckCircle2 className="w-3 h-3 text-secondary" /></div>
                      </div>
                    </div>
                    <div className="text-sm font-bold">{idType}</div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">Selfie Verification</h4>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center relative">
                        <CheckCircle2 className="w-4 h-4 text-secondary absolute -bottom-1 -right-1 bg-card rounded-full" />
                      </div>
                      <span className="text-sm font-bold">Verified</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-4">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Full Name</label>
                      <Input defaultValue="Akosua Koomson" className="h-12 bg-muted/30 font-semibold" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Document Number</label>
                      <Input placeholder="GHA-XXXXXXXXX-X" className="h-12 bg-muted/30 font-mono" />
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl cursor-pointer mb-24 border border-transparent hover:border-border transition-colors">
                  <div className="mt-0.5">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium leading-tight">
                    I confirm these documents belong to me and the information is accurate
                  </span>
                </label>

                <div className="absolute bottom-6 left-6 right-6 bg-background pt-2">
                  <Button 
                    disabled={!consent} 
                    className="w-full h-14 rounded-2xl text-lg font-bold"
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
  );
}
