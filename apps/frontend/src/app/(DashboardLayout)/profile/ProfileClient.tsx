"use client";
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { usersApi, uploadsApi, type UserProfile, type UpdateProfileBody } from "@/lib/api";
import { useProfile } from "@/app/context/ProfileContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import Image from "next/image";

const VISIBILITY_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "organisation", label: "Organisation" },
  { value: "public", label: "Public" },
];

const TIMEZONES = [
  "UTC", "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane",
  "Asia/Karachi", "Asia/Kolkata", "America/New_York", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin",
];

type FormValues = {
  firstName: string;
  lastName: string;
  preferredName: string;
  phoneNumber: string;
  bio: string;
  experienceYears: string;
  linkedinUrl: string;
  timezone: string;
  profileVisibility: "private" | "public" | "organisation";
};

export default function ProfileClient() {
  const { setProfile } = useProfile();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [keyword, setKeyword] = useState("");

  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Resume upload state
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    usersApi.getMe()
      .then(({ user }) => {
        setUser(user);
        reset({
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          preferredName: user.profile.preferredName ?? "",
          phoneNumber: user.phoneNumber ?? "",
          bio: user.profile.bio ?? "",
          experienceYears: user.profile.experienceYears?.toString() ?? "",
          linkedinUrl: user.profile.linkedinUrl ?? "",
          timezone: user.profile.timezone,
          profileVisibility: user.profile.profileVisibility as FormValues["profileVisibility"],
        });
      })
      .catch(() => setServerError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true); setServerError(""); setSuccessMsg("");
    try {
      const body: UpdateProfileBody = {
        firstName: data.firstName,
        lastName: data.lastName,
        preferredName: data.preferredName || null,
        phoneNumber: data.phoneNumber || null,
        bio: data.bio || null,
        experienceYears: data.experienceYears ? parseInt(data.experienceYears) : null,
        linkedinUrl: data.linkedinUrl || null,
        timezone: data.timezone,
        profileVisibility: data.profileVisibility,
        interestKeywords: user?.interestKeywords ?? [],
      };
      await usersApi.updateMe(body);
      // Fetch fresh user data to ensure all fields are in sync (including resume data)
      const { user: updated } = await usersApi.getMe();
      setUser(updated);
      setProfile(updated);
      setSuccessMsg("Profile updated successfully");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSendVerification = async () => {
    setVerifying(true); setServerError(""); setSuccessMsg("");
    try {
      await usersApi.sendVerificationEmail();
      setSuccessMsg("Verification email sent — check your inbox");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setVerifying(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setServerError("");
    setSuccessMsg("");
    try {
      const result = await uploadsApi.uploadAvatar(file);
      const updated = { ...user, profile: { ...user!.profile, avatarUrl: result.avatarUrl } } as UserProfile;
      setUser(updated);
      setProfile(updated);
      setSuccessMsg("Avatar uploaded successfully");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    setServerError("");
    setSuccessMsg("");
    try {
      const result = await uploadsApi.uploadResume(file);
      const updated = {
        ...user,
        profile: {
          ...user!.profile,
          resumeDocumentId: result.documentId,
          resumeFileName: result.fileName,
        },
      } as UserProfile;
      setUser(updated);
      setProfile(updated);
      setSuccessMsg("Resume uploaded successfully");
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Failed to upload resume");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!user?.profile.resumeDocumentId) return;
    setServerError("");
    try {
      const { url } = await uploadsApi.getDocumentUrl(user.profile.resumeDocumentId);
      window.open(url, "_blank");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Failed to get download URL");
    }
  };

  const handleDeleteResume = async () => {
    if (!user?.profile.resumeDocumentId) return;
    if (!confirm("Delete this resume?")) return;

    setServerError("");
    setSuccessMsg("");
    try {
      await uploadsApi.deleteDocument(user.profile.resumeDocumentId);
      const updated = {
        ...user,
        profile: {
          ...user.profile,
          resumeDocumentId: null,
          resumeFileName: null,
        },
      } as UserProfile;
      setUser(updated);
      setProfile(updated);
      setSuccessMsg("Resume deleted");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Failed to delete resume");
    }
  };

  const addKeyword = () => {
    const kw = keyword.trim();
    if (!kw || !user) return;
    if (user.interestKeywords.includes(kw)) return;
    setUser({ ...user, interestKeywords: [...user.interestKeywords, kw] });
    setKeyword("");
  };

  const removeKeyword = (kw: string) => {
    if (!user) return;
    setUser({ ...user, interestKeywords: user.interestKeywords.filter((k) => k !== kw) });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-darklink">Loading profile...</p></div>;

  return (
    <div className="max-w-3xl mx-auto">
      {serverError && <p className="mb-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{serverError}</p>}
      {successMsg && <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">{successMsg}</p>}

      {/* Email Verification Banner */}
      {user && !user.isEmailVerified && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-yellow-800 text-sm">
            <Icon icon="solar:danger-triangle-outline" className="text-lg flex-shrink-0" />
            <span>Your email is not verified. Verify it to secure your account.</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleSendVerification} disabled={verifying}>
            {verifying ? "Sending..." : "Send Verification Email"}
          </Button>
        </div>
      )}

      {/* Avatar Upload Card */}
      <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6 mb-6">
        <h5 className="text-lg font-semibold mb-4">Profile Photo</h5>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-darkgray/50 flex-shrink-0">
            <Image
              src={user?.profile.avatarUrl ?? "/images/profile/user-1.jpg"}
              alt="Avatar"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="avatar-input" className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="mb-2"
              >
                <Icon icon="solar:cloud-upload-line-duotone" className="mr-1" />
                {uploadingAvatar ? "Uploading..." : "Upload Photo"}
              </Button>
            </Label>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
              disabled={uploadingAvatar}
            />
            <p className="text-xs text-darklink">JPEG, PNG, or WebP. Max 2MB.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Account Info Card */}
        <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6 mb-6">
          <h5 className="text-lg font-semibold mb-1">Account Information</h5>
          <p className="text-sm text-darklink mb-5">Your login and account details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label className="mb-2 block">Email</Label>
              <div className="flex items-center gap-2">
                <Input value={user?.email ?? ""} disabled className="form-control bg-gray-50" />
                {user?.isEmailVerified
                  ? <Icon icon="solar:check-circle-bold" className="text-green-500 text-xl flex-shrink-0" />
                  : <Icon icon="solar:close-circle-bold" className="text-yellow-500 text-xl flex-shrink-0" />}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Phone Number</Label>
              <Input {...register("phoneNumber")} className="form-control" placeholder="+61 400 000 000" />
            </div>
            <div>
              <Label className="mb-2 block">Roles</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {user?.roles.map((r) => <Badge key={r} variant="outline" className="capitalize">{r.replace("_", " ")}</Badge>)}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info Card */}
        <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6 mb-6">
          <h5 className="text-lg font-semibold mb-1">Personal Information</h5>
          <p className="text-sm text-darklink mb-5">Update your personal details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label className="mb-2 block">First Name <span className="text-red-500">*</span></Label>
              <Input {...register("firstName", { required: "First name is required" })} className={`form-control ${errors.firstName ? "border-red-400" : ""}`} />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Last Name <span className="text-red-500">*</span></Label>
              <Input {...register("lastName", { required: "Last name is required" })} className={`form-control ${errors.lastName ? "border-red-400" : ""}`} />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Preferred Name</Label>
              <Input {...register("preferredName")} className="form-control" placeholder="What should we call you?" />
            </div>
            <div>
              <Label className="mb-2 block">Years of Experience</Label>
              <Input {...register("experienceYears")} type="number" min={0} max={60} className="form-control" placeholder="e.g. 5" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-2 block">Bio</Label>
              <textarea {...register("bio")} rows={3}
                className="form-control w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-darkgray border-border resize-none"
                placeholder="Tell us a little about yourself..." />
            </div>
            <div>
              <Label className="mb-2 block">LinkedIn URL</Label>
              <Input {...register("linkedinUrl")} className="form-control" placeholder="https://linkedin.com/in/yourname" />
            </div>
            <div>
              <Label className="mb-2 block">Timezone</Label>
              <select {...register("timezone")}
                className="form-control w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-darkgray border-border">
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-2 block">Profile Visibility</Label>
              <select {...register("profileVisibility")}
                className="form-control w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-darkgray border-border">
                {VISIBILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Resume Upload Card */}
        <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6 mb-6">
          <h5 className="text-lg font-semibold mb-4">Resume / CV</h5>
          {user?.profile.resumeDocumentId ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-darkgray/50 rounded-lg border border-ld">
              <div className="flex items-center gap-3">
                <Icon icon="solar:document-text-line-duotone" className="text-2xl text-primary" />
                <div>
                  <p className="font-medium text-sm">{user.profile.resumeFileName}</p>
                  <p className="text-xs text-darklink">Uploaded resume</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadResume}
                  className="text-primary"
                >
                  <Icon icon="solar:download-line-duotone" className="mr-1" />
                  Download
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={uploadingResume}
                >
                  {uploadingResume ? "..." : "Replace"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteResume}
                  className="text-red-500 border-red-200 hover:bg-red-50"
                >
                  <Icon icon="solar:trash-bin-2-line-duotone" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-ld rounded-lg p-8 text-center">
              <Icon icon="solar:cloud-upload-line-duotone" className="text-4xl text-primary mx-auto mb-3 opacity-60" />
              <p className="font-medium text-sm mb-1">No resume uploaded yet</p>
              <p className="text-xs text-darklink mb-4">PDF or DOCX format, up to 5MB</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploadingResume}
              >
                <Icon icon="solar:cloud-upload-line-duotone" className="mr-1" />
                {uploadingResume ? "Uploading..." : "Upload Resume"}
              </Button>
            </div>
          )}
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleResumeChange}
            className="hidden"
            disabled={uploadingResume}
          />
        </div>

        {/* Interest Keywords Card */}
        <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6 mb-6">
          <h5 className="text-lg font-semibold mb-1">Interest Keywords</h5>
          <p className="text-sm text-darklink mb-5">Skills or topics you're interested in (max 20)</p>
          <div className="flex gap-2 mb-4">
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
              className="form-control" placeholder="e.g. React, Node.js, Machine Learning" />
            <Button type="button" variant="outline" onClick={addKeyword}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.interestKeywords.map((kw) => (
              <Badge key={kw} variant="secondary" className="flex items-center gap-1 pr-1">
                {kw}
                <button type="button" onClick={() => removeKeyword(kw)} className="ml-1 hover:text-red-500">
                  <Icon icon="solar:close-circle-bold" className="text-base" />
                </button>
              </Badge>
            ))}
            {!user?.interestKeywords.length && <p className="text-sm text-darklink">No keywords added yet</p>}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="rounded-full px-8" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
