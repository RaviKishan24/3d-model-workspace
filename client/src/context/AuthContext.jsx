import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { setUnauthorizedHandler, toFriendlyError } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Session is restored from the HTTP-only cookie, so start in a loading state.
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    authService
      .me({ signal: controller.signal })
      .then((current) => setUser(current))
      .catch(() => setUser(null))
      .finally(() => setInitializing(false));

    return () => controller.abort();
  }, []);

  // Any 401 from a protected call clears local state immediately.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const current = await authService.login(credentials);
      setUser(current);
      return { ok: true, user: current };
    } catch (err) {
      return { ok: false, ...toFriendlyError(err) };
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      const current = await authService.register(payload);
      setUser(current);
      return { ok: true, user: current };
    } catch (err) {
      return { ok: false, ...toFriendlyError(err) };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // The cookie is cleared server-side; ignore transport failures here.
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, isAuthenticated: Boolean(user), login, register, logout }),
    [user, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
