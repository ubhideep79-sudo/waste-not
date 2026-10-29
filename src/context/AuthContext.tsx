import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User, UserRole } from "../types/index.ts";
import {
  api,
  getToken,
  getStoredUser,
  clearToken,
  onSessionExpired,
} from "../services/api.ts";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isManager: boolean;
  isStaff: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchRoleDemo: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const freshUser = await api.getCurrentUser();
      setUser(freshUser);
    } catch {
      setUser(null);
      clearToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Handle token expired events from API requests
    const unsubscribe = onSessionExpired(() => {
      setUser(null);
    });
    return unsubscribe;
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser } = await api.login(email, password);
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  // 1-Click Role Switcher for examiner evaluation & demo review
  const switchRoleDemo = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const creds = await api.getDemoCredentials();
      if (targetRole === "manager") {
        await login(creds.manager.email, creds.manager.password);
      } else {
        await login(creds.staff.email, creds.staff.password);
      }
    } catch (err: any) {
      console.error("Demo switch failed:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isManager: user?.role === "manager",
    isStaff: user?.role === "staff",
    isLoading,
    login,
    logout,
    refreshUser,
    switchRoleDemo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
