"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Pill, Clock, CheckCircle2, X, Home, User, Heart } from "lucide-react";

// Mock data representing the daily schedule
const scheduledMeds = [
  { id: 1, time: "8:00 AM", name: "Acetaminophen", desc: "1 Pill | Every 6 Hours", status: "TAKEN" },
  { id: 2, time: "2:00 PM", name: "Acetaminophen", desc: "1 Pill | Every 6 Hours", status: "PENDING" },
  { id: 3, time: "8:00 PM", name: "Acetaminophen", desc: "1 Pill | Every 6 Hours", status: "PENDING" },
];

export default function PatientSchedulePage() {
  // State to handle which view is currently active. 
  // false = list view, true = detail view open
  const [selectedMedication, setSelectedMedication] = useState<boolean>(false);

  // Mock user for the UI
  const user = { firstName: "User" };

  return (
    <main className="min-h-screen bg-[#EFF3F1] font-sans text-[#1A231D] sm:bg-gray-200 sm:py-8 flex justify-center">
      {/* Mobile App Container Wrapper */}
      <div className="relative w-full max-w-[400px] overflow-hidden bg-[#EFF3F1] min-h-screen sm:min-h-[850px] sm:rounded-[40px] sm:shadow-2xl flex flex-col shadow-lg">
        
        {/* =========================================
            SCREEN 1: LIST VIEW 
            ========================================= */}
        <div className={`flex-1 overflow-y-auto px-6 pt-14 pb-32 transition-transform duration-500 ease-in-out ${selectedMedication ? '-translate-x-full hidden' : 'translate-x-0'}`}>
          <div className="mb-6">
            <h1 className="text-[22px] font-medium text-[#1A231D] tracking-tight mb-1">Good Morning!</h1>
            <h2 className="text-[32px] leading-none font-bold text-[#1A231D] tracking-tight">{user.firstName}</h2>
          </div>

          {/* Toggle Buttons */}
          <div className="mb-8 flex gap-3">
            <button className="flex-1 rounded-[16px] bg-[#384D4D] py-3.5 text-[12px] font-bold tracking-wide text-white shadow-md hover:bg-[#2d3e3e] transition-colors">
              VIEW MEDICATION
            </button>
            <button className="flex-1 rounded-[16px] border-[1.5px] border-[#568164] bg-transparent py-3.5 text-[12px] font-bold tracking-wide text-[#568164] hover:bg-[#568164]/5 transition-colors">
              VIEW SCHEDULE
            </button>
          </div>

          {/* Schedule Cards */}
          <div className="flex flex-col gap-4">
            {scheduledMeds.map((med) => (
              <button
                key={med.id}
                onClick={() => setSelectedMedication(true)}
                className="text-left w-full rounded-[24px] bg-[#568164] p-5 text-white shadow-[0_4px_16px_rgba(86,129,100,0.25)] hover:bg-[#4a7256] transition-colors active:scale-[0.98]"
              >
                <div className="mb-3 text-[14px] font-bold tracking-wide text-white/95">
                  {med.time}
                </div>
                <div className="flex items-center gap-4">
                  <Pill className="h-7 w-7 -rotate-45 text-white opacity-90" strokeWidth={2} />
                  <div>
                    <h3 className="text-[22px] font-bold tracking-tight leading-none mb-1.5">
                      {med.name}
                    </h3>
                    <p className="text-[13px] font-medium text-white/80">
                      {med.desc}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

{/* BOTTOM NAVIGATION BAR (List View Only) */}
        {!selectedMedication && (
          <nav className="absolute bottom-0 left-0 w-full z-10">
            {/* The curved background container */}
            <div className="relative h-[85px] w-full bg-[#FAFBF9] rounded-t-[32px] shadow-[0_-8px_24px_rgba(0,0,0,0.04)] flex justify-between items-center px-8 pb-2">
              
              {/* Link to Dashboard */}
              <Link href="/patient/dashboard" className="p-2 text-[#C0C8C3] hover:text-[#568164] transition-colors">
                <Home className="w-[28px] h-[28px]" strokeWidth={2} />
              </Link>

              {/* Elevated Floating Action Button (Active Schedule Page) */}
              <div className="relative -top-7">
                <div className="absolute inset-0 bg-[#FAFBF9] rounded-full scale-[1.3] -z-10"></div>
                <Link href="/patient/schedule" className="w-[64px] h-[64px] bg-[#568164] rounded-full flex items-center justify-center text-white shadow-lg border-[6px] border-[#EFF3F1] outline outline-1 outline-black/5 hover:bg-[#4a7256] transition-colors">
                  <Clock className="w-7 h-7" strokeWidth={2.5} />
                </Link>
              </div>

              {/* Link to Health Info */}
              <Link href="/patient/health-info" className="p-2 text-[#C0C8C3] hover:text-[#568164] transition-colors">
                <Heart className="w-[28px] h-[28px]" strokeWidth={2} />
              </Link>
              
              {/* Link to Settings */}
              <Link href="/patient/settings" className="p-2 text-[#C0C8C3] hover:text-[#568164] transition-colors">
                <User className="w-[28px] h-[28px]" strokeWidth={2} />
              </Link>

            </div>
          </nav>
        )}
        
        {/* =========================================
            SCREEN 2: MEDICATION INFO DETAIL 
            ========================================= */}
        <div className={`absolute inset-0 z-50 bg-[#EFF3F1] overflow-y-auto px-6 pt-14 pb-12 transition-transform duration-500 ease-in-out ${selectedMedication ? 'translate-x-0' : 'translate-x-full'}`}>
          
          <div className="mb-2 flex justify-end">
            <button 
              onClick={() => setSelectedMedication(false)}
              className="rounded-full border-[2px] border-[#1A231D] p-1.5 text-[#1A231D] hover:bg-black/5 transition-colors"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="mb-6">
            <h2 className="mb-1.5 text-[32px] leading-none font-bold tracking-tight text-[#384D4D]">
              Acetaminophen
            </h2>
            <p className="text-[15px] font-bold text-[#1A231D] mb-0.5">Maintenance | 20 mg</p>
            <p className="text-[14px] text-[#73847B] font-medium">Prescribed by: Dr. Who</p>
          </div>

          <div className="mb-8 flex flex-col gap-3">
            <div className="flex items-center gap-4 rounded-[20px] bg-[#FAFBF9] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
              <Pill className="h-7 w-7 -rotate-45 text-[#384D4D]" strokeWidth={2} />
              <div>
                <div className="text-[20px] font-bold text-[#1A231D] leading-tight mb-0.5">60 mg</div>
                <div className="text-[13px] font-medium text-[#73847B]">Daily Dosage</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col justify-center rounded-[20px] bg-[#FAFBF9] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-center">
                <div className="text-[20px] font-bold text-[#1A231D] leading-tight mb-0.5">3 Pills</div>
                <div className="text-[13px] font-medium text-[#73847B]">Daily</div>
              </div>
              
              <div className="flex flex-1 items-center justify-center gap-3 rounded-[20px] bg-[#FAFBF9] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                <Clock className="h-7 w-7 text-[#384D4D]" strokeWidth={2} />
                <div className="text-left">
                  <div className="text-[11px] font-bold text-[#73847B] uppercase tracking-wide mb-0.5">Every</div>
                  <div className="text-[18px] font-bold text-[#1A231D] leading-none">6 Hours</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-3 text-[18px] font-bold text-[#1A231D]">Schedule:</h3>
            <div className="flex flex-col gap-3">
              
              <div className="flex items-center justify-between rounded-[20px] bg-[#FAFBF9] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] h-[60px]">
                <span className="text-[16px] font-bold text-[#1A231D]">8:00 AM</span>
                <div className="flex items-center gap-2 text-[#384D4D]">
                  <CheckCircle2 className="h-[20px] w-[20px]" strokeWidth={2.5} />
                  <span className="text-[14px] font-bold tracking-wide">TAKEN</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-[20px] bg-[#FAFBF9] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] h-[60px]">
                <span className="text-[16px] font-bold text-[#1A231D]">2:00 PM</span>
              </div>

              <div className="flex items-center justify-between rounded-[20px] bg-[#FAFBF9] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] h-[60px]">
                <span className="text-[16px] font-bold text-[#1A231D]">8:00 PM</span>
              </div>

            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[18px] font-bold text-[#1A231D]">Tracker:</h3>
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1 rounded-[20px] bg-[#FAFBF9] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                <Pill className="h-6 w-6 -rotate-45 text-[#384D4D] mb-1" strokeWidth={2.5} />
                <div className="text-[24px] font-bold text-[#1A231D] leading-none mb-0.5">1 / 3</div>
                <div className="text-[13px] font-medium text-[#73847B]">Taken</div>
              </div>
              <div className="flex flex-1 flex-col gap-1 rounded-[20px] bg-[#FAFBF9] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                <Pill className="h-6 w-6 -rotate-45 text-[#384D4D] mb-1" strokeWidth={2.5} />
                <div className="text-[24px] font-bold text-[#1A231D] leading-none mb-0.5">1</div>
                <div className="text-[13px] font-medium text-[#73847B]">Missed</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}