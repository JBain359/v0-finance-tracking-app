import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@descope/nextjs-sdk";
import "./globals.css";

// Onest font from Framer project - matching the design system
const onest = {
  className: "font-sans",
  style: { fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif" },
};

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "FinTrack - Personal Finance Tracker",
  description:
    "Track your spending with AI-powered insights. Upload bank and credit card statements, auto-categorize transactions, and chat with your financial data.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider
      projectId={process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID!}
      refreshTokenViaCookie={{ secure: process.env.NODE_ENV !== "development" }}
      sessionTokenViaCookie={{ secure: process.env.NODE_ENV !== "development" }}
    >
      <html lang="en" className="bg-background">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className={`${onest.className} ${geistMono.variable} antialiased`}>
          <main className="min-h-screen">{children}</main>
          {process.env.NODE_ENV === "production" && <Analytics />}
        </body>
      </html>
    </AuthProvider>
  );
}
