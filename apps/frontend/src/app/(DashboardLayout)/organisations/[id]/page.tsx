import type { Metadata } from "next";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import OrgDetailClient from "./OrgDetailClient";

export const metadata: Metadata = { title: "Organisation — NexHire" };

const BCrumb = [
  { to: "/", title: "Home" },
  { to: "/organisations", title: "Organisations" },
  { title: "Details" },
];

export default function OrgDetailPage() {
  return (
    <>
      <BreadcrumbComp title="Organisation" items={BCrumb} />
      <OrgDetailClient />
    </>
  );
}
