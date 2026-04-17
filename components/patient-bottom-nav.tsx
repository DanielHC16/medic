"use client";

import Link from "next/link";
import { Clock, Heart, House, Pill, User, Users } from "lucide-react";

export type PatientBottomNavItem =
  | "care-circle"
  | "home"
  | "medications"
  | "profile"
  | "schedule"
  | "wellness";

const NAV_ITEMS: Array<{
  href: string;
  icon: typeof House;
  key: PatientBottomNavItem;
  label: string;
}> = [
  {
    href: "/patient/dashboard",
    icon: House,
    key: "home",
    label: "Home",
  },
  {
    href: "/patient/schedule",
    icon: Clock,
    key: "schedule",
    label: "Schedule",
  },
  {
    href: "/patient/medications",
    icon: Pill,
    key: "medications",
    label: "Medications",
  },
  {
    href: "/patient/care-circle",
    icon: Users,
    key: "care-circle",
    label: "Care Circle",
  },
  {
    href: "/patient/wellness",
    icon: Heart,
    key: "wellness",
    label: "Wellness",
  },
  {
    href: "/profile",
    icon: User,
    key: "profile",
    label: "Profile",
  },
];

export function PatientBottomNav(props: {
  activeItem?: PatientBottomNavItem | null;
}) {
  return (
    <nav className="pd-nav justify-around gap-1 px-3" aria-label="Patient navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = props.activeItem === item.key;

        if (isActive) {
          return (
            <div key={item.key} className="pd-nav-active" aria-current="page">
              <Link
                href={item.href}
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
            href={item.href}
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
