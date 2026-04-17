"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Calendar as CalendarIcon, Play, Check, Plus, MoreHorizontal, MapPin, Search, Filter } from "lucide-react";
import type {
  ActivityLogRecord,
  ActivityPlanRecord,
  ActivitySummary,
  AppointmentRecord,
} from "@/lib/medic-types";

type WellnessUIProps = {
  activityPlans: ActivityPlanRecord[];
  appointments: AppointmentRecord[];
  activityLogs: ActivityLogRecord[];
  activitySummary: ActivitySummary | null;
  canManage: boolean;
};

export default function WellnessUI(props: WellnessUIProps) {
  const { activityPlans, appointments, canManage } = props;

  // Toggle between the two main screens shown in Figma
  const [activeView, setActiveView] = useState<"tips" | "scheduler">("scheduler");

  return (
    <main className="min-h-screen bg-[#EFF3F1] pb-32 font-sans overflow-x-hidden text-[#1A231D]">
      
      {/* Header */}
      <header className="px-5 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-[#EFF3F1] z-30">
        <Link href="/patient/dashboard" className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors">
          <ChevronLeft className="h-6 w-6 text-[#1A231D]" strokeWidth={2.5} />
        </Link>
        <h1 className="text-[16px] font-bold text-[#73847B]">
          {activeView === "tips" ? "Wellness Tips" : "Activity Scheduler"}
        </h1>
        <div className="h-8 w-8 rounded-full bg-[#D9E0DC] flex items-center justify-center overflow-hidden border border-[#1A231D]/10">
           {/* Placeholder for User Avatar */}
           <UserOutlineIcon className="h-5 w-5 text-[#4D6A56]" />
        </div>
      </header>

      {/* View Toggle (Optional utility to switch between your two Figma flows) */}
      <div className="px-5 mb-6 flex gap-2">
        <button 
          onClick={() => setActiveView("scheduler")}
          className={`flex-1 py-2 text-[12px] font-bold tracking-widest uppercase rounded-[12px] border transition-all ${activeView === "scheduler" ? 'bg-[#4D6A56] text-white border-[#4D6A56] shadow-md' : 'bg-transparent text-[#73847B] border-[#D9E0DC]'}`}
        >
          Scheduler
        </button>
        <button 
          onClick={() => setActiveView("tips")}
          className={`flex-1 py-2 text-[12px] font-bold tracking-widest uppercase rounded-[12px] border transition-all ${activeView === "tips" ? 'bg-[#4D6A56] text-white border-[#4D6A56] shadow-md' : 'bg-transparent text-[#73847B] border-[#D9E0DC]'}`}
        >
          Tips
        </button>
      </div>

      <div className="px-5">
        {/* =========================================
            SCREEN 1: ACTIVITY SCHEDULER
            ========================================= */}
        {activeView === "scheduler" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            
            {/* Calendar Scroller */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-[24px] font-extrabold tracking-tight">Jan 2024</h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-full border border-[#D9E0DC] text-[#4D6A56] bg-white"><Filter className="w-4 h-4" /></button>
                <button className="p-2 rounded-full border border-[#D9E0DC] text-[#4D6A56] bg-white"><Search className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Sub-header */}
            <div className="mb-4">
               <p className="text-[14px] font-medium text-[#73847B]">Due (2). <span className="font-bold text-[#1A231D]">Today, Thursday 04</span></p>
            </div>

            {/* Dynamic Appointments Mapping */}
            <div className="flex flex-col gap-4 mb-8">
              {appointments.length > 0 ? appointments.map((appt) => (
                <div key={appt.id} className="relative rounded-[20px] bg-white p-5 border border-[#4D6A56]/30 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border-l-[6px] border-l-[#4D6A56]">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 text-[#4D6A56]">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-[12px] font-bold">11:30 AM & 5:30 PM</span>
                    </div>
                    <button className="text-[#C0C8C3] hover:text-[#73847B]"><MoreHorizontal className="w-5 h-5" /></button>
                  </div>
                  <h3 className="text-[18px] font-bold text-[#1A231D] mb-1">{appt.title || "Scheduled Activity"}</h3>
                  <p className="text-[13px] text-[#73847B] leading-snug mb-3">
                    {appt.notes || "Scheduled routine for health tracking."}
                  </p>
                  <div className="flex items-center gap-1.5 text-[#73847B]">
                    <MapPin className="w-4 h-4" />
                    <span className="text-[12px] font-medium">{appt.location || "New York, USA"}</span>
                  </div>
                </div>
              )) : (
                // Fallback UI if data is empty to match Figma
                <>
                  <div className="relative rounded-[20px] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[#4D6A56]/30 border-l-[6px] border-l-[#4D6A56]">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 text-[#4D6A56]">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-[12px] font-bold">7:00 AM - 7:30 AM</span>
                      </div>
                      <button className="text-[#C0C8C3]"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>
                    <h3 className="text-[18px] font-bold text-[#1A231D] mb-1">Stretching Routine</h3>
                    <p className="text-[13px] text-[#73847B] leading-snug mb-3">Light stretching to improve flexibility and reduce stiffness of the muscles.</p>
                    <div className="flex items-center gap-1.5 text-[#73847B]"><MapPin className="w-4 h-4" /><span className="text-[12px] font-medium">New York, USA</span></div>
                  </div>
                  
                  <div className="relative rounded-[20px] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[#EAA43F]/30 border-l-[6px] border-l-[#EAA43F]">
                     <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 text-[#EAA43F]">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-[12px] font-bold">8:30 AM - 9:30 AM</span>
                      </div>
                      <button className="text-[#C0C8C3]"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>
                    <h3 className="text-[18px] font-bold text-[#1A231D] mb-1">Morning Yoga & Meditation</h3>
                    <p className="text-[13px] text-[#73847B] leading-snug mb-3">Stretching and mindfulness to reduce stress.</p>
                    <div className="flex items-center gap-1.5 text-[#73847B]"><MapPin className="w-4 h-4" /><span className="text-[12px] font-medium">New York, USA</span></div>
                  </div>
                </>
              )}
            </div>

            {/* Floating Action Button */}
            {canManage && (
              <div className="fixed bottom-[100px] right-5 z-40">
                <button className="w-14 h-14 bg-[#4D6A56] rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-transform">
                  <Plus className="w-6 h-6" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            SCREEN 2: WELLNESS TIPS / ACTIVITIES
            ========================================= */}
        {activeView === "tips" && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
             
            <h2 className="text-[14px] font-bold tracking-widest text-[#73847B] uppercase mb-4 mt-2">Recommended Activities</h2>

            {/* Dynamic Activity Plans Mapping */}
            <div className="flex flex-col gap-4">
              {activityPlans.length > 0 ? activityPlans.map((plan, idx) => (
                <div key={plan.id} className={`rounded-[20px] p-6 shadow-sm flex flex-col justify-center min-h-[120px] relative overflow-hidden ${idx % 2 === 0 ? 'bg-[#E3EFE8]' : 'bg-[#F2E5F5]'}`}>
                  <h3 className="text-[20px] font-extrabold text-[#1A231D] mb-1 z-10 w-2/3">{plan.title || "Breathing Exercise"}</h3>
                  <p className="text-[13px] text-[#5C665F] font-medium z-10 w-2/3 leading-snug">
                    {plan.instructions || "Gentle breathing to relax the body."}
                  </p>
                  <button className="absolute right-5 bottom-5 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-[#4D6A56] z-10 hover:scale-105 transition-transform">
                     <Play className="w-4 h-4 ml-1" fill="currentColor" />
                  </button>
                </div>
              )) : (
                // Fallback UI if data is empty
                <>
                  <div className="rounded-[20px] bg-[#F2E5F5] p-6 shadow-sm flex flex-col justify-center min-h-[120px] relative">
                    <h3 className="text-[20px] font-extrabold text-[#1A231D] mb-1 z-10 w-2/3">Breathing Exercise</h3>
                    <p className="text-[13px] text-[#5C665F] font-medium z-10 w-2/3 leading-snug">Gentle breathing to relax the body.</p>
                  </div>
                  <div className="rounded-[20px] bg-[#E3EFE8] p-6 shadow-sm flex flex-col justify-center min-h-[120px] relative">
                    <h3 className="text-[20px] font-extrabold text-[#1A231D] mb-1 z-10 w-2/3">Light Stretching</h3>
                    <p className="text-[13px] text-[#5C665F] font-medium z-10 w-2/3 leading-snug">Improve flexibility and reduce stiffness.</p>
                  </div>
                </>
              )}
            </div>

            <h2 className="text-[14px] font-bold tracking-widest text-[#73847B] uppercase mb-4 mt-8">Activities for Today</h2>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4 bg-[#F1F3F2] rounded-[16px] p-3 pr-5 border border-[#D9E0DC]">
                <div className="w-12 h-12 rounded-[12px] bg-[#4D6A56] flex items-center justify-center text-white shrink-0 shadow-inner">
                  <Check className="w-6 h-6" strokeWidth={3} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[16px] font-bold text-[#1A231D]">Breathing Exercise</h4>
                  <p className="text-[12px] text-[#73847B] font-medium">Activity 1 / 03:00 min</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-[#F1F3F2] rounded-[16px] p-3 pr-5 border border-[#D9E0DC]">
                <div className="w-12 h-12 rounded-[12px] bg-[#4D6A56] flex items-center justify-center text-white shrink-0 shadow-inner">
                  <Check className="w-6 h-6" strokeWidth={3} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[16px] font-bold text-[#1A231D]">Light Stretching</h4>
                  <p className="text-[12px] text-[#73847B] font-medium">Activity 2 / 05:00 min</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* =========================================
          BOTTOM NAVIGATION BAR
          ========================================= */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#FAFBF9] rounded-t-[32px] px-8 py-4 pb-6 flex justify-between items-center shadow-[0_-8px_24px_rgba(0,0,0,0.04)] z-50">
        
        {/* Home Link */}
        <Link href="/patient/dashboard" className="p-2">
          <HomeIcon className="w-[28px] h-[28px] text-[#C0C8C3] hover:text-[#568164] transition" />
        </Link>

        {/* Schedule Link */}
        <Link href="/patient/schedule" className="p-2">
          <ClockIcon className="w-[28px] h-[28px] text-[#C0C8C3] hover:text-[#568164] transition" />
        </Link>

        {/* Lifted Active Wellness Button */}
        <div className="relative -top-7">
        <Link 
            href="/wellness" 
            className="w-[64px] h-[64px] bg-[#568164] rounded-full flex items-center justify-center text-white shadow-lg border-[6px] border-[#EFF3F1] outline outline-1 outline-black/5"
        >
            <HeartIcon className="w-7 h-7" />
        </Link>
        </div>
        
        {/* Settings/User Link */}
        <Link href="/profile" className="p-2">
          <UserOutlineIcon className="w-[28px] h-[28px] text-[#C0C8C3] hover:text-[#568164] transition" />
        </Link>
      </nav>

    </main>
  );
}

// Inline SVG Icons
function HomeIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>; }
function ClockIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      fill="#FFFFFF"   /* Hardcoded White Fill */
      stroke="#FFFFFF" /* Hardcoded White Stroke */
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}
function UserOutlineIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
