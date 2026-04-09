"use client";

import Image from "next/image";

const LeftSidebarPart = () => {
  return (
    <>
      <div className="circle-top"></div>
      <div className="flex justify-center h-screen items-center z-10 relative">
        <div className="xl:w-7/12 xl:px-0 px-6">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src={"/images/logos/Icon.png"}
              alt="NexHire Logo"
              width={40}
              height={40}
            />
            <span className="text-white font-bold text-xl tracking-tight">NexHire</span>
          </div>
          <h2 className="text-white text-[36px] font-bold leading-tight mb-4">
            Hire smarter,<br />interview better.
          </h2>
          <p className="opacity-75 text-white text-base font-medium leading-relaxed">
            AI-powered technical interviews. Connect companies with vetted interviewers and get accurate, bias-free evaluations at scale.
          </p>
          <div className="mt-10 space-y-3">
            {["AI transcription & scoring", "Vetted interviewer network", "TOTP & email MFA security"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default LeftSidebarPart;
