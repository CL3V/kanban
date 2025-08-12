import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kanban Board - Project Management",
  description: "A modern Kanban board for managing projects and tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 min-h-screen transition-all duration-300`}
      >
        <ThemeProvider defaultTheme="system" storageKey="kanban-theme">
          <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">K</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Kanban Board
                    </h1>
                  </div>
                </div>
                <div className="flex items-center">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1 overflow-hidden w-full">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
