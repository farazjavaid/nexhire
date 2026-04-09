"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { authApi } from "@/lib/api";

type ForgotForm = { email: string };

const AuthForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ForgotForm>();

  const onSubmit = async (data: ForgotForm) => {
    setServerError(""); setLoading(true);
    try { await authApi.forgotPassword(data); setSent(true); }
    catch (err: any) { setServerError(err.message); }
    finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700">
        If an account exists for <strong>{getValues("email")}</strong>, a reset link has been sent.
      </div>
    );
  }

  return (
    <form className="mt-6" onSubmit={handleSubmit(onSubmit)}>
      {serverError && <p className="text-red-500 text-sm mb-4">{serverError}</p>}
      <div className="mb-4">
        <Label htmlFor="email" className="mb-2 block">Email Address</Label>
        <Input id="email" type="text" className={`form-control ${errors.email ? "border-red-400" : ""}`} placeholder="name@example.com"
          {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" } })} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <Button className="w-full rounded-full" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
    </form>
  );
};

export default AuthForgotPassword;
