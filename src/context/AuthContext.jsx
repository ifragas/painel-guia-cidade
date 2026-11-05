import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLoggedIn = localStorage.getItem('admin_logged_in');
    const savedEmail = localStorage.getItem('admin_email');

    if (savedLoggedIn === 'true' && savedEmail) {
      setUser({ email: savedEmail });
    }
    setLoading(false);
  }, []);

  const login = (email, token) => {
    localStorage.setItem('admin_logged_in', 'true');
    localStorage.setItem('admin_email', email);
    if (token) {
      localStorage.setItem('admin_token', token);
    }
    setUser({ email });
  };

  const logout = () => {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}