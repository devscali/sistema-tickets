// Cliente de Supabase - punto central de conexión
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Validar que las variables de entorno existan
if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
	throw new Error(
		'Faltan las credenciales de Supabase. Asegúrate de crear el archivo .env con PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY'
	);
}

// Crear y exportar el cliente de Supabase
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
