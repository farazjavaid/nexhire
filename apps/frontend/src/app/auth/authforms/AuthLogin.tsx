"use client";
import SocialButtons from "./SocialButtons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { authApi } from "@/lib/api";

type LoginForm = { email: string; password: string };
type MfaForm = { code: string };

const AuthLogin = () => {
  const [mfaToken, setMfaToken] = useState("");
  const [mfaStep, setMfaStep] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const { register: registerMfa, handleSubmit: handleSubmitMfa, formState: { errors: mfaErrors } } = useForm<MfaForm>();

  const onLogin = async (data: LoginForm) => {
    setServerError(""); setLoading(true);
    try {
      const res = await authApi.login(data);
      console.log("🔐 Login API Response:", res);
      if (res.mfaToken) { console.log("🔑 MFA Required"); setMfaToken(res.mfaToken); setMfaStep(true); }
      else if (res.token && res.user) {
        console.log("✅ Login Success - Token:", res.token.substring(0, 20) + "...");
        console.log("✅ User Data:", res.user);
        setAuth(res.token, res.user as any);
        console.log("✅ Auth set, redirecting to:", redirectTo);
        router.push(redirectTo);
      } else {
        console.log("❌ Missing token or user in response");
      }
    } catch (err: any) {
      console.error("❌ Login Error:", err.message);
      setServerError(err.message);
    }
    finally { setLoading(false); }
  };

  const onMfa = async (data: MfaForm) => {
    setServerError(""); setLoading(true);
    try {
      console.log("🔐 Verifying MFA...");
      const res = await authApi.verifyMfa({ mfaToken, code: data.code });
      console.log("✅ MFA Verified - Token:", res.token.substring(0, 20) + "...");
      setAuth(res.token, res.user as any);
      console.log("✅ Auth set, redirecting to:", redirectTo);
      router.push(redirectTo);
    } catch (err: any) {
      console.error("❌ MFA Error:", err.message);
      setServerError(err.message);
    }
    finally { setLoading(false); }
  };

  if (mfaStep) {
    return (
      <form className="mt-6" onSubmit={handleSubmitMfa(onMfa)}>
        {serverError && <p className="text-red-500 text-sm mb-4">{serverError}</p>}
        <div className="mb-4">
          <Label htmlFor="code">Security Code</Label>
          <Input id="code" type="text" className={`form-control mt-2 ${mfaErrors.code ? "border-red-400" : ""}`} placeholder="6-digit code" maxLength={6}
            {...registerMfa("code", { required: "Security code is required", pattern: { value: /^\d{6}$/, message: "Must be exactly 6 digits" } })} />
          {mfaErrors.code && <p className="text-red-500 text-xs mt-1">{mfaErrors.code.message}</p>}
        </div>
        <Button type="submit" className="w-full rounded-full" disabled={loading}>{loading ? "Verifying..." : "Verify"}</Button>
      </form>
    );
  }

  return (
    <>
    <SocialButtons />
    <form className="mt-6" onSubmit={handleSubmit(onLogin)}>
      {serverError && <p className="text-red-500 text-sm mb-4">{serverError}</p>}
      <div className="mb-4">
        <Label htmlFor="email" className="mb-2 block">Email Address</Label>
        <Input id="email" type="text" className={`form-control ${errors.email ? "border-red-400" : ""}`} placeholder="name@example.com"
          {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" } })} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div className="mb-4">
        <Label htmlFor="password" className="mb-2 block">Password</Label>
        <Input id="password" type="password" className={`form-control ${errors.password ? "border-red-400" : ""}`} placeholder="Your password"
          {...register("password", { required: "Password is required", minLength: { value: 8, message: "Password must be at least 8 characters" } })} />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>
      <div className="flex justify-between my-5">
        <div className="flex items-center gap-2">
          <Checkbox id="remember" className="checkbox" />
          <Label htmlFor="remember" className="opacity-90 font-normal cursor-pointer mb-0">Remember this Device</Label>
        </div>
        <Link href="/forgot-password" className="text-primary text-sm font-medium">Forgot Password?</Link>
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
    </form>
    </>
  );
};

export default AuthLogin;
