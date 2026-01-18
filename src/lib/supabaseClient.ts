// Cliente de Supabase - punto central de conexión
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pyhlqiiiwakugtxtyocz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5aGxxaWlpd2FrdWd0eHR5b2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODE4MzgsImV4cCI6MjA4MzY1NzgzOH0.a-7G-7BGYYAhvW28ngb2NOQ-aysFfLMp7f1f4zWTVFA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
