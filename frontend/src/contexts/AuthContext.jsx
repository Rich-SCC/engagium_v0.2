import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '@/services/api';
import { getToken, getRefreshToken, setTokens, removeTokens, isTokenValid } from '@/utils/auth';

const AUTH_BOOTSTRAP_TIMEOUT_MS = 5000;

const unwrapAuthResponse = (response) => response?.data ?? response;

const extractAuthPayload = (response) => unwrapAuthResponse(response)?.data ?? unwrapAuthResponse(response);

const withTimeout = (promise, timeoutMs, timeoutMessage) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  });
};

// Auth context
const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };

    case 'LOGOUT':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      };

    case 'REGISTER_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'REGISTER_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };

    case 'REGISTER_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };

    case 'UPDATE_PROFILE_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'UPDATE_PROFILE_SUCCESS':
      return {
        ...state,
        isLoading: false,
        user: { ...state.user, ...action.payload },
        error: null,
      };

    case 'UPDATE_PROFILE_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'INIT_COMPLETE':
      return {
        ...state,
        isInitializing: false,
      };

    default:
      return state;
  }
};

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  isInitializing: true, // Only gate route rendering during initial session bootstrap
  error: null,
};

// Auth provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      const refreshToken = getRefreshToken();

      if (token && isTokenValid()) {
        try {
          // Verify token by fetching user profile
          const response = await withTimeout(
            authAPI.getProfile(),
            AUTH_BOOTSTRAP_TIMEOUT_MS,
            'Auth bootstrap timed out'
          );
          const payload = extractAuthPayload(response);

          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: payload?.user,
              token,
            },
          });
        } catch (error) {
          // Token/profile verification failed.
          removeTokens();
        }
      } else if (refreshToken) {
        try {
          const refreshResponse = await withTimeout(
            authAPI.refreshToken(refreshToken),
            AUTH_BOOTSTRAP_TIMEOUT_MS,
            'Auth refresh timed out'
          );
          const refreshPayload = extractAuthPayload(refreshResponse);
          const newAccessToken = refreshPayload?.accessToken;
          const newRefreshToken = refreshPayload?.refreshToken || refreshToken;

          if (!newAccessToken) {
            throw new Error('Missing access token from refresh response');
          }

          setTokens(newAccessToken, newRefreshToken);

          const profileResponse = await withTimeout(
            authAPI.getProfile(),
            AUTH_BOOTSTRAP_TIMEOUT_MS,
            'Profile verification timed out'
          );
          const profilePayload = extractAuthPayload(profileResponse);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: profilePayload?.user,
              token: newAccessToken,
            },
          });
        } catch (error) {
          removeTokens();
        }
      } else {
        // No token or invalid token
        if (token) {
          removeTokens();
        }
      }

      dispatch({ type: 'INIT_COMPLETE' });
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = extractAuthPayload(response);

      setTokens(accessToken, refreshToken);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token: accessToken },
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' });

    try {
      const response = await authAPI.register(userData);
      const { user, accessToken, refreshToken } = extractAuthPayload(response);

      setTokens(accessToken, refreshToken);
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: { user, token: accessToken },
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: 'REGISTER_FAILURE',
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    }

    removeTokens();
    dispatch({ type: 'LOGOUT' });
  };

  // Update profile function
  const updateProfile = async (userData) => {
    dispatch({ type: 'UPDATE_PROFILE_START' });

    try {
      const response = await authAPI.updateProfile(userData);
      const payload = extractAuthPayload(response);

      dispatch({
        type: 'UPDATE_PROFILE_SUCCESS',
        payload: payload?.user,
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: 'UPDATE_PROFILE_FAILURE',
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;