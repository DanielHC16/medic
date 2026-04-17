"use client";

import { useState } from "react";
import { User, ChevronLeft, Eye, EyeOff, Check } from "lucide-react";

interface Props {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  onClose: () => void;
}

const fieldClass = "w-full px-4 py-3 rounded-[14px] border border-[#2F3E34]/20 bg-[#F6F7F2] text-[13px] outline-none focus:border-[#4A7C59] transition";

function PasswordField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <p className="text-[14px] font-bold mb-1.5">{label}:</p>
      <div className="relative">
        <input
          className={`${fieldClass} pr-20`}
          placeholder={placeholder}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#2F3E34]/50 hover:text-[#2F3E34] transition"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-[11px] font-semibold">{show ? "Hide" : "Show"}</span>
        </button>
      </div>
    </div>
  );
}

export function ProfileEditModal({ initialName, initialEmail, initialPhone, onClose }: Props) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    setError(null);
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
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

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
            onClick={onClose}
            className="px-10 py-3 rounded-[14px] text-[13px] font-bold uppercase tracking-widest text-white"
            style={{ background: "#4A7C59" }}>
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-modal-sheet flex flex-col">

      <div className="mb-6">
        <button onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-white"
          style={{ background: "#4A7C59" }}>
          <ChevronLeft className="w-4 h-4" /> BACK
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="w-20 h-20 rounded-full border-2 border-[#2F3E34] bg-[#E5E7EB] flex items-center justify-center">
          <User className="w-10 h-10 text-[#2F3E34]" />
        </div>
        <button className="text-[13px] underline opacity-70 hover:opacity-100 transition">
          Edit Profile Picture
        </button>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div>
          <p className="text-[14px] font-bold mb-1.5">Name:</p>
          <input className={fieldClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <p className="text-[14px] font-bold mb-1.5">Email:</p>
          <input className={fieldClass} placeholder="Email@email.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <p className="text-[14px] font-bold mb-1.5">Contact Number:</p>
          <input className={fieldClass} placeholder="09123456789" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <PasswordField label="Password" value={password} onChange={setPassword} placeholder="Password" />
        <PasswordField label="Retype Password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Retype Password" />

        {error && (
          <p className="text-[13px] text-center font-semibold text-[#D97B7B]">{error}</p>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 rounded-full text-[13px] font-bold uppercase tracking-widest text-white mt-2"
          style={{ background: "#4A7C59" }}>
          {saving ? "Saving…" : "SAVE"}
        </button>
      </div>
    </div>
  );
}
