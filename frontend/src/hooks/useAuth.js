import { create } from 'zustand'

export const useAuth = create((set) => ({
  user: null, // { name: 'Alice', email: 'alice@example.com', role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' }
  token: localStorage.getItem('token') || null,
  
  login: (userData, token) => {
    localStorage.setItem('token', token);
    set({ user: userData, token });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  
  // For hydrate on load
  setUser: (user) => set({ user }),
}))
