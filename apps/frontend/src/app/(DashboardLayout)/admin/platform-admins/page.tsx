import type { Metadata } from "next";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import UserRoleManagerClient from "./UserRoleManagerClient";

export const metadata: Metadata = { title: "User Role Management — Admin — NexHire" };

const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Admin" },
  { title: "User Roles" },
];

const UserRolesPage = () => (
  <>
    <BreadcrumbComp title="User Role Management" items={BCrumb} />
    <UserRoleManagerClient />
  </>
);

export default UserRolesPage;
