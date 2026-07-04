import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/auth/me');
      setUser(res.data);
    } catch (error) {
      console.error(error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const formData = { username, password };
    const res = await axios.post('http://localhost:8000/api/auth/login', formData);
    setToken(res.data.access_token);
    localStorage.setItem('token', res.data.access_token);
  };

  const register = async (username, email, password) => {
    await axios.post('http://localhost:8000/api/auth/register', { username, email, password });
    await login(username, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
