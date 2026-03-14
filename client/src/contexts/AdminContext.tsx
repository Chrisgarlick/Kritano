/**
 * AdminContext stub — full implementation in Phase 9
 */
import { createContext, useContext, type ReactNode } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType>({ isAdmin: false, isLoading: false });

export function AdminProvider({ children }: { children: ReactNode }) {
  return (
    <AdminContext.Provider value={{ isAdmin: false, isLoading: false }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  return useContext(AdminContext);
}
