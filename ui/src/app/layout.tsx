import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuthDevice7702 Demo 🔐",
  description: "UI Demo: Multi-Device WebAuthn Account Management with EIP-7702 (Non-Functional Prototype)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen`}
      >
        <Providers>
          <div className="max-w-6xl mx-auto px-4 py-8">
            <header className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                AuthDevice7702 Demo 🔐
              </h1>
              <p className="text-gray-600">
                UI Demo: Multi-Device WebAuthn Account Management with EIP-7702
              </p>
              <div className="mt-3 inline-block px-4 py-2 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm font-medium text-red-700">
                  ⚠️ Non-Functional Prototype - UI Demo Only
                </p>
              </div>
            </header>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
