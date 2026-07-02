import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useSession } from '../context/SessionContext';

export function AdminDashboard() {
  const { currentMember } = useSession();
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'loans' | 'users'>('loans');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDashboardData = async () => {
    try {
      // Fetch loans for the active term cycle (Term 1)
      const loansData = await api.loans.byTerm(1).catch(() => []);
      setPendingLoans(loansData.filter((l: any) => l.status === 'PENDING'));

      // Fetch all system members
      const membersData = await api.members.list().catch(() => []);
      setMembers(membersData);
    } catch (err) {
      setError('Failed to fetch administrative data grids.');
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleApprove = async (id: number) => {
    setError('');
    setSuccess('');
    try {
      const adminId = currentMember?.id || 1;
      await api.loans.approve(id, adminId);
      setSuccess(`Loan #${id} has been approved successfully!`);
      loadDashboardData(); // Refresh list grid
    } catch (err: any) {
      setError(err.message || 'Approval processing failure.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #DCD2B8', paddingBottom: '1rem' }}>
        <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#5B5646', fontWeight: 600, margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
          System Control Center
        </p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#1F4B3F', margin: 0 }}>
          Administrative Dashboard
        </h2>
      </div>

      {/* Notices */}
      {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#DC2626', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}
      {success && <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#16A34A', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>{success}</div>}

      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('loans')}
          style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: '1px solid #DCD2B8', cursor: 'pointer', backgroundColor: activeTab === 'loans' ? '#1F4B3F' : '#FFFDF8', color: activeTab === 'loans' ? '#FFFDF8' : '#1B2430', fontWeight: 600 }}
        >
          Pending Approvals ({pendingLoans.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: '1px solid #DCD2B8', cursor: 'pointer', backgroundColor: activeTab === 'users' ? '#1F4B3F' : '#FFFDF8', color: activeTab === 'users' ? '#FFFDF8' : '#1B2430', fontWeight: 600 }}
        >
          Manage Members ({members.length})
        </button>
      </div>

      {/* Tab Panel Content Views */}
      <div style={{ backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '12px', padding: '2rem' }}>
        {activeTab === 'loans' ? (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1F4B3F' }}>Active Funding Requests Waiting For Review</h3>
            {pendingLoans.length === 0 ? (
              <p style={{ color: '#5B5646', fontSize: '0.9rem' }}>No pending applications found in the active rotation queue.</p>
            ) : (
              pendingLoans.map((loan) => (
                <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #DCD2B8', borderRadius: '8px', marginBottom: '1rem', backgroundColor: '#FFFDF2' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#1B2430' }}>{loan.memberName}</span>
                    <span style={{ margin: '0 8px', color: '#5B5646' }}>|</span>
                    <span style={{ color: '#B4842A', fontWeight: 600 }}>₹{loan.amount.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => handleApprove(loan.id)}
                    style={{ backgroundColor: '#1F4B3F', color: '#FFFDF8', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Approve Allocation
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1F4B3F' }}>Registered Group Members</h3>
            {members.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #DCD2B8', fontSize: '0.95rem' }}>
                <span style={{ color: '#1B2430', fontWeight: 500 }}>{m.name}</span>
                <span style={{ color: '#5B5646', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>{m.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}