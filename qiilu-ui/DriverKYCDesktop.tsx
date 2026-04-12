import React, { useState } from 'react';
import { 
  ShieldCheck, UploadCloud, CheckCircle2, ChevronLeft, Moon, Sun, 
  FileText, Briefcase, Calendar, CreditCard, User, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DriverKYCDesktop() {
  const [dark, setDark] = useState(true);
  const [step, setStep] = useState(1);
  const [idType, setIdType] = useState('Ghana Card');
  
  const [idFront, setIdFront] = useState(false);
  const [idBack, setIdBack] = useState(false);
  const [licenceFront, setLicenceFront] = useState(false);
  const [roadworthy, setRoadworthy] = useState(false);
  const [insurance, setInsurance] = useState(false);
  
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

  const steps = [
    { id: 1, title: 'Welcome' },
    { id: 2, title: 'Personal ID' },
    { id: 3, title: "Driver's Licence" },
    { id: 4, title: 'Vehicle Docs' },
    { id: 5, title: 'Review' }
  ];

  return (
    <div className={`w-full h-screen flex bg-background text-foreground font-sans ${dark ? 'dark' : ''}`}>
      
      {/* Left Sidebar */}
      <div className="w-80 border-r border-border bg-gray-950 text-gray-100 flex flex-col justify-between shrink-0 z-20">
        <div>
          <div className="p-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-3xl tracking-tighter">Q</div>
            <div className="flex flex-col">
              <span className="font-bold text-3xl tracking-tight text-white leading-none">Qiilu</span>
              <span className="text-xs text-primary font-bold uppercase tracking-wider mt-1">Driver Partner</span>
            </div>
          </div>

          <div className="px-8 mt-4">
            <h2 className="text-xl font-bold text-white mb-8">Partner Verification</h2>
            
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-muted/20">
        
        {/* Top Header */}
        <header className="h-20 border-b border-border bg-card flex items-center justify-between px-8 z-20 sticky top-0 shadow-sm">
          <h1 className="text-xl font-bold">KYC / Documents</h1>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
               {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          
          <div className="w-full max-w-4xl">
            
            {step === 1 && (
              <div className="bg-card border border-border rounded-[2rem] p-12 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-8">
                  <ShieldCheck className="w-10 h-10 text-secondary" />
                </div>
                <h2 className="text-3xl font-extrabold mb-4">Become a Verified Driver Partner</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">Complete your profile, upload your documents, and start earning with Qiilu today.</p>
                
                <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-5 mb-12 inline-block">
                  <p className="text-base font-bold text-secondary flex items-center gap-3">
                    <Briefcase className="w-5 h-5" /> Verified drivers earn up to 20% more per trip on average
                  </p>
                </div>

                <h3 className="text-xl font-bold mb-6">Required Documents</h3>
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-muted/50 p-6 rounded-2xl border border-border">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Personal ID</h4>
                    <p className="text-sm text-muted-foreground">Valid Ghana Card, Passport, or Voter's ID.</p>
                  </div>
                  <div className="bg-muted/50 p-6 rounded-2xl border border-border">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Driver's Licence</h4>
                    <p className="text-sm text-muted-foreground">Active licence for your vehicle class.</p>
                  </div>
                  <div className="bg-muted/50 p-6 rounded-2xl border border-border">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Vehicle Docs</h4>
                    <p className="text-sm text-muted-foreground">Valid Roadworthy & Insurance certificates.</p>
                  </div>
                </div>

                <Button className="h-14 px-10 rounded-xl text-lg font-bold shadow-lg" onClick={() => setStep(2)}>
                  Start Verification
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-card border border-border rounded-[2rem] p-12 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-3xl font-bold mb-8">Upload Personal ID</h2>
                
                <div className="flex flex-wrap gap-3 mb-10">
                  {['Ghana Card', 'Passport', "Voter's ID"].map(type => (
                    <button 
                      key={type}
                      onClick={() => setIdType(type)}
                      className={`px-6 py-3 rounded-full text-base font-bold border-2 transition-all ${idType === type ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/50 text-muted-foreground hover:border-muted-foreground'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="flex gap-6 mb-10">
                  <div 
                    onClick={() => setIdFront(true)}
                    className={`w-[300px] aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center p-6 cursor-pointer transition-all ${idFront ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-muted/30 hover:border-primary'}`}
                  >
                    {idFront ? (
                      <>
                        <CheckCircle2 className="w-12 h-12 text-secondary mb-4" />
                        <span className="text-base font-bold truncate w-full text-center">id_front.jpg</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                        <span className="text-base font-bold text-muted-foreground text-center">Tap to upload Front of ID</span>
                      </>
                    )}
                  </div>
                  <div 
                    onClick={() => setIdBack(true)}
                    className={`w-[300px] aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center p-6 cursor-pointer transition-all ${idBack ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-muted/30 hover:border-primary'}`}
                  >
                    {idBack ? (
                      <>
                        <CheckCircle2 className="w-12 h-12 text-secondary mb-4" />
                        <span className="text-base font-bold truncate w-full text-center">id_back.jpg</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                        <span className="text-base font-bold text-muted-foreground text-center">Tap to upload Back of ID</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-border">
                  <Button variant="ghost" onClick={() => setStep(1)} className="font-bold text-muted-foreground h-12">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button 
                    disabled={!idFront || !idBack} 
                    className="h-14 px-12 rounded-xl text-lg font-bold"
                    onClick={() => setStep(3)}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-card border border-border rounded-[2rem] p-12 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-3xl font-bold mb-8">Upload Driver's Licence</h2>
                
                <div className="flex gap-12">
                  <div className="w-[400px] shrink-0">
                    <div 
                      onClick={() => setLicenceFront(true)}
                      className={`w-full aspect-[16/9] rounded-2xl border-2 flex flex-col items-center justify-center p-8 cursor-pointer transition-all ${licenceFront ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-muted/30 hover:border-primary'}`}
                    >
                      {licenceFront ? (
                        <>
                          <CheckCircle2 className="w-16 h-16 text-secondary mb-4" />
                          <span className="text-lg font-bold text-center">licence_front.jpg</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-16 h-16 text-muted-foreground mb-4" />
                          <span className="text-lg font-bold text-muted-foreground text-center">Tap to upload Licence Front</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-8">
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Licence Number</label>
                      <Input placeholder="GHA-DL-XXXXXXXX" className="h-14 text-lg bg-muted/30 font-mono" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Expiry Date</label>
                      <div className="flex gap-4">
                        <select className="flex-1 h-14 rounded-xl border border-input bg-muted/30 px-4 text-base font-semibold ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <option value="" disabled selected>Month</option>
                          {[...Array(12)].map((_, i) => <option key={i}>{String(i + 1).padStart(2, '0')}</option>)}
                        </select>
                        <select className="flex-1 h-14 rounded-xl border border-input bg-muted/30 px-4 text-base font-semibold ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <option value="" disabled selected>Year</option>
                          {[...Array(10)].map((_, i) => <option key={i}>{2024 + i}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Licence Class</label>
                      <div className="flex gap-3">
                        {['A', 'B', 'C', 'D'].map(cls => (
                          <button 
                            key={cls}
                            onClick={() => setLicenceClass(cls)}
                            className={`flex-1 h-14 rounded-xl text-lg font-bold border-2 transition-all ${licenceClass === cls ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/50 text-muted-foreground hover:border-muted-foreground'}`}
                          >
                            Class {cls}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-12 border-t border-border mt-12">
                  <Button variant="ghost" onClick={() => setStep(2)} className="font-bold text-muted-foreground h-12">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button 
                    disabled={!licenceFront} 
                    className="h-14 px-12 rounded-xl text-lg font-bold"
                    onClick={() => setStep(4)}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-card border border-border rounded-[2rem] p-12 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-3xl font-bold mb-8">Vehicle Documents</h2>

                <div className="grid md:grid-cols-2 gap-8 mb-10">
                  {/* Roadworthy */}
                  <div className="bg-muted/30 border border-border rounded-2xl p-6">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-3"><FileText className="w-5 h-5 text-primary" /> Roadworthy Certificate</h4>
                    <div 
                      onClick={() => setRoadworthy(true)}
                      className={`h-32 rounded-xl border-2 flex items-center justify-center cursor-pointer mb-6 transition-all ${roadworthy ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-background hover:border-primary'}`}
                    >
                      {roadworthy ? (
                        <div className="flex items-center gap-2 text-secondary font-bold text-lg"><CheckCircle2 className="w-6 h-6" /> uploaded.pdf</div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground font-bold text-lg"><UploadCloud className="w-6 h-6" /> Upload Document</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Expiry Date</label>
                      <Input placeholder="MM/YYYY" className="h-12 bg-background font-mono" />
                    </div>
                  </div>

                  {/* Insurance */}
                  <div className="bg-muted/30 border border-border rounded-2xl p-6">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-primary" /> Insurance Certificate</h4>
                    <div 
                      onClick={() => setInsurance(true)}
                      className={`h-32 rounded-xl border-2 flex items-center justify-center cursor-pointer mb-6 transition-all ${insurance ? 'border-secondary bg-secondary/5' : 'border-dashed border-border bg-background hover:border-primary'}`}
                    >
                      {insurance ? (
                        <div className="flex items-center gap-2 text-secondary font-bold text-lg"><CheckCircle2 className="w-6 h-6" /> uploaded.pdf</div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground font-bold text-lg"><UploadCloud className="w-6 h-6" /> Upload Document</div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Policy Number</label>
                        <Input placeholder="Policy Number" className="h-12 bg-background font-mono" />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Expiry Date</label>
                        <Input placeholder="MM/YYYY" className="h-12 bg-background font-mono" />
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-6">Vehicle Details</h3>
                <div className="bg-muted/30 border border-border rounded-2xl p-8">
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Make</label>
                      <Input defaultValue="Toyota" className="h-12 bg-background" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Model</label>
                      <Input defaultValue="Corolla" className="h-12 bg-background" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Year</label>
                      <Input defaultValue="2019" className="h-12 bg-background" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Colour</label>
                      <Input defaultValue="Silver" className="h-12 bg-background" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Number Plate</label>
                      <Input defaultValue="GR-2345-21" className="h-12 bg-background font-mono text-lg" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-12 border-t border-border mt-12">
                  <Button variant="ghost" onClick={() => setStep(3)} className="font-bold text-muted-foreground h-12">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button 
                    disabled={!roadworthy || !insurance} 
                    className="h-14 px-12 rounded-xl text-lg font-bold"
                    onClick={() => setStep(5)}
                  >
                    Review Application
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="bg-card border border-border rounded-[2rem] p-12 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 animate-in zoom-in duration-500">
                    <div className="w-32 h-32 rounded-full bg-secondary/20 flex items-center justify-center mb-8">
                      <CheckCircle2 className="w-16 h-16 text-secondary" />
                    </div>
                    <h2 className="text-4xl font-bold mb-4">Application Submitted!</h2>
                    <p className="text-xl text-muted-foreground mb-12 max-w-lg leading-relaxed">Our operations team will review your application within 24 hours. We'll send you a notification once approved.</p>
                    <Button className="h-14 px-12 rounded-xl font-bold text-lg bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      Go to Dashboard
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
                    <h2 className="text-2xl font-bold mb-4">Submitting Application...</h2>
                    <p className="text-lg text-muted-foreground">Uploading your documents securely to Qiilu servers.</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold mb-8">Review Application</h2>
                    
                    <div className="bg-muted/30 border border-border rounded-2xl overflow-hidden mb-10">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="py-4 px-6 font-bold text-sm text-muted-foreground uppercase tracking-wider">Document</th>
                            <th className="py-4 px-6 font-bold text-sm text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="py-4 px-6 font-bold text-sm text-muted-foreground uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <tr>
                            <td className="py-5 px-6 font-semibold text-lg">Personal ID (Ghana Card)</td>
                            <td className="py-5 px-6"><span className="bg-secondary/20 text-secondary text-sm font-bold px-3 py-1 rounded-md">Uploaded</span></td>
                            <td className="py-5 px-6 text-right"><Button variant="outline" size="sm" onClick={() => setStep(2)}>Re-upload</Button></td>
                          </tr>
                          <tr>
                            <td className="py-5 px-6 font-semibold text-lg">Driver's Licence (Class B)</td>
                            <td className="py-5 px-6"><span className="bg-secondary/20 text-secondary text-sm font-bold px-3 py-1 rounded-md">Uploaded</span></td>
                            <td className="py-5 px-6 text-right"><Button variant="outline" size="sm" onClick={() => setStep(3)}>Re-upload</Button></td>
                          </tr>
                          <tr>
                            <td className="py-5 px-6 font-semibold text-lg">Roadworthy Certificate</td>
                            <td className="py-5 px-6"><span className="bg-secondary/20 text-secondary text-sm font-bold px-3 py-1 rounded-md">Uploaded</span></td>
                            <td className="py-5 px-6 text-right"><Button variant="outline" size="sm" onClick={() => setStep(4)}>Re-upload</Button></td>
                          </tr>
                          <tr>
                            <td className="py-5 px-6 font-semibold text-lg">Insurance Certificate</td>
                            <td className="py-5 px-6"><span className="bg-secondary/20 text-secondary text-sm font-bold px-3 py-1 rounded-md">Uploaded</span></td>
                            <td className="py-5 px-6 text-right"><Button variant="outline" size="sm" onClick={() => setStep(4)}>Re-upload</Button></td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="p-6 bg-card border-t border-border flex justify-between items-center">
                        <span className="font-semibold text-lg">Vehicle Registration</span>
                        <span className="font-mono text-xl bg-muted px-4 py-2 rounded-lg">GR-2345-21 • Toyota Corolla 2019</span>
                      </div>
                    </div>

                    <div className="mb-10">
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
                          I confirm that all documents provided belong to me, are currently valid, and the information is accurate. I understand that submitting fraudulent documents will result in permanent suspension.
                        </span>
                      </label>
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t border-border">
                      <Button variant="ghost" onClick={() => setStep(4)} className="font-bold text-muted-foreground h-12">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button 
                        disabled={!consent} 
                        className="h-14 px-12 rounded-xl text-lg font-bold"
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
      </div>
    </div>
  );
}
