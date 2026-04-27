import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Inter } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" className={`h-full antialiased ${atkinson.variable} ${inter.variable}`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
