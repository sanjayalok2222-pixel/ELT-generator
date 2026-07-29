import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isMockMode } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Define unified User profile type
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (fullName: string, avatarUrl: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize Auth
  useEffect(() => {
    if (isMockMode) {
      // Mock mode initialization
      const currentUser = localStorage.getItem('mock_current_user');
      if (currentUser) {
        setUser(JSON.parse(currentUser));
      }
      setLoading(false);
    } else if (supabase) {
      // Real Supabase initialization
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          fetchAndSetProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session && session.user) {
            fetchAndSetProfile(session.user);
          } else {
            setUser(null);
            setLoading(false);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const fetchAndSetProfile = async (supabaseUser: User) => {
    try {
      if (!supabase) return;
      // Try to get profile from database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile not found, let's create it
        const newProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          full_name: supabaseUser.user_metadata?.full_name || 'ELT Developer',
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${supabaseUser.email}`,
          updated_at: new Date().toISOString()
        };
        await supabase.from('profiles').insert(newProfile);
        
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          fullName: newProfile.full_name,
          avatarUrl: newProfile.avatar_url
        });
      } else if (data) {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          fullName: data.full_name || 'ELT Developer',
          avatarUrl: data.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${supabaseUser.email}`
        });
      } else {
        // Fallback if profiles table isn't created yet or other error
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          fullName: supabaseUser.user_metadata?.full_name || 'ELT Developer',
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${supabaseUser.email}`
        });
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (isMockMode) {
      // Mock Sign Up
      const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      if (mockUsers.some((u: any) => u.email === email)) {
        return { error: new Error('User already exists') };
      }
      
      const newUserId = Math.random().toString(36).substring(2, 11);
      const newUser = {
        id: newUserId,
        email,
        password, // stored in plain text for mock only
        fullName,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`
      };
      
      mockUsers.push(newUser);
      localStorage.setItem('mock_users', JSON.stringify(mockUsers));
      
      // Auto login after sign up
      localStorage.setItem('mock_current_user', JSON.stringify({
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        avatarUrl: newUser.avatarUrl
      }));
      setUser({
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        avatarUrl: newUser.avatarUrl
      });
      return { error: null };
    } else {
      if (!supabase) return { error: new Error('Supabase client not initialized') };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      if (error) return { error };
      
      // Setup local profile immediately if verification is bypassed
      if (data.user) {
        const newProfile = {
          id: data.user.id,
          email: data.user.email || '',
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.user.email}`,
          updated_at: new Date().toISOString()
        };
        await supabase.from('profiles').insert(newProfile).select().single();
      }
      
      return { error: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (isMockMode) {
      // Mock Login
      const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const foundUser = mockUsers.find((u: any) => u.email === email && u.password === password);
      
      if (!foundUser) {
        return { error: new Error('Invalid email or password') };
      }
      
      const loggedUser = {
        id: foundUser.id,
        email: foundUser.email,
        fullName: foundUser.fullName,
        avatarUrl: foundUser.avatarUrl
      };
      
      localStorage.setItem('mock_current_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return { error: null };
    } else {
      if (!supabase) return { error: new Error('Supabase client not initialized') };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) return { error };
      return { error: null };
    }
  };

  const signOut = async () => {
    if (isMockMode) {
      localStorage.removeItem('mock_current_user');
      setUser(null);
      return { error: null };
    } else {
      if (!supabase) return { error: new Error('Supabase client not initialized') };
      const { error } = await supabase.auth.signOut();
      if (error) return { error };
      setUser(null);
      return { error: null };
    }
  };

  const resetPassword = async (email: string) => {
    if (isMockMode) {
      const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      if (!mockUsers.some((u: any) => u.email === email)) {
        return { error: new Error('Email not found') };
      }
      return { error: null }; // Mock success
    } else {
      if (!supabase) return { error: new Error('Supabase client not initialized') };
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) return { error };
      return { error: null };
    }
  };

  const updateProfile = async (fullName: string, avatarUrl: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    if (isMockMode) {
      const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const userIndex = mockUsers.findIndex((u: any) => u.id === user.id);
      
      if (userIndex > -1) {
        mockUsers[userIndex].fullName = fullName;
        mockUsers[userIndex].avatarUrl = avatarUrl;
        localStorage.setItem('mock_users', JSON.stringify(mockUsers));
      }
      
      const updated = { ...user, fullName, avatarUrl };
      localStorage.setItem('mock_current_user', JSON.stringify(updated));
      setUser(updated);
      return { error: null };
    } else {
      if (!supabase) return { error: new Error('Supabase client not initialized') };
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) return { error };
      
      setUser(prev => prev ? { ...prev, fullName, avatarUrl } : null);
      return { error: null };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resetPassword, updateProfile }}>
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
