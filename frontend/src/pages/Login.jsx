import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function Login({ onNavigate }) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim()) { setErrorMsg('Please enter your email address.'); return; }
    if (!password) { setErrorMsg('Please enter your password.'); return; }

    setIsLoading(true);
    const response = await login(email, password);
    setIsLoading(false);

    if (!response.success) {
      setErrorMsg(response.error || 'Login failed. Please check your credentials.');
    } else {
      const destRole = response.role;
      setSuccessMsg('Welcome back! Redirecting to your dashboard...');
      setTimeout(() => {
        if (destRole === 'customer') onNavigate('dashboard-customer');
        else if (destRole === 'provider') onNavigate('dashboard-provider');
        else if (destRole === 'admin') onNavigate('admin');
      }, 1000);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md enterprise-slide-up">
        <div className="enterprise-card p-8 sm:p-10">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                <span className="text-white font-extrabold text-sm leading-none">S</span>
              </div>
              <span className="font-extrabold text-surface-900 text-lg tracking-tight">ServeGo</span>
            </div>
            <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">Sign In to Your Account</h2>
            <p className="text-surface-500 text-[13px] mt-1.5 font-medium">
              Enter your credentials to access your account.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[12px] font-semibold flex items-start gap-2.5 enterprise-fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[12px] font-semibold flex items-start gap-2.5 enterprise-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="enterprise-label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-surface-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-[12px] font-medium text-surface-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-[12px] font-semibold text-brand-700 hover:text-brand-800 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="enterprise-btn-primary w-full !py-3 !text-[13px] mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-5 border-t border-surface-100">
            <span className="text-surface-500 text-[12px]">Don't have an account? </span>
            <button
              onClick={() => onNavigate('signup')}
              className="text-brand-700 font-bold text-[12px] hover:text-brand-800 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
