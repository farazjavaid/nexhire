import type { Metadata } from "next";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import OrganisationsClient from "./OrganisationsClient";

export const metadata: Metadata = { title: "My Organisations — NexHire" };

const BCrumb = [{ to: "/", title: "Home" }, { title: "Organisations" }];

export default function OrganisationsPage() {
  return (
    <>
      <BreadcrumbComp title="My Organisations" items={BCrumb} />
      <OrganisationsClient />
    </>
  );
}
