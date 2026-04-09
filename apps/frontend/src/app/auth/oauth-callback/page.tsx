"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function OAuthCallback() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    // Get params directly from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userStr = params.get("user");

    console.log("🔐 OAuth callback started");
    console.log("Token:", token ? "✓" : "✗");
    console.log("User:", userStr ? "✓" : "✗");

    if (token && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        const nameParts = userData.name.split(" ");
        const user = {
          id: userData.id,
          email: userData.email,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" ") || "",
          role: "user",
        };

        console.log("✅ OAuth callback - Setting auth");
        setAuth(token, user);

        // Also set cookie for middleware
        document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        console.log("🍪 Cookie set");

        // Redirect to home
        console.log("🔄 Redirecting to home...");
        router.replace("/");
      } catch (err) {
        console.error("❌ OAuth callback error:", err);
        router.replace("/login?error=invalid_callback");
      }
    } else {
      console.error("❌ Missing token or user in callback");
      console.log("URL:", window.location.href);
      // Small delay to show error
      setTimeout(() => {
        router.replace("/login?error=missing_params");
      }, 2000);
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen flex-col gap-4">
      <p className="text-gray-600">Completing sign in...</p>
      <p className="text-sm text-gray-400">If this takes too long, <a href="/login" className="text-blue-500">click here</a></p>
    </div>
  );
}
