"use client";
import { Icon } from "@iconify/react";
import CardBox from "@/app/components/shared/CardBox";
import { useProfile } from "@/app/context/ProfileContext";
import Link from "next/link";

const Introduction = () => {
  const { profile } = useProfile();

  return (
    <>
      <CardBox>
        <h5 className="card-title">Introduction</h5>
        {profile?.profile.bio ? (
          <p className="card-subtitle">{profile.profile.bio}</p>
        ) : (
          <p className="card-subtitle text-darklink italic">No bio added yet.</p>
        )}
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex gap-3 items-center">
            <Icon icon="solar:mailbox-outline" height="20" className="text-ld" />
            <p className="text-ld font-semibold">{profile?.email ?? "—"}</p>
          </div>
          {profile?.phoneNumber && (
            <div className="flex gap-3 items-center">
              <Icon icon="solar:phone-outline" height="20" className="text-ld" />
              <p className="text-ld font-semibold">{profile.phoneNumber}</p>
            </div>
          )}
          {profile?.profile.linkedinUrl && (
            <div className="flex gap-3 items-center">
              <Icon icon="mdi:linkedin" height="20" className="text-ld" />
              <Link href={profile.profile.linkedinUrl} target="_blank" className="text-ld font-semibold hover:text-primary">
                LinkedIn Profile
              </Link>
            </div>
          )}
          <div className="flex gap-3 items-center">
            <Icon icon="solar:clock-circle-outline" height="20" className="text-ld" />
            <p className="text-ld font-semibold">{profile?.profile.timezone ?? "UTC"}</p>
          </div>
        </div>
      </CardBox>
    </>
  );
};

export default Introduction;
