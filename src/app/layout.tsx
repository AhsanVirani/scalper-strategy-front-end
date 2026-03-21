import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { BottomNav } from "@/components/nav/BottomNav";
import { Sidebar } from "@/components/nav/Sidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "LVN Scalper",
  description: "LVN/FVG Scalping Strategy — Backtesting & Analytics",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trading",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0e13",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Desktop: sidebar + content. Mobile: full-height column + bottom nav */}
        <div className="flex flex-col md:flex-row h-dvh overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </main>
            <BottomNav />
          </div>
        </div>
      </body>
    </html>
  );
}
