import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Member } from '../types';

interface SessionContextValue {
  members: Member[];
  currentMember: Member | null;
  loading: boolean;
  login: (identifier: string, isEmail: boolean, passwordInput: string) => Promise<void>;
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

  useEffect(() => {
    refreshMembers();
  }, [currentMember]);

  // Handle production-ready login action routed via backend verification paths
  const login = async (identifier: string, isEmail: boolean, passwordInput: string) => {
    setLoading(true);
    try {
      // Evict existing credentials from the client memory state to guarantee fresh assignments
      localStorage.removeItem('mlvpyc.auth_user');

      // Hand off identity lookup attributes straight to Spring Security's PasswordEncoder matches loop
      const authenticatedUser = await api.members.login({
        identifier: identifier.trim(),
        password: passwordInput
      });

      setCurrentMember(authenticatedUser);
      localStorage.setItem('mlvpyc.auth_user', JSON.stringify(authenticatedUser));
    } catch (err: any) {
      // Bubble up the explicit backend rejection messages (e.g., 401 Incorrect Password) directly to UI panels
      throw new Error(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

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