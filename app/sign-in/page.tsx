'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void> | void;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
  }>;
};

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInPageShell inviteCode="" />}>
      <SignInPageContent />
    </Suspense>
  );
}

function SignInPageContent() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('code')?.trim().toUpperCase() ?? '';

  return <SignInPageShell inviteCode={inviteCode} />;
}

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

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
// ------------------------------------

function SignInPageShell({ inviteCode }: { inviteCode: string }) {
  const router = useRouter();

  // 1. Form and UI State
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // 2. Auth State (for loading and errors)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  // Listen for the PWA install prompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as DeferredPromptEvent);
      // Update UI notify the user they can install the PWA
      setShowInstallPopup(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We no longer need the prompt. Clear it up.
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPopup(false);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPopup(false);
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // 4. Form Submission Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: emailOrPhone,
          password: password,
          ...(inviteCode ? { redirectTo: `/join?code=${inviteCode}` } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Failed to sign in. Please check your credentials.');
      }

      router.push(data.redirectTo || '/');
      router.refresh();
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Top Navigation Bar (Header) */}
      <header className="p-6 relative z-10 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center justify-center px-4 py-2 bg-[#3F6F50] text-white text-sm font-normal rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:bg-[#345c43] transition">
          BACK
        </Link>
        <div className="w-10 h-10" />
      </header>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 z-10 mb-8 mt-4">
        
        {/* Logo and Brand Name */}
        <div className="flex flex-col items-center gap-4 mb-10">
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

        {/* The Sign In Form */}
        <form onSubmit={handleSignIn} className="w-full max-w-sm flex flex-col gap-6">
          {inviteCode ? (
            <div className="rounded-2xl border border-[#A3B18A] bg-[#F6F7F2] px-4 py-3 text-sm leading-6 text-[#384D4D]">
              Invite detected for code <span className="font-semibold">{inviteCode}</span>.
              Sign in to continue joining the patient.
            </div>
          ) : null}
          
          {/* Email or Phone Input */}
          <input
            type="text"
            id="emailOrPhone"
            name="emailOrPhone"
            placeholder="Email or Phone Number"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            required
            className="w-full h-[60px] px-6 text-base bg-white text-[#3F6F50] border border-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] placeholder:text-[#CBD7D0] focus:ring-2 focus:ring-[#3F6F50] focus:border-[#3F6F50] transition"
          />

          {/* Password Input (with Show toggle) */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-[60px] pl-6 pr-24 text-base bg-white text-[#3F6F50] border border-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] placeholder:text-[#CBD7D0] focus:ring-2 focus:ring-[#3F6F50] focus:border-[#3F6F50] transition"
            />
            {/* Show/Hide Toggle Button */}
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 py-2 px-3 text-sm font-medium text-[#3F6F50] opacity-80 hover:opacity-100 transition"
            >
              <span>{showPassword ? 'Hide' : 'Show'}</span>
              <EyeIcon className="w-5 h-5 text-[#3F6F50]" aria-hidden="true" />
            </button>
          </div>

          {/* Display Error Message (if any) */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 text-sm rounded-xl text-center shadow-sm" role="alert">
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
        <div className="absolute left-[10%] sm:left-[15%] top-[-7%] w-[14vw] max-w-[56px] aspect-square z-10" aria-hidden="true">
          <Image src="/leaf-tuft-left.png" alt="" fill className="object-contain drop-shadow-sm" />
        </div>
        <div className="absolute right-[2%] sm:right-[4%] top-[-8%] w-[18vw] max-w-[72px] aspect-square z-10" aria-hidden="true">
          <Image src="/leaf-tuft-right.png" alt="" fill className="object-contain drop-shadow-sm" />
        </div>

        {/* Main Action Button & Footer Link */}
        <div className="relative z-20 flex flex-col items-center w-full max-w-sm mx-auto pb-12 pt-16 px-6">
          <button
            type="submit"
            onClick={handleSignIn}
            disabled={isLoading}
            className="flex items-center justify-center w-full h-[60px] bg-[#3F6F50] text-white text-lg font-light rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.35)] hover:bg-[#345c43] transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            <span className="[text-shadow:_0_1px_2px_rgb(0_0_0_/_0.5)]">
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </span>
          </button>
          
          <p className="text-sm font-medium text-white/90">
            Don&apos;t have an account?{' '}
            <Link href={inviteCode ? `/sign-up?code=${inviteCode}` : "/sign-up"}>
              <span className="font-bold text-[#1A231D] underline decoration-2 underline-offset-2 hover:text-black transition drop-shadow-sm">
                Create one Now!
              </span>
            </Link>
          </p>
        </div>
      </div>

      <div className="h-8 w-full bg-[#4A7C59]" aria-hidden="true" />

      {/* --- PWA Install Popup UI --- */}
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
              Get quick access and work offline with our app
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
