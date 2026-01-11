// Tipos TypeScript para nuestro sistema de tickets

export type Categoria =
	| 'WhatsApp'
	| 'Messenger'
	| 'Instagram'
	| 'Entrenamiento de Bot'
	| 'Problema Técnico'
	| 'Otro';

export type Estado = 'Nuevo' | 'En Progreso' | 'Resuelto' | 'Cerrado';

export interface Ticket {
	id: string;
	numero: number; // #00001, #00002, etc.
	titulo: string;
	descripcion: string;
	nombre_paciente: string;
	categoria: Categoria;
	estado: Estado;
	captura_url: string;
	created_at: string;
	updated_at: string;
}

export interface Comentario {
	id: string;
	ticket_id: string;
	contenido: string;
	captura_url?: string; // Opcional
	created_at: string;
}

export interface TicketConConteo extends Ticket {
	total_comentarios: number;
}

// Constantes para usar en la UI
export const CATEGORIAS: Categoria[] = [
	'WhatsApp',
	'Messenger',
	'Instagram',
	'Entrenamiento de Bot',
	'Problema Técnico',
	'Otro'
];

export const ESTADOS: Estado[] = ['Nuevo', 'En Progreso', 'Resuelto', 'Cerrado'];

// Colores para cada estado (útil para badges)
export const ESTADO_COLORES: Record<Estado, string> = {
	Nuevo: 'bg-blue-500',
	'En Progreso': 'bg-yellow-500',
	Resuelto: 'bg-green-500',
	Cerrado: 'bg-gray-500'
};
