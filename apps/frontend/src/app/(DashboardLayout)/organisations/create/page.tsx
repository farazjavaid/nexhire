import type { Metadata } from "next";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import CreateOrgClient from "./CreateOrgClient";

export const metadata: Metadata = { title: "Create Organisation — NexHire" };

const BCrumb = [
  { to: "/", title: "Home" },
  { to: "/organisations", title: "Organisations" },
  { title: "Create" },
];

export default function CreateOrgPage() {
  return (
    <>
      <BreadcrumbComp title="Create Organisation" items={BCrumb} />
      <CreateOrgClient />
    </>
  );
}
