"use client";
import React, { useState } from "react";
import { adminApi, type AdminUserSearchResult } from "@/lib/api";
import { Icon } from "@iconify/react";

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  org_admin:         { label: "Org Admin",          color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/30",    border: "border-blue-200 dark:border-blue-800" },
  client:            { label: "Hiring Manager",      color: "text-sky-600",     bg: "bg-sky-50 dark:bg-sky-950/30",      border: "border-sky-200 dark:border-sky-800" },
  interviewer:       { label: "Interviewer",         color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
  candidate:         { label: "Candidate",           color: "text-orange-600",  bg: "bg-orange-50 dark:bg-orange-950/30",  border: "border-orange-200 dark:border-orange-800" },
  internal_employee: { label: "Internal Employee",   color: "text-rose-600",    bg: "bg-rose-50 dark:bg-rose-950/30",    border: "border-rose-200 dark:border-rose-800" },
  platform_admin:    { label: "Platform Admin",      color: "text-green-600",   bg: "bg-green-50 dark:bg-green-950/30",  border: "border-green-200 dark:border-green-800" },
};

const ASSIGNABLE_ROLES = ['org_admin', 'client', 'interviewer', 'candidate', 'internal_employee'];

export default function UserRoleManagerClient() {
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [user, setUser] = useState<AdminUserSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSearching(true);
    setSearchError(null);
    setUser(null);
    setActionError(null);
    try {
      const result = await adminApi.searchUser(email.trim());
      setUser(result);
    } catch (e: any) {
      setSearchError(e.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleAssign(role: string) {
    if (!user) return;
    setProcessing(role);
    setActionError(null);
    try {
      await adminApi.assignRole(user.id, role);
      // Replace all assignable roles with the new one, keep platform_admin if present
      setUser((prev) => {
        if (!prev) return prev;
        const kept = prev.roles.filter((r) => !ASSIGNABLE_ROLES.includes(r));
        return { ...prev, roles: [...kept, role] };
      });
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setProcessing(null);
    }
  }

  async function handleRevoke(role: string) {
    if (!user) return;
    setProcessing(role);
    setActionError(null);
    try {
      await adminApi.revokeRole(user.id, role);
      setUser((prev) => prev ? { ...prev, roles: prev.roles.filter((r) => r !== role) } : prev);
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Search form */}
      <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6">
        <h3 className="font-semibold text-base mb-4">Find User by Email</h3>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            className="flex-1 px-3 py-2 rounded-lg border border-ld bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>
        {searchError && (
          <div className="flex items-center gap-2 mt-3 text-red-600 dark:text-red-400 text-sm">
            <Icon icon="solar:danger-circle-line-duotone" />
            {searchError}
          </div>
        )}
      </div>

      {/* User result */}
      {user && (
        <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6 space-y-5">

          {/* User info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-lightprimary flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:user-circle-line-duotone" className="text-2xl text-primary" />
            </div>
            <div>
              <p className="font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-darklink">{user.email}</p>
              <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium
                ${user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                {user.status}
              </span>
            </div>
          </div>

          {actionError && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <Icon icon="solar:danger-circle-line-duotone" />
              {actionError}
            </div>
          )}

          {/* Current role */}
          <div>
            <p className="text-sm font-medium mb-2">Current Role</p>
            <div className="flex flex-wrap gap-2">
              {user.roles.filter((r) => r !== 'platform_admin').length === 0 && (
                <span className="text-xs text-darklink">No role assigned</span>
              )}
              {user.roles.map((role) => {
                const cfg = ROLE_CONFIG[role];
                return (
                  <span
                    key={role}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
                      ${cfg ? `${cfg.color} ${cfg.bg} ${cfg.border}` : 'text-darklink bg-gray-100 border-gray-200'}`}
                  >
                    {cfg?.label ?? role}
                    {role !== 'platform_admin' && (
                      <button
                        onClick={() => handleRevoke(role)}
                        disabled={!!processing}
                        className="hover:opacity-70 disabled:opacity-40"
                        title="Remove role"
                      >
                        <Icon icon="solar:close-circle-bold" className="text-sm" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Change role */}
          <div>
            <p className="text-sm font-medium mb-1">Change Role</p>
            <p className="text-xs text-darklink mb-3">Selecting a role will replace the current one.</p>
            <div className="flex flex-wrap gap-2">
              {ASSIGNABLE_ROLES.map((role) => {
                const cfg = ROLE_CONFIG[role];
                const isCurrent = user.roles.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => !isCurrent && handleAssign(role)}
                    disabled={!!processing || isCurrent}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                      disabled:cursor-not-allowed
                      ${isCurrent
                        ? `${cfg?.color} ${cfg?.bg} ${cfg?.border} opacity-60 cursor-default`
                        : `${cfg ? `${cfg.color} ${cfg.bg} ${cfg.border} hover:opacity-80` : 'text-darklink bg-gray-50 border-gray-200 hover:opacity-80'}`
                      }`}
                  >
                    {isCurrent
                      ? <Icon icon="solar:check-circle-bold" className="text-sm" />
                      : <Icon icon="solar:refresh-line-duotone" className="text-sm" />
                    }
                    {processing === role ? "..." : (cfg?.label ?? role)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
