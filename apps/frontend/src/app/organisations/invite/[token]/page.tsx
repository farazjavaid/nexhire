"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import { organisationsApi, authApi } from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";

interface InvitePreview {
  email: string;
  orgName: string;
  role: string;
  expiresAt: string;
}

type LoginForm = { email: string; password: string };

export default function InviteLandingPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, setAuth } = useAuth();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [stage, setStage] = useState<"preview" | "accepting" | "success" | "error">("preview");
  const [stageMessage, setStageMessage] = useState("");
  const [orgId, setOrgId] = useState<number | null>(null);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  // Load invite preview (public — no auth needed)
  useEffect(() => {
    organisationsApi.getInvitePreview(token)
      .then(setPreview)
      .catch((err: unknown) => {
        setPreviewError(err instanceof Error ? err.message : "Invalid or expired invitation");
      });
  }, [token]);

  // If already logged in, try to auto-accept
  useEffect(() => {
    if (user && preview && stage === "preview") {
      handleAccept();
    }
  }, [user, preview]);

  const handleAccept = async () => {
    setStage("accepting");
    try {
      const org = await organisationsApi.acceptInvite(token);
      setOrgId(org.id);
      setStage("success");
    } catch (err: unknown) {
      setStageMessage(err instanceof Error ? err.message : "Failed to accept invitation");
      setStage("error");
    }
  };

  const onLogin = async (data: LoginForm) => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await authApi.login(data);
      if (res.token && res.user) {
        setAuth(res.token, res.user as any);
        // accept will fire via useEffect when user updates
      } else if (res.mfaToken) {
        setLoginError("MFA is enabled on this account. Please log in via the main login page and then accept the invite.");
      }
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Store the invite URL so callback can redirect back here
    if (typeof window !== "undefined") {
      localStorage.setItem("oauth_redirect", window.location.pathname);
    }
    window.location.href = "/api/auth/google";
  };

  // ── Loading preview ──────────────────────────────────────────────────────────
  if (!preview && !previewError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-dark">
        <Icon icon="solar:refresh-circle-line-duotone" className="text-4xl text-primary animate-spin" />
      </div>
    );
  }

  // ── Invalid / expired ────────────────────────────────────────────────────────
  if (previewError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-dark px-4">
        <div className="bg-white dark:bg-darkgray rounded-xl p-8 max-w-sm w-full text-center shadow-sm">
          <Icon icon="solar:close-circle-line-duotone" className="text-5xl text-red-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold mb-2">Invitation Not Found</h4>
          <p className="text-sm text-darklink mb-6">{previewError}</p>
          <Link href="/login">
            <Button className="rounded-full px-6">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Accepting ────────────────────────────────────────────────────────────────
  if (stage === "accepting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-dark">
        <div className="text-center">
          <Icon icon="solar:refresh-circle-line-duotone" className="text-4xl text-primary mx-auto mb-3 animate-spin" />
          <p className="text-darklink">Accepting invitation...</p>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (stage === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-dark px-4">
        <div className="bg-white dark:bg-darkgray rounded-xl p-8 max-w-sm w-full text-center shadow-sm">
          <Icon icon="solar:check-circle-line-duotone" className="text-5xl text-green-500 mx-auto mb-4" />
          <h4 className="text-lg font-semibold mb-2">Invitation Accepted!</h4>
          <p className="text-sm text-darklink mb-6">You have successfully joined <strong>{preview?.orgName}</strong>.</p>
          <Button onClick={() => router.push(orgId ? `/organisations/${orgId}` : "/organisations")} className="rounded-full px-6">
            View Organisation
          </Button>
        </div>
      </div>
    );
  }

  // ── Error after accept attempt ───────────────────────────────────────────────
  if (stage === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-dark px-4">
        <div className="bg-white dark:bg-darkgray rounded-xl p-8 max-w-sm w-full text-center shadow-sm">
          <Icon icon="solar:close-circle-line-duotone" className="text-5xl text-red-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold mb-2">Could Not Accept Invitation</h4>
          <p className="text-sm text-darklink mb-6">{stageMessage}</p>
          <Button onClick={() => router.push("/organisations")} className="rounded-full px-6">
            Go to Organisations
          </Button>
        </div>
      </div>
    );
  }

  // ── Main: invite details + login form ────────────────────────────────────────
  const roleLabel: Record<string, string> = {
    client: "Client",
    interviewer: "Interviewer",
    candidate: "Candidate",
    internal_employee: "Internal Employee",
    org_admin: "Organisation Admin",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-dark px-4 py-8">
      <div className="bg-white dark:bg-darkgray rounded-xl shadow-sm max-w-md w-full p-8">
        <div className="flex justify-center mb-6">
          <FullLogo />
        </div>

        {/* Invite summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Icon icon="solar:buildings-2-line-duotone" className="text-2xl text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-darklink mb-1">You've been invited to join</p>
              <p className="font-semibold text-base">{preview!.orgName}</p>
              <p className="text-sm text-darklink mt-1">
                Role: <span className="font-medium text-foreground">{roleLabel[preview!.role] ?? preview!.role}</span>
              </p>
              <p className="text-xs text-darklink mt-1">
                Sent to: <span className="font-medium">{preview!.email}</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-darklink text-center mb-5">
          Sign in with <strong>{preview!.email}</strong> to accept this invitation.
        </p>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          className="w-full px-4 py-2.5 border border-ld flex gap-2 items-center justify-center rounded-md text-sm text-primary-ld hover:bg-gray-50 dark:hover:bg-dark transition-colors mb-4"
        >
          <Image src="/images/svgs/google-icon.svg" alt="google" height={18} width={18} />
          Continue with Google
        </button>

        <div className="flex items-center gap-2 mb-4">
          <hr className="grow border-ld" />
          <span className="text-xs text-darklink">or sign in with email</span>
          <hr className="grow border-ld" />
        </div>

        {/* Email / password form */}
        <form onSubmit={handleSubmit(onLogin)}>
          {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
          <div className="mb-4">
            <Label htmlFor="email" className="mb-2 block">Email Address</Label>
            <Input
              id="email"
              type="text"
              placeholder={preview!.email}
              className={errors.email ? "border-red-400" : ""}
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" },
              })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div className="mb-6">
            <Label htmlFor="password" className="mb-2 block">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              className={errors.password ? "border-red-400" : ""}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Password must be at least 8 characters" },
              })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={loginLoading}>
            {loginLoading ? "Signing in..." : "Sign In & Accept Invitation"}
          </Button>
        </form>

        <p className="text-xs text-center text-darklink mt-4">
          Don't have an account?{" "}
          <Link href={`/register?redirect=/organisations/invite/${token}`} className="text-primary font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
