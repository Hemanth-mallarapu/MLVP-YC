import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

export function Login() {
  const { login } = useSession();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEPPING AND OVERLAY MANAGEMENT STATE ENTRIES
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [step, setStep] = useState(1); // 1: Email Identification, 2: OTP Entry Panel
  const [forgotEmail, setForgotEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // UNIVERSAL ENTRY SUBMISSION HANDLER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const isEmail = identifier.includes('@');

      // FIXED: Pass the arguments to match the updated SessionContext signature exactly:
      // login(identifier, isEmail, passwordInput)
      await login(identifier, isEmail, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // HANDLER FOR STEP 1: GENERATE & DISPATCH OTP PIN CODE via client.ts definition
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSubmitting(true);
    try {
      await api.public.generateOtp(forgotEmail);
      setStep(2);
    } catch (err: any) {
      setModalError(err.message || 'Failed to dispatch verification email.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // HANDLER FOR STEP 2: VERIFY AND WRITE CREDENTIAL ADJUSTMENTS via client.ts definition
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (forgotNewPassword.length < 6) {
      setModalError('Password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setModalError('New passwords do not match.');
      return;
    }

    setModalSubmitting(true);
    try {
      await api.public.verifyAndReset({
        email: forgotEmail,
        otp: emailOtp,
        password: forgotNewPassword
      });

      setModalSuccess('🎉 Password reset successfully completed!');
      setTimeout(() => {
        setShowForgotModal(false);
        setStep(1);
        setForgotEmail('');
        setEmailOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setModalSuccess('');
      }, 2500);
    } catch (err: any) {
      setModalError(err.message || 'Validation gate rejected the supplied code.');
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="no-ruled" style={{ position: 'fixed', inset: 0, backgroundColor: '#4E4B5C', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: "'IBM Plex Sans', sans-serif", zIndex: 9999 }}>
      <div style={{ width: '100%', maxWidth: '1024px', height: '560px', backgroundColor: '#1E1B26', borderRadius: '20px', display: 'flex', margin: 'auto', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)' }}>

        {/* LEFT BRAND PANEL LAYOUT */}
        <div style={{ width: '43%', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', background: 'linear-gradient(180deg, #53457A 0%, #171124 100%)', borderRadius: '14px', margin: '12px', overflow: 'hidden' }}>
          <div><span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#FFFFFF', fontFamily: "'Fraunces', serif" }}>MLVP<span style={{ color: '#8862F2' }}>-</span>YC</span></div>
          <div style={{ color: '#FFFFFF' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>Secure Ledger Gateway</h2>
            <p style={{ color: '#AAA3D0', fontSize: '0.85rem', lineHeight: 1.4 }}>Access real-time member metrics and account parameters instantly.</p>
          </div>
        </div>

        {/* RIGHT SYSTEM ENTRY ACTION PANEL */}
        <div style={{ width: '57%', padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#1E1B26' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.4rem' }}>Log In</h1>
            <p style={{ color: '#7E7A8A', fontSize: '0.9rem' }}>New to the club? <Link to="/signup" style={{ color: '#8862F2', textDecoration: 'none', fontWeight: 500 }}>Create an account</Link></p>
          </div>

          {error && <div style={{ padding: '0.85rem 1.2rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#F87171', fontSize: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Email or Mobile number" required style={{ width: '100%', backgroundColor: '#292535', border: '1px solid #363145', borderRadius: '8px', padding: '0.9rem 1.1rem', color: '#FFFFFF', fontSize: '0.95rem', outline: 'none' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required style={{ width: '100%', backgroundColor: '#292535', border: '1px solid #363145', borderRadius: '8px', padding: '0.9rem 1.1rem', color: '#FFFFFF', fontSize: '0.95rem', outline: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <span onClick={() => { setShowForgotModal(true); setStep(1); setModalError(''); setModalSuccess(''); }} style={{ color: '#8862F2', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>Forgot Password?</span>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} style={{ width: '100%', backgroundColor: '#6C4DE6', color: '#FFFFFF', fontWeight: 500, padding: '0.95rem', borderRadius: '8px', border: 'none', fontSize: '0.95rem', cursor: 'pointer', marginTop: '0.5rem' }}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {/* COMPACT INTERACTIVE EMAIL OTP RESET MODAL */}
      {showForgotModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(23, 20, 32, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'linear-gradient(135deg, #24212F 0%, #171420 100%)', border: '1px solid rgba(136, 98, 242, 0.25)', borderRadius: '12px', padding: '1.5rem 1.75rem', width: '90%', maxWidth: '360px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.55)' }}>

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', color: '#8862F2', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px' }}>Security Recovery Node</span>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.35rem', color: '#FFFFFF', margin: 0, fontWeight: 600 }}>Reset Password</h3>
            </div>

            {modalSuccess ? (
              <div style={{ color: '#4ADE80', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', padding: '2rem 0' }}>{modalSuccess}</div>
            ) : step === 1 ? (
              /* STAGE PANEL 1: EMAIL CAPTURE FOR DISPATCH */
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#A09BB0' }}>REGISTERED EMAIL ADDRESS</label>
                  <input required type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Enter registration email" style={{ padding: '0.65rem 0.85rem', backgroundColor: '#1E1B28', border: '1px solid #363145', borderRadius: '6px', fontSize: '0.88rem', color: '#FFFFFF', outline: 'none' }} />
                </div>
                {modalError && <div style={{ color: '#F87171', fontSize: '0.8rem', backgroundColor: 'rgba(248, 113, 113, 0.1)', padding: '0.5rem', borderRadius: '6px' }}>⚠️ {modalError}</div>}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowForgotModal(false)} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid #363145', backgroundColor: 'transparent', color: '#A09BB0', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={modalSubmitting} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: 'none', backgroundColor: '#6C4DE6', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}>{modalSubmitting ? 'Sending...' : 'Send OTP'}</button>
                </div>
              </form>
            ) : (
              /* STAGE PANEL 2: OTP TOKEN & COMPLEXITY VALUE VALIDATION */
              <form onSubmit={handleVerifyAndReset} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#A09BB0' }}>6-DIGIT EMAIL OTP PIN</label>
                  <input required type="text" maxLength={6} value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} placeholder="------" style={{ padding: '0.65rem 0.85rem', backgroundColor: '#1E1B28', border: '1px solid #363145', borderRadius: '6px', fontSize: '1.1rem', color: '#8862F2', textAlign: 'center', letterSpacing: '0.2em', fontWeight: 700, outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#A09BB0' }}>CHOOSE NEW PASSWORD</label>
                  <input required type="password" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} placeholder="Minimum 6 characters" style={{ padding: '0.65rem 0.85rem', backgroundColor: '#1E1B28', border: '1px solid #363145', borderRadius: '6px', fontSize: '0.88rem', color: '#FFFFFF', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#A09BB0' }}>CONFIRM NEW PASSWORD</label>
                  <input required type="password" value={forgotConfirmPassword} onChange={(e) => setForgotConfirmPassword(e.target.value)} placeholder="Re-enter to confirm" style={{ padding: '0.65rem 0.85rem', backgroundColor: '#1E1B28', border: '1px solid #363145', borderRadius: '6px', fontSize: '0.88rem', color: '#FFFFFF', outline: 'none' }} />
                </div>
                {modalError && <div style={{ color: '#F87171', fontSize: '0.8rem', backgroundColor: 'rgba(248, 113, 113, 0.1)', padding: '0.5rem', borderRadius: '6px' }}>⚠️ {modalError}</div>}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid #363145', backgroundColor: 'transparent', color: '#A09BB0', cursor: 'pointer' }}>Back</button>
                  <button type="submit" disabled={modalSubmitting} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: 'none', backgroundColor: '#4ADE80', color: '#171420', fontWeight: 700, cursor: 'pointer' }}>{modalSubmitting ? 'Validating...' : 'Reset Password'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}