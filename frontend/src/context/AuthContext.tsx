import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { apiRequest, ApiError } from '../services/api';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthResponse {
  success: boolean;
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  clearUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const response = await apiRequest<AuthResponse>('/auth/me');

      setUser(response.user);

      return response.user;
    } catch (error) {
      setUser(null);

      if (error instanceof ApiError && error.status === 401) {
        return null;
      }

      console.error('Unable to verify authentication:', error);

      return null;
    }
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkAuthentication = async () => {
      try {
        const response = await apiRequest<AuthResponse>('/auth/me');

        if (isMounted) {
          setUser(response.user);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);

          if (!(error instanceof ApiError && error.status === 401)) {
            console.error('Authentication check failed:', error);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuthentication();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        refreshUser,
        clearUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }

  return context;
}

/*
### Authentication Context

- Calls `/api/auth/me` when the application starts.
- Checks whether the user has a valid authentication cookie.
- Stores the authenticated user's information.
- Provides authentication status to other components.
- Provides `refreshUser()` to update authentication after login or registration.
- Provides `clearUser()` to clear frontend authentication state after logout.
*/