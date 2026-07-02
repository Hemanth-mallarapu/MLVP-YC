import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { useNavigate, Link } from 'react-router-dom';

export function Login() {
  const { login } = useSession();
  const navigate = useNavigate();

  // Combine identity input into one universal field
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // In production backend, you can parse if identifier is email or phone.
      // For now, we normalize the variable name for our login context.
      const isEmail = identifier.includes('@');
      const emailParam = isEmail ? identifier : '';
      const phoneParam = isEmail ? '' : identifier;

      await login(phoneParam || emailParam, emailParam); // Pass dynamically based on input
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
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
          height: '560px',
          backgroundColor: '#1E1B26',
          borderRadius: '20px',
          display: 'flex',
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* LEFT PANEL */}
        <div style={{ width: '43%', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifySelf: 'stretch', justifyContent: 'space-between', position: 'relative', background: 'linear-gradient(180deg, #53457A 0%, #171124 100%)', borderRadius: '14px', margin: '12px', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ fontWeight: 800, letterSpacing: '0.15em', fontSize: '1.4rem', color: '#FFFFFF', fontFamily: "'Fraunces', serif" }}>
              MLVP<span style={{ color: '#8862F2' }}>-</span>YC
            </span>
          </div>
          <div style={{ position: 'relative', zIndex: 2, color: '#FFFFFF' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Secure Ledger Gateway</h2>
            <p style={{ color: '#AAA3D0', fontSize: '0.85rem', lineHeight: 1.4 }}>Access real-time member metrics and account parameters instantly.</p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ width: '57%', padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#1E1B26' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>Log In</h1>
            <p style={{ color: '#7E7A8A', fontSize: '0.9rem' }}>
              New to the club? <Link to="/signup" style={{ color: '#8862F2', textDecoration: 'none', fontWeight: 500 }}>Create an account</Link>
            </p>
          </div>

          {error && (
            <div style={{ padding: '0.85rem 1.2rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#F87171', fontSize: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* UNIVERSAL IDENTIFIER FIELD */}
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or Mobile number"
              required
              style={{ width: '100%', backgroundColor: '#292535', border: '1px solid #363145', borderRadius: '8px', padding: '0.9rem 1.1rem', color: '#FFFFFF', fontSize: '0.95rem', outline: 'none' }}
            />

            {/* SECURE MASKED PASSWORD FIELD */}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{ width: '100%', backgroundColor: '#292535', border: '1px solid #363145', borderRadius: '8px', padding: '0.9rem 1.1rem', color: '#FFFFFF', fontSize: '0.95rem', outline: 'none' }}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ width: '100%', backgroundColor: '#6C4DE6', color: '#FFFFFF', fontWeight: 500, padding: '0.95rem', borderRadius: '8px', border: 'none', fontSize: '0.95rem', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(108, 77, 230, 0.2)' }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}