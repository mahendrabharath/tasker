import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { TasksProvider } from "@/components/TasksProvider";

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <TasksProvider>
            <div className="min-h-screen bg-zinc-950 text-zinc-100">
              {children}
            </div>
          </TasksProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
