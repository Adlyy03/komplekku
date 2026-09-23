import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ComplexSettings, UserRole, UserRoleRecord } from '@/types/database';
import { getComplexSettings } from '@/services/complex';
import { getMyHousehold, type MyHouseholdInfo } from '@/services/residents';
import { getHighestRole, getUserRoles } from '@/services/roles';
import { useSupabase } from './supabase-provider';

interface ComplexContextType {
  complexSettings: ComplexSettings;
  household: MyHouseholdInfo | null;
  roles: UserRoleRecord[];
  activeRole: UserRole;
  isDeveloper: boolean;
  isRw: boolean;
  isRt: boolean;
  isWarga: boolean;
  loading: boolean;
  setActiveRole: (role: UserRole) => void;
  refreshComplex: () => Promise<void>;
  // Backward-compatibility properties for existing components:
  activeCommunity: { id: string; name: string; address?: string | null } | null;
  isMember: (id?: string) => boolean;
  setActiveCommunity?: (c: any) => Promise<void>;
  memberships?: any[];
}

const DEFAULT_SETTINGS: ComplexSettings = {
  id: 1,
  name: 'Komplekku Perumahan',
  logo_path: null,
  address: 'Jl. Utama Komplek',
  phone: null,
  email: null,
  timezone: 'Asia/Jakarta',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const ComplexContext = createContext<ComplexContextType | undefined>(undefined);

export function ComplexProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabase();

  const [complexSettings, setComplexSettings] = useState<ComplexSettings>(DEFAULT_SETTINGS);
  const [household, setHousehold] = useState<MyHouseholdInfo | null>(null);
  const [roles, setRoles] = useState<UserRoleRecord[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole>('warga');
  const [loading, setLoading] = useState(true);

  const refreshComplex = useCallback(async () => {
    try {
      // 1. Fetch complex settings
      const { data: settings } = await getComplexSettings();
      if (settings) {
        setComplexSettings(settings);
      }

      // 2. If user logged in, fetch household & roles
      if (user?.id) {
        const [householdRes, rolesRes] = await Promise.all([
          getMyHousehold(user.id),
          getUserRoles(user.id),
        ]);

        if (householdRes.data) {
          setHousehold(householdRes.data);
        }
        if (rolesRes.data) {
          setRoles(rolesRes.data);
          const highest = getHighestRole(rolesRes.data);
          setActiveRole(highest);
        }
      } else {
        setHousehold(null);
        setRoles([]);
        setActiveRole('warga');
      }
    } catch {
      // Fallback cleanly
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void refreshComplex();
    });
  }, [refreshComplex]);

  const isDeveloper = activeRole === 'developer' || roles.some((r) => r.role === 'developer');
  const isRw = activeRole === 'rw' || roles.some((r) => r.role === 'rw');
  const isRt = activeRole === 'rt' || roles.some((r) => r.role === 'rt');
  const isWarga = true;

  const activeCommunity = {
    id: 'single-complex',
    name: complexSettings.name,
    address: complexSettings.address,
  };

  return (
    <ComplexContext.Provider
      value={{
        complexSettings,
        household,
        roles,
        activeRole,
        isDeveloper,
        isRw,
        isRt,
        isWarga,
        loading,
        setActiveRole,
        refreshComplex,
        activeCommunity,
        isMember: () => true,
        setActiveCommunity: async () => {},
        memberships: [{ community: activeCommunity, role: activeRole }],
      }}
    >
      {children}
    </ComplexContext.Provider>
  );
}

export function useComplex() {
  const context = useContext(ComplexContext);
  if (!context) {
    throw new Error('useComplex must be used within a ComplexProvider');
  }
  return context;
}

// Backward-compatibility alias
export const useCommunity = useComplex;
export const CommunityProvider = ComplexProvider;
