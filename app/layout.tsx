import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { version } from "@/package.json";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Parts Tracker",
  description: "Electronic components inventory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <header className="bg-gray-900 text-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
            <span className="font-bold text-lg tracking-tight">⚡ Parts Tracker</span>
            <nav className="flex gap-4 text-sm">
              <Link href="/parts" className="hover:text-blue-300 transition-colors">Inventory</Link>
              <Link href="/projects" className="hover:text-blue-300 transition-colors">Projects</Link>
              <Link href="/schematics" className="hover:text-blue-300 transition-colors">Schematics</Link>
              <Link href="/import" className="hover:text-blue-300 transition-colors">Import</Link>
            </nav>
            <span className="ml-auto text-xs text-gray-400 font-mono">v{version}</span>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">{children}</main>
      </body>
    </html>
  );
}
