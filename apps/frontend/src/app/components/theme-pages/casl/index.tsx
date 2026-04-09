"use client";
import React from "react";
import { defineAbility } from "@casl/ability";
import { Can } from "@casl/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/app/context/ProfileContext";
import { Icon } from "@iconify/react";

// ─── Original CASL demo data ─────────────────────────────────────────────────

interface actionType {
  action: string;
  subject: string;
}

interface PermissionType {
  CanEdit: actionType;
  CanDelete: actionType;
}

const permissions: PermissionType | any = {
  CanEdit: {
    action: "Can-Edit",
    subject: "address",
  },
  CanDelete: {
    action: "Can-Delete",
    subject: "address",
  },
};

interface userType {
  Admin: { permissions: Array<string> };
  Manager: { permissions: Array<string> };
  Subscriber: { permissions: Array<string> };
}

const users: userType | any = {
  Admin: { permissions: ["CanEdit", "CanDelete"] },
  Manager: { permissions: ["CanEdit"] },
  Subscriber: { permissions: [] },
};

interface addressType {
  city: string;
  street: string;
  type: string;
}

const addresses: addressType[] = [
  { city: "New York",       street: "5684 Max Summit", type: "address" },
  { city: "Manhatten York", street: "5684 Max Summit", type: "address" },
  { city: "Canada street York", street: "5684 Max Summit", type: "address" },
  { city: "Delhi street",   street: "5684 Max Summit", type: "address" },
  { city: "UP Chawk",       street: "5684 Max Summit", type: "address" },
];

// ─── NexHire role config ──────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  permissions: string[];
}> = {
  platform_admin: {
    label: "Platform Admin",
    icon: "solar:shield-star-line-duotone",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    description: "Full control over the entire NexHire platform.",
    permissions: [
      "Approve or reject interviewer applications",
      "View platform-wide analytics",
      "View and manage all organisations (suspend, delete)",
      "Assign or remove other Platform Admins",
      "Manage system-level settings",
    ],
  },
  org_admin: {
    label: "Organisation Admin",
    icon: "solar:buildings-2-line-duotone",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    description: "Manages users and settings within their own organisation.",
    permissions: [
      "Invite users to the organisation via email",
      "Approve or reject membership requests",
      "Remove members from the organisation",
      "Change member roles within the organisation",
      "View organisation-level analytics",
      "Update organisation profile and settings",
    ],
  },
  client: {
    label: "Client",
    icon: "solar:user-id-line-duotone",
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-800",
    description: "Company-side user who posts jobs and requests interviews.",
    permissions: [
      "Create, edit, and delete job postings",
      "Send interview requests to candidates",
      "View candidate profiles",
      "View interview reports and scorecards",
      "View job-level analytics within own organisation",
    ],
  },
  interviewer: {
    label: "Interviewer",
    icon: "solar:user-check-rounded-line-duotone",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    description: "Conducts interviews. Requires Platform Admin approval to activate.",
    permissions: [
      "View interviews assigned to them",
      "Conduct assigned interviews",
      "Submit scorecards after interviews",
      "View profiles of assigned candidates",
    ],
  },
  candidate: {
    label: "Candidate",
    icon: "solar:user-hand-up-line-duotone",
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    description: "Job seeker who applies for jobs and participates in interviews.",
    permissions: [
      "Create and update their profile",
      "Apply for jobs",
      "Participate in screening and interviews",
      "View own interview history and scorecards",
    ],
  },
  internal_employee: {
    label: "Internal Employee",
    icon: "solar:diploma-line-duotone",
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
    description: "NexHire internal user with access to mock interviews and upskilling.",
    permissions: [
      "Access the mock interview platform",
      "Access upskilling resources",
      "Manage own profile",
      "Track own progress",
    ],
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const RollBaseIndex = () => {
  const [userId, setUserId] = React.useState(Object.keys(users)[0]);
  const { profile, loading } = useProfile();

  const userPermissions = users[userId].permissions.map(
    (id: number) => permissions[id]
  );

  const actions = [
    ...userPermissions.reduce(
      (collection: any, { action }: { action: any }) => {
        collection.add(action);
        return collection;
      },
      new Set()
    ),
  ];

  const ability = defineAbility((can) => {
    userPermissions.forEach(
      ({ action, subject }: { action: any; subject: any }) => {
        can(action, subject);
      }
    );
  });

  const roles: string[] = profile?.roles ?? [];

  return (
    <div className="space-y-8">

      {/* ── NexHire: Your Role & Access ── */}
      <div className="max-w-3xl space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <p className="text-darklink text-sm">Loading...</p>
          </div>
        ) : !profile ? (
          <div className="flex items-center justify-center h-24">
            <p className="text-darklink text-sm">Not logged in.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-lightprimary flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:user-circle-line-duotone" className="text-2xl text-primary" />
            </div>
            <div>
              <p className="font-semibold text-base">
                {profile.profile.firstName} {profile.profile.lastName}
              </p>
              <p className="text-sm text-darklink">{profile.email}</p>
            </div>
            <div className="ms-auto flex flex-wrap gap-2">
              {roles.length === 0 && (
                <span className="text-xs text-darklink border border-ld rounded-full px-3 py-1">
                  No roles assigned
                </span>
              )}
              {roles.map((role) => {
                const cfg = ROLE_CONFIG[role];
                return (
                  <span
                    key={role}
                    className={`text-xs font-medium border rounded-full px-3 py-1 ${cfg ? `${cfg.color} ${cfg.bg} ${cfg.border}` : "text-darklink bg-gray-100 border-gray-200"}`}
                  >
                    {cfg?.label ?? role}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Original CASL demo ── */}
      <Card>
        <div className="flex gap-2">
          {Object.entries(users).map(([id], i) => (
            <React.Fragment key={i}>
              {userId !== id ? (
                <Button variant={"outline"} key={id} onClick={() => setUserId(id)}>
                  {id}
                </Button>
              ) : (
                <Button key={id} onClick={() => setUserId(id)}>
                  {id}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-lightprimary dark:bg-lightprimary p-4 rounded-md my-2">
          {users[userId].permissions.map((permission: string) => (
            <h5 key={permission} className="text-sm opacity-80">
              {permission}
            </h5>
          ))}
        </div>

        <ul className="border-0 dark:bg-transparent p-2">
          {addresses.map(({ city, street, type }) => (
            <li key={city} className="mb-3">
              <div className="flex items-center gap-3">
                <span className="text-darklink font-normal">
                  {city}, {street}
                </span>
                {actions.map((action) => (
                  <Can I={action} a={type} ability={ability} key={action}>
                    <Button variant="lightprimary" size="sm" className="rounded-full">
                      {action}
                    </Button>
                  </Can>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Card>

    </div>
  );
};

export default RollBaseIndex;
