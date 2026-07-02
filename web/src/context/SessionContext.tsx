import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Member } from '../types';

interface SessionContextValue {
  members: Member[];
  currentMember: Member | null;
  loading: boolean;
  login: (phone: string, email: string) => Promise<void>; // Expanded for real auth later
  logout: () => void;
  refreshMembers: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(() => {
    const stored = localStorage.getItem('mlvpyc.auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshMembers = async () => {
    // Only fetch members if a user is logged in (Production requirement)
    if (!currentMember) {
      setLoading(false);
      return;
    }

    try {
      const list = await api.members.list();
      setMembers(list);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Run on startup or when the user logs in
  useEffect(() => {
    refreshMembers();
  }, [currentMember]);

  // Handle production-ready login action
  const login = async (phone: string, email: string) => {
    setLoading(true);
    try {
      // For now, we find the matching member.
      // Next step, this will point to your backend endpoint: api.auth.login({ phone, email })
      const list = await api.members.list();
      const matchedUser = list.find(m => m.phone === phone); // Basic check for now

      if (!matchedUser) {
        throw new Error('User not found. Please register or check details.');
      }

      setCurrentMember(matchedUser);
      localStorage.setItem('mlvpyc.auth_user', JSON.stringify(matchedUser));
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const logout = () => {
    setCurrentMember(null);
    setMembers([]);
    localStorage.removeItem('mlvpyc.auth_user');
  };

  return (
    <SessionContext.Provider value={{ members, currentMember, login, logout, refreshMembers, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}