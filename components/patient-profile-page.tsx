"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Pill, QrCode, User } from "lucide-react";

import { PatientBottomNav } from "@/components/patient-bottom-nav";
import { ProfileEditModal } from "@/components/profile-edit-modal";
import { LogoutButton } from "@/components/logout-button";

type PatientProfileUser = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  profileImageDataUrl: string | null;
};

export function PatientProfilePage(props: {
  user: PatientProfileUser;
}) {
  const [user, setUser] = useState(props.user);
  const [editOpen, setEditOpen] = useState(false);
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <main className="pd-page flex flex-col">
      <h1 className="pd-heading mb-6">Profile</h1>

      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#2F3E34] bg-[#E5E7EB]">
          {user.profileImageDataUrl ? (
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
        <div className="text-center text-[13px] opacity-70">
          <p>{user.email}</p>
          <p>{user.phone ?? "No phone added yet"}</p>
        </div>
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
            href="/patient/care-circle"
            className="pd-card flex items-center gap-4 p-4 transition hover:opacity-90"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#2F3E34]/10">
              <QrCode className="h-5 w-5 text-[#2F3E34]" />
            </div>
            <div>
              <span className="text-[16px] font-bold">Care Circle QR</span>
              <p className="mt-1 text-[12px] opacity-60">
                View your latest invite and manage access.
              </p>
            </div>
          </Link>

          <Link
            href="/patient/medications"
            className="pd-card flex items-center gap-4 p-4 transition hover:opacity-90"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#2F3E34]/10">
              <Pill className="h-5 w-5 text-[#2F3E34]" />
            </div>
            <div>
              <span className="text-[16px] font-bold">Medications</span>
              <p className="mt-1 text-[12px] opacity-60">
                Review active medicines and today&apos;s logs.
              </p>
            </div>
          </Link>
        </div>
      </div>

      <div className="mt-auto flex justify-center pb-4 pt-8">
        <LogoutButton />
      </div>

      <PatientBottomNav activeItem="profile" />

      {editOpen ? (
        <ProfileEditModal
          initialName={fullName}
          initialEmail={user.email}
          initialPhone={user.phone ?? ""}
          initialProfileImageDataUrl={user.profileImageDataUrl}
          onClose={() => setEditOpen(false)}
          onSaved={(updatedUser) => {
            setUser(updatedUser);
          }}
        />
      ) : null}
    </main>
  );
}
