import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to check if user is logged out
const isUserLoggedOut = async (): Promise<boolean> => {
  try {
    // Check if we have the logged out flag in AsyncStorage
    const logoutState = await AsyncStorage.getItem('isLoggedOut');
    return logoutState === 'true';
  } catch (error) {
    console.error('Error checking logged out state:', error);
    return false;
  }
};

// Set the logged out state in AsyncStorage
export const setLoggedOutState = async (isLoggedOut: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem('isLoggedOut', isLoggedOut ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting logged out state:', error);
  }
};

// Log requests for debugging
API.interceptors.request.use(
  async (config) => {
    try {
      // First check if user is logged out
      const loggedOut = await isUserLoggedOut();
      
      // If logged out and not a login/register request, cancel the request
      if (loggedOut) {
        const isAuthRequest = config.url?.includes('/login') || config.url?.includes('/register');
        if (!isAuthRequest) {
          console.log(`Request canceled because user is logged out: ${config.method?.toUpperCase()} ${config.url}`);
          // Cancel the request
          const customError: Error & { name: string } = new Error('Request canceled - user is logged out');
          customError.name = 'LoggedOutError';
          throw customError;
        }
      }
      
      // Get the token from AsyncStorage
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user && user.token) {
          // Set Authorization header properly with 'Bearer' prefix
          config.headers.Authorization = `Bearer ${user.token}`;
          console.log('Request with token:', `Bearer ${user.token.substring(0, 15)}...`);
        } else {
          console.log('No token available in user data');
        }
      } else {
        console.log('No user data found in AsyncStorage');
      }
      
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    } catch (error: any) {
      if (error.name === 'LoggedOutError') {
        return Promise.reject(error);
      }
      console.error('Error adding auth token to request:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Log responses for debugging
API.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error: any) => {
    // Don't log errors for cancelled requests due to logout
    if (error.name === 'LoggedOutError' || error.message?.includes('logged out')) {
      return Promise.reject(error);
    }
    
    if (error.response) {
      console.error(`API Error: ${error.response.status} from ${error.config?.url}`, 
        error.response.data);
      
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        console.log('Unauthorized access, token might be invalid or expired');
        // You could trigger logout here if needed
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (userData: {
    username: string;
    password: string;
    fullname: string;
    email: string;
  }) => {
    try {
      // Reset logged out state when registering
      await setLoggedOutState(false);
      const response = await API.post('/api/users/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  login: async (credentials: { username: string; password: string }) => {
    try {
      // Reset logged out state when logging in
      await setLoggedOutState(false);
      const response = await API.post('/api/users/login', credentials);
      // Store token immediately after successful login
      if (response.data && response.data.token) {
        console.log('Login successful, token received');
        // Create a user entry for AsyncStorage with the token
        const userData = {
          id: response.data._id || response.data.user?._id || '',
          username: response.data.username || response.data.user?.username || '',
          fullname: response.data.fullname || response.data.user?.fullname || '',
          email: response.data.email || response.data.user?.email || '',
          role: response.data.role || response.data.user?.role,
          token: response.data.token
        };
        
        // Store token for immediate use
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        console.log('User data with token stored in AsyncStorage');
      } else {
        console.warn('Login response did not contain a token');
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      // Set logged out state immediately
      await setLoggedOutState(true);
      
      // Make sure we have the latest token
      const userJson = await AsyncStorage.getItem('user');
      let token = null;
      
      if (userJson) {
        const user = JSON.parse(userJson);
        token = user.token;
      }
      
      if (!token) {
        console.warn('No token found for logout, proceeding with local logout only');
        return { success: true, message: 'Logged out locally' };
      }
      
      // Call the logout endpoint with token in Authorization header
      console.log('Attempting to logout with server...');
      const response = await API.post('/api/users/logout');
      console.log('Logout successful on server');
      return response.data;
    } catch (error: any) {
      if (error.name === 'LoggedOutError' || error.message?.includes('logged out')) {
        console.log('Logout process already in progress, skipping API call');
        return { success: true, message: 'Logged out locally' };
      }
      console.error('Logout error:', error);
      // Even if there's an error with the API call, we should still clear local storage
      return { success: false, message: 'Logged out locally only' };
    }
  },
};

export const bookService = {
  getBooks: async () => {
    try {
      const response = await API.get('/api/users/books');
      return response.data;
    } catch (error: any) {
      if (error.name === 'LoggedOutError' || error.message?.includes('logged out')) {
        console.log('Books request cancelled - user is logged out');
        return { data: [] }; // Return empty data instead of throwing error
      }
      console.error('Get books error:', error);
      throw error;
    }
  },
  
  getBookById: async (bookId: string) => {
    try {
      const response = await API.get(`/api/users/books/${bookId}`);
      return response.data;
    } catch (error: any) {
      if (error.name === 'LoggedOutError' || error.message?.includes('logged out')) {
        console.log(`Book ${bookId} request cancelled - user is logged out`);
        return { data: null }; // Return null data instead of throwing error
      }
      console.error(`Error fetching book ${bookId}:`, error);
      throw error;
    }
  },
  
  getBorrowedBooks: async (userId: string) => {
    try {
      const response = await API.get(`/api/users/${userId}/borrowed`);
      return response.data;
    } catch (error: any) {
      if (error.name === 'LoggedOutError' || error.message?.includes('logged out')) {
        console.log('Borrowed books request cancelled - user is logged out');
        return { data: [] }; // Return empty data instead of throwing error
      }
      console.error('Get borrowed books error:', error);
      throw error;
    }
  },
};

export default API;
