import type { Metadata } from "next";
import { Geist, Rajdhani } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-rajdhani" });

export const metadata: Metadata = {
  title: {
    default: "Yaadhum CRM",
    template: "%s · Yaadhum CRM",
  },
  description: "Yaadhum International Technologies — CRM for leads, students, admissions, HR and finance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${rajdhani.variable}`}>
      <body className="font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
