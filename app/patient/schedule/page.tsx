"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Pill, CheckCircle2, X, Calendar } from "lucide-react";

const scheduledMeds = [
  { id: 1, time: "8:00 AM", name: "Acetaminophen", desc: "1 Pill | Every 6 Hours", status: "TAKEN" },
  { id: 2, time: "2:00 PM", name: "Acetaminophen", desc: "1 Pill | Every 6 Hours", status: "PENDING" },
  { id: 3, time: "8:00 PM", name: "Acetaminophen", desc: "1 Pill | Every 6 Hours", status: "PENDING" },
];

export default function ScheduleUI() {
  const [selectedMedication, setSelectedMedication] = useState<boolean>(false);

  return (
    <main className="min-h-screen bg-[#EFF3F1] pb-32 px-5 pt-12 font-sans overflow-x-hidden relative text-[#1A231D]">
      
      {/* =========================================
          SCREEN 1: LIST VIEW (MED REMINDER)
          ========================================= */}
      <div className={`transition-all duration-500 ease-in-out ${selectedMedication ? 'opacity-0 -translate-x-full hidden' : 'opacity-100 translate-x-0'}`}>
        
        {/* Toggle Buttons - Updated to Figma Style */}
        <div className="mb-8 flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 rounded-[12px] bg-[#4D6A56] py-4 text-[11px] font-bold tracking-widest text-white shadow-lg uppercase transition-all">
            <Pill className="h-4 w-4 -rotate-45" />
            VIEW MEDICATION
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 rounded-[12px] border border-[#D9E0DC] bg-[#F1F3F2] py-4 text-[11px] font-bold tracking-widest text-[#1A231D] uppercase transition-all">
            <Calendar className="h-4 w-4" />
            VIEW SCHEDULE
          </button>
        </div>

        {/* Schedule Cards - Updated to Light Background with Dark Text */}
        <div className="flex flex-col gap-4">
          {scheduledMeds.map((med) => (
            <button
              key={med.id}
              onClick={() => setSelectedMedication(true)}
              className="text-left w-full rounded-[20px] bg-[#F1F3F2] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:bg-[#E8EBE9] transition-all active:scale-[0.98]"
            >
              <div className="mb-2 text-[14px] font-bold tracking-tight text-[#1A231D]">
                {med.time}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#384D4D]/10">
                    <Pill className="h-5 w-5 -rotate-45 text-[#384D4D]" />
                </div>
                <div>
                  <h3 className="text-[24px] font-extrabold tracking-tight leading-none text-[#1A231D] mb-1">
                    {med.name}
                  </h3>
                  <p className="text-[13px] font-semibold text-[#5C665F]">
                    {med.desc}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================
          SCREEN 2: MEDICATION INFORMATION (Detail View)
          ========================================= */}
      <div className={`absolute inset-0 z-40 bg-[#EFF3F1] overflow-y-auto px-5 pt-12 pb-32 transition-all duration-500 ease-in-out ${selectedMedication ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full hidden'}`}>
        
        <div className="mb-4 flex justify-end">
          <button 
            onClick={() => setSelectedMedication(false)}
            className="rounded-full border-[1.5px] border-[#1A231D] p-1 text-[#1A231D] hover:bg-black/5"
          >
            <X className="h-6 w-6" strokeWidth={2} />
          </button>
        </div>

        <div className="mb-6">
          <h2 className="mb-1 text-[36px] font-extrabold tracking-tight text-[#384D4D]">
            Acetaminophen
          </h2>
          <p className="text-[14px] font-bold text-[#1A231D]">Maintenance | 20 mg</p>
          <p className="text-[13px] text-[#73847B] font-medium">Prescribed by: Dr. Who</p>
        </div>

        {/* Info Blocks */}
        <div className="mb-8 flex gap-3">
          <div className="flex flex-1 items-center gap-3 rounded-[16px] border border-[#D9E0DC] bg-[#F1F3F2] p-4">
            <Pill className="h-6 w-6 -rotate-45 text-[#1A231D]" strokeWidth={2.5} />
            <div>
              <div className="text-[18px] font-bold text-[#1A231D]">3 Pills</div>
              <div className="text-[11px] font-bold text-[#73847B]">Daily</div>
            </div>
          </div>
          
          <div className="flex flex-1 items-center gap-3 rounded-[16px] border border-[#D9E0DC] bg-[#F1F3F2] p-4">
            <ClockIcon className="h-6 w-6 text-[#1A231D]" />
            <div>
               <div className="text-[11px] font-bold text-[#73847B] uppercase leading-none">Every</div>
               <div className="text-[18px] font-bold text-[#1A231D]">6 Hours</div>
            </div>
          </div>
        </div>

        {/* Detail Schedule Section */}
        <div className="mb-8">
          <h3 className="mb-4 text-[16px] font-bold text-[#1A231D] tracking-tight">Schedule:</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-[16px] bg-[#F1F3F2] p-5 h-[56px] border border-[#D9E0DC]">
              <span className="text-[16px] font-bold text-[#1A231D]">8:00 AM</span>
              <div className="flex items-center gap-1.5 rounded-lg bg-[#4D6A56] px-3 py-1.5 text-white">
                <CheckCircle2 className="h-4 w-4" strokeWidth={3} />
                <span className="text-[11px] font-black tracking-widest uppercase">TAKEN</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-[16px] bg-[#F1F3F2] p-5 h-[56px] border border-[#D9E0DC]">
              <span className="text-[16px] font-bold text-[#1A231D]">2:00 PM</span>
            </div>
            <div className="flex items-center justify-between rounded-[16px] bg-[#F1F3F2] p-5 h-[56px] border border-[#D9E0DC]">
              <span className="text-[16px] font-bold text-[#1A231D]">8:00 PM</span>
            </div>
          </div>
        </div>

        {/* Tracker Section - Updated to match Figma 1/50 style */}
        <div>
          <h3 className="mb-4 text-[16px] font-bold text-[#1A231D] tracking-tight">Tracker:</h3>
          <div className="flex gap-4">
            <div className="flex-1 rounded-[20px] bg-[#F1F3F2] p-5 border border-[#D9E0DC]">
              <Pill className="h-5 w-5 -rotate-45 text-[#1A231D] mb-3" />
              <div className="text-[28px] font-bold text-[#1A231D] leading-none mb-1">1 / 50</div>
              <div className="text-[12px] font-bold text-[#73847B]">Taken</div>
            </div>
            <div className="flex-1 rounded-[20px] bg-[#F1F3F2] p-5 border border-[#D9E0DC]">
              <Pill className="h-5 w-5 -rotate-45 text-[#1A231D] mb-3" />
              <div className="text-[28px] font-bold text-[#1A231D] leading-none mb-1">1</div>
              <div className="text-[12px] font-bold text-[#73847B]">Missed</div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          BOTTOM NAVIGATION BAR
          ========================================= */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#FAFBF9] rounded-t-[32px] px-8 py-4 pb-8 flex justify-between items-center shadow-[0_-8px_24px_rgba(0,0,0,0.05)] z-50">
        
        {/* Home Link */}
        <Link href="/patient/dashboard" className="group p-2">
          <HomeIcon className="w-[28px] h-[28px] text-[#C0C8C3] transition-all duration-300 group-hover:text-[#4D6A56]" />
        </Link>

        {/* Active Schedule Button (Static Green) */}
        <div className="relative -top-8">
          <Link href="/patient/schedule" className="w-[68px] h-[68px] bg-[#4D6A56] rounded-full flex items-center justify-center text-white shadow-xl border-[6px] border-[#EFF3F1] transition-transform duration-300 hover:scale-105">
            <ClockIcon className="w-8 h-8 text-white" />
          </Link>
        </div>

        {/* Health Info Link */}
        <Link href="/wellness" className="group p-2">
          <HeartIcon className="w-[28px] h-[28px] text-[#C0C8C3] transition-all duration-300 group-hover:text-[#4D6A56]" />
        </Link>
        
        {/* Settings/User Link */}
        <Link href="/profile" className="group p-2">
          <UserOutlineIcon className="w-[28px] h-[28px] text-[#C0C8C3] transition-all duration-300 group-hover:text-[#4D6A56]" />
        </Link>
      </nav>

    </main>
  );
}

// Icons
function HomeIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>; }
function ClockIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function HeartIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>; }
function UserOutlineIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
