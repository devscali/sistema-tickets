<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		obtenerTicketPorNumero,
		obtenerComentarios,
		crearComentario,
		actualizarEstadoTicket,
		editarTicket,
		eliminarTicket,
		validarImagen
	} from '$lib/ticketService';
	import { ESTADOS, ESTADO_COLORES, CATEGORIAS, type Ticket, type Comentario, type Estado, type Categoria } from '$lib/types';

	let ticket: Ticket | null = null;
	let comentarios: Comentario[] = [];
	let cargando = true;
	let error = '';

	// Formulario de comentario
	let nuevoComentario = '';
	let capturaFile: File | null = null;
	let capturaPreview: string | null = null;
	let enviandoComentario = false;
	let errorComentario = '';

	// Estado del ticket
	let cambiandoEstado = false;

	// Edición
	let modoEdicion = false;
	let editTitulo = '';
	let editDescripcion = '';
	let editNombrePaciente = '';
	let editCategoria: Categoria = 'WhatsApp';
	let guardandoEdicion = false;

	// Eliminación
	let mostrarConfirmacionEliminar = false;
	let eliminando = false;

	$: numeroTicket = parseInt($page.params.numero);

	onMount(async () => {
		await cargarTicket();
	});

	async function cargarTicket() {
		try {
			cargando = true;
			error = '';

			ticket = await obtenerTicketPorNumero(numeroTicket);

			if (!ticket) {
				error = 'Ticket no encontrado';
				return;
			}

			comentarios = await obtenerComentarios(ticket.id);
		} catch (err) {
			console.error('Error al cargar ticket:', err);
			error = 'No se pudo cargar el ticket';
		} finally {
			cargando = false;
		}
	}

	function manejarArchivoSeleccionado(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		const validacion = validarImagen(file);
		if (!validacion.valido) {
			errorComentario = validacion.error || 'Archivo inválido';
			capturaFile = null;
			capturaPreview = null;
			return;
		}

		capturaFile = file;
		errorComentario = '';

		const reader = new FileReader();
		reader.onload = (e) => {
			capturaPreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function limpiarFormulario() {
		nuevoComentario = '';
		capturaFile = null;
		capturaPreview = null;
		errorComentario = '';
	}

	async function enviarComentario() {
		if (!ticket) return;

		errorComentario = '';

		if (nuevoComentario.trim().length === 0) {
			errorComentario = 'El comentario no puede estar vacío';
			return;
		}

		try {
			enviandoComentario = true;

			const comentario = await crearComentario(ticket.id, nuevoComentario, capturaFile || undefined);

			// Agregar comentario a la lista
			comentarios = [...comentarios, comentario];

			limpiarFormulario();
		} catch (err) {
			console.error('Error al crear comentario:', err);
			errorComentario = 'No se pudo crear el comentario';
		} finally {
			enviandoComentario = false;
		}
	}

	async function cambiarEstado(nuevoEstado: Estado) {
		if (!ticket || cambiandoEstado) return;

		try {
			cambiandoEstado = true;
			await actualizarEstadoTicket(ticket.id, nuevoEstado);
			ticket.estado = nuevoEstado;
			ticket = ticket; // Forzar re-render
		} catch (err) {
			console.error('Error al cambiar estado:', err);
			alert('No se pudo cambiar el estado');
		} finally {
			cambiandoEstado = false;
		}
	}

	function formatearFecha(fecha: string): string {
		const date = new Date(fecha);
		return date.toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function iniciarEdicion() {
		if (!ticket) return;
		editTitulo = ticket.titulo;
		editDescripcion = ticket.descripcion;
		editNombrePaciente = ticket.nombre_paciente;
		editCategoria = ticket.categoria;
		modoEdicion = true;
	}

	function cancelarEdicion() {
		modoEdicion = false;
	}

	async function guardarEdicion() {
		if (!ticket) return;

		try {
			guardandoEdicion = true;
			await editarTicket(ticket.id, {
				titulo: editTitulo,
				descripcion: editDescripcion,
				nombre_paciente: editNombrePaciente,
				categoria: editCategoria
			});

			// Actualizar el ticket local
			ticket.titulo = editTitulo;
			ticket.descripcion = editDescripcion;
			ticket.nombre_paciente = editNombrePaciente;
			ticket.categoria = editCategoria;
			ticket = ticket;

			modoEdicion = false;
		} catch (err) {
			console.error('Error al editar ticket:', err);
			alert('No se pudo guardar los cambios');
		} finally {
			guardandoEdicion = false;
		}
	}

	async function confirmarEliminar() {
		if (!ticket) return;

		try {
			eliminando = true;
			await eliminarTicket(ticket.id);
			goto('/tickets');
		} catch (err) {
			console.error('Error al eliminar ticket:', err);
			alert('No se pudo eliminar el ticket');
			eliminando = false;
		}
	}
</script>

{#if cargando}
	<div class="loading-container">
		<p>Cargando ticket...</p>
	</div>
{:else if error}
	<div class="error-container">
		<h2>❌ {error}</h2>
		<a href="/tickets" class="btn-primary">← Volver a tickets</a>
	</div>
{:else if ticket}
	<div class="container">
		<!-- Header -->
		<div class="header">
			<a href="/tickets" class="back-link">← Volver a todos los tickets</a>
			<div class="ticket-number">#{String(ticket.numero).padStart(5, '0')}</div>
		</div>

		<!-- Modal de confirmación de eliminación -->
		{#if mostrarConfirmacionEliminar}
			<div class="modal-overlay" on:click={() => mostrarConfirmacionEliminar = false}>
				<div class="modal" on:click|stopPropagation>
					<h3>Eliminar Ticket</h3>
					<p>¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer.</p>
					<div class="modal-actions">
						<button class="btn-cancel" on:click={() => mostrarConfirmacionEliminar = false} disabled={eliminando}>
							Cancelar
						</button>
						<button class="btn-danger" on:click={confirmarEliminar} disabled={eliminando}>
							{eliminando ? 'Eliminando...' : 'Sí, eliminar'}
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Ticket principal -->
		<div class="ticket-main">
			{#if modoEdicion}
				<!-- Modo edición -->
				<div class="edit-form">
					<h2>Editar Ticket</h2>

					<div class="form-group">
						<label for="edit-titulo">Título</label>
						<input id="edit-titulo" type="text" bind:value={editTitulo} />
					</div>

					<div class="form-group">
						<label for="edit-paciente">Nombre del Paciente</label>
						<input id="edit-paciente" type="text" bind:value={editNombrePaciente} />
					</div>

					<div class="form-group">
						<label for="edit-categoria">Categoría</label>
						<select id="edit-categoria" bind:value={editCategoria}>
							{#each CATEGORIAS as cat}
								<option value={cat}>{cat}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="edit-descripcion">Descripción</label>
						<textarea id="edit-descripcion" bind:value={editDescripcion} rows="6"></textarea>
					</div>

					<div class="edit-actions">
						<button class="btn-cancel" on:click={cancelarEdicion} disabled={guardandoEdicion}>
							Cancelar
						</button>
						<button class="btn-primary" on:click={guardarEdicion} disabled={guardandoEdicion}>
							{guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
						</button>
					</div>
				</div>
			{:else}
				<!-- Modo visualización -->
				<div class="ticket-header">
					<h1>{ticket.titulo}</h1>
					<div class="ticket-actions">
						<button class="btn-edit" on:click={iniciarEdicion}>Editar</button>
						<button class="btn-danger-small" on:click={() => mostrarConfirmacionEliminar = true}>Eliminar</button>
					</div>
				</div>

				<div class="estado-selector">
					<label>Estado:</label>
					<select bind:value={ticket.estado} on:change={(e) => cambiarEstado(e.currentTarget.value as Estado)} disabled={cambiandoEstado}>
						{#each ESTADOS as estado}
							<option value={estado}>{estado}</option>
						{/each}
					</select>
				</div>

				<div class="ticket-meta">
					<span class="categoria">{ticket.categoria}</span>
					<span class="paciente">Paciente: {ticket.nombre_paciente}</span>
					<span class="fecha">{formatearFecha(ticket.created_at)}</span>
				</div>

				<div class="ticket-descripcion">
					<p>{ticket.descripcion}</p>
				</div>

				{#if ticket.captura_url}
					<div class="ticket-captura">
						<img src={ticket.captura_url} alt="Captura del ticket" />
					</div>
				{/if}
			{/if}
		</div>

		<!-- Comentarios -->
		<div class="comentarios-section">
			<h2>💬 Comentarios ({comentarios.length})</h2>

			<div class="comentarios-lista">
				{#each comentarios as comentario}
					<div class="comentario">
						<div class="comentario-header">
							<span class="comentario-fecha">{formatearFecha(comentario.created_at)}</span>
						</div>
						<div class="comentario-contenido">
							<p>{comentario.contenido}</p>
							{#if comentario.captura_url}
								<div class="comentario-captura">
									<img src={comentario.captura_url} alt="Captura adjunta" />
								</div>
							{/if}
						</div>
					</div>
				{/each}

				{#if comentarios.length === 0}
					<p class="no-comentarios">No hay comentarios todavía. ¡Sé el primero en comentar!</p>
				{/if}
			</div>

			<!-- Formulario de nuevo comentario -->
			<div class="nuevo-comentario">
				<h3>Agregar Comentario</h3>

				<form on:submit|preventDefault={enviarComentario}>
					<div class="form-group">
						<textarea
							bind:value={nuevoComentario}
							placeholder="Escribe tu comentario..."
							rows="4"
							required
						></textarea>
					</div>

					<div class="form-group">
						<label for="captura-comentario">Adjuntar captura (opcional)</label>
						<input
							id="captura-comentario"
							type="file"
							accept="image/*"
							on:change={manejarArchivoSeleccionado}
						/>

						{#if capturaPreview}
							<div class="image-preview">
								<img src={capturaPreview} alt="Preview" />
								<button type="button" on:click={() => {
									capturaFile = null;
									capturaPreview = null;
								}} class="remove-preview">✕ Quitar</button>
							</div>
						{/if}
					</div>

					{#if errorComentario}
						<div class="error-message">⚠️ {errorComentario}</div>
					{/if}

					<button type="submit" class="btn-primary" disabled={enviandoComentario}>
						{enviandoComentario ? 'Enviando...' : 'Publicar Comentario'}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	.loading-container,
	.error-container {
		max-width: 600px;
		margin: 4rem auto;
		text-align: center;
		padding: 2rem;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.header {
		margin-bottom: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.back-link {
		color: #3498db;
		text-decoration: none;
		font-weight: 500;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.ticket-number {
		font-family: 'Courier New', monospace;
		font-weight: bold;
		font-size: 1.5rem;
		color: #7f8c8d;
	}

	.ticket-main {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.ticket-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.ticket-header h1 {
		margin: 0;
		color: #2c3e50;
		flex: 1;
		min-width: 200px;
	}

	.estado-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.estado-selector label {
		font-weight: 600;
		color: #2c3e50;
	}

	.estado-selector select {
		padding: 0.5rem 1rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-weight: 600;
		background: white;
	}

	.ticket-meta {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.categoria {
		background: #3498db;
		color: white;
		padding: 0.35rem 0.75rem;
		border-radius: 12px;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.fecha {
		color: #7f8c8d;
		font-size: 0.9rem;
	}

	.ticket-descripcion {
		margin-bottom: 1.5rem;
		line-height: 1.6;
		color: #2c3e50;
	}

	.ticket-captura {
		border: 2px solid #ecf0f1;
		border-radius: 8px;
		overflow: hidden;
	}

	.ticket-captura img {
		width: 100%;
		height: auto;
		display: block;
	}

	.comentarios-section {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.comentarios-section h2 {
		margin: 0 0 1.5rem 0;
		color: #2c3e50;
	}

	.comentarios-lista {
		margin-bottom: 2rem;
	}

	.comentario {
		border-left: 3px solid #3498db;
		padding: 1rem;
		margin-bottom: 1rem;
		background: #f8f9fa;
		border-radius: 6px;
	}

	.comentario-header {
		margin-bottom: 0.5rem;
	}

	.comentario-fecha {
		font-size: 0.85rem;
		color: #7f8c8d;
	}

	.comentario-contenido p {
		margin: 0 0 0.75rem 0;
		line-height: 1.5;
		color: #2c3e50;
	}

	.comentario-captura {
		margin-top: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		overflow: hidden;
		max-width: 400px;
	}

	.comentario-captura img {
		width: 100%;
		height: auto;
		display: block;
	}

	.no-comentarios {
		text-align: center;
		color: #7f8c8d;
		padding: 2rem;
		font-style: italic;
	}

	.nuevo-comentario {
		border-top: 2px solid #ecf0f1;
		padding-top: 2rem;
	}

	.nuevo-comentario h3 {
		margin: 0 0 1rem 0;
		color: #2c3e50;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #2c3e50;
	}

	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
		resize: vertical;
		box-sizing: border-box;
	}

	textarea:focus {
		outline: none;
		border-color: #3498db;
	}

	input[type='file'] {
		width: 100%;
		padding: 0.75rem;
		border: 2px dashed #ddd;
		border-radius: 6px;
		cursor: pointer;
	}

	.image-preview {
		position: relative;
		margin-top: 1rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		overflow: hidden;
		max-width: 300px;
	}

	.image-preview img {
		width: 100%;
		height: auto;
		display: block;
	}

	.remove-preview {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: rgba(231, 76, 60, 0.9);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
	}

	.remove-preview:hover {
		background: rgba(192, 57, 43, 1);
	}

	.error-message {
		background: #fee;
		border: 2px solid #e74c3c;
		color: #c0392b;
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.btn-primary {
		width: 100%;
		padding: 0.75rem 1.5rem;
		background: #3498db;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2980b9;
	}

	.btn-primary:disabled {
		background: #bdc3c7;
		cursor: not-allowed;
	}

	/* Botones de acción del ticket */
	.ticket-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-edit {
		padding: 0.5rem 1rem;
		background: #3498db;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-edit:hover {
		background: #2980b9;
	}

	.btn-danger-small {
		padding: 0.5rem 1rem;
		background: #e74c3c;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-danger-small:hover {
		background: #c0392b;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		max-width: 400px;
		width: 90%;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}

	.modal h3 {
		margin: 0 0 1rem 0;
		color: #2c3e50;
	}

	.modal p {
		color: #7f8c8d;
		margin-bottom: 1.5rem;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.btn-cancel {
		padding: 0.75rem 1.5rem;
		background: #ecf0f1;
		color: #2c3e50;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-cancel:hover:not(:disabled) {
		background: #bdc3c7;
	}

	.btn-danger {
		padding: 0.75rem 1.5rem;
		background: #e74c3c;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-danger:hover:not(:disabled) {
		background: #c0392b;
	}

	.btn-danger:disabled,
	.btn-cancel:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Formulario de edición */
	.edit-form h2 {
		margin: 0 0 1.5rem 0;
		color: #2c3e50;
	}

	.edit-form input[type='text'],
	.edit-form select {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.edit-form input:focus,
	.edit-form select:focus,
	.edit-form textarea:focus {
		outline: none;
		border-color: #3498db;
	}

	.edit-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	.paciente {
		background: #9b59b6;
		color: white;
		padding: 0.35rem 0.75rem;
		border-radius: 12px;
		font-size: 0.9rem;
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.ticket-header {
			flex-direction: column;
			gap: 1rem;
		}

		.ticket-actions {
			width: 100%;
		}

		.ticket-actions button {
			flex: 1;
		}

		.estado-selector {
			width: 100%;
		}

		.estado-selector select {
			flex: 1;
		}

		.edit-actions {
			flex-direction: column;
		}

		.modal-actions {
			flex-direction: column;
		}
	}
</style>
