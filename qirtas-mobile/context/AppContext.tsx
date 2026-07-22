import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAppState } from '../api';
import { getCurrentUser, logoutUser as logoutApi, getAuthToken } from '../api/auth';

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
  user: any;
  token: string | null;
  refreshData: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      const currentToken = await getAuthToken();
      setUser(currentUser);
      setToken(currentToken);
    } catch (e) {
      console.error('Failed to load user', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAppState();
    if (data) {
      setState(data);
    }
    setLoading(false);
  };
  
  const logout = async () => {
    await logoutApi();
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    checkAuth().then(() => {
      loadData();
    });
  }, []);

  return (
    <AppContext.Provider value={{ state, loading, user, token, refreshData: loadData, logout, checkAuth }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
