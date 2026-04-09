"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { organisationsApi, type MyOrganisation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { useProfile } from "@/app/context/ProfileContext";

const ORG_TYPE_LABELS: Record<string, string> = {
  company: "Company",
  startup: "Startup",
  enterprise: "Enterprise",
  ngo: "NGO",
  government: "Government",
  other: "Other",
};

export default function OrganisationsClient() {
  const [orgs, setOrgs] = useState<MyOrganisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { profile } = useProfile();

  useEffect(() => {
    organisationsApi.getMine()
      .then(setOrgs)
      .catch(() => setError("Failed to load organisations"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-darklink">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-darklink">{orgs.length} organisation{orgs.length !== 1 ? "s" : ""}</p>
        <Link href="/organisations/create">
          <Button className="rounded-full px-6 gap-2">
            <Icon icon="solar:add-circle-line-duotone" className="text-lg" />
            Create Organisation
          </Button>
        </Link>
      </div>

      {orgs.length === 0 ? (
        <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-12 text-center">
          <Icon icon="solar:buildings-2-line-duotone" className="text-5xl text-darklink mx-auto mb-4" />
          <h5 className="text-lg font-semibold mb-1">No organisations yet</h5>
          <p className="text-sm text-darklink mb-6">Create your first organisation to get started.</p>
          <Link href="/organisations/create">
            <Button className="rounded-full px-6">Create Organisation</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orgs.map((org) => (
            <Link key={org.id} href={`/organisations/${org.id}`}>
              <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-5 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {org.logoUrl ? (
                        <img src={org.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <Icon icon="solar:buildings-2-line-duotone" className="text-2xl text-primary" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-semibold text-base">{org.legalName}</h5>
                      {org.tradingName && (
                        <p className="text-xs text-darklink">{org.tradingName}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-darklink">
                          {ORG_TYPE_LABELS[org.organisationType] ?? org.organisationType}
                        </span>
                        {org.industry && (
                          <>
                            <span className="text-xs text-darklink">·</span>
                            <span className="text-xs text-darklink">{org.industry}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={org.myRole === "admin" ? "default" : "secondary"} className="capitalize">
                      {org.myRole}
                    </Badge>
                    <Icon icon="solar:alt-arrow-right-line-duotone" className="text-darklink" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
