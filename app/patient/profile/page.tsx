"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { House, Clock, Heart, User, QrCode, Pill, ChevronDown } from "lucide-react";
import { ProfileEditModal } from "@/components/profile-edit-modal";
import { LogoutButton } from "@/components/logout-button";

export default function PatientProfilePage() {
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; phone: string | null } | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.ok ? r.json() : null).then((j) => j && setUser(j?.user ?? j)).catch(() => {});
  }, []);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "User";

  return (
    <main className="pd-page flex flex-col">
      <h1 className="pd-heading mb-6">Profile</h1>
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-20 h-20 rounded-full border-2 border-[#2F3E34] bg-[#E5E7EB] flex items-center justify-center">
          <User className="w-10 h-10 text-[#2F3E34]" />
        </div>
        <p className="text-[17px] font-bold">{fullName}</p>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#2F3E34]/30 bg-[#F6F7F2] text-[13px] font-semibold opacity-70 hover:bg-[#E5E7EB] transition"
        >
          Edit Profile <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Options */}
      <div className="mb-6">
        <p className="text-[15px] font-bold mb-3">Options:</p>
        <div className="flex flex-col gap-3">
          <Link href="/patient/care-circle" className="pd-card p-4 flex items-center gap-4 hover:opacity-90 transition">
            <div className="w-10 h-10 rounded-xl bg-[#2F3E34]/10 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 text-[#2F3E34]" />
            </div>
            <span className="text-[16px] font-bold">QR / Code</span>
          </Link>
          <Link href="/patient/medications" className="pd-card p-4 flex items-center gap-4 hover:opacity-90 transition">
            <div className="w-10 h-10 rounded-xl bg-[#2F3E34]/10 flex items-center justify-center flex-shrink-0">
              <Pill className="w-5 h-5 text-[#2F3E34]" />
            </div>
            <span className="text-[16px] font-bold">Medication</span>
          </Link>
        </div>
      </div>

      {/* Sign out */}
      <div className="mt-auto pt-8 pb-4 flex justify-center">
        <LogoutButton />
      </div>

      {/* Bottom Nav */}
      <nav className="pd-nav">
        <Link href="/patient/dashboard" className="pd-nav-link"><House className="w-7 h-7" /></Link>
        <Link href="/patient/schedule" className="pd-nav-link"><Clock className="w-7 h-7" /></Link>
        <Link href="/wellness" className="pd-nav-link"><Heart className="w-7 h-7" /></Link>
        <div className="pd-nav-active">
          <Link href="/patient/profile" className="flex items-center justify-center w-full h-full">
            <User className="w-8 h-8" />
          </Link>
        </div>
      </nav>

      {editOpen && (
        <ProfileEditModal
          initialName={fullName}
          initialEmail={user?.email ?? ""}
          initialPhone={user?.phone ?? ""}
          onClose={() => setEditOpen(false)}
        />
      )}
    </main>
  );
}
