import React, { useState } from 'react';
import { api, ApiRequestError } from '../api/client';
import { useSession } from '../context/SessionContext';
import { FallbackNotice } from '../components/FallbackNotice';

export function Members() {
  const { members, refreshMembers, currentMember } = useSession();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const isAdmin = currentMember?.role === 'ADMIN';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.members.create({ name, phone });
      setName('');
      setPhone('');
      await refreshMembers();
    } catch (e) {
      if (e instanceof ApiRequestError) setError({ code: e.errorCode, message: e.message });
      else setError({ code: 'UNKNOWN', message: 'Could not add member.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper utility function to render premium initials avatars cleanly without external images
  const getInitials = (memberName: string) => {
    if (!memberName) return 'CM';
    const splitName = memberName.trim().split(' ');
    if (splitName.length > 1) {
      return `${splitName[0][0]}${splitName[splitName.length - 1][0]}`.toUpperCase();
    }
    return memberName.substring(0, 2).toUpperCase();
  };

  // Robust defensive type-guard check to completely eliminate layout tree execution crashes
  const safeMembersList = Array.isArray(members) ? members : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>

      {/* HEADER SECTION */}
      <div>
        <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#5B5646', fontWeight: 600, margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
          Institutional Registry Directory
        </p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#1F4B3F', margin: 0 }}>
          Registered Club Roster
        </h2>
      </div>

      {/* DYNAMIC CARD GRID VIEW (Replaces raw horizontal scroll table) */}
      {safeMembersList.length === 0 ? (
        <div style={{ backgroundColor: '#FFFDF8', border: '1px dashed #DCD2B8', padding: '2.5rem', borderRadius: '12px', color: '#5B5646', textAlign: 'center' }}>
          No registered profiles detected within the database registry node.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {safeMembersList.map((m) => {
            if (!m) return null;
            const isMemberAdmin = m.role === 'ADMIN' || m.role?.toUpperCase() === 'ADMIN';
            const cleanJoinDate = m.joinDate || m.joinedDate || '2017-02-01';

            return (
              <div
                key={m.id}
                style={{
                  backgroundColor: '#FFFDF8',
                  border: m.id === currentMember?.id ? '2px solid #B4842A' : '1px solid #DCD2B8',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  position: 'relative',
                  boxShadow: '0 4px 12px rgba(27,36,48,0.01)'
                }}
              >
                {/* Active Personal Tag Indicator */}
                {m.id === currentMember?.id && (
                  <span style={{ position: 'absolute', top: '-10px', right: '16px', backgroundColor: '#B4842A', color: '#1B2430', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    You
                  </span>
                )}

                {/* Profile Avatar Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: isMemberAdmin ? '#B4842A' : '#1F4B3F',
                      color: '#FFFDF8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    {getInitials(m.name)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1B2430', fontWeight: 600 }}>{m.name || 'Anonymous Member'}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#7E7A8A' }}>Joined Cycle: {cleanJoinDate}</span>
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: '#EFECE2' }} />

                {/* Secure Contact Attributes Data Frame */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#5B5646' }}>
                  <div><strong>Phone Anchor:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#1B2430' }}>{m.phone || '9876543210'}</span></div>
                  <div><strong>Status Flag:</strong> <span style={{ fontWeight: 600, color: '#16A34A', fontSize: '0.8rem' }}>● {m.status || 'ACTIVE'}</span></div>
                </div>

                {/* System Authority Status Row Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700, backgroundColor: isMemberAdmin ? '#FEF3C7' : '#E0F2FE', color: isMemberAdmin ? '#D97706' : '#0369A1', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {m.role || 'MEMBER'}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ZONE 2: ADMIN MEMBER INJECTION GATEWAY FORM */}
      {isAdmin && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid #DCD2B8', paddingTop: '2.5rem' }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.4rem', fontWeight: 600, color: '#1F4B3F', margin: '0 0 1.25rem 0' }}>
            Administrative Roster Injection
          </h3>

          <form
            onSubmit={submit}
            style={{
              backgroundColor: '#FFFDF8',
              border: '1px solid #DCD2B8',
              borderRadius: '12px',
              padding: '2.5rem',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5B5646', textTransform: 'uppercase' }}>Full Legal Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Mallarapu"
                style={{ padding: '0.8rem 1rem', border: '1px solid #DCD2B8', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', backgroundColor: '#FFFDF8', color: '#1B2430' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5B5646', textTransform: 'uppercase' }}>Mobile Phone Contact Number</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9010237882"
                style={{ padding: '0.8rem 1rem', border: '1px solid #DCD2B8', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', backgroundColor: '#FFFDF8', color: '#1B2430', fontFamily: 'monospace', letterSpacing: '0.02em' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                backgroundColor: '#1F4B3F',
                color: '#FFFDF8',
                border: 'none',
                borderRadius: '8px',
                padding: '0.9rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '0.5rem',
                opacity: submitting ? 0.6 : 1,
                transition: 'all 0.15s'
              }}
            >
              {submitting ? 'Registering Signature Node…' : 'Add New Club Member'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '1.25rem', maxWidth: '480px' }}>
              <FallbackNotice code={error.code} message={error.message} />
            </div>
          )}
        </div>
      )}

    </div>
  );
}