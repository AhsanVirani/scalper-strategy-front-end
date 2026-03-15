import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { BottomNav } from "@/components/nav/BottomNav";

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
  title: "Trading Platform",
  description: "LVN/FVG Scalping Strategy — Backtesting & Analytics",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trading",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
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
        <div className="flex flex-col h-dvh overflow-hidden">
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
