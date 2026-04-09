"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { organisationsApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/app/context/ProfileContext";

type FormValues = {
  legalName: string;
  tradingName: string;
  organisationType: string;
  industry: string;
  countryCode: string;
  timezone: string;
  website: string;
  description: string;
  employeeRange: string;
};

const ORG_TYPES = [
  { value: "company", label: "Company" },
  { value: "startup", label: "Startup" },
  { value: "enterprise", label: "Enterprise" },
  { value: "ngo", label: "NGO" },
  { value: "government", label: "Government" },
  { value: "other", label: "Other" },
];

const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

const TIMEZONES = [
  "UTC", "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane",
  "Asia/Karachi", "Asia/Kolkata", "America/New_York", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin",
];

const selectClass = "form-control w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-darkgray border-border";

export default function CreateOrgClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const { profile, loading } = useProfile();

  if (loading) {
    return null;
  }

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { timezone: "UTC", organisationType: "company" },
  });

  const onSubmit = async (data: FormValues) => {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      const org = await organisationsApi.create({
        legalName: data.legalName,
        tradingName: data.tradingName || undefined,
        organisationType: data.organisationType,
        industry: data.industry || undefined,
        countryCode: data.countryCode || undefined,
        timezone: data.timezone,
        website: data.website || undefined,
        description: data.description || undefined,
        employeeRange: data.employeeRange || undefined,
      });
      router.push(`/organisations/${org.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create organisation");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6 mb-6">
          <h5 className="text-lg font-semibold mb-1">Organisation Details</h5>
          <p className="text-sm text-darklink mb-5">Basic information about your organisation</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label className="mb-2 block">Legal Name <span className="text-red-500">*</span></Label>
              <Input
                {...register("legalName", { required: "Legal name is required" })}
                className={`form-control ${errors.legalName ? "border-red-400" : ""}`}
                placeholder="Acme Pty Ltd"
              />
              {errors.legalName && <p className="text-red-500 text-xs mt-1">{errors.legalName.message}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Trading Name</Label>
              <Input {...register("tradingName")} className="form-control" placeholder="Acme" />
            </div>
            <div>
              <Label className="mb-2 block">Organisation Type <span className="text-red-500">*</span></Label>
              <select {...register("organisationType")} className={selectClass}>
                {ORG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2 block">Industry</Label>
              <Input {...register("industry")} className="form-control" placeholder="e.g. Technology, Healthcare" />
            </div>
            <div>
              <Label className="mb-2 block">Country Code</Label>
              <Input {...register("countryCode")} className="form-control" placeholder="AU" maxLength={2} />
            </div>
            <div>
              <Label className="mb-2 block">Employee Range</Label>
              <select {...register("employeeRange")} className={selectClass}>
                <option value="">Select range</option>
                {EMPLOYEE_RANGES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2 block">Timezone</Label>
              <select {...register("timezone")} className={selectClass}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2 block">Website</Label>
              <Input {...register("website")} className="form-control" placeholder="https://acme.com" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-2 block">Description</Label>
              <textarea
                {...register("description")}
                rows={3}
                className="form-control w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-darkgray border-border resize-none"
                placeholder="Brief description of your organisation..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" className="rounded-full px-6" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-full px-8" disabled={saving}>
            {saving ? "Creating..." : "Create Organisation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
