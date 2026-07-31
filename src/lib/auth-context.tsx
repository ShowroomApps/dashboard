'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from './api';

interface AuthContextType {
  token: string | null;
  user: any | null;
  currentOrgId: string | null;
  organizations: any[];
  setAuth: (token: string, user: any, orgs: any[]) => void;
  setCurrentOrgId: (orgId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  currentOrgId: null,
  organizations: [],
  setAuth: () => {},
  setCurrentOrgId: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [currentOrgId, setCurrentOrgIdState] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedOrgId = localStorage.getItem('current_org_id');
    const savedUser = localStorage.getItem('current_user');
    const savedOrgs = localStorage.getItem('current_orgs');

    if (savedToken) {
      setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
      let orgs: any[] = [];
      if (savedOrgs) {
        try {
          orgs = JSON.parse(savedOrgs);
          setOrganizations(orgs);
        } catch (e) {}
      }

      let validOrgId: string | null = savedOrgId;
      if (!validOrgId || validOrgId === 'undefined' || validOrgId === 'null') {
        if (orgs.length > 0 && orgs[0]?.id) {
          validOrgId = orgs[0].id;
          if (validOrgId) {
            localStorage.setItem('current_org_id', validOrgId);
          }
        }
      }
      if (validOrgId && validOrgId !== 'undefined' && validOrgId !== 'null') {
        setCurrentOrgIdState(validOrgId);
      }
    } else if (pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, router]);

  const setAuth = (newToken: string, newUser: any, newOrgs: any[]) => {
    setToken(newToken);
    setUser(newUser);
    setOrganizations(newOrgs);

    localStorage.setItem('access_token', newToken);
    localStorage.setItem('current_user', JSON.stringify(newUser));
    localStorage.setItem('current_orgs', JSON.stringify(newOrgs));

    if (newOrgs.length > 0) {
      const defaultOrgId = newOrgs[0].id;
      setCurrentOrgIdState(defaultOrgId);
      localStorage.setItem('current_org_id', defaultOrgId);
    }
  };

  const setCurrentOrgId = (orgId: string) => {
    setCurrentOrgIdState(orgId);
    localStorage.setItem('current_org_id', orgId);
    window.location.reload();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCurrentOrgIdState(null);
    setOrganizations([]);
    localStorage.clear();
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        currentOrgId,
        organizations,
        setAuth,
        setCurrentOrgId,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
