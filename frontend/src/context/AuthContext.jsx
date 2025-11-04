import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';
const AuthContext = createContext();
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
};
const AUTH_SUCCESS = 'AUTH_SUCCESS';
const AUTH_FAILURE = 'AUTH_FAILURE';
const LOGOUT = 'LOGOUT';
const SET_LOADING = 'SET_LOADING';
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case AUTH_FAILURE:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/api/auth/profile');
          dispatch({
            type: AUTH_SUCCESS,
            payload: {
              user: res.data,
              token: token,
            },
          });
        } catch (error) {
          console.error('Load user error:', error);
          dispatch({ type: AUTH_FAILURE });
        }
      } else {
        dispatch({ type: AUTH_FAILURE });
      }
    };
    loadUser();
  }, []);
  const register = async (formData) => {
    try {
      const res = await api.post('/api/auth/register', formData);
      dispatch({
        type: AUTH_SUCCESS,
        payload: {
          user: {
            _id: res.data._id,
            username: res.data.username,
            email: res.data.email,
            avatar: res.data.avatar,
          },
          token: res.data.token,
        },
      });
      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_FAILURE });
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };
  const login = async (formData) => {
    try {
      const res = await api.post('/api/auth/login', formData);
      dispatch({
        type: AUTH_SUCCESS,
        payload: {
          user: {
            _id: res.data._id,
            username: res.data.username,
            email: res.data.email,
            avatar: res.data.avatar,
          },
          token: res.data.token,
        },
      });
      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_FAILURE });
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };
  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: LOGOUT });
    }
  };
  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
