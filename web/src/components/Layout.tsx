import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useSession } from '../context/SessionContext';

export function Layout() {
  const { currentMember, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  // COMPACT PREMIUM PASSWORD RESET OVERLAY MODAL STATES
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Fallback safe rendering parameter for user profile
  const userName = currentMember?.name || 'Club Member';
  const userRole = currentMember?.role || 'MEMBER';

  // Handles dropdown option routes and modal state triggers
  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    if (action === 'logout') {
      logout();
      navigate('/login');
    } else if (action === 'Reset Password') {
      // Clear old state tracking values and open password update modal
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setModalError('');
      setIsResetModalOpen(true);
    } else {
      alert(`${action} integration is simulated for current term.`);
    }
  };

  // Handles dispatching the secure credential adjustment payload to Spring Boot
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (newPassword.length < 6) {
      setModalError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError('Passwords do not match.');
      return;
    }

    setModalSubmitting(true);
    try {
      if (!currentMember?.id) throw new Error('No active user session detected.');

      // Fires request to updated endpoint passing both validation metrics
      await api.members.resetPassword(Number(currentMember.id), {
        oldPassword,
        password: newPassword
      });

      alert('🎉 Password changed successfully!');
      setIsResetModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to update credentials.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // 1. Build out the navigation payload list array
  const navigationItems = [
    { path: '/', label: 'Ledger' },
    { path: '/apply', label: 'Apply for Loan' },
    { path: '/loans', label: 'Loans' },
    { path: '/members', label: 'Members' },
    { path: '/contributions', label: 'Contributions' },
    { path: '/overview', label: 'Club Capital Index' }
  ];

  // 2. DYNAMIC SHIFT: If user is an ADMIN, prepend the Admin Hub link cleanly
  if (currentMember?.role === 'ADMIN') {
    navigationItems.push({ path: '/admin', label: '🛡️ Admin Hub' });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F6F1E7', position: 'relative' }}>

      {/* HEADER LAYER MATRIX */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', borderBottom: '1px solid #DCD2B8', backgroundColor: '#FFFDF8', zIndex: 1000 }}>

        {/* ENHANCED CLICKABLE BRAND MENU WRAP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>

          {/* Large Clickable Hamburger Trigger */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: '#1F4B3F',
              border: 'none',
              borderRadius: '8px',
              width: '42px',
              height: '42px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(31, 75, 63, 0.2)',
              padding: '0'
            }}
            title="Account Menu"
          >
            <div style={{ width: '22px', height: '2px', backgroundColor: '#FFFDF8', transition: 'all 0.2s' }} />
            <div style={{ width: '22px', height: '2px', backgroundColor: '#FFFDF8', transition: 'all 0.2s' }} />
            <div style={{ width: '22px', height: '2px', backgroundColor: '#FFFDF8', transition: 'all 0.2s' }} />
          </button>

          {/* Core Text Banner Identity */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', fontWeight: 700, color: '#1F4B3F', letterSpacing: '-0.01em', lineHeight: '1.2' }}>
              MLVPYC
            </span>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', tracking: '0.05em', color: '#5B5646', fontWeight: 600, letterSpacing: '0.05em' }}>
              MALLARAPU VANDLA PALLI YOUTH CLUB — LEDGER
            </span>
          </div>

          {/* DYNAMIC DROPDOWN MENU OPTIONS */}
          {showMenu && (
            <div style={{ position: 'absolute', top: '52px', left: 0, backgroundColor: '#1E1B26', border: '1px solid #363145', borderRadius: '12px', width: '240px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden', padding: '6px 0', zIndex: 1100 }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #363145', display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600 }}>{userName}</span>
                <span style={{ color: '#8862F2', fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{userRole}</span>
              </div>
              <button onClick={() => handleMenuAction('Profile')} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', color: '#E2DDF2', fontSize: '0.85rem', cursor: 'pointer' }}>Profile</button>
              <button onClick={() => handleMenuAction('Settings')} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', color: '#E2DDF2', fontSize: '0.85rem', cursor: 'pointer' }}>Settings</button>

              {/* Privacy & Security Header Option Wrapper */}
              <div style={{ padding: '8px 16px 4px 16px', color: '#A09BB0', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Privacy & Security</div>
              <button onClick={() => handleMenuAction('Reset Password')} style={{ width: '100%', textAlign: 'left', padding: '6px 16px 10px 28px', background: 'none', border: 'none', color: '#E2DDF2', fontSize: '0.85rem', cursor: 'pointer' }}>Reset Password</button>

              <div style={{ height: '1px', backgroundColor: '#363145', margin: '4px 0' }} />
              <button onClick={() => handleMenuAction('logout')} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', color: '#F87171', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>Logout</button>
            </div>
          )}
        </div>

        {/* SECURE IDENTITY INSIGNIA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#F6F1E7', padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid #DCD2B8' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1B2430' }}>Active: {userName}</span>
        </div>
      </header>

      {/* SUB-NAVIGATION LINKS */}
      <nav style={{ backgroundColor: '#FFFDF8', padding: '0.5rem 2rem', display: 'flex', gap: '1.5rem', borderBottom: '1px solid #DCD2B8', zIndex: 900 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: item.path === '/admin' ? '#B4842A' : (isActive ? '#1F4B3F' : '#5B5646'),
                borderBottom: isActive ? (item.path === '/admin' ? '2px solid #B4842A' : '2px solid #1F4B3F') : '2px solid transparent',
                paddingBottom: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* CORE OUTLET AREA CONTAINER */}
      <main style={{ flex: 1, padding: '2.5rem 2rem', backgroundColor: '#F6F1E7', position: 'relative', zIndex: 10 }}>
        <Outlet />
      </main>

      {/* INTERACTIVE COMPACT PREMIUM PASSWORD RESET MODAL */}
      {isResetModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(23, 20, 32, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            // FIXED: Swapped dark gradient out for the premium cream card theme from the dashboard popups
            backgroundColor: '#FFFDF8',
            border: '2px solid #DCD2B8',
            borderRadius: '12px',
            padding: '1.7rem 2rem', width: '90%', maxWidth: '360px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            fontFamily: "'IBM Plex Sans', sans-serif"
          }}>

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', color: '#B4842A', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px' }}>
                Security Settings Checkpoint
              </span>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.45rem', color: '#1F4B3F', margin: 0, fontWeight: 700 }}>
                Reset Access Password
              </h3>
            </div>

            <form onSubmit={handlePasswordResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

              {/* Old Password Input Frame */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#5B5646', letterSpacing: '0.02em' }}>
                  CURRENT PASSWORD
                </label>
                <input
                  required
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  style={{
                    padding: '0.7rem 0.9rem',
                    backgroundColor: '#FFFDF8',
                    border: '1px solid #DCD2B8',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#1B2430',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1F4B3F';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#DCD2B8';
                  }}
                />
              </div>

              {/* New Password Input Frame */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#5B5646', letterSpacing: '0.02em' }}>
                  NEW ACCESS PASSWORD
                </label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{
                    padding: '0.7rem 0.9rem',
                    backgroundColor: '#FFFDF8',
                    border: '1px solid #DCD2B8',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#1B2430',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1F4B3F';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#DCD2B8';
                  }}
                />
              </div>

              {/* Confirm Password Input Frame */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#5B5646', letterSpacing: '0.02em' }}>
                  CONFIRM NEW PASSWORD
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter to confirm"
                  style={{
                    padding: '0.7rem 0.9rem',
                    backgroundColor: '#FFFDF8',
                    border: '1px solid #DCD2B8',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#1B2430',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1F4B3F';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#DCD2B8';
                  }}
                />
              </div>

              {modalError && (
                <div style={{
                  color: '#DC2626', fontSize: '0.8rem', fontWeight: 600,
                  backgroundColor: 'rgba(220, 38, 38, 0.05)', padding: '0.5rem 0.75rem',
                  borderRadius: '6px', border: '1px solid rgba(220, 38, 38, 0.15)'
                }}>
                  ⚠️ {modalError}
                </div>
              )}

              {/* Action Buttons Matrix */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setIsResetModalOpen(false); setModalError(''); }}
                  style={{
                    flex: 1, padding: '0.65rem', borderRadius: '6px',
                    border: '1px solid #DCD2B8', backgroundColor: 'transparent',
                    cursor: 'pointer', fontWeight: 600, color: '#5B5646',
                    fontSize: '0.85rem', transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#EFECE2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  style={{
                    flex: 1, padding: '0.65rem', borderRadius: '6px', border: 'none',
                    backgroundColor: '#1F4B3F', color: '#FFFDF8', cursor: 'pointer',
                    fontWeight: 600, fontSize: '0.85rem', opacity: modalSubmitting ? 0.7 : 1,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if(!modalSubmitting) e.currentTarget.style.backgroundColor = '#163A31'; }}
                  onMouseLeave={(e) => { if(!modalSubmitting) e.currentTarget.style.backgroundColor = '#1F4B3F'; }}
                >
                  {modalSubmitting ? 'Saving...' : 'Update Password'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* PRODUCTION GRADE BRAND FOOTER LAYER */}
      <footer style={{ backgroundColor: '#1B2430', color: '#FFFDF8', padding: '2.5rem 2rem', marginTop: 'auto', borderTop: '4px solid #B4842A', position: 'relative', zIndex: 20 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '2rem' }}>

          <div style={{ maxWidth: '400px' }}>
            <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.25rem', marginBottom: '0.5rem', color: '#B4842A' }}>About MLVPYC</h4>
            <p style={{ fontSize: '0.8rem', color: '#DCD2B8', lineHeight: '1.5', margin: '0' }}>
              Established in early 2017 with 11 core members. Operating mutual rotating micro-capitalization savings algorithms to ensure transparent loan priorities across regular 6-month cycles (Feb-Aug / Aug-Feb).
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#B4842A', marginBottom: '0.5rem', tracking: '0.05em' }}>CONTACT INFO</h4>
            <p style={{ fontSize: '0.8rem', color: '#DCD2B8', margin: '0 0 0.25rem 0' }}>Mallarapu Vandla Palli Youth Club Registry</p>
            <p style={{ fontSize: '0.8rem', color: '#DCD2B8', margin: '0' }}>
              Email:{' '}
              <a
                href="mailto:mlvpyclub@gmail.com"
                style={{ color: '#B4842A', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                mlvpyclub@gmail.com
              </a>
            </p>
          </div>

          {/* SOCIAL MEDIA CONNECTIONS INTERFACE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#B4842A', marginBottom: '0.5rem' }}>CONNECT</h4>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a href="#linkedin" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #B4842A', color: '#FFFDF8', textDecoration: 'none', fontSize: '0.8rem' }} title="LinkedIn">in</a>
              <a href="#instagram" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #B4842A', color: '#FFFDF8', textDecoration: 'none', fontSize: '0.8rem' }} title="Instagram">ig</a>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#B4842A', color: '#1B2430', fontWeight: 'bold', fontSize: '0.8rem' }} title="Copyright">©</div>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}