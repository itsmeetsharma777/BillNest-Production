import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

type UserRole = "shopkeeper" | "customer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const result = await response.json();

      setUser(result?.data?.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (isMounted) {
            setUser(null);
          }

          return;
        }

        const result = await response.json();

        if (isMounted) {
          setUser(result?.data?.user ?? null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * Automatically invalidate the server session when
   * the BillNest page is unloaded.
   *
   * This handles:
   * - closing the browser window
   * - closing the browser
   * - closing the BillNest tab
   * - refreshing the page
   * - navigating away from BillNest
   *
   * Normal React Router navigation inside BillNest does
   * NOT unload the page, so it does not log the user out.
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    let logoutSent = false;

    const handlePageHide = () => {
      if (logoutSent) {
        return;
      }

      logoutSent = true;

      void fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
      }).catch(() => {
        /*
         * The browser may terminate the request during shutdown.
         * The server session will expire normally if this happens.
         */
      });
    };

    window.addEventListener(
      "pagehide",
      handlePageHide,
    );

    return () => {
      window.removeEventListener(
        "pagehide",
        handlePageHide,
      );
    };
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      refreshUser,
      logout,
    }),
    [
      user,
      isLoading,
      refreshUser,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider.",
    );
  }

  return context;
}