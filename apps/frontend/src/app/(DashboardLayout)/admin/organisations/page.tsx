import type { Metadata } from "next";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import AdminOrgsClient from "./AdminOrgsClient";

export const metadata: Metadata = { title: "Organisations — Admin — NexHire" };

const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Admin" },
  { title: "Organisations" },
];

const AdminOrganisationsPage = () => (
  <>
    <BreadcrumbComp title="Organisations" items={BCrumb} />
    <AdminOrgsClient />
  </>
);

export default AdminOrganisationsPage;
