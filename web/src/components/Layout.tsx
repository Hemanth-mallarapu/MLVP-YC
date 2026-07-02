import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

export function Layout() {
  const { currentMember, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  // Fallback safe rendering parameter for user profile
  const userName = currentMember?.name || 'Club Member';
  const userRole = currentMember?.role || 'MEMBER';

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    if (action === 'logout') {
      logout();
      navigate('/login');
    } else {
      alert(`${action} integration is simulated for current term.`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F6F1E7', position: 'relative' }}>

      {/* HEADER LAYER MATRIX */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', borderBottom: '1px solid #DCD2B8', backgroundColor: '#FFFDF8', zIndex: 100 }}>

        {/* ENHANCED CLICKABLE BRAND MENU WRAP (Left Side - Responding to edited-image.png) */}
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
            <div style={{ position: 'absolute', top: '52px', left: 0, backgroundColor: '#1E1B26', border: '1px solid #363145', borderRadius: '12px', width: '220px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden', padding: '6px 0' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #363145', display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600 }}>{userName}</span>
                <span style={{ color: '#8862F2', fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{userRole}</span>
              </div>
              <button onClick={() => handleMenuAction('Profile')} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', color: '#E2DDF2', fontSize: '0.85rem', cursor: 'pointer' }}>Profile</button>
              <button onClick={() => handleMenuAction('Settings')} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', color: '#E2DDF2', fontSize: '0.85rem', cursor: 'pointer' }}>Settings</button>
              <button onClick={() => handleMenuAction('Reset Password')} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', color: '#E2DDF2', fontSize: '0.85rem', cursor: 'pointer' }}>Reset Password</button>
              <div style={{ height: '1px', backgroundColor: '#363145', margin: '4px 0' }} />
              <button onClick={() => handleMenuAction('logout')} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', color: '#F87171', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>Logout</button>
            </div>
          )}
        </div>

        {/* SECURE IDENTITY INSIGNIA (Right Side - Replaced the viewing select picker) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#F6F1E7', padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid #DCD2B8' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1B2430' }}>Active: {userName}</span>
        </div>
      </header>

      {/* SUB-NAVIGATION LINKS */}
      <nav style={{ backgroundColor: '#FFFDF8', padding: '0.5rem 2rem', display: 'flex', gap: '1.5rem', borderBottom: '1px solid #DCD2B8' }}>
        {[
          { path: '/', label: 'Ledger' },
          { path: '/apply', label: 'Apply for Loan' },
          { path: '/loans', label: 'Loans' },
          { path: '/members', label: 'Members' },
          { path: '/contributions', label: 'Contributions' }
        ].map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: isActive ? '#1F4B3F' : '#5B5646',
                borderBottom: isActive ? '2px solid #1F4B3F' : '2px solid transparent',
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
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>

      {/* PRODUCTION GRADE BRAND FOOTER LAYER */}
      <footer style={{ backgroundColor: '#1B2430', color: '#FFFDF8', padding: '2.5rem 2rem', marginTop: 'auto', borderTop: '4px solid #B4842A' }}>
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
              {/* LinkedIn Icon */}
              <a href="#linkedin" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #B4842A', color: '#FFFDF8', textDecoration: 'none', fontSize: '0.8rem' }} title="LinkedIn">in</a>
              {/* Instagram Icon */}
              <a href="#instagram" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #B4842A', color: '#FFFDF8', textDecoration: 'none', fontSize: '0.8rem' }} title="Instagram">ig</a>
              {/* Copyright Signia badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#B4842A', color: '#1B2430', fontWeight: 'bold', fontSize: '0.8rem' }} title="Copyright">©</div>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}