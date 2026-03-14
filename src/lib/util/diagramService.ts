import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';
import { currentUser } from './auth';
import { isSupabaseEnabled } from './supabase';

const CURRENT_DIAGRAM_KEY = 'mermaid_current_diagram';

// Load from localStorage on init
const getStoredDiagram = (): SavedDiagram | null => {
  if (!browser) return null;
  const stored = localStorage.getItem(CURRENT_DIAGRAM_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as SavedDiagram;
    } catch {
      return null;
    }
  }
  return null;
};

// Store to track the currently editing diagram
export const currentDiagram = writable<SavedDiagram | null>(getStoredDiagram());

export const setCurrentDiagram = (diagram: SavedDiagram | null): void => {
  currentDiagram.set(diagram);
  if (browser) {
    if (diagram) {
      localStorage.setItem(CURRENT_DIAGRAM_KEY, JSON.stringify(diagram));
    } else {
      localStorage.removeItem(CURRENT_DIAGRAM_KEY);
    }
  }
};

export const clearCurrentDiagram = (): void => {
  currentDiagram.set(null);
  if (browser) {
    localStorage.removeItem(CURRENT_DIAGRAM_KEY);
  }
};

export interface SavedDiagram {
  id: string;
  short_id: string;
  code: string;
  config: string | null;
  title: string | null;
  user_id: string | null;
  created_at: string;
}

const generateShortId = (): string => crypto.randomUUID().replace(/-/g, '').slice(0, 7);

const getCurrentUserId = (): string | null => {
  const user = get(currentUser);
  return user?.id ?? null;
};

export async function saveDiagram(
  code: string,
  config?: string,
  title?: string
): Promise<SavedDiagram | null> {
  if (!isSupabaseEnabled) {
    return null;
  }

  const short_id = generateShortId();
  const user_id = getCurrentUserId();

  try {
    const response = await fetch('/api/diagrams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        config: config ?? null,
        short_id,
        title: title ?? null,
        user_id
      })
    });

    if (!response.ok) {
      console.error('Error saving diagram:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving diagram:', error);
    return null;
  }
}

export async function loadDiagram(shortId: string): Promise<SavedDiagram | null> {
  if (!isSupabaseEnabled) {
    return null;
  }

  try {
    const response = await fetch(`/api/diagrams/${shortId}`);

    if (!response.ok) {
      console.error('Error loading diagram:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading diagram:', error);
    return null;
  }
}

export async function loadAllDiagrams(
  limit = 50,
  offset = 0
): Promise<{ diagrams: SavedDiagram[]; count: number | null }> {
  if (!isSupabaseEnabled) {
    return { count: null, diagrams: [] };
  }

  const user_id = getCurrentUserId();
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (user_id) params.set('user_id', user_id);

  try {
    const response = await fetch(`/api/diagrams?${params}`);

    if (!response.ok) {
      console.error('Error loading diagrams:', await response.text());
      return { count: null, diagrams: [] };
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading diagrams:', error);
    return { count: null, diagrams: [] };
  }
}

export async function updateDiagram(
  shortId: string,
  code: string,
  config?: string,
  title?: string
): Promise<SavedDiagram | null> {
  if (!isSupabaseEnabled) {
    return null;
  }

  const user_id = getCurrentUserId();

  try {
    const response = await fetch(`/api/diagrams/${shortId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, config: config ?? null, title: title ?? null, user_id })
    });

    if (!response.ok) {
      console.error('Error updating diagram:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating diagram:', error);
    return null;
  }
}

export async function deleteDiagram(shortId: string): Promise<boolean> {
  if (!isSupabaseEnabled) {
    return false;
  }

  try {
    const response = await fetch(`/api/diagrams/${shortId}`, { method: 'DELETE' });

    if (!response.ok) {
      console.error('Error deleting diagram:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting diagram:', error);
    return false;
  }
}
