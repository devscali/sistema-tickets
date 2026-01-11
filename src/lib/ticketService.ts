// Servicio para manejar todas las operaciones de tickets con Supabase
import { supabase } from './supabaseClient';
import type { Ticket, Comentario, TicketConConteo, Categoria, Estado } from './types';

// ============================================
// TICKETS
// ============================================

/**
 * Obtener todos los tickets con conteo de comentarios
 * Opcionalmente filtrar por categoría y/o estado
 */
export async function obtenerTickets(
	categoria?: Categoria,
	estado?: Estado
): Promise<TicketConConteo[]> {
	let query = supabase
		.from('tickets')
		.select(
			`
			*,
			comentarios (count)
		`
		)
		.order('created_at', { ascending: false });

	// Aplicar filtros si existen
	if (categoria) {
		query = query.eq('categoria', categoria);
	}
	if (estado) {
		query = query.eq('estado', estado);
	}

	const { data, error } = await query;

	if (error) {
		console.error('Error al obtener tickets:', error);
		throw error;
	}

	// Transformar el resultado para incluir total_comentarios
	return (data || []).map((ticket) => ({
		...ticket,
		total_comentarios: ticket.comentarios[0]?.count || 0
	})) as TicketConConteo[];
}

/**
 * Obtener un ticket específico por su número
 */
export async function obtenerTicketPorNumero(numero: number): Promise<Ticket | null> {
	const { data, error } = await supabase
		.from('tickets')
		.select('*')
		.eq('numero', numero)
		.single();

	if (error) {
		console.error('Error al obtener ticket:', error);
		return null;
	}

	return data as Ticket;
}

/**
 * Crear un nuevo ticket
 */
export async function crearTicket(
	titulo: string,
	descripcion: string,
	categoria: Categoria,
	capturaFile: File
): Promise<Ticket> {
	// 1. Subir la captura a Supabase Storage
	const capturaUrl = await subirCaptura(capturaFile);

	// 2. Crear el ticket en la base de datos
	const { data, error } = await supabase
		.from('tickets')
		.insert({
			titulo,
			descripcion,
			categoria,
			captura_url: capturaUrl
		})
		.select()
		.single();

	if (error) {
		console.error('Error al crear ticket:', error);
		throw error;
	}

	return data as Ticket;
}

/**
 * Actualizar el estado de un ticket
 */
export async function actualizarEstadoTicket(ticketId: string, nuevoEstado: Estado): Promise<void> {
	const { error } = await supabase
		.from('tickets')
		.update({ estado: nuevoEstado })
		.eq('id', ticketId);

	if (error) {
		console.error('Error al actualizar estado:', error);
		throw error;
	}
}

// ============================================
// COMENTARIOS
// ============================================

/**
 * Obtener todos los comentarios de un ticket
 */
export async function obtenerComentarios(ticketId: string): Promise<Comentario[]> {
	const { data, error } = await supabase
		.from('comentarios')
		.select('*')
		.eq('ticket_id', ticketId)
		.order('created_at', { ascending: true });

	if (error) {
		console.error('Error al obtener comentarios:', error);
		throw error;
	}

	return (data || []) as Comentario[];
}

/**
 * Crear un nuevo comentario en un ticket
 */
export async function crearComentario(
	ticketId: string,
	contenido: string,
	capturaFile?: File
): Promise<Comentario> {
	let capturaUrl: string | undefined;

	// Subir captura si existe
	if (capturaFile) {
		capturaUrl = await subirCaptura(capturaFile);
	}

	const { data, error } = await supabase
		.from('comentarios')
		.insert({
			ticket_id: ticketId,
			contenido,
			captura_url: capturaUrl
		})
		.select()
		.single();

	if (error) {
		console.error('Error al crear comentario:', error);
		throw error;
	}

	return data as Comentario;
}

// ============================================
// ALMACENAMIENTO DE ARCHIVOS
// ============================================

/**
 * Subir una captura de pantalla a Supabase Storage
 * Retorna la URL pública del archivo
 */
export async function subirCaptura(file: File): Promise<string> {
	// Generar nombre único para el archivo
	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(7);
	const extension = file.name.split('.').pop();
	const fileName = `${timestamp}-${randomString}.${extension}`;

	// Subir a Supabase Storage
	const { data, error } = await supabase.storage.from('capturas').upload(fileName, file, {
		cacheControl: '3600',
		upsert: false
	});

	if (error) {
		console.error('Error al subir captura:', error);
		throw error;
	}

	// Obtener la URL pública
	const {
		data: { publicUrl }
	} = supabase.storage.from('capturas').getPublicUrl(data.path);

	return publicUrl;
}

/**
 * Validar que un archivo sea una imagen válida
 */
export function validarImagen(file: File): { valido: boolean; error?: string } {
	// Verificar tipo
	if (!file.type.startsWith('image/')) {
		return { valido: false, error: 'El archivo debe ser una imagen' };
	}

	// Verificar tamaño (máximo 5MB)
	const MAX_SIZE = 5 * 1024 * 1024; // 5MB en bytes
	if (file.size > MAX_SIZE) {
		return { valido: false, error: 'La imagen no debe superar 5MB' };
	}

	return { valido: true };
}
