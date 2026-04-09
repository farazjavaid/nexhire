"use client";
import React, { useEffect, useState } from "react";
import { adminApi, type AdminOrganisation } from "@/lib/api";
import { Icon } from "@iconify/react";

type ActionType = 'approve' | 'reject' | 'suspend' | 'delete';

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  pending:   'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  suspended: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  deleted:   'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

export default function AdminOrgsClient() {
  const [orgs, setOrgs] = useState<AdminOrganisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);

  async function loadOrgs() {
    try {
      const data = await adminApi.listOrganisations();
      setOrgs(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrgs(); }, []);

  async function handleAction(id: number, action: ActionType) {
    setProcessing(id);
    setActionError(null);
    try {
      if (action === 'approve')  await adminApi.approveOrganisation(id);
      if (action === 'reject')   await adminApi.rejectOrganisation(id);
      if (action === 'suspend')  await adminApi.suspendOrganisation(id);
      if (action === 'delete')   await adminApi.deleteOrganisation(id);

      const newStatus =
        action === 'approve' ? 'active' :
        action === 'reject'  ? 'rejected' :
        action === 'suspend' ? 'suspended' : 'deleted';

      setOrgs((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o));
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setProcessing(null);
    }
  }

  const pending = orgs.filter((o) => o.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-darklink text-sm">Loading organisations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
        <Icon icon="solar:danger-circle-line-duotone" className="text-lg flex-shrink-0" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {actionError && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          <Icon icon="solar:danger-circle-line-duotone" className="text-lg flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* ── Pending Approvals ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold">Pending Approvals</h2>
          {pending.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              {pending.length} pending
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="rounded-xl border border-ld bg-white dark:bg-darkgray flex flex-col items-center justify-center h-32 gap-2">
            <Icon icon="solar:check-circle-line-duotone" className="text-3xl text-green-500 opacity-60" />
            <p className="text-darklink text-sm">No pending approvals</p>
          </div>
        ) : (
          <div className="rounded-xl border border-ld bg-white dark:bg-darkgray overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 dark:bg-amber-950/20 border-b border-ld">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-darklink">Organisation</th>
                    <th className="text-left px-4 py-3 font-medium text-darklink">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-darklink">Org Admin</th>
                    <th className="text-left px-4 py-3 font-medium text-darklink">Submitted</th>
                    <th className="text-left px-4 py-3 font-medium text-darklink">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ld">
                  {pending.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{org.legalName}</div>
                        {org.tradingName && <div className="text-xs text-darklink">{org.tradingName}</div>}
                      </td>
                      <td className="px-4 py-3 capitalize text-darklink">{org.organisationType}</td>
                      <td className="px-4 py-3 text-darklink">{org.orgAdminEmail ?? "—"}</td>
                      <td className="px-4 py-3 text-darklink">{new Date(org.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ActionButton icon="solar:check-circle-line-duotone" label="Approve" color="green"
                            loading={processing === org.id} onClick={() => handleAction(org.id, 'approve')} />
                          <ActionButton icon="solar:close-circle-line-duotone" label="Reject" color="red"
                            loading={processing === org.id} onClick={() => handleAction(org.id, 'reject')} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── All Organisations ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">All Organisations</h2>
          <span className="text-sm text-darklink">{orgs.length} total</span>
        </div>

        {orgs.length === 0 ? (
          <div className="rounded-xl border border-ld bg-white dark:bg-darkgray flex flex-col items-center justify-center h-32 gap-2">
            <Icon icon="solar:buildings-2-line-duotone" className="text-3xl text-darklink opacity-40" />
            <p className="text-darklink text-sm">No organisations yet</p>
          </div>
        ) : (
          <div className="rounded-xl border border-ld bg-white dark:bg-darkgray overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-ld">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-darklink">Organisation</th>
                    <th className="text-left px-4 py-3 font-medium text-darklink">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-darklink">Org Admin</th>
                    <th className="text-left px-4 py-3 font-medium text-darklink">Members</th>
                    <th className="text-left px-4 py-3 font-medium text-darklink">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-darklink">Created</th>
                    <th className="text-left px-4 py-3 font-medium text-darklink">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ld">
                  {orgs.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{org.legalName}</div>
                        {org.tradingName && <div className="text-xs text-darklink">{org.tradingName}</div>}
                      </td>
                      <td className="px-4 py-3 capitalize text-darklink">{org.organisationType}</td>
                      <td className="px-4 py-3 text-darklink">{org.orgAdminEmail ?? "—"}</td>
                      <td className="px-4 py-3 text-darklink">{org.memberCount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[org.status] ?? STATUS_BADGE.deleted}`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-darklink">{new Date(org.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {org.status === 'active' && (
                            <ActionButton icon="solar:pause-circle-line-duotone" label="Suspend" color="orange"
                              loading={processing === org.id} onClick={() => handleAction(org.id, 'suspend')} />
                          )}
                          {org.status !== 'deleted' && (
                            <ActionButton icon="solar:trash-bin-2-line-duotone" label="Delete" color="red"
                              loading={processing === org.id} onClick={() => handleAction(org.id, 'delete')} />
                          )}
                          {(org.status === 'rejected' || org.status === 'suspended') && (
                            <ActionButton icon="solar:check-circle-line-duotone" label="Approve" color="green"
                              loading={processing === org.id} onClick={() => handleAction(org.id, 'approve')} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small reusable action button ───────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  green:  'bg-green-600 hover:bg-green-700',
  red:    'bg-red-600 hover:bg-red-700',
  orange: 'bg-orange-500 hover:bg-orange-600',
};

function ActionButton({
  icon, label, color, loading, onClick,
}: {
  icon: string; label: string; color: string; loading: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={label}
      className={`flex items-center gap-1 px-2.5 py-1.5 text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${COLOR_MAP[color]}`}
    >
      <Icon icon={icon} className="text-sm" />
      {loading ? "..." : label}
    </button>
  );
}
