import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { getCurrentUser, getDefaultRouteForRole } from '@/lib/auth/dal';

export default async function StartPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getDefaultRouteForRole(user));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-[#EFF3F0] overflow-hidden relative">
      
      {/* Background Graphic Overlay (Top Right) */}
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

      {/* Main Content Area (Centered vertically in the top portion) */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm z-10 mt-12">
        <div className="w-48 h-48 mb-6 relative flex items-center justify-center">
          <Image
            src="/medic-logo.png"
            alt="MEDIC Logo"
            width={192}
            height={192}
            priority={true}
            className="object-contain"
          />
        </div>
        <h1 className="text-5xl font-semibold tracking-widest text-[#384D4D]">
          MEDIC
        </h1>
      </div>

      {/* Bottom Graphic Section ("The Hill") */}
      <div className="w-full relative flex flex-col justify-end h-[380px] z-0">
        
        {/* The Gradient Hill */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160%] h-[320px] bg-gradient-to-b from-[#A3B18A]/90 to-[#4A7C59] rounded-t-[100%] z-0" 
          aria-hidden="true" 
        />

        {/* Anchored Responsive Leaves */}
        {/* LEFT LEAF: Increased size slightly (14vw / max 56px) */}
        <div className="absolute left-[10%] sm:left-[15%] top-[9%] w-[14vw] max-w-[56px] aspect-square z-10" aria-hidden="true">
          <Image 
            src="/leaf-tuft-left.png" 
            alt="" 
            fill 
            className="object-contain drop-shadow-sm"
          />
        </div>

        {/* RIGHT LEAF: Made noticeably larger than the left (18vw / max 72px) */}
        <div className="absolute right-[2%] sm:right-[4%] top-[8%] w-[18vw] max-w-[72px] aspect-square z-10" aria-hidden="true">
          <Image 
            src="/leaf-tuft-right.png" 
            alt="" 
            fill 
            className="object-contain drop-shadow-sm"
          />
        </div>

        {/* Main Action Buttons & Separator */}
        <div className="relative z-20 flex flex-col items-center w-full max-w-sm mx-auto pb-12 pt-16 px-6">
          
          {/* Sign In Button */}
          <Link
            href="/sign-in"
            className="flex items-center justify-center w-full h-[60px] bg-[#3F6F50] text-white text-lg font-light rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.35)] hover:bg-[#345c43] transition duration-150 mb-5"
          >
            {/* Added subtle text shadow */}
            <span className="[text-shadow:_0_1px_2px_rgb(0_0_0_/_0.5)]">
              SIGN IN
            </span>
          </Link>
          
          {/* Separator Line */}
          <div className="w-full flex items-center justify-center gap-4 mb-5">
            {/* Changed to pure white */}
            <div className="h-px w-full bg-white" />
            <span className="text-sm font-medium text-white tracking-widest">OR</span>
            <div className="h-px w-full bg-white" />
          </div>

          {/* Sign Up Button */}
          <Link
            href="/sign-up"
            className="flex items-center justify-center w-full h-[60px] bg-[#EFF3F0] text-lg font-light rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.35)] hover:bg-white transition duration-150"
          >
             {/* We moved text-[#4A7C59] right here onto the span! */}
            <span className="text-[#4A7C59] [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.5)]">
              SIGN UP
            </span>
          </Link>
          
        </div>
      </div>

      {/* Hidden dev link for your team to access the build map */}
      {process.env.NODE_ENV !== "production" && (
        <div className="absolute top-4 left-4 z-50">
          <Link href="/dev" className="text-xs font-semibold text-[#3F6F50]/40 hover:text-[#3F6F50] transition">
            Test Hub
          </Link>
        </div>
      )}
    </main>
  );
}