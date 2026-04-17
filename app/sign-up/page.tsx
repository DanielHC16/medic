'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void> | void;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
  }>;
};

// --- Icons used for the PWA Popup ---
function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
// ------------------------------------

export default function SignUpPage() {
  const router = useRouter();

  // 1. Wizard Step State
  const [step, setStep] = useState(1);

  // 2. Form Data State
  const [formData, setFormData] = useState({
    role: 'patient',
    firstName: '',
    lastName: '',
    birthday: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    assistance: 'independent',
    assistanceDetails: '',
    approvalMode: 'manual',
    inviteCode: '',
  });

  // 3. UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 4. PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [finalRedirectUrl, setFinalRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as DeferredPromptEvent);
      // We do NOT set showInstallPopup(true) here because we want to wait until registration completes
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const proceedToDashboard = (url: string | null) => {
    if (url) {
      router.push(url);
      router.refresh();
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    
    setShowInstallPopup(false);
    proceedToDashboard(finalRedirectUrl);
  };

  const handleDismissInstall = () => {
    setShowInstallPopup(false);
    proceedToDashboard(finalRedirectUrl);
  };

  // Helpers to update form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role: string) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleAssistanceSelect = (assistance: string) => {
    setFormData((prev) => ({ ...prev, assistance }));
  };

  // 5. Navigation Handlers
  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep((prev) => prev - 1);
      return;
    }
    router.push('/');
  };

  // 6. Final Submission Logic
  const submitForm = async (): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: formData.role,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.role === 'patient' ? formData.birthday : undefined,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          ...(formData.role === 'patient' && {
            assistanceLevel: formData.assistance,
            emergencyNotes:
              formData.assistance === 'limited_mobility'
                ? formData.assistanceDetails
                : undefined,
          }),
          ...(formData.role !== 'patient' && {
            approvalMode: formData.approvalMode,
            inviteCode: formData.inviteCode,
          }),
        }),
      });

      const data = await response.json() as {
        message?: string;
        ok: boolean;
        redirectTo?: string;
      };

      if (!response.ok || !data.ok || !data.redirectTo) {
        throw new Error(data.message || 'Failed to create account.');
      }

      return data.redirectTo;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Wizard Flow Handler
  const handleNextOrSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // Step 1: Role Selection
    if (step === 1 && !formData.role) {
      setError("Please select a role to continue.");
      return;
    }
    // Step 2: Basic Info
    if (
      step === 2 &&
      (!formData.firstName ||
        !formData.lastName ||
        (formData.role === 'patient' && !formData.birthday))
    ) {
      setError("Please fill out all fields to continue.");
      return;
    }
    // Step 3: Contact Info
    if (step === 3 && (!formData.email || !formData.phone)) {
      setError("Please provide both email and phone number.");
      return;
    }
    // Step 4: Passwords
    if (step === 4) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      
      // Branch logic based on Role
      if (formData.role === 'patient') {
        setStep(5); // Go to patient health details
      } else {
        setStep(6); // Go to optional invite details
      }
      return;
    }

    // Submission step triggers (Step 5 or 6 depending on role)
    if (step === 5 || step === 6) {
      if (step === 5 && formData.assistance === 'limited_mobility' && !formData.assistanceDetails) {
        setError("Please specify your mobility limitations.");
        return;
      }

      const redirectTo = await submitForm();
      if (redirectTo) {
        // Successful Registration Interception:
        // If the device supports PWA and it's not installed, show the prompt.
        if (deferredPrompt) {
          setFinalRedirectUrl(redirectTo);
          setShowInstallPopup(true);
        } else {
          // If already installed or not supported (like iOS Safari), route normally.
          proceedToDashboard(redirectTo);
        }
      }
      return;
    }

    // Default increment for standard steps (1-3)
    if (step < 4) {
      setStep((prev) => prev + 1);
    }
  };

  // Determine Button Text dynamically
  let buttonText = 'NEXT';
  if (isLoading) buttonText = 'PROCESSING...';
  else if (step === 5 || step === 6) buttonText = 'CREATE ACCOUNT';

  return (
    <main className="flex min-h-screen flex-col bg-[#EFF3F0] overflow-hidden relative">
      
      {/* Background Graphic Overlay */}
      <div 
        className="absolute top-[-125px] right-[-125px] w-[65vw] max-w-[271px] h-[65vw] max-h-[265px] z-0" 
        aria-hidden="true"
      >
        <Image 
          src="/top-right-corner.png" 
          alt="" 
          fill 
          priority 
          className="object-cover object-top-right" 
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="p-6 relative z-10 flex items-center justify-between min-h-[88px]">
        <button 
          onClick={handleBack}
          disabled={isLoading}
          className="inline-flex items-center justify-center px-4 py-2 bg-[#3F6F50] text-white text-sm font-normal rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:bg-[#345c43] transition disabled:opacity-50"
        >
          BACK
        </button>
      </header>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 z-10 mb-8 mt-[-20px]">
        
        {/* Responsive Logo and Brand Name */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-[120px] h-[120px] relative flex items-center justify-center">
            <Image
              src="/medic-logo.png"
              alt="MEDIC Logo"
              fill
              priority={true}
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-semibold tracking-widest text-[#384D4D]">
            MEDIC
          </h1>
        </div>

        {/* The Wizard Form */}
        <form onSubmit={handleNextOrSubmit} className="w-full max-w-sm flex flex-col gap-5 min-h-[260px]">
          
          {/* --- STEP 1: ROLE SELECTION --- */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-6">
              <div className="text-center">
                <h2 className="text-lg font-bold text-[#3F6F50] tracking-wide mb-1">LET&apos;S GET STARTED!</h2>
                <p className="text-base font-semibold text-[#1F2924]">Who will use this account?</p>
              </div>
              <div className="flex flex-col gap-4 mt-2 px-4">
                <CustomRadio label="Elderly User" selected={formData.role === 'patient'} onClick={() => handleRoleSelect('patient')} />
                <CustomRadio label="Caregiver" selected={formData.role === 'caregiver'} onClick={() => handleRoleSelect('caregiver')} />
                <CustomRadio label="Family Member" selected={formData.role === 'family_member'} onClick={() => handleRoleSelect('family_member')} />
              </div>
            </div>
          )}

          {/* --- STEP 2: NAME & DOB --- */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#4A5D52] ml-4">What is your First Name?</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full h-[60px] px-6 text-base bg-white text-[#3F6F50] border border-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] placeholder:text-[#CBD7D0] focus:ring-2 focus:ring-[#3F6F50] focus:border-[#3F6F50] transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#4A5D52] ml-4">What is your Last Name?</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full h-[60px] px-6 text-base bg-white text-[#3F6F50] border border-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] placeholder:text-[#CBD7D0] focus:ring-2 focus:ring-[#3F6F50] focus:border-[#3F6F50] transition"
                />
              </div>
              {formData.role === 'patient' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#4A5D52] ml-4">When is your Birthday?</label>
                  <input
                    type="date"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                    required
                    className="w-full h-[60px] px-6 text-base bg-white text-[#3F6F50] border border-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] placeholder:text-[#CBD7D0] focus:ring-2 focus:ring-[#3F6F50] focus:border-[#3F6F50] transition"
                  />
                </div>
              )}
            </div>
          )}

          {/* --- STEP 3: CONTACT INFO --- */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#4A5D52] ml-4">What is your Email?</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full h-[60px] px-6 text-base bg-white text-[#3F6F50] border border-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] placeholder:text-[#CBD7D0] focus:ring-2 focus:ring-[#3F6F50] focus:border-[#3F6F50] transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#4A5D52] ml-4">What is your Phone Number?</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Contact Number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full h-[60px] px-6 text-base bg-white text-[#3F6F50] border border-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] placeholder:text-[#CBD7D0] focus:ring-2 focus:ring-[#3F6F50] focus:border-[#3F6F50] transition"
                />
              </div>
            </div>
          )}

          {/* --- STEP 4: PASSWORDS --- */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#4A5D52] ml-4">Create Password:</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full h-[60px] pl-6 pr-24 text-base bg-white text-[#3F6F50] border border-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] placeholder:text-[#CBD7D0] focus:ring-2 focus:ring-[#3F6F50] focus:border-[#3F6F50] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 py-2 px-3 text-sm font-medium text-[#3F6F50] opacity-80 hover:opacity-100 transition"
                  >
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                    <EyeIcon className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#4A5D52] ml-4">Type Password Again:</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full h-[60px] pl-6 pr-24 text-base bg-white text-[#3F6F50] border border-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] placeholder:text-[#CBD7D0] focus:ring-2 focus:ring-[#3F6F50] focus:border-[#3F6F50] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 py-2 px-3 text-sm font-medium text-[#3F6F50] opacity-80 hover:opacity-100 transition"
                  >
                    <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
                    <EyeIcon className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 5: PATIENT HEALTH DETAILS --- */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-6">
              <div className="text-center px-4">
                <h2 className="text-[17px] font-bold text-[#1F2924] leading-snug">
                  Do you need assistance in your daily activities?
                </h2>
              </div>
              <div className="flex flex-col gap-4 px-2">
                <CustomRadio label="No assistance needed" selected={formData.assistance === 'independent'} onClick={() => handleAssistanceSelect('independent')} />
                <CustomRadio label="Needs help walking" selected={formData.assistance === 'minimal_assistance'} onClick={() => handleAssistanceSelect('minimal_assistance')} />
                <CustomRadio label="Needs caregiver assistance" selected={formData.assistance === 'caregiver_assistance'} onClick={() => handleAssistanceSelect('caregiver_assistance')} />
                <div className="flex flex-col gap-2">
                  <CustomRadio label="Limited mobility (please specify)" selected={formData.assistance === 'limited_mobility'} onClick={() => handleAssistanceSelect('limited_mobility')} />
                  {formData.assistance === 'limited_mobility' && (
                    <input
                      type="text"
                      name="assistanceDetails"
                      placeholder="Indicate here"
                      value={formData.assistanceDetails}
                      onChange={handleChange}
                      className="ml-10 mt-1 h-10 px-4 text-sm bg-white text-[#3F6F50] border border-b-[#4A5D52] border-x-transparent border-t-transparent outline-none bg-transparent placeholder:text-[#4A5D52]/50 transition w-[85%]"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 6: OPTIONAL INVITE DETAILS --- */}
          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-6">
              <div className="text-center px-4">
                <h2 className="text-[17px] font-bold text-[#1F2924] leading-snug">
                  Do you already have an invite code?
                </h2>
                <p className="mt-2 text-sm text-[#4A5D52]">
                  You can create your account now and link it to a patient immediately if you already have a code.
                </p>
              </div>
              <div className="flex flex-col gap-5 px-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#4A5D52] ml-4">Invite Code (Optional)</label>
                  <input
                    type="text"
                    name="inviteCode"
                    placeholder="CARE123"
                    value={formData.inviteCode}
                    onChange={handleChange}
                    className="w-full h-[60px] px-6 text-base uppercase bg-white text-[#3F6F50] border border-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] placeholder:text-[#CBD7D0] focus:ring-2 focus:ring-[#3F6F50] focus:border-[#3F6F50] transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#4A5D52] ml-4">Approval Handling</label>
                  <select
                    name="approvalMode"
                    value={formData.approvalMode}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, approvalMode: event.target.value }))
                    }
                    className="w-full h-[60px] px-6 text-base bg-white text-[#3F6F50] border border-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-[#3F6F50] focus:border-[#3F6F50] transition"
                  >
                    <option value="manual">Request approval</option>
                    <option value="auto">Auto-approve if allowed</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-xl text-center shadow-sm" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="hidden" aria-hidden="true" />
        </form>

      </section>

      {/* Bottom Graphic Section ("The Hill") */}
      <div className="w-full relative flex flex-col justify-end h-[320px] mt-auto z-0">
        
        {/* The Gradient Hill */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160%] h-[320px] bg-gradient-to-b from-[#A3B18A]/90 to-[#4A7C59] rounded-t-[100%] z-0" 
          aria-hidden="true" 
        />

        {/* Anchored Responsive Leaves */}
        <div className="absolute left-[10%] sm:left-[15%] top-[-8%] w-[14vw] max-w-[56px] aspect-square z-10" aria-hidden="true">
          <Image src="/leaf-tuft-left.png" alt="" fill className="object-contain drop-shadow-sm" />
        </div>

        <div className="absolute right-[2%] sm:right-[4%] top-[-9%] w-[18vw] max-w-[72px] aspect-square z-10" aria-hidden="true">
          <Image src="/leaf-tuft-right.png" alt="" fill className="object-contain drop-shadow-sm" />
        </div>

        {/* Main Action Button & Footer Link */}
        <div className="relative z-20 flex flex-col items-center w-full max-w-sm mx-auto pb-12 pt-16 px-6">
          
          <button
            type="button"
            onClick={handleNextOrSubmit}
            disabled={isLoading}
            className="flex items-center justify-center w-full h-[60px] bg-[#3F6F50] text-white text-lg font-light rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.35)] hover:bg-[#345c43] transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            <span className="[text-shadow:_0_1px_2px_rgb(0_0_0_/_0.5)] tracking-wide">
              {buttonText}
            </span>
          </button>
          
          <p className="text-sm font-medium text-white/90">
            Already have an account?{' '}
            <Link href="/sign-in">
              <span className="font-bold text-[#1A231D] underline decoration-2 underline-offset-2 hover:text-black transition drop-shadow-sm">
                Log in
              </span>
            </Link>
          </p>

        </div>
      </div>

      {/* Mobile-specific safe-area bottom padding */}
      <div className="h-8 w-full bg-[#4A7C59]" aria-hidden="true" />

      {/* --- PWA Install Popup UI (Matches Sign In Page) --- */}
      {showInstallPopup && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-[#3F6F50] rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-white/10">
            
            {/* Close Button */}
            <button 
              onClick={handleDismissInstall}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition"
              aria-label="Dismiss install prompt"
            >
              <CloseIcon className="w-6 h-6" />
            </button>

            {/* Header / Title */}
            <div className="flex items-center gap-3 mb-2 pr-8">
              <div className="p-2 border border-white/20 rounded-xl bg-white/10 text-white">
                <DownloadIcon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-white tracking-wide">
                Install MEDIC
              </h2>
            </div>

            {/* Description text */}
            <p className="text-white/90 text-sm mb-6 leading-relaxed">
              Account created successfully! Get quick access and work offline with our app.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              <button 
                onClick={handleInstallClick}
                className="flex-1 bg-white text-[#3F6F50] py-3 px-4 rounded-2xl font-bold hover:bg-gray-100 transition shadow-sm"
              >
                Install
              </button>
              <button 
                onClick={handleDismissInstall}
                className="flex-1 bg-transparent text-white border border-white/30 py-3 px-4 rounded-2xl font-medium hover:bg-white/10 transition"
              >
                Not now
              </button>
            </div>

            {/* Footer Features Info */}
            <div className="mt-5 pt-4 border-t border-white/20 flex items-start sm:items-center gap-2">
              <InfoIcon className="w-5 h-5 text-white/70 shrink-0 mt-[2px] sm:mt-0" />
              <p className="text-xs text-white/80 font-medium">
                Works offline • Faster loading • Home screen access
              </p>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}

// Custom Radio Component
function CustomRadio({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <div 
      className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition"
      onClick={onClick}
    >
      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'border-[#384D4D]' : 'border-[#4A5D52]'}`}>
        {selected && <div className="w-2.5 h-2.5 bg-[#384D4D] rounded-full" />}
      </div>
      <span className="text-[15px] font-medium text-[#1F2924]">{label}</span>
    </div>
  );
}

// Reusable Eye Icon
function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
