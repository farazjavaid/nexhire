"use client";
import React from "react";
import Image from "next/image";

const SocialButtons = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3">
        <a
          href={`${apiUrl}/auth/google`}
          className="px-4 py-2.5 border border-ld flex gap-2 items-center w-full rounded-md text-center justify-center text-ld text-primary-ld hover:bg-gray-50 dark:hover:bg-dark transition-colors"
        >
          <Image src="/images/svgs/google-icon.svg" alt="google" height={18} width={18} />
          Continue with Google
        </a>
        <a
          href={`${apiUrl}/auth/microsoft`}
          className="px-4 py-2.5 border border-ld flex gap-2 items-center w-full rounded-md text-center justify-center text-ld text-primary-ld hover:bg-gray-50 dark:hover:bg-dark transition-colors"
        >
          <Image src="/images/svgs/microsoft-icon.svg" alt="microsoft" height={18} width={18} />
          Continue with Microsoft
        </a>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <hr className="grow border-ld" />
        <p className="text-base text-ld font-medium">or continue with</p>
        <hr className="grow border-ld" />
      </div>
    </div>
  );
};

export default SocialButtons;
