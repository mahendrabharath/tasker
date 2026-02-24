import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { TasksProvider } from "@/components/TasksProvider";
import { ThemeProviderWrapper } from "@/components/ThemeProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tasker",
  description: "Task creation, repetition tracking, and notifications.",
  manifest: "/manifest.json",
  themeColor: "#0a0a0a",
  icons: {
    icon: "/favicon.ico",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <AuthProvider>
          <ThemeProviderWrapper>
            <TasksProvider>
              <div className="min-h-screen">{children}</div>
            </TasksProvider>
          </ThemeProviderWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
