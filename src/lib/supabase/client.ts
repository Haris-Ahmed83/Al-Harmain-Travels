import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndgyuipuyprthgqbrfnt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZ3l1aXB1eXBydGhncWJyZm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMDcyNjUsImV4cCI6MjEwNDU4MzI2NX0.YDc4ZhmJ6jQy_IC0NLFPlrDuE8CCo_wTeNdFttZebk4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
