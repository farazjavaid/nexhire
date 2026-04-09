import React from "react";
import AuthRegister from "@/app/auth/authforms/AuthRegister";
import LeftSidebarPart from "@/app/auth/auth1/LeftSidebarPart";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Account — NexHire" };

const RegisterPage = () => (
  <div className="relative overflow-hidden h-screen">
    <div className="grid grid-cols-12 gap-3 h-screen bg-white dark:bg-darkgray">
      <div className="xl:col-span-4 lg:col-span-4 col-span-12 bg-dark lg:block hidden relative overflow-hidden">
        <LeftSidebarPart />
      </div>
      <div className="xl:col-span-8 lg:col-span-8 col-span-12 sm:px-12 px-4">
        <div className="flex h-screen items-center px-3 lg:justify-start justify-center">
          <div className="max-w-[460px] w-full mx-auto">
            <FullLogo />
            <h3 className="text-2xl font-bold my-3">Create account</h3>
            <p className="text-darklink text-sm font-medium">Join NexHire and get started today</p>
            <AuthRegister />
            <div className="flex gap-2 text-base font-medium mt-6 items-center justify-start">
              <p>Already have an account?</p>
              <Link href="/login" className="text-primary text-sm font-medium">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default RegisterPage;
