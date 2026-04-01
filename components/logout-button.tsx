"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/sign-in");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-busy={pending}
      className="medic-button text-sm"
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
