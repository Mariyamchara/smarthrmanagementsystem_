import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const OTP_EXPIRY_SECONDS = 120;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmployeeReset = searchParams.get("type") === "employee";
  const loginTarget = isEmployeeReset ? "/" : "/login";

  // step: "email" | "otp" | "reset"
  const [step, setStep] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);

  const otpRef = useRef(null);
  const timerRef = useRef(null);

  // Start countdown when on OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeLeft(OTP_EXPIRY_SECONDS);
      setExpired(false);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isEmployeeReset) {
        const res = await fetch("/api/employee-password-reset-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "No active employee found with that ID or email.");
          return;
        }
        setMessage("OTP sent to your email!");
      } else {
        const res = await fetch("/api/admin-password-reset-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to send OTP");
          return;
        }
        const data = await res.json();
        setMessage(data.message || "OTP sent to your email!");
      }

      setStep("otp");
    } catch {
      setError("Failed to verify account. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 - verify OTP
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (expired) {
      setError("OTP has expired. Please request a new one.");
      return;
    }
    if (!otpInput) {
      setError("Please enter the OTP.");
      return;
    }
    if (isEmployeeReset && otpInput !== otpRef.current) {
      setError("Invalid OTP. Please try again.");
      return;
    }
    clearInterval(timerRef.current);
    setMessage("");
    setStep("reset");
  };

  // Step 3 — reset password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const resetUrl = isEmployeeReset ? "/api/employee-password-reset" : "/api/admin-password-reset";
      const resetPayload = isEmployeeReset
        ? { identifier, newPassword }
        : { email: identifier, otp: otpInput, newPassword };

      const update = await fetch(resetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetPayload),
      });

      if (!update.ok) {
        const data = await update.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update password.");
      }
      setMessage("Password updated successfully! Redirecting...");
      setTimeout(() => navigate(loginTarget), 2000);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      if (isEmployeeReset) {
        const otp = generateOtp();
        otpRef.current = otp;
        setOtpInput("");
        setMessage(`New OTP sent! (Demo OTP: ${otp})`);
        setStep("otp");
      } else {
        const res = await fetch("/api/admin-password-reset-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to resend OTP");
          return;
        }
        setOtpInput("");
        setMessage("New OTP sent to your email!");
        setStep("otp");
      }
    } catch {
      setError("Failed to resend OTP. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="bg-[#2e2c7a] text-white px-8 py-4 shadow-md">
      </div>

      <div className="bg-gradient-to-r from-[#3f3d9c] to-[#5a57d6] text-white px-8 py-12 text-center">
        <h1 className="text-2xl font-bold">Smart HR Management System</h1>
      </div>

      <div className="flex items-center justify-center min-h-[90vh] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border-l-4 border-[#3f3d9c] p-8">

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {["Email", "OTP", "Reset"].map((label, i) => {
              const stepIndex = ["email", "otp", "reset"].indexOf(step);
              const active = i === stepIndex;
              const done = i < stepIndex;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${done ? "bg-green-500 text-white" : active ? "bg-[#3f3d9c] text-white" : "bg-gray-200 text-gray-500"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className="text-xs mt-1 text-gray-500">{label}</span>
                  </div>
                  {i < 2 && <div className={`h-0.5 w-10 mb-4 ${done ? "bg-green-500" : "bg-gray-200"}`} />}
                </React.Fragment>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
          )}
          {message && (
            <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{message}</div>
          )}

          {/* Step 1 — Email */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <h2 className="text-xl font-bold text-[#3f3d9c] mb-2">Forgot Password</h2>
              <p className="text-sm text-slate-500 mb-4">{isEmployeeReset ? "Enter your employee ID or email to receive an OTP." : "Enter your admin email to receive an OTP."}</p>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{isEmployeeReset ? "Employee ID or Email" : "Admin Email"}</label>
                <input
                  type={isEmployeeReset ? "text" : "email"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={isEmployeeReset ? "Enter employee ID or email" : "Enter your admin email"}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3f3d9c]"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#3f3d9c] hover:bg-[#2e2c7a] text-white font-semibold py-2 rounded-lg transition disabled:opacity-60">
                {loading ? "Verifying..." : "Send OTP"}
              </button>
              <p onClick={() => navigate(loginTarget)}
                className="text-center text-sm text-slate-500 hover:text-[#3f3d9c] cursor-pointer transition">
                Back to Login
              </p>
            </form>
          )}

          {/* Step 2 — OTP */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <h2 className="text-xl font-bold text-[#3f3d9c] mb-2">Enter OTP</h2>
              <p className="text-sm text-slate-500 mb-2">Enter the 6-digit OTP sent to <strong>{identifier}</strong>.</p>

              {/* Timer */}
              <div className={`text-center text-lg font-bold mb-2 ${expired ? "text-red-500" : timeLeft <= 30 ? "text-orange-500" : "text-[#3f3d9c]"}`}>
                {expired ? "OTP Expired" : `Time remaining: ${formatTime(timeLeft)}`}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">OTP Code</label>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                  disabled={expired}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3f3d9c] text-center text-xl tracking-widest disabled:opacity-50"
                />
              </div>

              {!expired ? (
                <button type="submit"
                  className="w-full bg-[#3f3d9c] hover:bg-[#2e2c7a] text-white font-semibold py-2 rounded-lg transition">
                  Verify OTP
                </button>
              ) : (
                <button type="button" onClick={handleResend} disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60">
                  {loading ? "Resending..." : "Resend OTP"}
                </button>
              )}
            </form>
          )}

          {/* Step 3 — Reset Password */}
          {step === "reset" && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <h2 className="text-xl font-bold text-[#3f3d9c] mb-2">Set New Password</h2>
              <p className="text-sm text-slate-500 mb-4">Enter and confirm your new password.</p>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3f3d9c]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3f3d9c]"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#3f3d9c] hover:bg-[#2e2c7a] text-white font-semibold py-2 rounded-lg transition disabled:opacity-60">
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
