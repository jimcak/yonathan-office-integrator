// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://owqtryzjibqjiciyvojs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93cXRyeXpqaWJxamljaXl2b2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNjM0NjcsImV4cCI6MjA1NDgzOTQ2N30.bJlhygKcTlivOjcTZSWugA7aDQraHBoeW98oAiyqnZ0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);