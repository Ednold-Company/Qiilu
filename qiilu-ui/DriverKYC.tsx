import React, { useState } from 'react';
import { 
  ShieldCheck, UploadCloud, CheckCircle2, ChevronLeft, Moon, Sun, 
  Camera, FileText, Briefcase, Calendar, CreditCard, User, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DriverKYC() {
  const [dark, setDark] = useState(true);
  const [step, setStep] = useState(1);
  const [idType, setIdType] = useState('Ghana Card');
  
  // Upload states
  const [idFront, setIdFront] = useState(false);
  const [idBack, setIdBack] = useState(false);
  const [licenceFront, setLicenceFront] = useState(false);
  const [roadworthy, setRoadworthy] = useState(false);
  const [insurance, setInsurance] = useState(false);
  
  // Licence class
  const [licenceClass, setLicenceClass] = useState('B');
  
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleTheme = () => setDark(!dark);

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
          <h1 className="font-bold text-lg">Driver KYC</h1>
        </div>
        <button onClick={toggleTheme} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="pt-28 px-6 pb-24 h-full overflow-y-auto">
        {!submitted && (
          <div className="mb-6 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">Become a Verified Driver Partner</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">Complete your profile to start earning with Qiilu.</p>
            
            <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 mb-8">
              <p className="text-sm font-bold text-secondary flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Verified drivers earn up to 20% more per trip
              </p>
            </div>

            <h3 className="font-bold mb-4">What you'll need:</h3>
            <div className="space-y-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Valid Ghana Card or Passport</h4>
                  <p className="text-sm text-muted-foreground">For identity verification.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Valid Driver's Licence</h4>
                  <p className="text-sm text-muted-foreground">Must be active and not expired.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Vehicle Documents</h4>
                  <p className="text-sm text-muted-foreground">Road Worthy & Insurance certificates.</p>
                </div>
              </div>
            </div>

            <Button className="w-full h-14 rounded-2xl text-lg font-bold bg-primary text-primary-foreground shadow-lg mb-4" onClick={() => setStep(2)}>
              Start Verification
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-bold mb-6">Upload Personal ID</h2>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {['Ghana Card', 'Passport', "Voter's ID"].map(type => (
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
                onClick={() => setIdFront(true)}
                className={`aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${idFront ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-muted/30 hover:border-primary'}`}
              >
                {idFront ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-secondary mb-2" />
                    <span className="text-xs font-bold truncate w-full text-center">id_front.jpg</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-xs font-bold text-muted-foreground text-center">Front of ID</span>
                  </>
                )}
              </div>
              <div 
                onClick={() => setIdBack(true)}
                className={`aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${idBack ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-muted/30 hover:border-primary'}`}
              >
                {idBack ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-secondary mb-2" />
                    <span className="text-xs font-bold truncate w-full text-center">id_back.jpg</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-xs font-bold text-muted-foreground text-center">Back of ID</span>
                  </>
                )}
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              <Button 
                disabled={!idFront || !idBack} 
                className="w-full h-14 rounded-2xl text-lg font-bold"
                onClick={() => setStep(3)}
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            <h2 className="text-xl font-bold mb-6">Upload Driver's Licence</h2>
            
            <div 
              onClick={() => setLicenceFront(true)}
              className={`w-full aspect-[16/9] rounded-2xl border-2 flex flex-col items-center justify-center p-6 cursor-pointer mb-6 transition-all ${licenceFront ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-muted/30 hover:border-primary'}`}
            >
              {licenceFront ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-secondary mb-3" />
                  <span className="text-sm font-bold text-center">licence_front.jpg</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-muted-foreground mb-3" />
                  <span className="text-sm font-bold text-muted-foreground text-center">Tap to upload Licence</span>
                </>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Licence Number</label>
                <Input placeholder="GHA-DL-XXXXXXXX" className="h-12 bg-muted/30" />
              </div>
              
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Expiry Date</label>
                <div className="flex gap-3">
                  <select className="flex-1 h-12 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <option value="" disabled selected>Month</option>
                    {[...Array(12)].map((_, i) => <option key={i}>{String(i + 1).padStart(2, '0')}</option>)}
                  </select>
                  <select className="flex-1 h-12 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <option value="" disabled selected>Year</option>
                    {[...Array(10)].map((_, i) => <option key={i}>{2024 + i}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Licence Class</label>
                <div className="flex gap-2">
                  {['A', 'B', 'C', 'D'].map(cls => (
                    <button 
                      key={cls}
                      onClick={() => setLicenceClass(cls)}
                      className={`flex-1 h-12 rounded-xl text-sm font-bold border-2 transition-all ${licenceClass === cls ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'}`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 pt-2 bg-background">
              <Button 
                disabled={!licenceFront} 
                className="w-full h-14 rounded-2xl text-lg font-bold"
                onClick={() => setStep(4)}
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            <h2 className="text-xl font-bold mb-6">Vehicle Documents</h2>

            <div className="space-y-6 mb-6">
              {/* Roadworthy */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h4 className="font-bold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Roadworthy Certificate</h4>
                <div 
                  onClick={() => setRoadworthy(true)}
                  className={`h-24 rounded-xl border-2 flex items-center justify-center cursor-pointer mb-4 transition-all ${roadworthy ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-muted/30 hover:border-primary'}`}
                >
                  {roadworthy ? (
                    <div className="flex items-center gap-2 text-secondary font-bold text-sm"><CheckCircle2 className="w-5 h-5" /> uploaded.pdf</div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm"><UploadCloud className="w-5 h-5" /> Upload File</div>
                  )}
                </div>
                <Input placeholder="Expiry Date (MM/YYYY)" className="h-12 bg-muted/30" />
              </div>

              {/* Insurance */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h4 className="font-bold mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Insurance Certificate</h4>
                <div 
                  onClick={() => setInsurance(true)}
                  className={`h-24 rounded-xl border-2 flex items-center justify-center cursor-pointer mb-4 transition-all ${insurance ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-muted/30 hover:border-primary'}`}
                >
                  {insurance ? (
                    <div className="flex items-center gap-2 text-secondary font-bold text-sm"><CheckCircle2 className="w-5 h-5" /> uploaded.pdf</div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm"><UploadCloud className="w-5 h-5" /> Upload File</div>
                  )}
                </div>
                <div className="space-y-3">
                  <Input placeholder="Policy Number" className="h-12 bg-muted/30" />
                  <Input placeholder="Expiry Date (MM/YYYY)" className="h-12 bg-muted/30" />
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h4 className="font-bold mb-4">Vehicle Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input defaultValue="Toyota" placeholder="Make" className="h-12 bg-muted/30" />
                  <Input defaultValue="Corolla" placeholder="Model" className="h-12 bg-muted/30" />
                  <Input defaultValue="2019" placeholder="Year" className="h-12 bg-muted/30" />
                  <Input defaultValue="Silver" placeholder="Colour" className="h-12 bg-muted/30" />
                  <Input defaultValue="GR-2345-21" placeholder="Number Plate" className="col-span-2 h-12 bg-muted/30 font-mono" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 pt-2 bg-background z-10">
              <Button 
                disabled={!roadworthy || !insurance} 
                className="w-full h-14 rounded-2xl text-lg font-bold"
                onClick={() => setStep(5)}
              >
                Review Application
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center mt-20 animate-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
                <p className="text-muted-foreground mb-8">Our team will review your application within 24 hours. We'll notify you once approved.</p>
                <Button className="w-full h-14 rounded-2xl font-bold text-lg bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Go to Dashboard
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
                <h2 className="text-xl font-bold mb-2">Submitting Application...</h2>
                <p className="text-muted-foreground">Uploading securely to Qiilu servers</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-6">Review Application</h2>
                
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="font-semibold">Personal ID</span>
                    <span className="bg-secondary/20 text-secondary text-xs font-bold px-2 py-1 rounded">Uploaded</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="font-semibold">Driver's Licence</span>
                    <span className="bg-secondary/20 text-secondary text-xs font-bold px-2 py-1 rounded">Uploaded</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="font-semibold">Roadworthy</span>
                    <span className="bg-secondary/20 text-secondary text-xs font-bold px-2 py-1 rounded">Uploaded</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="font-semibold">Insurance</span>
                    <span className="bg-secondary/20 text-secondary text-xs font-bold px-2 py-1 rounded">Uploaded</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold mb-1">Vehicle Details</span>
                    <span className="text-sm text-muted-foreground font-mono">GR-2345-21 • Toyota Corolla 2019</span>
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
                    I confirm these documents belong to me, are valid, and the information is accurate.
                  </span>
                </label>

                <div className="absolute bottom-6 left-6 right-6 bg-background pt-2 z-10">
                  <Button 
                    disabled={!consent} 
                    className="w-full h-14 rounded-2xl text-lg font-bold"
                    onClick={handleSubmit}
                  >
                    Submit Application
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
