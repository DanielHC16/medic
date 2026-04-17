import Link from "next/link";
import Image from "next/image";
import { MedicationReminderPanel } from "@/components/medication-reminder-panel";
import { getPatientDashboardData, listMedicationLogsForPatient } from "@/lib/db/medic-data";
import { formatDateTime, formatTimeList } from "@/lib/display";
import { getNextReminderSlot } from "@/lib/medication-reminders";
import { requireRole } from "@/lib/auth/dal";

export default async function PatientDashboardPage() {
  const user = await requireRole("patient");
  const [dashboard, medicationLogs] = await Promise.all([
    getPatientDashboardData(user.userId),
    listMedicationLogsForPatient(user.userId, 12),
  ]);

  if (!dashboard) {
    return null;
  }

  // Formatting today's date to match UI (e.g., "SAT 18 APRIL")
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).toUpperCase();

  // Get next medication and appointment for the display cards
  const nextMedicationEntry =
    dashboard.medications
      .filter((item) => item.isActive)
      .map((item) => ({
        item,
        nextSlot: getNextReminderSlot(item, medicationLogs, today),
      }))
      .filter(
        (
          entry,
        ): entry is {
          item: (typeof dashboard.medications)[number];
          nextSlot: Date;
        } => entry.nextSlot instanceof Date,
      )
      .sort((left, right) => left.nextSlot.getTime() - right.nextSlot.getTime())[0] ?? null;
  const nextMedication = nextMedicationEntry?.item ?? dashboard.medications[0] ?? null;
  const nextMedicationTimeLabel = nextMedicationEntry
    ? new Intl.DateTimeFormat("en-PH", {
        hour: "numeric",
        hour12: user.preferences.timeFormat !== "24h",
        minute: "2-digit",
      }).format(nextMedicationEntry.nextSlot)
    : nextMedication
      ? formatTimeList(nextMedication.scheduleTimes)
      : "Not scheduled";
  const nextAppointment = dashboard.appointments[0];

  return (
    <main className="min-h-screen bg-[#EFF3F1] pb-32 px-5 pt-12 font-sans overflow-x-hidden relative">
      
      {/* Header Section */}
      <header className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A231D] tracking-tight">
            Welcome, {user.firstName || "User"}!
          </h1>
          <div className="flex items-center text-[#73847B] text-xs font-semibold mt-1 tracking-wider">
            <SunIcon className="w-4 h-4 mr-1.5" />
            <span>{dateString}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-[42px] h-[42px] bg-[#425F4C] rounded-xl flex items-center justify-center text-white shadow-md hover:bg-[#344b3c] transition">
            <QrCodeIcon className="w-6 h-6" />
          </button>
          <Link
            href="/profile"
            className="w-[42px] h-[42px] bg-black rounded-full flex items-center justify-center shadow-md overflow-hidden border-2 border-transparent"
          >
            {/* Replace with User Avatar Image if available */}
            <UserSolidIcon className="w-6 h-6 text-white" />
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        
        {/* Medicine Taken Today Card */}
        <div className="bg-[#568164] text-white rounded-[24px] p-5 shadow-[0_4px_12px_rgba(86,129,100,0.2)] relative overflow-hidden">
          <PillIcon className="absolute top-4 right-4 w-6 h-6 opacity-80" />
          <h2 className="text-[15px] font-medium mb-1">Medicine Taken today</h2>
          <p className="text-[40px] font-light tracking-wide flex items-baseline gap-2">
            {dashboard.medicationSummary.takenToday} 
            <span className="text-[22px] font-normal opacity-90">/ {dashboard.medicationSummary.dueToday}</span>
          </p>
        </div>

        {/* Next Medication Card */}
        <div className="bg-[#FAFBF9] rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex justify-between items-start">
          <div>
            <h2 className="text-[16px] font-bold text-[#1A231D] mb-1">Next Medication:</h2>
            <p className="text-sm text-[#73847B]">
              {nextMedication
                ? `${nextMedication.name} is the next scheduled dose`
                : "No medications scheduled today"}
            </p>
          </div>
          {nextMedication && (
            <div className="flex items-center gap-2 text-[#1A231D]">
              <span className="text-[15px] font-semibold">
                {nextMedicationTimeLabel}
              </span>
              <BellIcon className="w-5 h-5" />
            </div>
          )}
        </div>

        <MedicationReminderPanel
          contactMethod={user.preferences.preferredContactMethod}
          logs={medicationLogs}
          medications={dashboard.medications}
          patientDisplayName={`${user.firstName} ${user.lastName}`}
          patientUserId={user.userId}
          role={user.role}
          timeFormat={user.preferences.timeFormat}
          viewerDisplayName={`${user.firstName} ${user.lastName}`}
        />

        {/* AI Recommendation Card */}
        <div className="bg-[#FAFBF9] rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2.5 mb-2">
            <RobotIcon className="w-[22px] h-[22px] text-[#1A231D]" />
            <h2 className="text-[16px] font-bold text-[#1A231D]">AI Recommendation</h2>
          </div>
          <p className="text-[14px] text-[#4A5D52] pl-8 leading-snug">
            Try a 5-minute light stretching session today.
          </p>
        </div>

        {/* Upcoming Appointments Section */}
        <h3 className="text-[18px] font-bold text-[#1A231D] mt-3 mb-1 px-1">
          Upcoming Appointments:
        </h3>

        {dashboard.appointments.length === 0 ? (
           <div className="bg-[#FAFBF9] rounded-[24px] p-5 shadow-sm text-sm text-[#73847B] text-center">
             No upcoming appointments.
           </div>
        ) : (
          <div className="bg-[#FAFBF9] rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[15px] font-bold text-[#1A231D] block mb-0.5">Today</span>
                <h4 className="text-[16px] font-bold text-[#425F4C]">{nextAppointment.title}</h4>
              </div>
              <div className="flex items-center gap-2 text-[#1A231D]">
                <span className="text-[15px] font-semibold">
                   {formatDateTime(nextAppointment.appointmentAt).split(',')[1] || "9:00 AM"} 
                </span>
                <BellIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[14px] text-[#4A5D52] space-y-1.5">
              <p><span className="text-[#73847B]">Doctor:</span> {nextAppointment.providerName || "Pending"}</p>
              <p><span className="text-[#73847B]">Location:</span> {nextAppointment.location || "Pending"}</p>
            </div>
          </div>
        )}

        {/* Progress Summary Section */}
        <h3 className="text-[18px] font-bold text-[#1A231D] mt-3 mb-1 px-1">
          Progress Summary
        </h3>

        <div className="grid grid-cols-2 gap-4">
          
          {/* Donut Chart Card */}
          <div className="bg-[#FAFBF9] rounded-[24px] p-4 flex flex-col items-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] aspect-[4/5] relative">
            
            {/* Precision SVG Donut Chart */}
            <div className="relative w-[130px] h-[130px] mb-4">
              {/* Math breakdown:
                Radius (r) = 38. Circumference (C) = 2 * pi * 38 = 238.76
                Green segment: 50% (119.38 length), starting at 6 o'clock
                Yellow segment: 33.3% (79.58 length), starting at 12 o'clock
                Teal segment: 16.6% (39.79 length), starting at 4 o'clock
              */}
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                <g transform="rotate(-90 50 50)">
                  
                  {/* Teal (Missed) - 4 to 6 o'clock */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#C3E0DE" strokeWidth="14" 
                          strokeDasharray="39.79 238.76" strokeDashoffset="-79.58" />
                  
                  {/* Green (Taken) - 6 to 12 o'clock */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#8BA488" strokeWidth="14" 
                          strokeDasharray="119.38 238.76" strokeDashoffset="-119.38" />
                  
                  {/* Yellow (Pending) - 12 to 4 o'clock */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#F1D262" strokeWidth="14" 
                          strokeDasharray="79.58 238.76" strokeDashoffset="0" />
                </g>

                {/* White stroke gaps slicing the donut (matched to background) */}
                <line x1="50" y1="50" x2="50" y2="-10" stroke="#FAFBF9" strokeWidth="5" />       {/* 12 o'clock */}
                <line x1="50" y1="50" x2="50" y2="110" stroke="#FAFBF9" strokeWidth="5" />       {/* 6 o'clock */}
                <line x1="50" y1="50" x2="102" y2="80" stroke="#FAFBF9" strokeWidth="5" />       {/* 4 o'clock */}
              </svg>
              
              {/* Inner Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                <span className="text-[26px] font-bold text-[#1A231D] leading-none mb-0.5">2/5</span>
                <span className="text-[10px] text-[#73847B] font-medium leading-[1.2] text-center">
                  Medications<br/>Taken
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex w-full justify-between items-center px-1 mt-auto pb-1">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8BA488]" />
                <span className="text-[9px] font-medium text-[#73847B]">Taken</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F1D262]" />
                <span className="text-[9px] font-medium text-[#73847B]">Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D49191]" />
                <span className="text-[9px] font-medium text-[#73847B]">Missed</span>
              </div>
            </div>
          </div>

          {/* Workouts Completed Card */}
          <div className="bg-[#FAFBF9] rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-5 flex flex-col items-center justify-between text-center min-h-[200px]">
            <div className="relative w-full h-[100px] mb-3 flex-shrink-0">
              {/* Ensure you have this illustration in your public folder */}
              <Image 
                src="/Blue-Simple-Elderly-Care-Logo.png" 
                alt="Stretching Progress" 
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-auto flex flex-col items-center pb-1">
              <span className="text-[22px] font-bold text-[#1A231D] leading-none mb-1">1/2</span>
              <span className="text-[11px] text-[#73847B] font-medium leading-snug">
                Workouts<br/>Completed
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Full Width Curved Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#FAFBF9] rounded-t-[32px] px-8 py-4 pb-6 flex justify-between items-center shadow-[0_-8px_24px_rgba(0,0,0,0.04)] z-50">
        
        {/* Lifted Active Home Button */}
        <div className="relative -top-7">
          <Link href="/patient/dashboard" className="w-[64px] h-[64px] bg-[#568164] rounded-full flex items-center justify-center text-white shadow-lg border-[6px] border-[#EFF3F1] outline outline-1 outline-black/5">
            <HomeIcon className="w-7 h-7" />
          </Link>
        </div>

        <Link href="/patient/schedule" className="p-2">
          <ClockIcon className="w-[28px] h-[28px] text-[#C0C8C3] hover:text-[#568164] transition" />
        </Link>
        <Link href="/wellness" className="p-2">
          <HeartIcon className="w-[28px] h-[28px] text-[#C0C8C3] hover:text-[#568164] transition" />
        </Link>
        <Link href="/profile" className="p-2">
          <UserOutlineIcon className="w-[28px] h-[28px] text-[#C0C8C3] hover:text-[#568164] transition" />
        </Link>
      </nav>

    </main>
  );
}

// ==========================================
// Inline SVG Icons mapped perfectly to the UI
// ==========================================

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function QrCodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h-3v2h3v-2zm-3 4h3v2h-3v-2zm-2-6h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm2 2h2v2h-2v-2z" />
    </svg>
  );
}

function UserSolidIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function PillIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6zM14 6a7.5 7.5 0 00-7.5 7.5h7.5V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.4 16.6l9.2-9.2a3.5 3.5 0 014.9 4.9l-9.2 9.2a3.5 3.5 0 01-4.9-4.9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 13l4-4" />
    </svg>
  );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

function RobotIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h.01M15 12h.01M12 3v3m0 0a3 3 0 100 6 3 3 0 000-6zm-7.5 6h15A1.5 1.5 0 0121 13.5v4A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5v-4A1.5 1.5 0 014.5 9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 19v2m8-2v2" />
    </svg>
  );
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function UserOutlineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
