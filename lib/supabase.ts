
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jzmbjalanxwnjtdubmrs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bWJqYWxhbnh3bmp0ZHVibXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5Nzg0MjgsImV4cCI6MjA4MTU1NDQyOH0.-u1DnPJ5wRrD2I6DmRCWawKUqwZ0DVfJBKR9y37VACY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = true;
