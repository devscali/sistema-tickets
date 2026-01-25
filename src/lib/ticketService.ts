// Servicio para manejar todas las operaciones de tickets con Supabase
import { supabase } from './supabaseClient';
import type { Ticket, Comentario, TicketConConteo, Categoria, Estado } from './types';

// ============================================
// TICKETS
// ============================================

/**
 * Obtener el siguiente número de ticket
 */
async function obtenerSiguienteNumero(): Promise<number> {
	const { data, error } = await supabase
		.from('tickets')
		.select('numero')
		.order('numero', { ascending: false })
		.limit(1);

	if (error) {
		console.error('Error obteniendo siguiente número:', error);
		return 1;
	}

	if (!data || data.length === 0) {
		return 1;
	}

	return (data[0].numero || 0) + 1;
}

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
		.select('*, comentarios:comentarios(count)')
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
		console.error('Error obteniendo tickets:', error);
		throw error;
	}

	// Mapear los resultados al tipo TicketConConteo
	return (data || []).map((ticket) => ({
		id: ticket.id,
		numero: ticket.numero,
		titulo: ticket.titulo,
		descripcion: ticket.descripcion,
		nombre_paciente: ticket.nombre_paciente,
		categoria: ticket.categoria,
		estado: ticket.estado,
		captura_url: ticket.captura_url,
		created_at: ticket.created_at,
		updated_at: ticket.updated_at,
		total_comentarios: ticket.comentarios?.[0]?.count || 0
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
		if (error.code === 'PGRST116') {
			// No se encontró el ticket
			return null;
		}
		console.error('Error obteniendo ticket:', error);
		throw error;
	}

	return data as Ticket;
}

/**
 * Crear un nuevo ticket
 */
export async function crearTicket(
	titulo: string,
	descripcion: string,
	nombrePaciente: string,
	categoria: Categoria,
	capturaFile?: File,
	email?: string
): Promise<Ticket> {
	try {
		// 1. Subir la captura a Supabase Storage (si existe)
		let capturaUrl: string | undefined;
		if (capturaFile) {
			console.log('Subiendo imagen...');
			capturaUrl = await subirCaptura(capturaFile);
			console.log('Imagen subida:', capturaUrl);
		}

		// 2. Obtener el siguiente número de ticket
		console.log('Obteniendo número de ticket...');
		const numero = await obtenerSiguienteNumero();
		console.log('Número de ticket:', numero);

		// 3. Crear el ticket en Supabase
		const ticketData: Record<string, unknown> = {
			numero,
			titulo,
			descripcion,
			nombre_paciente: nombrePaciente,
			categoria,
			estado: 'Nuevo' as Estado
		};

		// Solo agregar captura_url si existe
		if (capturaUrl) {
			ticketData.captura_url = capturaUrl;
		}

		// Solo agregar email si existe
		if (email) {
			ticketData.email = email;
		}

		console.log('Guardando ticket en Supabase...', ticketData);
		const { data, error } = await supabase
			.from('tickets')
			.insert(ticketData)
			.select()
			.single();

		if (error) {
			console.error('Error creando ticket:', error);
			console.error('Código:', error.code);
			console.error('Mensaje:', error.message);
			console.error('Detalles:', error.details);
			console.error('Hint:', error.hint);
			throw error;
		}

		console.log('Ticket guardado con ID:', data.id);
		return data as Ticket;
	} catch (error) {
		console.error('Error detallado al crear ticket:', error);
		throw error;
	}
}

/**
 * Actualizar el estado de un ticket
 */
export async function actualizarEstadoTicket(ticketId: string, nuevoEstado: Estado): Promise<void> {
	const { error } = await supabase
		.from('tickets')
		.update({
			estado: nuevoEstado,
			updated_at: new Date().toISOString()
		})
		.eq('id', ticketId);

	if (error) {
		console.error('Error actualizando estado:', error);
		throw error;
	}
}

/**
 * Editar un ticket existente
 */
export async function editarTicket(
	ticketId: string,
	datos: {
		titulo?: string;
		descripcion?: string;
		nombre_paciente?: string;
		categoria?: Categoria;
	}
): Promise<void> {
	const { error } = await supabase
		.from('tickets')
		.update({
			...datos,
			updated_at: new Date().toISOString()
		})
		.eq('id', ticketId);

	if (error) {
		console.error('Error editando ticket:', error);
		throw error;
	}
}

/**
 * Eliminar un ticket y sus comentarios asociados
 */
export async function eliminarTicket(ticketId: string): Promise<void> {
	// 1. Eliminar todos los comentarios del ticket
	const { error: comentariosError } = await supabase
		.from('comentarios')
		.delete()
		.eq('ticket_id', ticketId);

	if (comentariosError) {
		console.error('Error eliminando comentarios:', comentariosError);
		throw comentariosError;
	}

	// 2. Eliminar el ticket
	const { error: ticketError } = await supabase
		.from('tickets')
		.delete()
		.eq('id', ticketId);

	if (ticketError) {
		console.error('Error eliminando ticket:', ticketError);
		throw ticketError;
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
		console.error('Error obteniendo comentarios:', error);
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

	const comentarioData: Record<string, unknown> = {
		ticket_id: ticketId,
		contenido
	};

	// Solo agregar captura_url si existe
	if (capturaUrl) {
		comentarioData.captura_url = capturaUrl;
	}

	const { data, error } = await supabase
		.from('comentarios')
		.insert(comentarioData)
		.select()
		.single();

	if (error) {
		console.error('Error creando comentario:', error);
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
	const { error: uploadError } = await supabase.storage
		.from('capturas')
		.upload(fileName, file);

	if (uploadError) {
		console.error('Error subiendo archivo:', uploadError);
		throw uploadError;
	}

	// Obtener la URL pública
	const { data } = supabase.storage
		.from('capturas')
		.getPublicUrl(fileName);

	return data.publicUrl;
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
