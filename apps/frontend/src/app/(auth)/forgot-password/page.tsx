import React from "react";
import AuthForgotPassword from "@/app/auth/authforms/AuthForgotPassword";
import LeftSidebarPart from "@/app/auth/auth1/LeftSidebarPart";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Forgot Password — NexHire" };

const ForgotPasswordPage = () => (
  <div className="relative overflow-hidden h-screen">
    <div className="grid grid-cols-12 gap-3 h-screen bg-white dark:bg-darkgray">
      <div className="xl:col-span-4 lg:col-span-4 col-span-12 bg-dark lg:block hidden relative overflow-hidden">
        <LeftSidebarPart />
      </div>
      <div className="xl:col-span-8 lg:col-span-8 col-span-12 sm:px-12 px-4">
        <div className="flex h-screen items-center px-3 max-w-[460px] mx-auto">
          <div className="w-full">
            <FullLogo />
            <h3 className="text-2xl font-bold my-3">Forgot Password</h3>
            <p className="text-darklink text-sm font-medium">Enter your email and we will send you a reset link.</p>
            <AuthForgotPassword />
            <Button variant="lightprimary" className="w-full mt-4 rounded-full" asChild>
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ForgotPasswordPage;
