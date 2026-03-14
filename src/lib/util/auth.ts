import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { isSupabaseEnabled } from './supabase';

export interface User {
  id: string;
  username: string;
}

const STORAGE_KEY = 'mermaid_user';

const getStoredUser = (): User | null => {
  if (!browser) return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }
  return null;
};

export const currentUser = writable<User | null>(getStoredUser());

export const login = async (username: string, password: string): Promise<User | null> => {
  if (!isSupabaseEnabled) {
    return null;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      console.error('Login failed:', await response.text());
      return null;
    }

    const data = await response.json();
    const user: User = { id: data.id, username: data.username };

    if (browser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }

    currentUser.set(user);
    return user;
  } catch (error) {
    console.error('Login failed:', error);
    return null;
  }
};

export const logout = (): void => {
  if (browser) {
    localStorage.removeItem(STORAGE_KEY);
  }
  currentUser.set(null);
};

export const isLoggedIn = (): boolean => {
  let user: User | null = null;
  currentUser.subscribe((u) => (user = u))();
  return user !== null;
};
