import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, setLoggedOutState } from '../services/api';
import { router } from 'expo-router';

// Define types
interface User {
  id: string;
  username: string;
  fullname: string;
  email: string;
  role?: number;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isLoggedOut: boolean;
  register: (username: string, password: string, fullname: string, email: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  // Check for stored user on mount and logout status
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if we were logged out
        const logoutStatus = await AsyncStorage.getItem('isLoggedOut');
        const isLoggedOutState = logoutStatus === 'true';
        setIsLoggedOut(isLoggedOutState);
        
        // If not logged out, load user data
        if (!isLoggedOutState) {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            console.log('Loaded user from storage, token available:', !!userData.token);
            setUser(userData);
          }
        }
      } catch (e) {
        console.error('Failed to load user from storage', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register function
  const register = async (username: string, password: string, fullname: string, email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Reset logged out state when registering
      setIsLoggedOut(false);
      await setLoggedOutState(false);
      
      const response = await authService.register({ username, password, fullname, email });
      console.log('Registration successful:', response);
      
      // After successful registration, navigate to login
      router.replace('/login');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registration failed');
      console.error('Registration error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    setIsLoggedOut(false);
    
    try {
      // Reset logged out state when logging in
      await setLoggedOutState(false);
      
      const response = await authService.login({ username, password });
      console.log('Login response received, checking token...');
      
      if (!response || !response.token) {
        throw new Error("Không nhận được token từ server");
      }
      
      // Create user object from response
      const userData: User = {
        id: response._id || response.user?._id || '',
        username: response.username || response.user?.username || '',
        fullname: response.fullname || response.user?.fullname || '',
        email: response.email || response.user?.email || '',
        role: response.role || response.user?.role,
        token: response.token
      };
      
      console.log('Đăng nhập thành công với token:', userData.token?.substring(0, 15) + '...');
      
      // Save to state and storage
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('Đã lưu thông tin người dùng vào bộ nhớ');

      // Navigate based on role
      if (userData.role === 0) {
        // Regular user - go to tabs
        router.replace('/(tabs)/home');
      } else if (userData.role === 1 || userData.role === 2) {
        // Manager - go to manager section
        router.replace('/manager/ManagerDrawer');
      } else {
        // Invalid role - go back to login
        router.replace('/login');
      }
    } catch (e: any) {
      console.error('Login error details:', e.response?.data || e.message || e);
      alert(e.response?.data?.message || e.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Immediately set the logged out flag to prevent API calls
      setIsLoggedOut(true);
      await setLoggedOutState(true);
      
      setIsLoading(true);
      console.log('Đang đăng xuất...');
      
      // Kiểm tra token trước khi gọi API
      const userData = user || (await AsyncStorage.getItem('user')?.then(data => data ? JSON.parse(data) : null));
      
      if (userData?.token) {
        console.log('Đăng xuất với token:', userData.token.substring(0, 15) + '...');
        // Call server to invalidate token
        await authService.logout();
        console.log('Đã đăng xuất thành công trên server');
      } else {
        console.log('Không tìm thấy token, chỉ đăng xuất cục bộ');
      }
    } catch (e) {
      console.error('Lỗi khi đăng xuất:', e);
    } finally {
      // Always clear local state and storage, even if API call fails
      setUser(null);
      await AsyncStorage.removeItem('user');
      console.log('Đã xóa thông tin người dùng khỏi bộ nhớ cục bộ');
      setIsLoading(false);
      router.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, isLoggedOut, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
