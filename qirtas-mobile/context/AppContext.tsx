import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAppState } from '../api';

interface AppState {
  schoolName: string;
  schoolLogo: string;
  students: any[];
  teachers: any[];
  classRooms: Record<string, string[]>;
  timetables: Record<string, any[]>;
  announcements: any[];
}

interface AppContextType {
  state: AppState | null;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAppState();
    if (data) {
      setState(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppContext.Provider value={{ state, loading, refreshData: loadData }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
