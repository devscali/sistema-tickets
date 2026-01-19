// Cliente de Supabase - punto central de conexión
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://olzxjcqnluuznwsbbici.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9senhqY3FubHV1em53c2JiaWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MDI2NzcsImV4cCI6MjA4NDE3ODY3N30.29UT0Stkv89Gj6wTb98HQ5i_qyJLxVtmPyewbbqxFJM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
