// Servicio para manejar todas las operaciones de tickets con Firebase
import { db, storage } from './firebaseClient';
import {
	collection,
	doc,
	getDocs,
	addDoc,
	updateDoc,
	query,
	where,
	orderBy,
	getCountFromServer
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Ticket, Comentario, TicketConConteo, Categoria, Estado } from './types';

// Referencias a colecciones
const ticketsCollection = collection(db, 'tickets');
const comentariosCollection = collection(db, 'comentarios');

// ============================================
// TICKETS
// ============================================

/**
 * Obtener el siguiente número de ticket
 */
async function obtenerSiguienteNumero(): Promise<number> {
	const snapshot = await getDocs(ticketsCollection);
	let maxNumero = 0;
	snapshot.forEach((doc) => {
		const data = doc.data();
		if (data.numero && data.numero > maxNumero) {
			maxNumero = data.numero;
		}
	});
	return maxNumero + 1;
}

/**
 * Obtener todos los tickets con conteo de comentarios
 * Opcionalmente filtrar por categoría y/o estado
 */
export async function obtenerTickets(
	categoria?: Categoria,
	estado?: Estado
): Promise<TicketConConteo[]> {
	let q = query(ticketsCollection, orderBy('created_at', 'desc'));

	// Aplicar filtros si existen
	if (categoria && estado) {
		q = query(
			ticketsCollection,
			where('categoria', '==', categoria),
			where('estado', '==', estado),
			orderBy('created_at', 'desc')
		);
	} else if (categoria) {
		q = query(
			ticketsCollection,
			where('categoria', '==', categoria),
			orderBy('created_at', 'desc')
		);
	} else if (estado) {
		q = query(ticketsCollection, where('estado', '==', estado), orderBy('created_at', 'desc'));
	}

	const snapshot = await getDocs(q);
	const tickets: TicketConConteo[] = [];

	for (const docSnap of snapshot.docs) {
		const data = docSnap.data();

		// Contar comentarios para este ticket
		const comentariosQuery = query(comentariosCollection, where('ticket_id', '==', docSnap.id));
		const comentariosSnapshot = await getCountFromServer(comentariosQuery);
		const totalComentarios = comentariosSnapshot.data().count;

		tickets.push({
			id: docSnap.id,
			numero: data.numero,
			titulo: data.titulo,
			descripcion: data.descripcion,
			nombre_paciente: data.nombre_paciente,
			categoria: data.categoria,
			estado: data.estado,
			captura_url: data.captura_url,
			created_at: data.created_at,
			updated_at: data.updated_at,
			total_comentarios: totalComentarios
		} as TicketConConteo);
	}

	return tickets;
}

/**
 * Obtener un ticket específico por su número
 */
export async function obtenerTicketPorNumero(numero: number): Promise<Ticket | null> {
	const q = query(ticketsCollection, where('numero', '==', numero));
	const snapshot = await getDocs(q);

	if (snapshot.empty) {
		return null;
	}

	const docSnap = snapshot.docs[0];
	const data = docSnap.data();

	return {
		id: docSnap.id,
		numero: data.numero,
		titulo: data.titulo,
		descripcion: data.descripcion,
		nombre_paciente: data.nombre_paciente,
		categoria: data.categoria,
		estado: data.estado,
		captura_url: data.captura_url,
		created_at: data.created_at,
		updated_at: data.updated_at
	} as Ticket;
}

/**
 * Crear un nuevo ticket
 */
export async function crearTicket(
	titulo: string,
	descripcion: string,
	nombrePaciente: string,
	categoria: Categoria,
	capturaFile: File
): Promise<Ticket> {
	// 1. Subir la captura a Firebase Storage
	const capturaUrl = await subirCaptura(capturaFile);

	// 2. Obtener el siguiente número de ticket
	const numero = await obtenerSiguienteNumero();

	// 3. Crear el ticket en Firestore
	const now = new Date().toISOString();
	const ticketData = {
		numero,
		titulo,
		descripcion,
		nombre_paciente: nombrePaciente,
		categoria,
		estado: 'Nuevo' as Estado,
		captura_url: capturaUrl,
		created_at: now,
		updated_at: now
	};

	const docRef = await addDoc(ticketsCollection, ticketData);

	return {
		id: docRef.id,
		...ticketData
	} as Ticket;
}

/**
 * Actualizar el estado de un ticket
 */
export async function actualizarEstadoTicket(ticketId: string, nuevoEstado: Estado): Promise<void> {
	const ticketRef = doc(db, 'tickets', ticketId);
	await updateDoc(ticketRef, {
		estado: nuevoEstado,
		updated_at: new Date().toISOString()
	});
}

// ============================================
// COMENTARIOS
// ============================================

/**
 * Obtener todos los comentarios de un ticket
 */
export async function obtenerComentarios(ticketId: string): Promise<Comentario[]> {
	const q = query(
		comentariosCollection,
		where('ticket_id', '==', ticketId),
		orderBy('created_at', 'asc')
	);

	const snapshot = await getDocs(q);
	const comentarios: Comentario[] = [];

	snapshot.forEach((docSnap) => {
		const data = docSnap.data();
		comentarios.push({
			id: docSnap.id,
			ticket_id: data.ticket_id,
			contenido: data.contenido,
			captura_url: data.captura_url,
			created_at: data.created_at
		} as Comentario);
	});

	return comentarios;
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

	const now = new Date().toISOString();
	const comentarioData = {
		ticket_id: ticketId,
		contenido,
		captura_url: capturaUrl,
		created_at: now
	};

	const docRef = await addDoc(comentariosCollection, comentarioData);

	return {
		id: docRef.id,
		...comentarioData
	} as Comentario;
}

// ============================================
// ALMACENAMIENTO DE ARCHIVOS
// ============================================

/**
 * Subir una captura de pantalla a Firebase Storage
 * Retorna la URL pública del archivo
 */
export async function subirCaptura(file: File): Promise<string> {
	// Generar nombre único para el archivo
	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(7);
	const extension = file.name.split('.').pop();
	const fileName = `capturas/${timestamp}-${randomString}.${extension}`;

	// Subir a Firebase Storage
	const storageRef = ref(storage, fileName);
	await uploadBytes(storageRef, file);

	// Obtener la URL pública
	const downloadURL = await getDownloadURL(storageRef);
	return downloadURL;
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
