"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { usersApi } from "@/lib/api";
import { Icon } from "@iconify/react";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";

const VerifyEmailPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Invalid verification link."); return; }
    usersApi.verifyEmail(token)
      .then(({ message }) => { setStatus("success"); setMessage(message); })
      .catch((err) => { setStatus("error"); setMessage(err.message || "Verification failed."); });
  }, [token]);

  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-darkgray px-4">
      <div className="max-w-[400px] w-full text-center">
        <div className="mb-6"><FullLogo /></div>
        {status === "loading" && (
          <>
            <Icon icon="solar:refresh-circle-outline" className="text-5xl text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-bold">Verifying your email...</h3>
          </>
        )}
        {status === "success" && (
          <>
            <Icon icon="solar:check-circle-bold" className="text-5xl text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Email Verified!</h3>
            <p className="text-darklink text-sm mb-6">{message}</p>
            <Link href="/" className="inline-block bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium">
              Go to Dashboard
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <Icon icon="solar:close-circle-bold" className="text-5xl text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Verification Failed</h3>
            <p className="text-darklink text-sm mb-6">{message}</p>
            <Link href="/profile" className="inline-block bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium">
              Back to Profile
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
