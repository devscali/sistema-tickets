// Cliente de Supabase - punto central de conexión
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pyhlqiiiwakugtxtyocz.supabase.co';
const supabaseAnonKey = 'sb_publishable_vY2OQbywARQMbHvRvy18mA_BIluxw23';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
