"use client";

import React, { useState } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "sonner";
import { LanguageProvider, useLang } from "@/lib/LanguageContext";
import { Menu, Gamepad2 } from "lucide-react";

const MobileHeader = ({ onOpen }: { onOpen: () => void }) => {
  return (
    <header className="lg:hidden h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Gamepad2 className="text-white w-4 h-4" />
        </div>
        <h1 className="text-sm font-black tracking-tighter text-white italic uppercase">
          PS CAFE <span className="text-blue-400">PRO</span>
        </h1>
      </div>
      <button 
        onClick={onOpen}
        className="p-2 -me-2 text-muted-foreground hover:text-white transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>
    </header>
  );
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body className="antialiased text-foreground bg-background">
        <LanguageProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
              <MobileHeader onOpen={() => setIsSidebarOpen(true)} />
              
              <main className="flex-1 overflow-y-auto relative bg-transparent scrollbar-hide">
                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)' }} />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)' }} />

                <div className="relative z-10 p-4 md:p-8">
                  {children}
                </div>
              </main>
            </div>
          </div>
          <Toaster position="top-right" theme="dark" richColors closeButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
