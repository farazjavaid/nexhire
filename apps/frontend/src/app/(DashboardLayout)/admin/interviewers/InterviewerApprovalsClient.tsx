"use client";
import { useEffect, useState } from "react";
import { adminApi, type PendingInterviewer } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";

export default function InterviewerApprovalsClient() {
  const [interviewers, setInterviewers] = useState<PendingInterviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [approving, setApproving] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);

  useEffect(() => {
    loadInterviewers();
  }, []);

  const loadInterviewers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPendingInterviewers();
      setInterviewers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interviewers");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: number, name: string) => {
    if (!confirm(`Approve ${name} as interviewer?`)) return;
    setApproving(userId);
    setError("");
    setSuccess("");
    try {
      await adminApi.approveInterviewer(userId);
      setInterviewers((prev) => prev.filter((i) => i.userId !== userId));
      setSuccess(`${name} approved as interviewer`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve interviewer");
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (userId: number, name: string) => {
    if (!confirm(`Reject ${name} as interviewer?`)) return;
    setRejecting(userId);
    setError("");
    setSuccess("");
    try {
      await adminApi.rejectInterviewer(userId);
      setInterviewers((prev) => prev.filter((i) => i.userId !== userId));
      setSuccess(`${name} rejected`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject interviewer");
    } finally {
      setRejecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-darklink">Loading interviewers...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
      )}
      {success && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">{success}</p>
      )}

      {/* Header */}
      <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon icon="solar:user-check-rounded-line-duotone" className="text-2xl text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Interviewer Approvals</h2>
            <p className="text-sm text-darklink">
              {interviewers.length === 0
                ? "No pending interviewer applications"
                : `${interviewers.length} pending approval${interviewers.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {/* Interviewers List */}
      {interviewers.length === 0 ? (
        <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-12 text-center">
          <Icon icon="solar:inbox-line-duotone" className="text-5xl text-gray-300 mx-auto mb-3" />
          <p className="text-darklink">No pending interviewer applications</p>
        </div>
      ) : (
        <div className="rounded-xl border border-ld bg-white dark:bg-darkgray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-darkgray border-b border-ld">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-darklink">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-darklink">Email</th>
                  <th className="text-left px-5 py-3 font-medium text-darklink">Applied</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ld">
                {interviewers.map((interviewer) => (
                  <tr key={interviewer.userId} className="hover:bg-gray-50 dark:hover:bg-darkgray/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {interviewer.avatarUrl ? (
                          <img
                            src={interviewer.avatarUrl}
                            alt={`${interviewer.firstName} ${interviewer.lastName}`}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-darkgray flex items-center justify-center text-xs font-bold">
                            {interviewer.firstName[0]}{interviewer.lastName[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {interviewer.firstName} {interviewer.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-darklink">{interviewer.email}</td>
                    <td className="px-5 py-3 text-xs text-darklink">
                      {new Date(interviewer.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white gap-1"
                          onClick={() => handleApprove(interviewer.userId, `${interviewer.firstName} ${interviewer.lastName}`)}
                          disabled={approving === interviewer.userId || rejecting === interviewer.userId}
                        >
                          <Icon icon="solar:check-circle-line-duotone" className="text-base" />
                          {approving === interviewer.userId ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => handleReject(interviewer.userId, `${interviewer.firstName} ${interviewer.lastName}`)}
                          disabled={approving === interviewer.userId || rejecting === interviewer.userId}
                        >
                          <Icon icon="solar:close-circle-line-duotone" className="text-base" />
                          {rejecting === interviewer.userId ? "Rejecting..." : "Reject"}
                        </Button>
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
  );
}
