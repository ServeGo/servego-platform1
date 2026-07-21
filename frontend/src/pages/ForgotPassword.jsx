import React, { useState } from 'react';
import { api } from '../utils/apiClient';
import { Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';

export function ForgotPassword({ onNavigate }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverToken, setServerToken] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim()) { setErrorMsg('Please enter your email address.'); return; }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      setIsLoading(false);

      if (response.data?.success) {
        if (response.data?.data?.resetToken) {
          setServerToken(response.data.data.resetToken);
        }
        setSuccessMsg('A reset code has been sent to your email. Enter it below along with your new password.');
        setStep(2);
      } else {
        setErrorMsg(response.data?.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setIsLoading(false);
      const msg = err.response?.data?.message || err.message || 'Failed to send reset code. Please try again.';
      setErrorMsg(msg);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!resetToken.trim()) { setErrorMsg('Please enter the reset code.'); return; }
    if (!newPassword) { setErrorMsg('Please enter a new password.'); return; }
    if (newPassword.length < 8) { setErrorMsg('Password must be at least 8 characters.'); return; }
    if (!/^(?=.*[a-z])(?=.*\d)/.test(newPassword)) { setErrorMsg('Password must contain a lowercase letter and a number.'); return; }
    if (newPassword !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email: email.trim(),
        token: resetToken.trim(),
        newPassword,
      });
      setIsLoading(false);

      if (response.data?.success) {
        setSuccessMsg('Password reset successful! Redirecting to login...');
        setTimeout(() => onNavigate('login'), 2000);
      } else {
        setErrorMsg(response.data?.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setIsLoading(false);
      const msg = err.response?.data?.message || err.message || 'Failed to reset password. Please try again.';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="min-h-[80vh] bg-surface-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="enterprise-card p-8 sm:p-10 enterprise-slide-up">
          <div className="text-center mb-8">
            <div className="inline-flex w-10 h-10 rounded-xl bg-surface-900 items-center justify-center text-white font-extrabold text-sm mb-3">
              S
            </div>
            <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">
              {step === 1 ? 'Reset Your Password' : 'Create New Password'}
            </h2>
            <p className="text-surface-500 text-[13px] mt-1.5 font-medium">
              {step === 1
                ? 'Enter your email and we\'ll send you a reset code.'
                : 'Enter the reset code and your new password below.'
              }
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[12px] font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[12px] font-semibold flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="enterprise-label">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="enterprise-input pl-10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="enterprise-btn-primary w-full !py-3 !text-[13px] mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending reset code...
                  </span>
                ) : (
                  <>
                    <span>Send Reset Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {serverToken && (
                <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 text-[12px] font-semibold flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <span>Your reset code: </span>
                    <code className="font-mono font-bold bg-brand-100 px-1.5 py-0.5 rounded text-[11px]">{serverToken}</code>
                  </div>
                </div>
              )}

              <div>
                <label className="enterprise-label">Reset Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter the reset code"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="enterprise-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="enterprise-label">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="enterprise-input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-400 hover:text-surface-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="enterprise-label">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="enterprise-input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-400 hover:text-surface-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="enterprise-btn-primary w-full !py-3 !text-[13px] mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting password...
                  </span>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setErrorMsg(''); setSuccessMsg(''); setResetToken(''); setNewPassword(''); setConfirmPassword(''); setServerToken(''); }}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-surface-500 hover:text-surface-700 transition-colors mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to email
              </button>
            </form>
          )}

          <div className="text-center mt-6 pt-5 border-t border-surface-100">
            <span className="text-surface-500 text-[12px]">Remember your password? </span>
            <button
              onClick={() => onNavigate('login')}
              className="text-brand-700 font-bold text-[12px] hover:text-brand-800 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
