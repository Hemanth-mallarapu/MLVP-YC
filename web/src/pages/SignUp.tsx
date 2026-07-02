import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

export function SignUp() {
  const navigate = useNavigate();

  // State variables
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // 1. Production Security Validations
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for duplicates before executing creation
      const existingMembers = await api.members.list();
      const isDuplicate = existingMembers.some(
        (m) => m.phone === phone || m.email?.toLowerCase() === email.toLowerCase()
      );

      if (isDuplicate) {
        throw new Error('An account with this email or phone number already exists.');
      }

      // Fire creation payload to backend database repository
      const fullName = `${firstName} ${lastName}`.trim();
      await api.members.create({
        name: fullName,
        phone: phone,
        email: email
        // password parameter will be captured here once backend is updated
      });

      setSuccess(true);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/login');
      }, 2500);

    } catch (err: any) {
      setError(err.message || 'Registration failed. System could be offline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="no-ruled"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#4E4B5C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
        zIndex: 9999,
        backgroundImage: 'none'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1024px',
          height: '680px', // Restructured height slightly to accommodate password blocks comfortably
          backgroundColor: '#1E1B26',
          borderRadius: '20px',
          display: 'flex',
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* LEFT PANEL */}
        <div style={{ width: '43%', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', background: 'linear-gradient(180deg, #53457A 0%, #171124 100%)', borderRadius: '14px', margin: '12px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', opacity: 0.15, background: 'radial-gradient(ellipse at center bottom, #AAA3D0 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ fontWeight: 800, letterSpacing: '0.15em', fontSize: '1.4rem', color: '#FFFFFF', fontFamily: "'Fraunces', serif" }}>
              MLVP<span style={{ color: '#8862F2' }}>-</span>YC
            </span>
          </div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3, color: '#FFFFFF', marginBottom: '0.75rem' }}>
              Capturing Moments,<br />Creating Memories
            </h2>
            <div style={{ display: 'flex', gap: '6px', marginTop: '1.5rem' }}>
              <div style={{ width: '16px', height: '4px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
              <div style={{ width: '16px', height: '4px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
              <div style={{ width: '32px', height: '4px', backgroundColor: '#FFFFFF', borderRadius: '2px' }} />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ width: '57%', padding: '2.5rem 4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#1E1B26' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.4rem', tracking: '-0.02em' }}>
              Create an account
            </h1>
            <p style={{ color: '#7E7A8A', fontSize: '0.85rem' }}>
              Already have an account?
              <Link to="/login" style={{ color: '#8862F2', textDecoration: 'none', marginLeft: '0.4rem', fontWeight: 500 }}>Log in</Link>
            </p>
          </div>

          {error && (
            <div style={{ padding: '0.75rem 1.1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#F87171', fontSize: '0.85rem', borderRadius: '8px', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: '0.75rem 1.1rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#4ADE80', fontSize: '0.85rem', borderRadius: '8px', marginBottom: '1rem' }}>
              User created successfully! Redirecting to login window...
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                style={{ width: '50%', backgroundColor: '#292535', border: '1px solid #363145', borderRadius: '8px', padding: '0.85rem 1.1rem', color: '#FFFFFF', fontSize: '0.9rem', outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ width: '50%', backgroundColor: '#292535', border: '1px solid #363145', borderRadius: '8px', padding: '0.85rem 1.1rem', color: '#FFFFFF', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                style={{ width: '100%', backgroundColor: '#292535', border: '1px solid #363145', borderRadius: '8px', padding: '0.85rem 1.1rem', color: '#FFFFFF', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
                style={{ width: '100%', backgroundColor: '#292535', border: '1px solid #363145', borderRadius: '8px', padding: '0.85rem 1.1rem', color: '#FFFFFF', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            {/* PASSWORD AND CONFIRM PASSWORD FIELDS */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '50%', backgroundColor: '#292535', border: '1px solid #363145', borderRadius: '8px', padding: '0.85rem 1.1rem', color: '#FFFFFF', fontSize: '0.9rem', outline: 'none' }}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: '50%', backgroundColor: '#292535', border: '1px solid #363145', borderRadius: '8px', padding: '0.85rem 1.1rem', color: '#FFFFFF', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.1rem' }}>
              <input type="checkbox" id="terms" defaultChecked required style={{ accentColor: '#8862F2', width: '16px', height: '16px', cursor: 'pointer' }} />
              <label htmlFor="terms" style={{ color: '#A09BB0', fontSize: '0.8rem' }}>
                I agree to the <span onClick={() => setShowTermsModal(true)} style={{ color: '#FFFFFF', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}>Terms & Conditions</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || success}
              style={{ width: '100%', backgroundColor: '#6C4DE6', color: '#FFFFFF', fontWeight: 500, padding: '0.85rem', borderRadius: '8px', border: 'none', fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(108, 77, 230, 0.3)' }}
            >
              {isSubmitting ? 'Registering...' : 'Create account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#363145' }} />
            <span style={{ color: '#7E7A8A', fontSize: '0.75rem', padding: '0 10px', textTransform: 'uppercase' }}>Or register with</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#363145' }} />
          </div>

          <button onClick={() => alert('Google integration simulated.')} style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid #363145', color: '#FFFFFF', borderRadius: '8px', padding: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontWeight: 500 }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3C6.27 7.77 8.93 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57l3.78 2.93c2.21-2.04 3.47-5.04 3.47-8.65z"/><path fill="#FBBC05" d="M5.36 14.5c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.5 6.9C.54 8.84 0 11.01 0 13.3c0 2.29.54 4.46 1.5 6.4l3.86-3z"/><path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.78-2.93c-1.05.7-2.4 1.13-4.18 1.13-3.07 0-5.73-2.73-6.66-5.46l-3.86 3C3.4 20.35 7.35 23 12 23z"/>
            </svg>
            Sign up with Google
          </button>
        </div>
      </div>

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#1E1B26', border: '1px solid #363145', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '2rem', color: '#FFFFFF' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Terms & Conditions</h3>
            <div style={{ color: '#A09BB0', fontSize: '0.85rem', lineHeight: 1.6, maxHeight: '250px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              <p style={{ marginBottom: '0.75rem' }}>1. This web ledger interface calculates group transaction parameters inside the MLVP youth club ecosystem securely.</p>
              <p>2. Users commit to registering matching credentials to access profile assets.</p>
            </div>
            <button onClick={() => setShowTermsModal(false)} style={{ backgroundColor: '#6C4DE6', color: '#FFFFFF', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', float: 'right' }}>Close Window</button>
          </div>
        </div>
      )}
    </div>
  );
}