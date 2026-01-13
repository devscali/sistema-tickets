<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		obtenerTicketPorNumero,
		obtenerComentarios,
		crearComentario,
		actualizarEstadoTicket,
		validarImagen
	} from '$lib/ticketService';
	import { ESTADOS, ESTADO_COLORES, type Ticket, type Comentario, type Estado } from '$lib/types';

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

		<!-- Ticket principal -->
		<div class="ticket-main">
			<div class="ticket-header">
				<h1>{ticket.titulo}</h1>
				<div class="estado-selector">
					<label>Estado:</label>
					<select bind:value={ticket.estado} on:change={(e) => cambiarEstado(e.currentTarget.value as Estado)} disabled={cambiandoEstado}>
						{#each ESTADOS as estado}
							<option value={estado}>{estado}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="ticket-meta">
				<span class="categoria">{ticket.categoria}</span>
				<span class="fecha">{formatearFecha(ticket.created_at)}</span>
			</div>

			<div class="ticket-descripcion">
				<p>{ticket.descripcion}</p>
			</div>

			<div class="ticket-captura">
				<img src={ticket.captura_url} alt="Captura del ticket" />
			</div>
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

	@media (max-width: 768px) {
		.ticket-header {
			flex-direction: column;
		}

		.estado-selector {
			width: 100%;
		}

		.estado-selector select {
			flex: 1;
		}
	}
</style>
