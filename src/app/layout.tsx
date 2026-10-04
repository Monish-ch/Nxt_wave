import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for hero/section headlines — the signature type of the dark theme
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "NxtWave AI Workshop Growth Engine",
    template: "%s · NxtWave Growth Engine",
  },
  description:
    "Build Your First AI Project in 60 Minutes — a free online workshop for final-year engineering students. Register, get your referral code, and help your campus hit the growth target.",
  keywords: [
    "NxtWave",
    "AI workshop",
    "free workshop",
    "engineering students",
    "referral program",
    "growth",
  ],
  openGraph: {
    title: "Build Your First AI Project in 60 Minutes",
    description:
      "Free online workshop for final-year engineering students. Reserve your spot and unlock referral rewards.",
    siteName: "NxtWave AI Workshop Growth Engine",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NxtWave",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0a17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
