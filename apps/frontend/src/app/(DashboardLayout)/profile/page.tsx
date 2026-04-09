import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";

export const metadata: Metadata = { title: "My Profile — NexHire" };

const BCrumb = [{ to: "/", title: "Home" }, { title: "My Profile" }];

const ProfilePage = () => (
  <>
    <BreadcrumbComp title="My Profile" items={BCrumb} />
    <ProfileClient />
  </>
);

export default ProfilePage;
