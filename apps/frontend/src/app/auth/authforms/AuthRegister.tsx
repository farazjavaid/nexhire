"use client";
import SocialButtons from "./SocialButtons";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { authApi } from "@/lib/api";

type RegisterForm = { firstName: string; lastName: string; email: string; password: string; confirmPassword: string };

const AuthRegister = () => {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setAuth } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch("password");

  const onSubmit = async (data: RegisterForm) => {
    setServerError(""); setLoading(true);
    try {
      const { confirmPassword, ...payload } = data;
      const res = await authApi.register({ ...payload, role: "candidate" });
      // Direct login after registration (OTP verification to be implemented)
      setAuth({ token: res.token, user: res.user });
      router.push("/");
    } catch (err: any) { setServerError(err.message); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const onVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setServerError("Please enter the 6-digit code"); return; }
    setServerError(""); setLoading(true);
    try {
      const res = await authApi.verifySignupOtp({ verificationToken, otp: code });
      setAuth(res.token, res.user as any);
      router.push("/");
    } catch (err: any) { setServerError(err.message); }
    finally { setLoading(false); }
  };

  const onResend = async () => {
    if (resendCooldown > 0) return;
    setServerError(""); setLoading(true);
    try {
      const res = await authApi.resendSignupOtp({ verificationToken });
      setVerificationToken(res.verificationToken);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
      }, 1000);
    } catch (err: any) { setServerError(err.message); }
    finally { setLoading(false); }
  };

  if (otpStep) {
    return (
      <div className="mt-6">
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            We sent a 6-digit verification code to <strong>{registeredEmail}</strong>. Enter it below to activate your account.
          </p>
        </div>
        {serverError && <p className="text-red-500 text-sm mb-4">{serverError}</p>}
        <div className="mb-6">
          <Label className="font-semibold mb-3 block">Verification Code</Label>
          <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:border-primary dark:bg-darkgray dark:text-white transition-colors"
              />
            ))}
          </div>
        </div>
        <Button className="w-full rounded-full" onClick={onVerifyOtp} disabled={loading || otp.join("").length !== 6}>
          {loading ? "Verifying..." : "Verify & Create Account"}
        </Button>
        <div className="mt-4 text-center text-sm text-darklink">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={resendCooldown > 0 || loading}
            className="text-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <SocialButtons />
    <form className="mt-6" onSubmit={handleSubmit(onSubmit)}>
      {serverError && <p className="text-red-500 text-sm mb-4">{serverError}</p>}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label className="font-semibold mb-2 block">First Name</Label>
          <Input type="text" className={`form-control ${errors.firstName ? "border-red-400" : ""}`}
            {...register("firstName", { required: "First name is required", maxLength: { value: 100, message: "Max 100 characters" } })} />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <Label className="font-semibold mb-2 block">Last Name</Label>
          <Input type="text" className={`form-control ${errors.lastName ? "border-red-400" : ""}`}
            {...register("lastName", { required: "Last name is required", maxLength: { value: 100, message: "Max 100 characters" } })} />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="mb-4">
        <Label className="font-semibold mb-2 block">Email Address</Label>
        <Input type="text" className={`form-control ${errors.email ? "border-red-400" : ""}`} placeholder="name@example.com"
          {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" } })} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div className="mb-4">
        <Label className="font-semibold mb-2 block">Password</Label>
        <Input type="password" className={`form-control ${errors.password ? "border-red-400" : ""}`} placeholder="Min. 8 characters"
          {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" }, maxLength: { value: 72, message: "Max 72 characters" }, pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: "Must include uppercase, lowercase, and a number" } })} />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>
      <div className="mb-4">
        <Label className="font-semibold mb-2 block">Confirm Password</Label>
        <Input type="password" className={`form-control ${errors.confirmPassword ? "border-red-400" : ""}`} placeholder="Repeat your password"
          {...register("confirmPassword", { required: "Please confirm your password", validate: (val) => val === password || "Passwords do not match" })} />
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
      </div>
      <Button className="w-full rounded-full" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
    </form>
    </>
  );
};

export default AuthRegister;
