import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '@/services/api';
import { getToken, setTokens, removeTokens, isTokenValid } from '@/utils/auth';

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
  error: null,
};

// Auth provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();

      if (token && isTokenValid()) {
        try {
          // Verify token by fetching user profile
          const response = await authAPI.getProfile();

          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.user,
              token,
            },
          });
        } catch (error) {
          // Token is invalid, remove it
          removeTokens();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        // Remove invalid token
        removeTokens();
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = response.data;

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
      const { user, accessToken, refreshToken } = response.data;

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

      dispatch({
        type: 'UPDATE_PROFILE_SUCCESS',
        payload: response.data.user,
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