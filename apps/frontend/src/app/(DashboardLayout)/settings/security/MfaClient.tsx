"use client";
import React, { useEffect, useState } from "react";
import { mfaApi, authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";
import Image from "next/image";

type Factor = { factor_type: string; is_active: boolean; is_primary: boolean };
type MfaStatus = { enabled: boolean; factors: Factor[] };

type TotpStep = "idle" | "setup" | "verify";
type EmailStep = "idle" | "sent" | "verify";

export default function MfaClient() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // TOTP state
  const [totpStep, setTotpStep] = useState<TotpStep>("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);

  // Email MFA state
  const [emailStep, setEmailStep] = useState<EmailStep>("idle");
  const [emailCode, setEmailCode] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Disable MFA state
  const [disableType, setDisableType] = useState<"totp" | "email" | null>(null);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);

  const loadStatus = async () => {
    try {
      // Check if user has password
      try {
        const userResponse = await authApi.me();
        setHasPassword(userResponse.user?.hasPassword ?? true);
      } catch {
        // If we can't get user info, default to true (require password)
        setHasPassword(true);
      }

      // Load MFA status
      const data = await mfaApi.getStatus();
      setStatus(data);
    } catch {
      setError("Failed to load MFA status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatus(); }, []);

  const clearMessages = () => { setError(""); setSuccess(""); };

  const totpFactor = status?.factors.find((f) => f.factor_type === "totp");
  const emailFactor = status?.factors.find((f) => f.factor_type === "email");

  // --- TOTP ---
  const handleSetupTotp = async () => {
    clearMessages(); setTotpLoading(true);
    try {
      const res = await mfaApi.setupTotp();
      setQrDataUrl(res.qrDataUrl);
      setTotpSecret(res.secret);
      setTotpStep("setup");
    } catch (err: any) {
      setError(err.message);
    } finally { setTotpLoading(false); }
  };

  const handleActivateTotp = async () => {
    if (totpCode.length !== 6) { setError("Enter a 6-digit code"); return; }
    clearMessages(); setTotpLoading(true);
    try {
      await mfaApi.activateTotp({ code: totpCode });
      setSuccess("Authenticator app enabled successfully");
      setTotpStep("idle"); setTotpCode(""); setQrDataUrl(""); setTotpSecret("");
      await loadStatus();
    } catch (err: any) {
      setError(err.message);
    } finally { setTotpLoading(false); }
  };

  // --- Email MFA ---
  const handleSetupEmail = async () => {
    clearMessages(); setEmailLoading(true);
    try {
      await mfaApi.setupEmail();
      setEmailStep("sent");
      setSuccess("Verification code sent to your email");
    } catch (err: any) {
      setError(err.message);
    } finally { setEmailLoading(false); }
  };

  const handleActivateEmail = async () => {
    if (emailCode.length !== 6) { setError("Enter a 6-digit code"); return; }
    clearMessages(); setEmailLoading(true);
    try {
      await mfaApi.activateEmail({ code: emailCode });
      setSuccess("Email MFA enabled successfully");
      setEmailStep("idle"); setEmailCode("");
      await loadStatus();
    } catch (err: any) {
      setError(err.message);
    } finally { setEmailLoading(false); }
  };

  // --- Disable ---
  const handleDisable = async () => {
    if (!disableType) return;

    // Check if password or code is required
    if (hasPassword && !disablePassword) return;
    if (!hasPassword && !disableCode) return;

    clearMessages(); setDisableLoading(true);
    try {
      await mfaApi.disable({
        password: disablePassword,
        code: disableCode,
        factorType: disableType
      });
      setSuccess(`${disableType === "totp" ? "Authenticator app" : "Email MFA"} disabled`);
      setDisableType(null);
      setDisablePassword("");
      setDisableCode("");
      await loadStatus();
    } catch (err: any) {
      setError(err.message);
    } finally { setDisableLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-darklink">Loading security settings...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          <Icon icon="solar:danger-triangle-outline" className="text-lg flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          <Icon icon="solar:check-circle-outline" className="text-lg flex-shrink-0" />
          {success}
        </div>
      )}

      {/* MFA Status Banner */}
      <div className={`rounded-xl border px-5 py-4 flex items-center gap-3 ${status?.enabled ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
        <Icon
          icon={status?.enabled ? "solar:shield-check-bold" : "solar:shield-warning-bold"}
          className={`text-2xl ${status?.enabled ? "text-green-600" : "text-yellow-600"}`}
        />
        <div>
          <p className={`font-semibold text-sm ${status?.enabled ? "text-green-800" : "text-yellow-800"}`}>
            {status?.enabled ? "Two-Factor Authentication is ON" : "Two-Factor Authentication is OFF"}
          </p>
          <p className={`text-xs mt-0.5 ${status?.enabled ? "text-green-700" : "text-yellow-700"}`}>
            {status?.enabled
              ? "Your account is protected with an additional verification step."
              : "Add an extra layer of security to your account."}
          </p>
        </div>
      </div>

      {/* TOTP Card */}
      <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:qr-code-line-duotone" className="text-primary text-xl" />
            </div>
            <div>
              <h5 className="font-semibold text-sm">Authenticator App (TOTP)</h5>
              <p className="text-xs text-darklink mt-0.5">Use Google Authenticator, Authy, or any TOTP app</p>
            </div>
          </div>
          {totpFactor?.is_active ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <Icon icon="solar:check-circle-bold" /> Active {totpFactor.is_primary && "(Primary)"}
              </span>
              <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => { setDisableType("totp"); clearMessages(); }}>
                Disable
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleSetupTotp} disabled={totpLoading || totpStep !== "idle"}>
              {totpLoading ? "Loading..." : "Set Up"}
            </Button>
          )}
        </div>

        {/* TOTP Setup Steps */}
        {totpStep === "setup" && (
          <div className="mt-5 pt-5 border-t border-ld">
            <p className="text-sm font-medium mb-4">
              Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                {qrDataUrl && (
                  <Image src={qrDataUrl} alt="TOTP QR Code" width={160} height={160} className="rounded-lg border border-ld" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-darklink mb-2">Or enter this secret manually:</p>
                <code className="text-xs bg-gray-100 dark:bg-dark px-3 py-2 rounded-lg block break-all font-mono mb-4">
                  {totpSecret}
                </code>
                <Label className="mb-2 block text-sm">Verification Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="form-control w-32 text-center tracking-widest text-lg"
                  />
                  <Button onClick={handleActivateTotp} disabled={totpLoading || totpCode.length !== 6}>
                    {totpLoading ? "Verifying..." : "Verify & Enable"}
                  </Button>
                  <Button variant="outline" onClick={() => { setTotpStep("idle"); setTotpCode(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disable TOTP confirm */}
        {disableType === "totp" && (
          <div className="mt-5 pt-5 border-t border-ld">
            {hasPassword ? (
              <>
                <p className="text-sm font-medium mb-3 text-red-600">Confirm your password to disable TOTP</p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Your password"
                    className="form-control max-w-xs"
                  />
                  <Button variant="destructive" onClick={handleDisable} disabled={disableLoading || !disablePassword}>
                    {disableLoading ? "Disabling..." : "Confirm Disable"}
                  </Button>
                  <Button variant="outline" onClick={() => { setDisableType(null); setDisablePassword(""); }}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium mb-3 text-red-600">Enter your authenticator code to disable TOTP</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="form-control w-32 text-center tracking-widest text-lg"
                  />
                  <Button variant="destructive" onClick={handleDisable} disabled={disableLoading || disableCode.length !== 6}>
                    {disableLoading ? "Disabling..." : "Confirm Disable"}
                  </Button>
                  <Button variant="outline" onClick={() => { setDisableType(null); setDisableCode(""); }}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Email MFA Card */}
      <div className="rounded-xl border border-ld bg-white dark:bg-darkgray p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:letter-line-duotone" className="text-secondary text-xl" />
            </div>
            <div>
              <h5 className="font-semibold text-sm">Email OTP</h5>
              <p className="text-xs text-darklink mt-0.5">Receive a one-time code to your email on login</p>
            </div>
          </div>
          {emailFactor?.is_active ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <Icon icon="solar:check-circle-bold" /> Active {emailFactor.is_primary && "(Primary)"}
              </span>
              <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => { setDisableType("email"); clearMessages(); }}>
                Disable
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={handleSetupEmail}
              disabled={emailLoading || emailStep !== "idle"}>
              {emailLoading ? "Sending..." : "Set Up"}
            </Button>
          )}
        </div>

        {/* Email MFA setup — verify step */}
        {emailStep === "sent" && (
          <div className="mt-5 pt-5 border-t border-ld">
            <p className="text-sm font-medium mb-3">
              A 6-digit code has been sent to your email. Enter it below to activate Email MFA.
            </p>
            <Label className="mb-2 block text-sm">Verification Code</Label>
            <div className="flex gap-2">
              <Input
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="form-control w-32 text-center tracking-widest text-lg"
              />
              <Button onClick={handleActivateEmail} disabled={emailLoading || emailCode.length !== 6}>
                {emailLoading ? "Verifying..." : "Verify & Enable"}
              </Button>
              <Button variant="outline" onClick={() => { setEmailStep("idle"); setEmailCode(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Disable Email confirm */}
        {disableType === "email" && (
          <div className="mt-5 pt-5 border-t border-ld">
            {hasPassword ? (
              <>
                <p className="text-sm font-medium mb-3 text-red-600">Confirm your password to disable Email MFA</p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Your password"
                    className="form-control max-w-xs"
                  />
                  <Button variant="destructive" onClick={handleDisable} disabled={disableLoading || !disablePassword}>
                    {disableLoading ? "Disabling..." : "Confirm Disable"}
                  </Button>
                  <Button variant="outline" onClick={() => { setDisableType(null); setDisablePassword(""); }}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium mb-3 text-red-600">Enter your email code to disable Email MFA</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="form-control w-32 text-center tracking-widest text-lg"
                  />
                  <Button variant="destructive" onClick={handleDisable} disabled={disableLoading || disableCode.length !== 6}>
                    {disableLoading ? "Disabling..." : "Confirm Disable"}
                  </Button>
                  <Button variant="outline" onClick={() => { setDisableType(null); setDisableCode(""); }}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
