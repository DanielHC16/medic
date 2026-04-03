'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();

  // 1. Form and UI State
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // 2. Auth State (for loading and errors)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // 3. Form Submission Handler
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
          email_or_phone: emailOrPhone, 
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign in. Please check your credentials.');
      }

      router.push('/patient/dashboard'); 
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Added overflow-hidden relative to match the start page
    <main className="flex min-h-screen flex-col bg-[#EFF3F0] overflow-hidden relative">
      
      {/* Background Graphic Overlay (Copied from Start Page) */}
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

      {/* 4. Top Navigation Bar (Header) */}
      <header className="p-6 relative z-10 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center justify-center px-4 py-2 bg-[#3F6F50] text-white text-sm font-normal rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:bg-[#345c43] transition">
          BACK
        </Link>
        <div className="w-10 h-10" />
      </header>

      {/* 5. Main Content Area */}
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

        {/* 6. The Sign In Form */}
        <form onSubmit={handleSignIn} className="w-full max-w-sm flex flex-col gap-6">
          
          {/* Email or Phone Input */}
          <input
            type="text"
            id="emailOrPhone"
            name="emailOrPhone"
            placeholder="Email or Phone Number"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            required
            // Replaced shadow-inner with a clean drop shadow
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
              // Replaced shadow-inner with a clean drop shadow
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

          {/* 7. Display Error Message (if any) */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 text-sm rounded-xl text-center shadow-sm" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="hidden" aria-hidden="true" />
        </form>

      </section>

      {/* 8. Bottom Graphic Section ("The Hill") - Copied from Start Page */}
      <div className="w-full relative flex flex-col justify-end h-[320px] mt-auto z-0">
        
        {/* The Gradient Hill */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160%] h-[320px] bg-gradient-to-b from-[#A3B18A]/90 to-[#4A7C59] rounded-t-[100%] z-0" 
          aria-hidden="true" 
        />

        {/* Anchored Responsive Leaves */}
        {/* LEFT LEAF */}
        <div className="absolute left-[10%] sm:left-[15%] top-[-7%] w-[14vw] max-w-[56px] aspect-square z-10" aria-hidden="true">
          <Image 
            src="/leaf-tuft-left.png" 
            alt="" 
            fill 
            className="object-contain drop-shadow-sm"
          />
        </div>

        {/* RIGHT LEAF */}
        <div className="absolute right-[2%] sm:right-[4%] top-[-8%] w-[18vw] max-w-[72px] aspect-square z-10" aria-hidden="true">
          <Image 
            src="/leaf-tuft-right.png" 
            alt="" 
            fill 
            className="object-contain drop-shadow-sm"
          />
        </div>

        {/* Main Action Button & Footer Link */}
        <div className="relative z-20 flex flex-col items-center w-full max-w-sm mx-auto pb-12 pt-16 px-6">
          
          <button
            type="submit"
            onClick={handleSignIn}
            disabled={isLoading}
            // Added Start Page Button Shadows
            className="flex items-center justify-center w-full h-[60px] bg-[#3F6F50] text-white text-lg font-light rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.35)] hover:bg-[#345c43] transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            <span className="[text-shadow:_0_1px_2px_rgb(0_0_0_/_0.5)]">
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </span>
          </button>
          
          {/* Create Account Link */}
          <p className="text-sm font-medium text-white/90">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up">
              {/* Forced the darker color and clean underline directly onto a span */}
              <span className="font-bold text-[#1A231D] underline decoration-2 underline-offset-2 hover:text-black transition drop-shadow-sm">
                Create one Now!
              </span>
            </Link>
          </p>
          
        </div>

      </div>

      {/* (Optional) Mobile-specific safe-area bottom padding */}
      <div className="h-8 w-full bg-[#4A7C59]" aria-hidden="true" />
    </main>
  );
}

// Simple Eye Icon SVG component for the password toggle
function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}