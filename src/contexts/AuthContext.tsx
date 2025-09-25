import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../lib/types';
import { authAPI } from '../lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<any>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  verifyEmail: (token: string) => Promise<any>;
  resendEmailVerification: (email?: string, userId?: string) => Promise<any>;
  requestPhoneVerification: (phoneNumber: string) => Promise<any>;
  verifyPhone: (code: string, phoneNumber?: string) => Promise<any>;
  isUnverified: boolean;
  verificationStatus: {
    email_verified: boolean;
    phone_verified: boolean;
    fully_verified: boolean;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Enhanced token management utilities
const TokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token');
  },
  
  getTemporaryToken: (): string | null => {
    return localStorage.getItem('temporary_token');
  },
  
  setTokens: (accessToken: string, refreshToken?: string, temporaryToken?: string): void => {
    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('auth_token', accessToken); // Keep both for compatibility
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    if (temporaryToken) {
      localStorage.setItem('temporary_token', temporaryToken);
    }
  },
  
  clearTokens: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('temporary_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('verification_status');
    localStorage.removeItem('pending_login');
    localStorage.removeItem('registration_data');
  },
  
  isTokenExpired: (token: string): boolean => {
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return tokenData.exp < (currentTime + 30); // Add 30 second buffer
    } catch {
      return true;
    }
  },
  
  getTokenExpiration: (token: string): number | null => {
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      return tokenData.exp;
    } catch {
      return null;
    }
  }
};

// Helper function to check verification status
const checkVerificationStatus = (userData: any): boolean => {
  return userData?.email_verified === true;
};

// Enhanced error handling for auth operations
const handleAuthError = (error: any, operation: string): string => {
  console.error(`${operation} error:`, error);
  
  if (error.response?.data) {
    const backendErrors = error.response.data;
    
    // Handle Django validation errors
    if (typeof backendErrors === 'object') {
      // Handle success: false responses with errors
      if (backendErrors.success === false) {
        if (backendErrors.message) {
          return backendErrors.message;
        }
        if (backendErrors.errors) {
          // Handle field-specific errors
          const errorMessages: string[] = [];
          Object.keys(backendErrors.errors).forEach(field => {
            const fieldErrors = backendErrors.errors[field];
            if (Array.isArray(fieldErrors)) {
              errorMessages.push(...fieldErrors);
            } else if (typeof fieldErrors === 'string') {
              errorMessages.push(fieldErrors);
            }
          });
          if (errorMessages.length > 0) {
            return errorMessages.join(', ');
          }
        }
      }
      
      // Check for specific field errors (old format)
      if (backendErrors.email && Array.isArray(backendErrors.email)) {
        if (backendErrors.email[0].includes('already exists')) {
          return 'This email address is already registered.';
        }
      }
      
      if (backendErrors.phone_number && Array.isArray(backendErrors.phone_number)) {
        if (backendErrors.phone_number[0].includes('already exists')) {
          return 'This phone number is already registered.';
        }
      }
      
      if (backendErrors.password && Array.isArray(backendErrors.password)) {
        return `Password error: ${backendErrors.password[0]}`;
      }
      
      // Handle non-field errors
      if (backendErrors.detail) {
        return backendErrors.detail;
      }
      
      if (backendErrors.error) {
        return backendErrors.error;
      }
      
      // Compile all error messages (fallback)
      const errorMessages: string[] = [];
      Object.keys(backendErrors).forEach(field => {
        if (Array.isArray(backendErrors[field])) {
          errorMessages.push(`${field}: ${backendErrors[field][0]}`);
        } else if (typeof backendErrors[field] === 'string') {
          errorMessages.push(backendErrors[field]);
        }
      });
      
      if (errorMessages.length > 0) {
        return errorMessages.join(', ');
      }
    }
    
    if (typeof backendErrors === 'string') {
      return backendErrors;
    }
  }
  
  // Handle HTTP status codes
  if (error.response?.status === 400) {
    return operation === 'login' ? 'Invalid email or password' : 'Invalid data provided';
  } else if (error.response?.status === 401) {
    return 'Authentication failed. Please login again.';
  } else if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  } else if (error.response?.status === 404) {
    return 'Service not available. Please try again later.';
  } else if (error.response?.status === 429) {
    return 'Too many attempts. Please wait before trying again.';
  } else if (error.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    return 'Network error. Please check your internet connection.';
  }
  
  if (error.message) {
    return error.message;
  }
  
  return `${operation} failed. Please try again.`;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    email_verified: false,
    phone_verified: false,
    fully_verified: false
  });

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async (): Promise<void> => {
    try {
      console.log('Initializing authentication...');
      const accessToken = TokenManager.getAccessToken();
      const refreshToken = TokenManager.getRefreshToken();
      const temporaryToken = TokenManager.getTemporaryToken();
      
      if (!accessToken && !temporaryToken && !refreshToken) {
        console.log('No tokens found, user not authenticated');
        setIsLoading(false);
        setInitializationComplete(true);
        return;
      }
      
      // If we have a temporary token but no access token, user needs verification
      if (temporaryToken && !accessToken) {
        console.log('Found temporary token, user needs verification');
        const cachedUser = localStorage.getItem('user_data');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            updateVerificationStatus(parsedUser);
            
            // Set isUnverified state
            setVerificationStatus({
              email_verified: parsedUser.email_verified || false,
              phone_verified: parsedUser.phone_verified || false,
              fully_verified: (parsedUser.email_verified || false) && (parsedUser.phone_verified || false)
            });
          } catch (parseError) {
            console.error('Failed to parse cached user data:', parseError);
            TokenManager.clearTokens();
          }
        }
        setIsLoading(false);
        setInitializationComplete(true);
        return;
      }
      
      // Check if access token is expired
      if (accessToken && TokenManager.isTokenExpired(accessToken)) {
        console.log('Access token expired, attempting refresh...');
        try {
          await refreshAuth();
        } catch (error) {
          console.error('Token refresh failed during initialization:', error);
          TokenManager.clearTokens();
        }
      } else if (accessToken) {
        console.log('Access token valid, loading user profile...');
        await loadUserProfile();
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      TokenManager.clearTokens();
    } finally {
      setIsLoading(false);
      setInitializationComplete(true);
    }
  };

  const updateVerificationStatus = (userData: any) => {
    const status = {
      email_verified: userData.email_verified || false,
      phone_verified: userData.phone_verified || false,
      fully_verified: (userData.email_verified || false) && (userData.phone_verified || false)
    };
    setVerificationStatus(status);
    localStorage.setItem('verification_status', JSON.stringify(status));
  };

  const loadUserProfile = async (): Promise<void> => {
    try {
      console.log('Loading user profile...');
      const userData = await authAPI.getProfile();
      console.log('User profile loaded:', userData);
      setUser(userData);
      updateVerificationStatus(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to load user profile:', error);
      
      // Fallback to cached user data if available
      const cachedUser = localStorage.getItem('user_data');
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          console.log('Using cached user data:', parsedUser);
          setUser(parsedUser);
          updateVerificationStatus(parsedUser);
        } catch (parseError) {
          console.error('Failed to parse cached user data:', parseError);
          TokenManager.clearTokens();
        }
      } else {
        console.log('No cached user data, clearing tokens');
        TokenManager.clearTokens();
        throw error;
      }
    }
  };

  const refreshAuth = async (): Promise<void> => {
    if (isRefreshing) {
      console.log('Refresh already in progress, skipping...');
      return;
    }
    
    try {
      setIsRefreshing(true);
      console.log('Starting token refresh...');
      const refreshToken = TokenManager.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await authAPI.refreshToken();
      
      if (response.access) {
        console.log('Token refreshed successfully');
        TokenManager.setTokens(response.access, response.refresh);
        await loadUserProfile();
      } else {
        throw new Error('Invalid token refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<any> => {
    try {
      console.log('Starting login process...');
      setIsLoading(true);
      const response: any = await authAPI.login(credentials);
      
      console.log('Login response:', response);

      // Handle successful login with full tokens
      if (response.success && (response.access_token || response.access)) {
        const accessToken = response.access_token || response.access;
        const refreshToken = response.refresh_token || response.refresh;
        
        console.log('Login successful, storing tokens...');
        TokenManager.setTokens(accessToken, refreshToken);
        
        if (response.user) {
          console.log('Setting user from login response:', response.user);
          setUser(response.user);
          updateVerificationStatus(response.user);
          localStorage.setItem('user_data', JSON.stringify(response.user));
        } else {
          await loadUserProfile();
        }
        
        // Clear any pending login data
        localStorage.removeItem('pending_login');
        
        toast.success('Welcome back!', {
          description: `Good to see you again, ${response.user?.first_name || 'there'}!`
        });
        
        return response;
      } 
      // Handle unverified user case
      else if (response.requires_verification) {
        console.log('Login requires verification:', response);
        
        // Store temporary token if provided
        if (response.temporary_token) {
          TokenManager.setTokens('', '', response.temporary_token);
        }
        
        // Store pending login for later use
        localStorage.setItem('pending_login', JSON.stringify({
          email: credentials.email,
          user_id: response.user_id,
          verification_type: response.verification_type,
          next_step: response.next_step
        }));
        
        // Create minimal user object if not provided
        if (response.user_id && response.email) {
          const minimalUser = {
            id: response.user_id,
            email: response.email,
            email_verified: false,
            phone_verified: false,
            ...response.user
          };
          setUser(minimalUser);
          updateVerificationStatus(minimalUser);
          localStorage.setItem('user_data', JSON.stringify(minimalUser));
        }
        
        return response;
      } 
      else {
        throw new Error(response.message || 'Login failed - no tokens received');
      }
    } catch (error: any) {
      const errorMessage = handleAuthError(error, 'Login');
      toast.error('Login Failed', {
        description: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<any> => {
    try {
      console.log('Starting registration process...');
      setIsLoading(true);
      const response: any = await authAPI.register(data);
      
      console.log('Registration response:', response);

      if (response.success) {
        // Store registration data for potential re-use
        localStorage.setItem('registration_data', JSON.stringify({
          user_id: response.user_id,
          email: response.email || data.email,
          requires_verification: response.requires_verification
        }));

        // If tokens provided (immediate login)
        if (response.access_token || response.access) {
          const accessToken = response.access_token || response.access;
          const refreshToken = response.refresh_token || response.refresh;
          
          TokenManager.setTokens(accessToken, refreshToken);
          
          if (response.user) {
            setUser(response.user);
            updateVerificationStatus(response.user);
            localStorage.setItem('user_data', JSON.stringify(response.user));
          }
          
          toast.success('Account Created!', {
            description: `Welcome to BizMap Rwanda, ${data.first_name}!`
          });
        } 
        // Registration successful but needs verification
        else {
          const minimalUser = {
            id: response.user_id || `temp_${Date.now()}`,
            email: response.email || data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            user_type: data.user_type,
            preferred_language: data.preferred_language || 'en',
            phone_number: data.phone_number,
            email_verified: false,
            phone_verified: false,
            date_joined: new Date().toISOString()
          };
          
          setUser(minimalUser);
          updateVerificationStatus(minimalUser);
          localStorage.setItem('user_data', JSON.stringify(minimalUser));
          
          toast.success('Registration Successful!', {
            description: response.message || 'Please check your email for verification instructions.'
          });
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = handleAuthError(error, 'Registration');
      toast.error('Registration Failed', {
        description: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token: string): Promise<any> => {
    try {
      setIsLoading(true);
      const response = await authAPI.verifyEmail(token);
      
      if (response.success) {
        // Update tokens with full access
        if (response.access_token && response.refresh_token) {
          TokenManager.setTokens(response.access_token, response.refresh_token);
        }
        
        if (response.user) {
          setUser(response.user);
          updateVerificationStatus(response.user);
          localStorage.setItem('user_data', JSON.stringify(response.user));
        }
        
        // Clear temporary tokens and pending login
        localStorage.removeItem('temporary_token');
        localStorage.removeItem('pending_login');
        localStorage.removeItem('registration_data');
        
        toast.success('Email Verified!', {
          description: 'Your email has been verified successfully. Welcome to BizMap Rwanda!'
        });
        
        return response;
      } else {
        throw new Error(response.message || 'Email verification failed');
      }
    } catch (error: any) {
      const errorMessage = handleAuthError(error, 'Email verification');
      toast.error('Verification Failed', {
        description: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmailVerification = async (email?: string, userId?: string): Promise<any> => {
    try {
      const response = await authAPI.resendEmailVerification(email, userId);
      
      if (response.success) {
        toast.success('Verification Email Sent!', {
          description: 'Please check your email for verification instructions.'
        });
        return response;
      } else {
        throw new Error(response.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      const errorMessage = handleAuthError(error, 'Resend email verification');
      toast.error('Failed to Send Email', {
        description: errorMessage
      });
      throw new Error(errorMessage);
    }
  };

  const requestPhoneVerification = async (phoneNumber: string): Promise<any> => {
    try {
      const response = await authAPI.requestPhoneVerification(phoneNumber);
      
      toast.success('Verification Code Sent!', {
        description: 'Please check your phone for the verification code.'
      });
      
      return response;
    } catch (error: any) {
      const errorMessage = handleAuthError(error, 'Phone verification request');
      toast.error('Failed to Send Code', {
        description: errorMessage
      });
      throw new Error(errorMessage);
    }
  };

  const verifyPhone = async (code: string, phoneNumber?: string): Promise<any> => {
    try {
      const response = await authAPI.verifyPhone(code, phoneNumber);
      
      if (response.success) {
        // Update user data
        if (response.user) {
          setUser(response.user);
          updateVerificationStatus(response.user);
          localStorage.setItem('user_data', JSON.stringify(response.user));
        } else if (user) {
          const updatedUser = { ...user, phone_verified: true };
          setUser(updatedUser);
          updateVerificationStatus(updatedUser);
          localStorage.setItem('user_data', JSON.stringify(updatedUser));
        }
        
        toast.success('Phone Verified!', {
          description: 'Your phone number has been verified successfully.'
        });
        
        return response;
      } else {
        throw new Error(response.message || 'Phone verification failed');
      }
    } catch (error: any) {
      const errorMessage = handleAuthError(error, 'Phone verification');
      toast.error('Verification Failed', {
        description: errorMessage
      });
      throw new Error(errorMessage);
    }
  };

  const logout = (): void => {
    console.log('Logging out user...');
    
    // Call logout API if available
    try {
      authAPI.logout().catch(console.error);
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    // Clear all state
    TokenManager.clearTokens();
    setUser(null);
    setVerificationStatus({
      email_verified: false,
      phone_verified: false,
      fully_verified: false
    });
    
    toast.success('Logged out successfully', {
      description: 'Hope to see you again soon!'
    });
  };

  const updateUser = (updatedUser: User): void => {
    console.log('Updating user data:', updatedUser);
    setUser(updatedUser);
    updateVerificationStatus(updatedUser);
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
  };

  const refreshUser = async (): Promise<void> => {
    try {
      console.log('Refreshing user data...');
      await loadUserProfile();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Don't logout on refresh failure, just log the error
    }
  };

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!initializationComplete || !user) return;

    const checkTokenExpiration = () => {
      const accessToken = TokenManager.getAccessToken();
      if (accessToken && user) {
        const expiration = TokenManager.getTokenExpiration(accessToken);
        if (expiration) {
          const currentTime = Date.now() / 1000;
          const timeUntilExpiration = expiration - currentTime;
          
          // Refresh token if it expires in less than 5 minutes
          if (timeUntilExpiration < 300 && timeUntilExpiration > 0) {
            console.log('Token expiring soon, refreshing...');
            refreshAuth().catch(console.error);
          }
        }
      }
    };

    // Check immediately and then every minute
    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 60000);
    
    return () => clearInterval(interval);
  }, [user, initializationComplete]);

  const isUnverified = user !== null && (!verificationStatus.email_verified || !verificationStatus.phone_verified);

  const value: AuthContextType = {
    user,
    isLoading: isLoading || isRefreshing,
    // FIX: Only consider authenticated if we have access token AND email is verified
    isAuthenticated: !!user && !!TokenManager.getAccessToken() && verificationStatus.email_verified,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    refreshAuth,
    verifyEmail,
    resendEmailVerification,
    requestPhoneVerification,
    verifyPhone,
    isUnverified,
    verificationStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Enhanced role checking hook
export const useRole = () => {
  const { user } = useAuth();
  
  return {
    isCustomer: user?.user_type === 'customer',
    isBusinessOwner: user?.user_type === 'business_owner',
    isAdmin: user?.user_type === 'admin',
    canManageBusinesses: user?.user_type === 'business_owner' || user?.user_type === 'admin',
    userType: user?.user_type,
    hasPermission: (permission: string): boolean => {
      switch (permission) {
        case 'manage_businesses':
          return user?.user_type === 'business_owner' || user?.user_type === 'admin';
        case 'view_admin_panel':
          return user?.user_type === 'admin';
        case 'create_business':
          return user?.user_type === 'business_owner';
        default:
          return false;
      }
    }
  };
};

// Hook to check authentication status with loading state
export const useAuthStatus = () => {
  const { isAuthenticated, isLoading, isUnverified } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    isUnverified,
    isReady: !isLoading // True when auth state is fully determined
  };
};