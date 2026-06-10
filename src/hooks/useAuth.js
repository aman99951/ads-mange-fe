import { useState } from 'react';

export function getInitialUser() {
  try {
    const stored = sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState(getInitialUser);

  const login = (u) => {
    sessionStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    sessionStorage.removeItem('access');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  return { user, login, logout };
}
