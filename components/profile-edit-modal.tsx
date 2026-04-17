"use client";

import { useState } from "react";
import { User, ChevronLeft } from "lucide-react";

interface Props {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  onClose: () => void;
}

export function ProfileEditModal({ initialName, initialEmail, initialPhone, onClose }: Props) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    if (password && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: name.split(" ")[0] ?? name,
          lastName: name.split(" ").slice(1).join(" ") || undefined,
          phone: phone || undefined,
          ...(password ? { password } : {}),
        }),
      });
      const json = res.ok ? await res.json() : { ok: false, message: "Server error." };
      if (!res.ok || !json.ok) throw new Error(json.message || "Failed to save.");
      setMessage("Profile updated.");
      setTimeout(onClose, 800);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pd-modal-sheet flex flex-col">

      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-white"
          style={{ background: "#4A7C59" }}
        >
          <ChevronLeft className="w-4 h-4" />
          BACK
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="w-20 h-20 rounded-full border-2 border-[#2F3E34] bg-[#E5E7EB] flex items-center justify-center">
          <User className="w-10 h-10 text-[#2F3E34]" />
        </div>
        <button className="text-[13px] underline opacity-70 hover:opacity-100 transition">
          Edit Profile Picture
        </button>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4 flex-1">
        <div>
          <p className="text-[14px] font-bold mb-1.5">Name:</p>
          <input
            className="w-full px-4 py-3 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2] text-[13px] outline-none focus:border-[#4A7C59] transition"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <p className="text-[14px] font-bold mb-1.5">Email:</p>
          <input
            className="w-full px-4 py-3 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2] text-[13px] outline-none focus:border-[#4A7C59] transition"
            placeholder="Email@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <p className="text-[14px] font-bold mb-1.5">Contact Number:</p>
          <input
            className="w-full px-4 py-3 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2] text-[13px] outline-none focus:border-[#4A7C59] transition"
            placeholder="09123456789"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <p className="text-[14px] font-bold mb-1.5">Password:</p>
          <input
            className="w-full px-4 py-3 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2] text-[13px] outline-none focus:border-[#4A7C59] transition"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <p className="text-[14px] font-bold mb-1.5">Retype Password:</p>
          <input
            className="w-full px-4 py-3 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2] text-[13px] outline-none focus:border-[#4A7C59] transition"
            placeholder="Retype Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {message && (
          <p className={`text-[13px] text-center font-semibold ${message.includes("updated") ? "text-[#4A7C59]" : "text-[#D97B7B]"}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-full text-[13px] font-bold uppercase tracking-widest text-white mt-2"
          style={{ background: "#4A7C59" }}
        >
          {saving ? "Saving…" : "SAVE"}
        </button>
      </div>
    </div>
  );
}
