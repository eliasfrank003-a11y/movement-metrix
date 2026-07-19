import { localStore } from './localStore';
import { supabase, supabaseStore } from './supabaseStore';
import type { HabitStore } from './types';

/**
 * Supabase takes over automatically once VITE_SUPABASE_ANON_KEY is present in
 * .env. Until then everything lives in this browser - no account needed, and
 * reshaping the data costs nothing.
 */
export const store: HabitStore = supabase ? supabaseStore : localStore;

export type { HabitStore } from './types';
