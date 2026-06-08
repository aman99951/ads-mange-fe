import { useState } from 'react';

export function getInitialUser() {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState(getInitialUser);

  const login = (u) => {
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, login, logout };
}
