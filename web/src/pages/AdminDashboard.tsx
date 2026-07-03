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
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);

  const loadDashboardData = async () => {
    try {
      const loansData = await api.loans.byTerm(1).catch(() => []);
      setPendingLoans(loansData.filter((l: any) => l.status === 'PENDING'));

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
      loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Approval processing failure.');
    }
  };

  // Handle dynamic switching between ADMIN and MEMBER roles
  const handleToggleRole = async (memberId: any, name: string, currentRole: string) => {
    setError('');
    setSuccess('');

    const isDemoting = currentRole.toUpperCase() === 'ADMIN';
    const isSelf = memberId === currentMember?.id;

    // SAFETY CHECK: Ensure the system isn't left with zero active administrators
    if (isDemoting) {
      const totalActiveAdmins = members.filter(m => {
        const role = (m.role || '').toString().trim().toUpperCase();
        const status = (m.status || '').toString().trim().toUpperCase();
        return role === 'ADMIN' && status !== 'INACTIVE';
      }).length;

      if (totalActiveAdmins <= 1) {
        setError("Security Guardrail: Cannot demote this user. The system requires at least one active administrator.");
        return;
      }
    }

    const targetRole = isDemoting ? 'MEMBER' : 'ADMIN';
    setActionLoading(`role-${memberId}`);

    try {
      if (api.members && typeof (api.members as any).update === 'function') {
        await (api.members as any).update(memberId, { role: targetRole });
        setSuccess(`Role for "${name}" was updated to ${targetRole} successfully!`);

        // SESSION STATE ENHANCEMENT: Matches your exact requirement
        if (isSelf && targetRole === 'MEMBER') {
          alert("Notice: You have demoted your account to MEMBER. Your current administrative permissions remain active inside this tab window until you sign out or reload the browser application.");
        }

        await loadDashboardData();
      } else {
        throw new Error("Member update endpoint 'api.members.update' is not defined.");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to modify user access role.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handles BOTH Deactivation (Soft Delete) and Re-activation
  const handleToggleStatus = async (memberId: any, name: string, currentStatus: string) => {
    setError('');
    setSuccess('');

    const isCurrentlyInactive = currentStatus?.toUpperCase() === 'INACTIVE';
    const confirmMessage = isCurrentlyInactive
      ? `Are you sure you want to re-activate member "${name}"?`
      : `Are you absolutely sure you want to deactivate member "${name}"? Historical logs will be preserved.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActionLoading(`status-${memberId}`);

    try {
      if (isCurrentlyInactive) {
        await (api.members as any).update(memberId, { status: 'ACTIVE' });
        setSuccess(`Member "${name}" was successfully re-activated!`);
      } else {
        if (api.members && typeof (api.members as any).delete === 'function') {
          await (api.members as any).delete(memberId);
        } else {
          await (api.members as any).remove(memberId);
        }
        setSuccess(`Member "${name}" was successfully deactivated.`);
      }
      await loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle member visibility configuration.');
    } finally {
      setActionLoading(null);
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
            {/* Divider header pane element structured explicitly to fit database column scales */}
            <div style={{ borderBottom: '1px solid #DCD2B8', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1F4B3F', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
                Registered Group Members
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {members.map((m) => {
                const isSelf = m.id === currentMember?.id;

                const normalizedRole = (m.role || '').toString().trim().toUpperCase();
                const normalizedStatus = (m.status || '').toString().trim().toUpperCase();

                const isAdminUser = normalizedRole === 'ADMIN';
                const isActiveUser = normalizedStatus !== 'INACTIVE';

                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      borderBottom: '1px solid #DCD2B8',
                      fontSize: '0.95rem',
                      backgroundColor: isSelf ? 'rgba(180, 132, 42, 0.03)' : !isActiveUser ? '#F3F4F6' : 'transparent',
                      opacity: !isActiveUser ? 0.7 : 1,
                      borderRadius: '6px'
                    }}
                  >
                    <div>
                      <span style={{
                        color: !isActiveUser ? '#9CA3AF' : '#1B2430',
                        fontWeight: 600,
                        textDecoration: !isActiveUser ? 'line-through' : 'none'
                      }}>
                        {m.name}
                      </span>
                      {isSelf && (
                        <span style={{ marginLeft: '6px', fontSize: '0.75rem', backgroundColor: '#E0E7FF', color: '#4F46E5', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                          YOU
                        </span>
                      )}
                      {!isActiveUser && (
                        <span style={{ marginLeft: '6px', fontSize: '0.75rem', backgroundColor: '#F3F4F6', color: '#6B7280', border: '1px solid #D1D5DB', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                          INACTIVE
                        </span>
                      )}
                    </div>

                    {/* Operational Panel Actions Block */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <span style={{
                        color: !isActiveUser ? '#9CA3AF' : isAdminUser ? '#B4842A' : '#5B5646',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: '0.03em'
                      }}>
                        {m.role || 'MEMBER'}
                      </span>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {/* Switch Role Button Module */}
                        <button
                          type="button"
                          disabled={!isActiveUser || actionLoading !== null}
                          onClick={() => handleToggleRole(m.id, m.name, m.role || 'MEMBER')}
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid #DCD2B8',
                            cursor: !isActiveUser ? 'not-allowed' : 'pointer',
                            backgroundColor: '#FFFDF8',
                            color: '#1F4B3F',
                            opacity: !isActiveUser ? 0.45 : 1,
                            outline: 'none'
                          }}
                        >
                          {actionLoading === `role-${m.id}` ? 'Updating...' : `Make ${isAdminUser ? 'Member' : 'Admin'}`}
                        </button>

                        {/* Interactive Status Toggle Action Module (Completely transparent if user is an active Admin) */}
                        {!(isActiveUser && isAdminUser) && (
                          <button
                            type="button"
                            disabled={actionLoading !== null}
                            onClick={() => handleToggleStatus(m.id, m.name, m.status || 'ACTIVE')}
                            style={{
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: isActiveUser
                                ? '1px solid rgba(220, 38, 38, 0.2)'
                                : '1px solid rgba(22, 163, 74, 0.3)',
                              cursor: 'pointer',
                              backgroundColor: isActiveUser
                                ? 'rgba(220, 38, 38, 0.02)'
                                : 'rgba(22, 163, 74, 0.04)',
                              color: isActiveUser ? '#DC2626' : '#16A34A',
                              outline: 'none'
                            }}
                          >
                            {actionLoading === `status-${m.id}`
                              ? 'Processing...'
                              : !isActiveUser
                                ? 'Activate'
                                : 'Deactivate'}
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}