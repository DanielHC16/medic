"use client";

import { useState } from "react";
import { ChevronLeft, CalendarDays, Clock, Stethoscope, Video, MapPin, Paperclip, RefreshCw, Check } from "lucide-react";

interface Props {
  initialTitle?: string;
  initialProvider?: string;
  initialNotes?: string;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialLocation?: string;
  onBack: () => void;
  onSave?: (data: {
    title: string; provider: string; notes: string;
    date: string; startTime: string; endTime: string; location: string;
  }) => void;
}

export function AppointmentEditModal({
  initialTitle = "", initialProvider = "", initialNotes = "",
  initialDate = "", initialStartTime = "", initialEndTime = "",
  initialLocation = "", onBack, onSave,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [provider, setProvider] = useState(initialProvider);
  const [notes, setNotes] = useState(initialNotes);
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [location, setLocation] = useState(initialLocation);
  const [saved, setSaved] = useState(false);

  const field = "w-full px-4 py-3.5 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2] text-[13px] outline-none focus:border-[#4A7C59] transition";

  // Success popup
  if (saved) {
    return (
      <div className="pd-modal-sheet flex items-center justify-center">
        <div className="w-full max-w-sm rounded-[24px] p-8 flex flex-col items-center gap-5 mx-auto"
          style={{ background: "#2F3E34" }}>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-[24px] font-bold text-white text-center" style={{ fontFamily: "var(--font-heading)" }}>
            Successfully Edited!
          </h2>
          <button
            onClick={() => { setSaved(false); onSave?.({ title, provider, notes, date, startTime, endTime, location }); }}
            className="px-10 py-3 rounded-[14px] text-[13px] font-bold uppercase tracking-widest text-white"
            style={{ background: "#4A7C59" }}>
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-modal-sheet">

      {/* Back */}
      <div className="mb-6">
        <button onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-white"
          style={{ background: "#4A7C59" }}>
          <ChevronLeft className="w-4 h-4" /> BACK
        </button>
      </div>

      {/* Title */}
      <div className="flex flex-col items-center mb-6">
        <CalendarDays className="w-8 h-8 text-[#2F3E34] mb-2" />
        <h2 className="text-[20px] font-bold" style={{ fontFamily: "var(--font-heading)" }}>Edit Schedule</h2>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-3">
        <input className={field} placeholder="Event Name" value={title} onChange={(e) => setTitle(e.target.value)} />

        <div className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2]">
          <Stethoscope className="w-4 h-4 text-[#2F3E34]/50 flex-shrink-0" />
          <input className="flex-1 bg-transparent text-[13px] outline-none" placeholder="Doctors Name"
            value={provider} onChange={(e) => setProvider(e.target.value)} />
        </div>

        <textarea className={`${field} min-h-[100px] resize-none`} placeholder="Type Notes Here..."
          value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2]">
          <input className="flex-1 bg-transparent text-[13px] outline-none" placeholder="Date" type="date"
            value={date} onChange={(e) => setDate(e.target.value)} />
          <CalendarDays className="w-4 h-4 text-[#2F3E34]/50 flex-shrink-0" />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 items-center gap-3 px-4 py-3.5 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2]">
            <input className="flex-1 bg-transparent text-[13px] outline-none" placeholder="Start Time" type="time"
              value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Clock className="w-4 h-4 text-[#2F3E34]/50 flex-shrink-0" />
          </div>
          <div className="flex flex-1 items-center gap-3 px-4 py-3.5 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2]">
            <input className="flex-1 bg-transparent text-[13px] outline-none" placeholder="End Time" type="time"
              value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            <Clock className="w-4 h-4 text-[#2F3E34]/50 flex-shrink-0" />
          </div>
        </div>

        <button className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2] text-[13px] text-[#2F3E34]/60 text-left">
          <RefreshCw className="w-4 h-4 flex-shrink-0" /> Add Follow Up Consultation
        </button>

        <button className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2] text-[13px] text-[#2F3E34]/60 text-left">
          <Video className="w-4 h-4 flex-shrink-0" /> + Add Online Meeting
        </button>

        <div className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2]">
          <MapPin className="w-4 h-4 text-[#2F3E34]/50 flex-shrink-0" />
          <input className="flex-1 bg-transparent text-[13px] outline-none" placeholder="+ Add Location"
            value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <button className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2] text-[13px] text-[#2F3E34]/60 text-left">
          <Paperclip className="w-4 h-4 flex-shrink-0" /> Add Attachments
        </button>

        <button
          onClick={() => setSaved(true)}
          className="w-full py-4 rounded-full text-[13px] font-bold uppercase tracking-widest text-white mt-2"
          style={{ background: "#2F3E34" }}>
            NEXT
        </button>
      </div>
    </div>
  );
}
