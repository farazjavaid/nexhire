import type { Metadata } from "next";
import MfaClient from "./MfaClient";

export const metadata: Metadata = { title: "Security Settings — NexHire" };

export default function SecuritySettingsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h4 className="text-xl font-semibold">Security Settings</h4>
        <p className="text-sm text-darklink mt-1">Manage your account security and two-factor authentication</p>
      </div>
      <MfaClient />
    </div>
  );
}
