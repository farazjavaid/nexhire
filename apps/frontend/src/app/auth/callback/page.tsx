"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error || !token) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      setAuth(token, {
        id: String(payload.sub),
        email: "",
        firstName: "",
        lastName: "",
        role: payload.roles?.[0] ?? "candidate",
      });
      const oauthRedirect = localStorage.getItem("oauth_redirect");
      if (oauthRedirect) {
        localStorage.removeItem("oauth_redirect");
        router.replace(oauthRedirect);
      } else {
        router.replace("/");
      }
    } catch {
      router.replace("/login?error=oauth_failed");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-500">Signing you in...</p>
    </div>
  );
}
