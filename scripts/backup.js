// Script para respaldar datos de Supabase
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('Faltan variables SUPABASE_URL o SUPABASE_KEY');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backup() {
	const fecha = new Date().toISOString().split('T')[0];
	const backupDir = `backups/${fecha}`;

	try {
		mkdirSync(backupDir, { recursive: true });

		// Respaldar tickets
		console.log('Respaldando tickets...');
		const { data: tickets, error: ticketsError } = await supabase
			.from('tickets')
			.select('*')
			.order('created_at', { ascending: false });

		if (ticketsError) throw ticketsError;
		writeFileSync(`${backupDir}/tickets.json`, JSON.stringify(tickets, null, 2));
		console.log(`  ${tickets.length} tickets respaldados`);

		// Respaldar comentarios
		console.log('Respaldando comentarios...');
		const { data: comentarios, error: comentariosError } = await supabase
			.from('comentarios')
			.select('*')
			.order('created_at', { ascending: false });

		if (comentariosError) throw comentariosError;
		writeFileSync(`${backupDir}/comentarios.json`, JSON.stringify(comentarios, null, 2));
		console.log(`  ${comentarios.length} comentarios respaldados`);

		// Crear resumen
		const resumen = {
			fecha: new Date().toISOString(),
			tickets: tickets.length,
			comentarios: comentarios.length
		};
		writeFileSync(`${backupDir}/resumen.json`, JSON.stringify(resumen, null, 2));

		console.log(`\nRespaldo completado en ${backupDir}/`);
	} catch (error) {
		console.error('Error en respaldo:', error);
		process.exit(1);
	}
}

backup();
