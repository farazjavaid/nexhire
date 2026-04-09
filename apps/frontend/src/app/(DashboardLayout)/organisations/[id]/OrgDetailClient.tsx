"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { organisationsApi, type Organisation, type OrgMember, type OrgInvite } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";

type Tab = "overview" | "members" | "invites";

export default function OrgDetailClient() {
  const { id } = useParams<{ id: string }>();
  const orgId = id; // Use string ID directly (CUID format)
  const router = useRouter();

  const [org, setOrg] = useState<Organisation | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("client");
  const [inviting, setInviting] = useState(false);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadOrg = useCallback(async () => {
    try {
      const [orgData, membersData] = await Promise.all([
        organisationsApi.getOne(orgId),
        organisationsApi.getMembers(orgId),
      ]);
      setOrg(orgData);
      setMembers(membersData);
    } catch {
      setError("Failed to load organisation");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const loadInvites = useCallback(async () => {
    try {
      const data = await organisationsApi.getInvites(orgId);
      setInvites(data);
    } catch {
      // not admin — silently ignore
    }
  }, [orgId]);

  useEffect(() => {
    loadOrg();
  }, [loadOrg]);

  useEffect(() => {
    if (activeTab === "invites") loadInvites();
  }, [activeTab, loadInvites]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError("");
    setSuccess("");
    try {
      await organisationsApi.invite(orgId, { email: inviteEmail.trim(), role: inviteRole });
      setSuccess(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail("");
      loadInvites();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setError("");
    try {
      await organisationsApi.updateMember(orgId, userId, { role: newRole });
      setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, role: newRole } : m));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update member");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm("Remove this member from the organisation?")) return;
    setError("");
    try {
      await organisationsApi.removeMember(orgId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleDeleteInvite = async (inviteId: number, email: string) => {
    if (!confirm(`Cancel invitation for ${email}?`)) return;
    setError("");
    try {
      await organisationsApi.deleteInvite(orgId, inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel invitation");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await organisationsApi.delete(orgId);
      router.push("/organisations");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete organisation");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-darklink">Loading...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-20">
        <p className="text-darklink">Organisation not found.</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "solar:info-circle-line-duotone" },
    { key: "members", label: `Members (${members.length})`, icon: "solar:users-group-two-rounded-line-duotone" },
    { key: "invites" as Tab, label: "Invites", icon: "solar:letter-line-duotone" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
      )}
      {success && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">{success}</p>
      )}

      {/* Header */}
      <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon icon="solar:buildings-2-line-duotone" className="text-3xl text-primary" />
            </div>
            <div>
              <h4 className="text-xl font-bold">{org.legalName}</h4>
              {org.tradingName && <p className="text-sm text-darklink">{org.tradingName}</p>}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">{org.organisationType}</Badge>
                <Badge
                  variant={org.status === "active" ? "default" : "secondary"}
                  className="capitalize text-xs"
                >
                  {org.status}
                </Badge>
                {org.industry && <span className="text-xs text-darklink">{org.industry}</span>}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 border-red-200 hover:bg-red-50"
            onClick={() => setConfirmDelete(true)}
          >
            <Icon icon="solar:trash-bin-2-line-duotone" className="mr-1" />
            Delete
          </Button>
        </div>
      </div>


      {/* Status Banner */}
      {org.status === "pending" && (
        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-5 flex items-start gap-3">
          <Icon icon="solar:info-circle-line-duotone" className="text-xl text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Awaiting Platform Admin Approval</h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your organization is currently under review. Once approved by a platform administrator, you'll be able to invite members and send interviews.
            </p>
          </div>
        </div>
      )}

      {org.status === "suspended" && (
        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-900/20 p-5 flex items-start gap-3">
          <Icon icon="solar:danger-circle-line-duotone" className="text-xl text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">Organization Suspended</h4>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              Your organization has been suspended. Please contact support for more information.
            </p>
          </div>
        </div>
      )}

      {org.status === "rejected" && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-5 flex items-start gap-3">
          <Icon icon="solar:close-circle-line-duotone" className="text-xl text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">Application Rejected</h4>
            <p className="text-sm text-red-800 dark:text-red-200">
              Unfortunately, your organization application was not approved. Please contact support if you'd like to reapply.
            </p>
          </div>
        </div>
      )}

      {org.status === "active" && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 p-5 flex items-start gap-3">
          <Icon icon="solar:check-circle-line-duotone" className="text-xl text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">Organization Approved</h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              Your organization is now active. You can invite members and start conducting interviews.
            </p>
          </div>
        </div>
      )}
      {/* Delete confirm */}
      {confirmDelete && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-700 mb-3">
            Are you sure you want to delete <strong>{org.legalName}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ld mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-darklink hover:text-ld"
            }`}
          >
            <Icon icon={tab.icon} className="text-base" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow label="Legal Name" value={org.legalName} />
            <InfoRow label="Trading Name" value={org.tradingName ?? "—"} />
            <InfoRow label="Type" value={org.organisationType} />
            <InfoRow label="Industry" value={org.industry ?? "—"} />
            <InfoRow label="Country" value={org.countryCode ?? "—"} />
            <InfoRow label="Timezone" value={org.timezone} />
            <InfoRow label="Employees" value={org.employeeRange ?? "—"} />
            <InfoRow label="Status" value={org.status} />
            {org.website && (
              <div>
                <p className="text-xs text-darklink mb-1">Website</p>
                <a href={org.website} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                  {org.website}
                </a>
              </div>
            )}
            {org.description && (
              <div className="sm:col-span-2">
                <p className="text-xs text-darklink mb-1">Description</p>
                <p className="text-sm">{org.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="rounded-xl border border-ld bg-white dark:bg-darkgray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-darkgray border-b border-ld">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-darklink">Member</th>
                  <th className="text-left px-5 py-3 font-medium text-darklink">Role</th>
                  <th className="text-left px-5 py-3 font-medium text-darklink">Invitation Status</th>
                  <th className="text-left px-5 py-3 font-medium text-darklink">Admin Approval</th>
                  <th className="text-left px-5 py-3 font-medium text-darklink">Joined</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ld">
                {members.map((m) => (
                  <tr key={m.userId} className="hover:bg-gray-50 dark:hover:bg-darkgray/50">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium">{m.firstName} {m.lastName}</p>
                        <p className="text-xs text-darklink">{m.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {m.role === "admin" ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg inline-block font-medium">
                          Admin
                        </span>
                      ) : (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                          className="text-xs border rounded-lg px-2 py-1 bg-white dark:bg-darkgray border-border"
                        >
                          <option value="client">Client</option>
                          <option value="interviewer">Interviewer</option>
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={m.status === "active" ? "default" : "secondary"} className="capitalize text-xs">
                        {m.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {m.role === "interviewer" && m.approvalStatus ? (
                        m.approvalStatus === "approved" ? (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="capitalize text-xs">
                            {m.approvalStatus}
                          </Badge>
                        )
                      ) : m.role === "client" ? (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                          Approved
                        </Badge>
                      ) : (
                        <span className="text-xs text-darklink">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-darklink">
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {m.role === "admin" ? null : (
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Remove member"
                        >
                          <Icon icon="solar:trash-bin-minimalistic-line-duotone" className="text-lg" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invites Tab */}
      {activeTab === "invites" && (
        <div className="space-y-5">
          {org.status !== "active" && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-5">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <Icon icon="solar:info-circle-line-duotone" className="inline mr-2" />
                Your organization is currently <strong>{org.status}</strong>. You can invite members once your organization is approved.
              </p>
            </div>
          )}

          {/* Send invite form */}
          <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6">
            <h5 className="text-base font-semibold mb-4">Invite a Member</h5>
            {org.status !== "active" ? (
              <p className="text-sm text-darklink">Invitations are disabled until your organization is approved.</p>
            ) : (
              <form onSubmit={handleInvite} className="flex items-end gap-3">
                <div className="flex-1">
                  <Label className="mb-2 block">Email Address</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="form-control"
                    placeholder="colleague@example.com"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Role</Label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="form-control border rounded-lg px-3 py-2 text-sm bg-white dark:bg-darkgray border-border"
                  >
                    <option value="client">Client (Post Jobs)</option>
                    <option value="interviewer">Interviewer (Conduct Interviews)</option>
                  </select>
                </div>
                <Button type="submit" className="rounded-full px-6 gap-2 mb-0" disabled={inviting}>
                  <Icon icon="solar:letter-line-duotone" className="text-base" />
                  {inviting ? "Sending..." : "Send Invite"}
                </Button>
              </form>
            )}
          </div>

          {/* Invites list */}
          <div className="rounded-xl border border-ld bg-white dark:bg-darkgray overflow-hidden">
            <div className="px-5 py-4 border-b border-ld">
              <h5 className="text-base font-semibold">Sent Invitations</h5>
            </div>
            {invites.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-darklink">No invitations sent yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-darkgray border-b border-ld">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-darklink">Email</th>
                      <th className="text-left px-5 py-3 font-medium text-darklink">Role</th>
                      <th className="text-left px-5 py-3 font-medium text-darklink">Status</th>
                      <th className="text-left px-5 py-3 font-medium text-darklink">Invited By</th>
                      <th className="text-left px-5 py-3 font-medium text-darklink">Expires</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ld">
                    {invites.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-darkgray/50">
                        <td className="px-5 py-3 font-medium">{inv.email}</td>
                        <td className="px-5 py-3 capitalize">{inv.role}</td>
                        <td className="px-5 py-3">
                          <Badge
                            variant={inv.status === "accepted" ? "default" : inv.status === "expired" ? "destructive" : "secondary"}
                            className="capitalize text-xs"
                          >
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-darklink">{inv.invitedBy}</td>
                        <td className="px-5 py-3 text-xs text-darklink">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {inv.status === "pending" ? (
                            <button
                              onClick={() => handleDeleteInvite(inv.id, inv.email)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Cancel invitation"
                            >
                              <Icon icon="solar:trash-bin-minimalistic-line-duotone" className="text-lg" />
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-darklink mb-1">{label}</p>
      <p className="text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
