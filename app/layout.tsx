import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  description:
    "MEDIC supports medication reminders, routines, and connected care for patients, caregivers, and family members.",
  icons: {
    apple: "/medic-logo.png",
    icon: "/medic-logo.png",
  },
  title: {
    default: "MEDIC",
    template: "%s | MEDIC",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
