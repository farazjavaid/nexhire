"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import ProfileTab from "./ProfileTab";
import CardBox from "@/app/components/shared/CardBox";
import { useProfile } from "@/app/context/ProfileContext";

const ProfileBanner = () => {
  const { profile } = useProfile();

  const displayName = profile
    ? `${profile.profile.firstName} ${profile.profile.lastName}`.trim()
    : "—";

  return (
    <>
      <CardBox className="p-0 overflow-hidden">
        <Image
          src={"/images/backgrounds/profilebg.jpg"}
          alt="profile banner"
          className="w-full"
          width={330}
          height={330}
        />
        <div className="bg-white dark:bg-dark p-6 -mt-2">
          <div className="grid grid-cols-12 gap-3">
            <div className="lg:col-span-4 col-span-12 lg:order-1 order-2">
              <div className="flex gap-6 items-center justify-around lg:py-0 py-4">
                <div className="text-center">
                  <h4 className="text-xl">{profile?.profile.experienceYears ?? "—"}</h4>
                  <p className="text-darklink dark:text-bodytext text-sm">Yrs Exp</p>
                </div>
                <div className="text-center">
                  <h4 className="text-xl">{profile?.roles?.length ?? 0}</h4>
                  <p className="text-darklink dark:text-bodytext text-sm">Roles</p>
                </div>
                <div className="text-center">
                  <h4 className="text-xl">{profile?.interestKeywords?.length ?? 0}</h4>
                  <p className="text-darklink dark:text-bodytext text-sm">Skills</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 col-span-12 lg:order-2 order-1">
              <div className="text-center -mt-20">
                <div className="w-[110px] h-[110px] linear-gradient rounded-full flex justify-center items-center mx-auto">
                  <Image
                    src={profile?.profile.avatarUrl ?? "/images/profile/user-1.jpg"}
                    alt="profile"
                    height="100"
                    width="100"
                    className="rounded-full mx-auto border-4 border-white dark:border-darkborder"
                  />
                </div>
                <h5 className="text-lg mt-3">{displayName}</h5>
                <p className="text-darklink dark:text-bodytext capitalize">
                  {profile?.roles?.[0]?.replace("_", " ") ?? ""}
                </p>
                {profile?.interestKeywords?.length ? (
                  <div className="flex flex-wrap gap-1 justify-center mt-2">
                    {profile.interestKeywords.slice(0, 4).map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="lg:col-span-4 col-span-12 lg:order-3 order-3">
              <div className="flex items-center gap-3.5 lg:justify-end justify-center h-full xl:pe-4">
                {profile?.profile.linkedinUrl && (
                  <Button className="h-9 w-9 rounded-full p-0" asChild>
                    <Link href={profile.profile.linkedinUrl} target="_blank">
                      <Icon icon="mdi:linkedin" width={20} />
                    </Link>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link href="/profile">Edit Profile</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <ProfileTab />
      </CardBox>
    </>
  );
};

export default ProfileBanner;
