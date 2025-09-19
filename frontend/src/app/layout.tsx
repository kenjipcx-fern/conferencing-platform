import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Toaster is handled by NotificationProvider
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { ClientProviders } from '@/components/providers/ClientProviders';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Conferencing Platform - Professional Virtual Presentations",
  description: "Host engaging virtual conferences with real-time video, Q&A, and audience interaction.",
  keywords: ["conferencing", "webrtc", "virtual", "presentations", "meetings", "live streaming"],
  authors: [{ name: "Conferencing Platform Team" }],
  openGraph: {
    title: "Conferencing Platform",
    description: "Professional virtual conferencing with real-time features",
    type: "website",
    siteName: "Conferencing Platform",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
        suppressHydrationWarning
      >
        <ClientProviders>
          <NotificationProvider>
            {children}
            {/* Toaster is handled by NotificationProvider */}
          </NotificationProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
