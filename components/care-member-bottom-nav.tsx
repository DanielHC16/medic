"use client";

import Link from "next/link";
import {
  Activity,
  Clock,
  Heart,
  House,
  Pill,
  User,
  UserPlus,
} from "lucide-react";

import type { RoleSlug } from "@/lib/medic-types";

export type CareMemberBottomNavItem =
  | "activity"
  | "home"
  | "join"
  | "medications"
  | "profile"
  | "wellness";

type SupportedCareRole = Extract<RoleSlug, "caregiver" | "family_member">;

const CAREGIVER_ITEMS = [
  {
    href: "/caregiver/dashboard",
    icon: House,
    key: "home",
    label: "Home",
  },
  {
    href: "/caregiver/monitoring",
    icon: Activity,
    key: "activity",
    label: "Monitoring",
  },
  {
    href: "/caregiver/medications",
    icon: Pill,
    key: "medications",
    label: "Medications",
  },
  {
    href: "/caregiver/join",
    icon: UserPlus,
    key: "join",
    label: "Join",
  },
  {
    href: "/caregiver/wellness",
    icon: Heart,
    key: "wellness",
    label: "Wellness",
  },
  {
    href: "/caregiver/profile",
    icon: User,
    key: "profile",
    label: "Profile",
  },
] as const satisfies Array<{
  href: string;
  icon: typeof House;
  key: CareMemberBottomNavItem;
  label: string;
}>;

const FAMILY_ITEMS = [
  {
    href: "/family/dashboard",
    icon: House,
    key: "home",
    label: "Home",
  },
  {
    href: "/family/updates",
    icon: Clock,
    key: "activity",
    label: "Updates",
  },
  {
    href: "/family/medications",
    icon: Pill,
    key: "medications",
    label: "Medications",
  },
  {
    href: "/caregiver/join",
    icon: UserPlus,
    key: "join",
    label: "Join",
  },
  {
    href: "/family/wellness",
    icon: Heart,
    key: "wellness",
    label: "Wellness",
  },
  {
    href: "/family/profile",
    icon: User,
    key: "profile",
    label: "Profile",
  },
] as const satisfies Array<{
  href: string;
  icon: typeof House;
  key: CareMemberBottomNavItem;
  label: string;
}>;

function withPatientQuery(href: string, patientUserId?: string | null) {
  if (!patientUserId || href === "/caregiver/join") {
    return href;
  }

  return `${href}?patientId=${patientUserId}`;
}

export function CareMemberBottomNav(props: {
  activeItem?: CareMemberBottomNavItem | null;
  patientUserId?: string | null;
  role: SupportedCareRole;
}) {
  const items = props.role === "caregiver" ? CAREGIVER_ITEMS : FAMILY_ITEMS;

  return (
    <nav className="pd-nav justify-around gap-1 px-3" aria-label="Care member navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const href = withPatientQuery(item.href, props.patientUserId);
        const isActive = props.activeItem === item.key;

        if (isActive) {
          return (
            <div key={item.key} className="pd-nav-active" aria-current="page">
              <Link
                href={href}
                aria-label={item.label}
                className="flex h-full w-full items-center justify-center"
              >
                <Icon className="h-7 w-7" />
              </Link>
            </div>
          );
        }

        return (
          <Link
            key={item.key}
            href={href}
            aria-label={item.label}
            className="pd-nav-link flex items-center justify-center"
          >
            <Icon className="h-6 w-6" />
          </Link>
        );
      })}
    </nav>
  );
}
