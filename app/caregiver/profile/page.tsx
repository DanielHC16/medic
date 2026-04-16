import Link from "next/link";
import { Home, Activity, UserPlus, Heart, User } from "lucide-react";

import { ProfilePageContent } from "@/components/profile-page-content";
import { requireRole } from "@/lib/auth/dal";
import { listLinkedPatientsForMember } from "@/lib/db/medic-data";
import { LogoutButton } from "@/components/logout-button";

export default async function CaregiverProfilePage() {
  const user = await requireRole("caregiver");
  const records = await listLinkedPatientsForMember(user.userId);

  // Mark the profile tab as active
  const currentPath = "/caregiver/profile";

  return (
    <div className="min-h-screen bg-[#Eef1f4] pb-32 font-sans">
      <main className="px-6 pt-10">
        {/* --- PROFILE HEADER --- */}
        <section className="mb-6 rounded-[2.5rem] bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5C8B6B]">
            Medic
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Caregiver Profile
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Update your caregiver account details and review which patient records are currently linked.
          </p>
        </section>

        {/* --- PROFILE CONTENT --- */}
        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-black/5">
          <ProfilePageContent
            heading="Caregiver account"
            records={records}
            roleNotes={[
              "Caregivers can manage medications, routines, and appointments for linked patients.",
              "Use the Monitoring page for the detailed patient-by-patient work area.",
            ]}
            shortcuts={[
              { href: "/caregiver/monitoring", label: "Open Monitoring" },
              { href: "/join", label: "Join another patient" },
            ]}
            user={user}
          />

          {/* --- SIGN OUT SECTION --- */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex w-full justify-center">
               {/* Using your project's existing LogoutButton component */}
               <LogoutButton />
            </div>
          </div>

        </div>
      </main>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around rounded-t-[2.5rem] bg-white px-4 py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100">
        {/* Home */}
        <NavIcon 
          href="/caregiver/dashboard" 
          icon={Home} 
          isActive={false} 
        />
        
        {/* Monitoring */}
        <NavIcon 
          href="/caregiver/monitoring" 
          icon={Activity} 
          isActive={false} 
        />

        {/* Join */}
        <NavIcon 
          href="/join" 
          icon={UserPlus} 
          isActive={false} 
        />

        {/* Wellness */}
        <NavIcon 
          href="/wellness" 
          icon={Heart} 
          isActive={false} 
        />

        {/* Profile - ACTIVE */}
        <NavIcon 
          href="/caregiver/profile" 
          icon={User} 
          isActive={true} 
        />
      </nav>
    </div>
  );
}

/**
 * Shared NavIcon Component
 */
function NavIcon({ href, icon: Icon, isActive }: { href: string; icon: any; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`relative flex h-14 w-14 items-center justify-center transition-all duration-300 ${
        isActive 
          ? "rounded-full bg-[#5C8B6B] shadow-lg scale-110" 
          : "rounded-full bg-transparent hover:bg-gray-50"
      }`}
    >
      <Icon 
        size={24}
        color={isActive ? "#FFFFFF" : "#5C8B6B"} 
        strokeWidth={isActive ? 2.5 : 2}
        className="block"
      />
    </Link>
  );
}