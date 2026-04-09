import React from "react";
import AuthLogin from "@/app/auth/authforms/AuthLogin";
import LeftSidebarPart from "@/app/auth/auth1/LeftSidebarPart";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In — NexHire" };

const LoginPage = async ({ searchParams }: { searchParams: Promise<{ error?: string }> }) => {
  const params = await searchParams;
  return <div className="relative overflow-hidden h-screen">
    <div className="grid grid-cols-12 gap-3 h-screen bg-white dark:bg-darkgray">
      <div className="xl:col-span-4 lg:col-span-4 col-span-12 bg-dark lg:block hidden relative overflow-hidden">
        <LeftSidebarPart />
      </div>
      <div className="xl:col-span-8 lg:col-span-8 col-span-12 sm:px-12 px-4">
        <div className="flex h-screen items-center px-3 lg:justify-start justify-center">
          <div className="max-w-[420px] w-full mx-auto">
            <FullLogo />
            <h3 className="text-2xl font-bold my-3">Welcome back</h3>
            <p className="text-darklink text-sm font-medium">Sign in to your NexHire account</p>
            {params.error && (
              <p className="mt-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                Sign-in failed. Please try again.
              </p>
            )}
            <AuthLogin />
            <div className="flex gap-2 text-base font-medium mt-6 items-center justify-center">
              <p>New to NexHire?</p>
              <Link href="/register" className="text-primary text-sm font-medium">Create an account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
};

export default LoginPage;
