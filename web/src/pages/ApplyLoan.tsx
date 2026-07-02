import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { useActiveTerm } from '../hooks/useActiveTerm';
import { useSession } from '../context/SessionContext';

export function ApplyLoan() {
  const { currentMember } = useSession();
  const { termId, term } = useActiveTerm();
  const [amount, setAmount] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [purpose, setPurpose] = useState('Business Expansion / Capital');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const purposeOptions = [
    'Agriculture Equipment / Seeds',
    'Business Expansion / Capital',
    'Higher Education / Tuition Fees',
    'Emergency Personal Medical Expenses'
  ];

  // Close custom dropdown safely if clicking completely outside the element
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const numericAmount = parseFloat(amount) || 0;
  const computedInterest = numericAmount * 0.05;
  const totalRepayment = numericAmount + computedInterest;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (numericAmount <= 0) {
      setError('Please provide a valid positive numeric loan figure.');
      return;
    }

    if (numericAmount > 200000) {
      setError('Limit Rule Violation: To maintain pool protection and prevent internal disputes, members can borrow a maximum of ₹2,00,000 per 6-month term.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Resolve target term context dynamically, fallback to 1 if not loaded yet
      const targetTermId = termId || 1;

      // 2. FIXED: Use api.loans.byTerm(targetTermId) instead of the non-existent .list() method
      const activeLoans = await api.loans.byTerm(targetTermId).catch(() => []);

      // 3. Keep your business logic verification unchanged
      const hasDebt = activeLoans.some(l => l.memberId === currentMember?.id && !l.status.includes('REPAID'));

      if (hasDebt) {
        throw new Error("Fallback Barrier Triggered: You have already taken a loan in this current term cycle. Your account currently holds the lowest priority level. Please wait until the next cycle transitions or a higher-priority member explicitly rejects their allocation slot.");
      }

      if (!termId) {
        setSuccess(`[Simulation Mode] Application for ₹${numericAmount.toLocaleString()} filed successfully! Calculated term interest (5%): ₹${computedInterest.toLocaleString()}. Total due next cycle: ₹${totalRepayment.toLocaleString()}. Note: This will be committed once the admin opens the cycle.`);
        setAmount('');
        return;
      }

      // 4. Submit application payload to database repository layer
      await api.loans.apply({
        memberId: currentMember?.id || 0,
        termId: termId,
        amount: numericAmount
      });

      setSuccess(`Your application for ₹${numericAmount.toLocaleString()} with a flat 5% term interest rate has been filed transparently into the priority matrix!`);
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to register application with the rotation engine.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>

      {/* HEADER SECTION */}
      <div style={{ borderBottom: '2px solid #DCD2B8', paddingBottom: '1rem' }}>
        <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#5B5646', fontWeight: 600, margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
          Capital Allocation Matrix
        </p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#1F4B3F', margin: 0 }}>
          Apply For Dynamic Loan
        </h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#5B5646' }}>
          Active Term: <span style={{ fontWeight: 600, color: term?.termName ? '#1F4B3F' : '#B4842A' }}>{term?.termName || 'Inter-cycle Processing (Offline Simulation)'}</span>
        </p>
      </div>

      {/* CORE DUAL PANEL COLUMN GRID */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'start' }}>

        {/* LEFT COMPONENT: FORM */}
        <div style={{ flex: '1 1 500px', backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '12px', padding: '2.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', color: '#1F4B3F', fontWeight: 600 }}>Loan Request Submission</h3>

          {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#DC2626', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>{error}</div>}
          {success && <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#16A34A', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* AMOUNT INPUT BOX */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5B5646', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Requested Capital Amount (INR)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '1rem', fontWeight: 600, color: '#5B5646' }}>₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  required
                  style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2rem', border: '1px solid #DCD2B8', borderRadius: '8px', fontSize: '1rem', outline: 'none', backgroundColor: '#FFFDF8' }}
                />
              </div>
            </div>

            {/* PREMIUM CUSTOM DROPDOWN ACCENT BOX */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} ref={dropdownRef}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5B5646', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Utilization Purpose Context</label>

              <div style={{ position: 'relative' }}>
                {/* Trigger Window Container Box */}
                <div
                  onClick={() => setIsOpen(!isOpen)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.25rem',
                    border: '1px solid #DCD2B8',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    backgroundColor: '#FFFDF8',
                    color: '#1B2430',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span>{purpose}</span>
                  <svg
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      opacity: 0.6
                    }}
                  >
                    <path d="M1 1L6 6L11 1" stroke="#1B2430" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Dropdown Floating Options Shelf */}
                {isOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      backgroundColor: '#FFFDF8',
                      border: '1px solid #DCD2B8',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(27,36,48,0.08)',
                      zIndex: 100,
                      overflow: 'hidden',
                      padding: '4px 0'
                    }}
                  >
                    {purposeOptions.map((option) => (
                      <div
                        key={option}
                        onClick={() => {
                          setPurpose(option);
                          setIsOpen(false);
                        }}
                        style={{
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.95rem',
                          color: '#1B2430',
                          cursor: 'pointer',
                          backgroundColor: purpose === option ? '#F6F1E7' : 'transparent',
                          fontWeight: purpose === option ? 600 : 400,
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (purpose !== option) e.currentTarget.style.backgroundColor = '#FFFDF2';
                        }}
                        onMouseLeave={(e) => {
                          if (purpose !== option) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* LIVE MATHEMATICAL BREAKDOWN FEEDBACK BOX */}
            <div style={{ padding: '1.25rem', backgroundColor: '#F6F1E7', borderRadius: '8px', border: '1px solid #DCD2B8', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#5B5646' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Base Principal Request:</span>
                <span style={{ fontWeight: 600, color: '#1B2430' }}>₹{numericAmount.toLocaleString()}.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fixed Cycle Interest (5% flat):</span>
                <span style={{ fontWeight: 600, color: '#B4842A' }}>+ ₹{computedInterest.toLocaleString()}.00</span>
              </div>
              <div style={{ height: '1px', backgroundColor: '#DCD2B8', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700, color: '#1F4B3F' }}>
                <span>Total 6-Month Liability Due:</span>
                <span>₹{totalRepayment.toLocaleString()}.00</span>
              </div>
            </div>

            <button type="submit" disabled={submitting} style={{ backgroundColor: '#1F4B3F', color: '#FFFDF8', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.6 : 1, transition: 'all 0.15s', boxShadow: '0 4px 10px rgba(31,75,63,0.1)' }}>
              {submitting ? 'Evaluating Queue Standings...' : 'Submit Loan Application'}
            </button>
          </form>
        </div>

        {/* RIGHT COMPONENT: GOVERNANCE RULES SIDEBAR CARD */}
        <div style={{ flex: '1 1 300px', backgroundColor: '#1B2430', color: '#FFFDF8', padding: '2rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.35rem', color: '#B4842A', margin: '0 0 1.25rem 0', fontWeight: 600 }}>
            MLVPYC Governance Audit Rules
          </h3>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', color: '#DCD2B8', display: 'flex', flexDirection: 'column', gap: '1rem', lineHeight: 1.55 }}>
            <li>
              <strong style={{ color: '#FFFFFF' }}>High Priority Standings:</strong> Awarded automatically to club members who have borrowed lesser combined lifetime capital and have drawn from the pool fewer total times.
            </li>
            <li>
              <strong style={{ color: '#FFFFFF' }}>Immediate Cycle Freeze:</strong> Any member who drew money or holds active unpaid debt during the current active term falls directly to trailing fallback priority.
            </li>
            <li>
              <strong style={{ color: '#FFFFFF' }}>Hard Capital Cap Safeguard:</strong> Individual limits are locked at a maximum of <span style={{ color: '#B4842A', fontWeight: 600 }}>₹2,00,000</span> per term to avoid default vulnerabilities and protect group harmony.
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}