import Link from "next/link";
import { ProfilePageContent } from "@/components/profile-page-content";
import { getSettingsRouteForRole, requireRole } from "@/lib/auth/dal";
import { listPatientConnections } from "@/lib/db/medic-data";

export default async function ProfilePage() {
  const user = await requireRole("patient");
  const records = await listPatientConnections(user.userId);

  const mobileOptions = [
    {
      label: "QR / Code",
      icon: <QrCodeIcon className="w-6 h-6" />,
      href: "/patient/care-circle",
    },
    {
      label: "Medication",
      icon: <PillIcon className="w-6 h-6" />,
      href: "/patient/medications",
    },
    { label: "Wellness", icon: <WellnessIcon className="w-6 h-6" />, href: "/wellness" },
  ];

  return (
    <main className="min-h-screen bg-[#EFF3F1] pb-32 font-sans overflow-x-hidden relative">
      {/* Mobile-Style Header */}
      <section className="bg-[#334237] pt-16 pb-12 px-8 rounded-b-[40px] relative transition-all shadow-lg">
        <div className="max-w-2xl mx-auto flex flex-col items-start gap-4">
          <div className="flex justify-between w-full items-start">
            <div className="w-24 h-24 bg-[#E0E5E2] rounded-full border-4 border-[#4A5D52] flex items-center justify-center overflow-hidden shadow-xl">
              <UserSolidIcon className="w-16 h-16 text-[#334237]" />
            </div>
            <Link
              href={getSettingsRouteForRole(user.role)}
              className="p-2 text-white/80 hover:text-white transition active:scale-90"
            >
              <SettingsIcon className="w-7 h-7" />
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white mt-2">
            {user.firstName || "User"}
          </h1>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-8 py-10 space-y-10">
        {/* We wrap ProfilePageContent but inject global CSS classes or Tailwind to force the "Underline" UI */}
        <div className="profile-ui-custom">
          <ProfilePageContent
            heading="Name:"
            records={records}
            shortcuts={[
              { href: "/patient/health-info", label: "Health Info" },
              { href: "/patient/alerts", label: "Alerts" },
            ]}
            user={user}
          />
        </div>

        {/* Integration of the "Options" buttons from the screenshot */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#334237]">Options:</h2>
          <div className="space-y-3">
            {mobileOptions.map((option) => (
              <Link
                key={option.label}
                href={option.href}
                className="flex items-center gap-4 bg-[#FAFBF9] p-5 rounded-[24px] border border-black/5 shadow-sm active:scale-[0.98] transition"
              >
                <div className="text-[#334237]">{option.icon}</div>
                <span className="font-bold text-[#334237] text-lg">{option.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Reusing Bottom Navigation from Dashboard */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#FAFBF9] rounded-t-[32px] px-8 py-4 pb-6 flex justify-between items-center shadow-[0_-8px_24px_rgba(0,0,0,0.04)] z-50">
        <Link href="/patient/dashboard" className="p-2"><HomeIcon className="w-[28px] h-[28px] text-[#C0C8C3]" /></Link>
        <Link href="/patient/schedule" className="p-2"><ClockIcon className="w-[28px] h-[28px] text-[#C0C8C3]" /></Link>
        <Link href="/wellness" className="p-2"><HeartIcon className="w-[28px] h-[28px] text-[#C0C8C3]" /></Link>
        <div className="relative -top-7">
          <div className="w-[64px] h-[64px] bg-[#568164] rounded-full flex items-center justify-center text-white shadow-lg border-[6px] border-[#EFF3F1]">
            <UserSolidIcon className="w-7 h-7" />
          </div>
        </div>
      </nav>

      {/* Keep AppShell hidden or purely functional for background tasks if necessary, 
          but here we've rebuilt the UI for the specific screenshot request */}
    </main>
  );
}

// Icon Components needed for the new UI
function SettingsIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" /></svg>; }
function QrCodeIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h-3v2h3v-2zm-3 4h3v2h-3v-2zm-2-6h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm2 2h2v2h-2v-2z" /></svg>; }
function PillIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><path d="M7.4 16.6l9.2-9.2a3.5 3.5 0 014.9 4.9l-9.2 9.2a3.5 3.5 0 01-4.9-4.9zM11 13l4-4" /></svg>; }
function WellnessIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><circle cx="12" cy="7" r="2"/><path d="M7 13.5l3-1.5h4l3 1.5M10 12l-1 7M14 12l1 7"/></svg>; }
function UserSolidIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>; }
function HomeIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>; }
function ClockIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" {...props}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function HeartIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" {...props}><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>; }
