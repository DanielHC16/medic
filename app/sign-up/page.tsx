'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();

  // 1. Wizard Step State
  // 1: Role, 2: Info, 3: Contact, 4: Passwords
  // 5: Elderly QA, 6: Family QA
  // 7: Elderly QR, 8: Success
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
    assistance: 'none',
    assistanceDetails: '',
    activelyAssisting: null as boolean | null, // Added for Family QA
  });

  // 3. UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // 4. Navigation Handlers
  const handleBack = () => {
    setError(null);
    if (step === 8) return; // No going back from success
    if (step === 7) setStep(5); // QR back to Elderly QA
    else if (step === 6) setStep(4); // Family QA back to Passwords
    else if (step === 5) setStep(4); // Elderly QA back to Passwords
    else if (step > 1) setStep((prev) => prev - 1);
    else router.push('/');
  };

  // 5. Final Submission Logic
  // Now returns a boolean indicating success instead of handling routing internally
  const submitForm = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: formData.role,
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.birthday,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          ...(formData.role === 'patient' && {
            assistance_level: formData.assistance,
            assistance_details: formData.assistance === 'limited' ? formData.assistanceDetails : null,
          }),
          ...(formData.role !== 'patient' && {
            actively_assisting: formData.activelyAssisting,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account.');
      }
      
      setIsLoading(false);
      return true;
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setIsLoading(false);
      return false;
    }
  };

  // 6. Wizard Flow Handler
  const handleNextOrSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // Step 1: Role Selection
    if (step === 1 && !formData.role) {
      setError("Please select a role to continue.");
      return;
    }
    // Step 2: Basic Info
    if (step === 2 && (!formData.firstName || !formData.lastName || !formData.birthday)) {
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
        setStep(5); // Go to Elderly QA
      } else {
        setStep(6); // Go to Family QA
      }
      return;
    }

    // Step 5: Elderly QA Submission
    if (step === 5) {
      if (formData.assistance === 'limited' && !formData.assistanceDetails) {
        setError("Please specify your mobility limitations.");
        return;
      }
      
      // --- UI TESTING BYPASS ---
      // Commented out the API call so you can test screens 5 -> 7 -> 8
      // const isSuccess = await submitForm();
      // if (isSuccess) setStep(7);
      
      setStep(7); // Bypass API and force it to proceed to QR Code
      return;
    }

    // Step 6: Family QA Submission
    if (step === 6) {
      if (formData.activelyAssisting === null) {
        setError("Please select whether you will be assisting.");
        return;
      }
      
      // --- UI TESTING BYPASS ---
      // Commented out the API call so you can test screens 6 -> 8
      // const isSuccess = await submitForm();
      // if (isSuccess) setStep(8);
      
      setStep(8); // Bypass API and force it to proceed directly to Success
      return;
    }

    // Step 7: Elderly QR Next Button
    if (step === 7) {
      setStep(8); // Proceed to Success
      return;
    }

    // Step 8: Success State -> Sign In Route
    if (step === 8) {
      router.push('/sign-in');
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
  else if (step === 5) buttonText = 'SUBMIT';
  else if (step === 8) buttonText = 'SIGN IN';

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
        {step !== 8 && (
          <button 
            onClick={handleBack}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-4 py-2 bg-[#3F6F50] text-white text-sm font-normal rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:bg-[#345c43] transition disabled:opacity-50"
          >
            BACK
          </button>
        )}
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

          {/* --- STEP 5: ELDERLY QA --- */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-6">
              <div className="text-center px-4">
                <h2 className="text-[17px] font-bold text-[#1F2924] leading-snug">
                  Do you need assistance in your daily activities?
                </h2>
              </div>
              <div className="flex flex-col gap-4 px-2">
                <CustomRadio label="No assistance needed" selected={formData.assistance === 'none'} onClick={() => handleAssistanceSelect('none')} />
                <CustomRadio label="Needs help walking" selected={formData.assistance === 'walking'} onClick={() => handleAssistanceSelect('walking')} />
                <CustomRadio label="Needs caregiver assistance" selected={formData.assistance === 'caregiver'} onClick={() => handleAssistanceSelect('caregiver')} />
                <div className="flex flex-col gap-2">
                  <CustomRadio label="Limited mobility (please specify)" selected={formData.assistance === 'limited'} onClick={() => handleAssistanceSelect('limited')} />
                  {formData.assistance === 'limited' && (
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

          {/* --- STEP 6: FAMILY QA --- */}
          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-6">
              <div className="text-center px-4">
                <h2 className="text-[17px] font-bold text-[#1F2924] leading-snug">
                  Will you be actively assisting the elderly user?
                </h2>
              </div>
              <div className="flex flex-col gap-4 px-4 mt-2">
                <CustomRadio label="Yes" selected={formData.activelyAssisting === true} onClick={() => setFormData(prev => ({...prev, activelyAssisting: true}))} />
                <CustomRadio label="No" selected={formData.activelyAssisting === false} onClick={() => setFormData(prev => ({...prev, activelyAssisting: false}))} />
              </div>
            </div>
          )}

          {/* --- STEP 7: ELDERLY QR CODE --- */}
          {step === 7 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center gap-4">
              <p className="text-sm font-medium text-[#4A5D52]">Invite:</p>
              
              <div className="w-48 h-48 bg-white border-[6px] border-[#384D4D] rounded-xl flex items-center justify-center p-3 shadow-md relative overflow-hidden">
                {/* Fallback pattern simulating a QR Code */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#1F2924]">
                   <rect width="30" height="30" x="5" y="5" fill="none" stroke="currentColor" strokeWidth="6"/>
                   <rect width="10" height="10" x="15" y="15" fill="currentColor"/>
                   <rect width="30" height="30" x="65" y="5" fill="none" stroke="currentColor" strokeWidth="6"/>
                   <rect width="10" height="10" x="75" y="15" fill="currentColor"/>
                   <rect width="30" height="30" x="5" y="65" fill="none" stroke="currentColor" strokeWidth="6"/>
                   <rect width="10" height="10" x="15" y="75" fill="currentColor"/>
                   <rect width="15" height="15" x="45" y="15" fill="currentColor"/>
                   <rect width="15" height="15" x="15" y="45" fill="currentColor"/>
                   <rect width="15" height="15" x="70" y="45" fill="currentColor"/>
                   <rect width="10" height="30" x="45" y="45" fill="currentColor"/>
                   <rect width="30" height="15" x="55" y="75" fill="currentColor"/>
                </svg>
              </div>

              <div className="mt-2 bg-[#384D4D] text-white text-2xl font-bold tracking-[0.2em] py-3 px-10 rounded-xl shadow-md">
                12345
              </div>
            </div>
          )}

          {/* --- STEP 8: SUCCESS PROMPT --- */}
          {step === 8 && (
            <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center justify-center mt-6">
              <h2 className="text-[26px] font-bold text-[#384D4D] leading-snug text-center">
                Account created<br/>successfully!
              </h2>
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