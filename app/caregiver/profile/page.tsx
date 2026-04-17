"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, QrCode, User } from "lucide-react";

import { CareMemberBottomNav } from "@/components/care-member-bottom-nav";
import { LogoutButton } from "@/components/logout-button";
import { ProfileEditModal } from "@/components/profile-edit-modal";

type ProfileUser = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  profileImageDataUrl: string | null;
};

export default function CaregiverProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => payload && setUser(payload?.user ?? payload))
      .catch(() => {});
  }, []);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "User";

  return (
    <main className="pd-page flex flex-col">
      <h1 className="pd-heading mb-6">Profile</h1>
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#2F3E34] bg-[#E5E7EB]">
          {user?.profileImageDataUrl ? (
            <Image
              src={user.profileImageDataUrl}
              alt={`${fullName} profile photo`}
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <User className="h-10 w-10 text-[#2F3E34]" />
          )}
        </div>
        <p className="text-[17px] font-bold">{fullName}</p>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 rounded-full border border-[#2F3E34]/30 bg-[#F6F7F2] px-6 py-2.5 text-[13px] font-semibold opacity-70 transition hover:bg-[#E5E7EB]"
        >
          Edit Profile <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-6">
        <p className="mb-3 text-[15px] font-bold">Options:</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/join"
            className="pd-card flex items-center gap-4 p-4 transition hover:opacity-90"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#2F3E34]/10">
              <QrCode className="h-5 w-5 text-[#2F3E34]" />
            </div>
            <span className="text-[16px] font-bold">QR / Code</span>
          </Link>

          <Link
            href="/caregiver/dashboard"
            className="pd-card flex items-center gap-4 p-4 transition hover:opacity-90"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#2F3E34]/10">
              <User className="h-5 w-5 text-[#2F3E34]" />
            </div>
            <span className="text-[16px] font-bold">Patient Profiles</span>
          </Link>
        </div>
      </div>

      <div className="mt-auto flex justify-center pb-4 pt-8">
        <LogoutButton />
      </div>

      <CareMemberBottomNav
        activeItem="profile"
        role="caregiver"
      />

      {editOpen && user ? (
        <ProfileEditModal
          initialName={fullName}
          initialEmail={user.email}
          initialPhone={user.phone ?? ""}
          initialProfileImageDataUrl={user.profileImageDataUrl}
          onClose={() => setEditOpen(false)}
          onSaved={(savedUser) => {
            setUser(savedUser);
          }}
        />
      ) : null}
    </main>
  );
}
