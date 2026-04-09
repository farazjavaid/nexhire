import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./css/globals.css";
import "@/utils/i18n";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "../components/ui/toaster";
import { CustomizerContextProvider } from "@/app/context/CustomizerContext";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/app/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NexHire — AI-Powered Interview Platform",
  description: "Technical interview platform for companies, candidates, and interviewers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/logos/Icon.png" type="image/png" />
      </head>
      <body className={`${inter.className}`} suppressHydrationWarning>
        <NextTopLoader color="#1B4332" showSpinner={false} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CustomizerContextProvider>{children}</CustomizerContextProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
