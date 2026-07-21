import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Briefcase, Mail, Lock, Phone, ShieldAlert, Sparkles, Eye, EyeOff } from 'lucide-react';

export function Signup({ onNavigate }) {
  const { registerUser } = useApp();
  const [signupType, setSignupType] = useState('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('partnerApplied') === '1') {
      setSignupType('provider');
      const msg = params.get('partnerMessage');
      setSuccessMsg(msg ? decodeURIComponent(msg) : 'Application submitted. Please register your account.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) { setErrorMsg('Please enter your full name.'); return; }
    if (!email.trim() || !email.includes('@')) { setErrorMsg('Please enter a valid email.'); return; }
    if (!mobileNumber.trim() || mobileNumber.trim().length < 10) { setErrorMsg('Please enter a valid mobile number.'); return; }
    if (signupType === 'customer' && !address.trim()) { setErrorMsg('Please enter your address.'); return; }
    if (signupType === 'customer' && (!pincode.trim() || !/^[0-9]{5,6}$/.test(pincode.trim()))) { setErrorMsg('Please enter a valid pincode.'); return; }
    if (!password || password.length < 8) { setErrorMsg('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    if (!acceptedTerms) { setErrorMsg('You must agree to the Terms & Conditions.'); return; }

    setIsLoading(true);
    const payload = signupType === 'customer'
      ? { name: fullName.trim(), email: email.trim(), phone: mobileNumber.trim(), role: signupType, password, confirmPassword, address: address.trim(), pincode: pincode.trim(), acceptedTerms }
      : { name: fullName.trim(), email: email.trim(), phone: mobileNumber.trim(), role: signupType, password, confirmPassword, photo: photoDataUrl || null, acceptedTerms };

    const result = await registerUser(payload);
    setIsLoading(false);

    if (result && !result.success) {
      setErrorMsg(result.error || 'Registration failed.');
      return;
    }
    setSuccessMsg('Account created successfully! Redirecting...');
    setTimeout(() => onNavigate(signupType === 'customer' ? 'dashboard-customer' : 'dashboard-provider'), 1200);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md enterprise-slide-up">
        <div className="enterprise-card p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                <span className="text-white font-extrabold text-sm leading-none">S</span>
              </div>
              <span className="font-extrabold text-surface-900 text-lg tracking-tight">ServeGo</span>
            </div>
            <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">Create Your Account</h2>
            <p className="text-surface-500 text-[13px] mt-1.5 font-medium">Join thousands booking trusted local experts.</p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[12px] font-semibold flex items-start gap-2.5 enterprise-fade-in">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[12px] font-semibold flex items-start gap-2.5 enterprise-fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1 animate-pulse" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Role Toggle */}
          <div className="grid grid-cols-2 p-1 bg-surface-100 rounded-xl mb-6">
            {[
              { key: 'customer', label: 'As Customer', icon: User },
              { key: 'provider', label: 'As Provider', icon: Briefcase },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { setSignupType(opt.key); setErrorMsg(''); }}
                  className={`py-2.5 px-3 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    signupType === opt.key ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="enterprise-label">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400"><User className="w-4 h-4" /></div>
                <input type="text" required placeholder="First and last name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="enterprise-input pl-10" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="enterprise-label">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400"><Mail className="w-4 h-4" /></div>
                <input type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="enterprise-input pl-10" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="enterprise-label">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400"><Phone className="w-4 h-4" /></div>
                <input type="tel" required placeholder="e.g. 9848022311" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="enterprise-input pl-10" />
              </div>
            </div>

            {/* Customer Address */}
            {signupType === 'customer' && (
              <>
                <div>
                  <label className="enterprise-label">Address</label>
                  <textarea required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, Street, Locality" className="enterprise-input min-h-[42px] resize-none" rows={2} />
                </div>
                <div>
                  <label className="enterprise-label">Pincode</label>
                  <input type="text" required value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="e.g. 500081" className="enterprise-input" />
                </div>
              </>
            )}

            {/* Provider Photo */}
            {signupType === 'provider' && (
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-200">
                <label className="enterprise-label">Photo (optional)</label>
                <input
                  type="file" accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) { setPhotoDataUrl(''); return; }
                    const reader = new FileReader();
                    reader.onloadend = () => setPhotoDataUrl(typeof reader.result === 'string' ? reader.result : '');
                    reader.readAsDataURL(file);
                  }}
                  className="enterprise-input !bg-white"
                />
                {photoDataUrl && <img src={photoDataUrl} alt="provider" className="mt-2 w-14 h-14 rounded-xl object-cover border border-surface-200" />}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="enterprise-label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400"><Lock className="w-4 h-4" /></div>
                <input type={showPassword ? 'text' : 'password'} required placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="enterprise-input pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-400 hover:text-surface-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="enterprise-label">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400"><Lock className="w-4 h-4" /></div>
                <input type={showConfirmPassword ? 'text' : 'password'} required placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="enterprise-input pl-10 pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-400 hover:text-surface-600">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 text-[12px] font-medium text-surface-600 leading-relaxed cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 rounded border-surface-300 text-brand-600 focus:ring-brand-500" />
              <span>I agree to the <span className="text-surface-900 font-bold">Terms & Conditions</span></span>
            </label>

            {/* Provider Disclaimer */}
            {signupType === 'provider' && (
              <div className="text-[11px] font-medium text-surface-500 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50 flex items-start gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>By registering, you confirm you have basic business eligibility under Hyderabad local guidelines.</span>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="enterprise-btn-primary w-full !py-3 !text-[13px] mt-2">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <>
                  <span>Create Account</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-5 border-t border-surface-100">
            <span className="text-surface-500 text-[12px]">Already have an account? </span>
            <button onClick={() => onNavigate('login')} className="text-brand-700 font-bold text-[12px] hover:text-brand-800 transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
