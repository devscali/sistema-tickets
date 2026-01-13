<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import {
		obtenerTicketPorNumero,
		obtenerComentarios,
		crearComentario,
		actualizarEstadoTicket,
		editarTicket,
		eliminarTicket,
		validarImagen
	} from '$lib/ticketService';
	import { ESTADOS, CATEGORIAS, type Ticket, type Comentario, type Estado, type Categoria } from '$lib/types';

	let ticket: Ticket | null = null;
	let comentarios: Comentario[] = [];
	let cargando = true;
	let error = '';

	// Agente
	let nombreAgente = '';
	let mostrarModalAgente = false;
	let inputNombreAgente = '';

	// Formulario de comentario
	let nuevoComentario = '';
	let capturaFile: File | null = null;
	let capturaPreview: string | null = null;
	let enviandoComentario = false;
	let errorComentario = '';

	// Estado del ticket
	let cambiandoEstado = false;

	// Edicion
	let modoEdicion = false;
	let editTitulo = '';
	let editDescripcion = '';
	let editNombrePaciente = '';
	let editCategoria: Categoria = 'WhatsApp';
	let guardandoEdicion = false;

	// Eliminacion
	let mostrarConfirmacionEliminar = false;
	let eliminando = false;

	$: numeroTicket = parseInt($page.params.numero);

	onMount(async () => {
		// Cargar nombre del agente desde localStorage
		if (browser) {
			const agenteGuardado = localStorage.getItem('nombreAgente');
			if (agenteGuardado) {
				nombreAgente = agenteGuardado;
			}
		}
		await cargarTicket();
	});

	function guardarNombreAgente() {
		if (inputNombreAgente.trim().length < 2) return;
		nombreAgente = inputNombreAgente.trim();
		if (browser) {
			localStorage.setItem('nombreAgente', nombreAgente);
		}
		mostrarModalAgente = false;
		inputNombreAgente = '';
	}

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
			errorComentario = validacion.error || 'Archivo invalido';
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

		// Verificar que tenemos nombre de agente
		if (!nombreAgente) {
			mostrarModalAgente = true;
			return;
		}

		errorComentario = '';
		if (nuevoComentario.trim().length === 0) {
			errorComentario = 'El comentario no puede estar vacio';
			return;
		}

		try {
			enviandoComentario = true;
			// Agregar nombre del agente al comentario
			const contenidoConAgente = `**${nombreAgente}:** ${nuevoComentario}`;
			const comentario = await crearComentario(ticket.id, contenidoConAgente, capturaFile || undefined);
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
			ticket = ticket;
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
			day: 'numeric',
			month: 'short',
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

	function getEstadoColor(estado: Estado): string {
		const colores: Record<Estado, string> = {
			'Nuevo': '#3498db',
			'En Progreso': '#f39c12',
			'Resuelto': '#27ae60',
			'Cerrado': '#95a5a6'
		};
		return colores[estado] || '#95a5a6';
	}

	function cambiarAgente() {
		inputNombreAgente = nombreAgente;
		mostrarModalAgente = true;
	}

	function parsearComentario(contenido: string): { agente: string | null; texto: string } {
		const match = contenido.match(/^\*\*(.+?):\*\*\s*(.*)$/s);
		if (match) {
			return { agente: match[1], texto: match[2] };
		}
		return { agente: null, texto: contenido };
	}
</script>

<div class="page-wrapper">
	{#if cargando}
		<div class="loading">
			<div class="spinner"></div>
			<p>Cargando ticket...</p>
		</div>
	{:else if error}
		<div class="error-page">
			<div class="error-icon">!</div>
			<h2>{error}</h2>
			<a href="/tickets" class="btn-back">Volver a tickets</a>
		</div>
	{:else if ticket}
		<!-- Modal Nombre Agente -->
		{#if mostrarModalAgente}
			<div class="modal-overlay">
				<div class="modal-agent">
					<div class="modal-icon">👤</div>
					<h3>Identificate</h3>
					<p>Ingresa tu nombre para identificar tus comentarios</p>
					<input
						type="text"
						bind:value={inputNombreAgente}
						placeholder="Tu nombre..."
						on:keydown={(e) => e.key === 'Enter' && guardarNombreAgente()}
						autofocus
					/>
					<button class="btn-save" on:click={guardarNombreAgente} disabled={inputNombreAgente.trim().length < 2}>
						Guardar
					</button>
				</div>
			</div>
		{/if}

		<!-- Modal Eliminar -->
		{#if mostrarConfirmacionEliminar}
			<div class="modal-overlay">
				<div class="modal-delete">
					<div class="modal-icon danger">!</div>
					<h3>Eliminar Ticket</h3>
					<p>Esta accion no se puede deshacer</p>
					<div class="modal-buttons">
						<button class="btn-cancel" on:click={() => mostrarConfirmacionEliminar = false}>Cancelar</button>
						<button class="btn-delete" on:click={confirmarEliminar} disabled={eliminando}>
							{eliminando ? 'Eliminando...' : 'Eliminar'}
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Header -->
		<header class="ticket-header">
			<a href="/tickets" class="back-btn">← Tickets</a>
			<div class="ticket-id">#{String(ticket.numero).padStart(5, '0')}</div>
			{#if nombreAgente}
				<button class="agent-badge" on:click={cambiarAgente}>
					👤 {nombreAgente}
				</button>
			{:else}
				<button class="agent-badge empty" on:click={() => mostrarModalAgente = true}>
					👤 Identificarse
				</button>
			{/if}
		</header>

		<main class="ticket-content">
			<!-- Info del ticket -->
			<section class="ticket-info">
				{#if modoEdicion}
					<div class="edit-mode">
						<h2>Editar Ticket</h2>
						<div class="edit-field">
							<label>Titulo</label>
							<input type="text" bind:value={editTitulo} />
						</div>
						<div class="edit-field">
							<label>Paciente</label>
							<input type="text" bind:value={editNombrePaciente} />
						</div>
						<div class="edit-field">
							<label>Categoria</label>
							<select bind:value={editCategoria}>
								{#each CATEGORIAS as cat}
									<option value={cat}>{cat}</option>
								{/each}
							</select>
						</div>
						<div class="edit-field">
							<label>Descripcion</label>
							<textarea bind:value={editDescripcion} rows="4"></textarea>
						</div>
						<div class="edit-buttons">
							<button class="btn-cancel" on:click={cancelarEdicion}>Cancelar</button>
							<button class="btn-save" on:click={guardarEdicion} disabled={guardandoEdicion}>
								{guardandoEdicion ? 'Guardando...' : 'Guardar'}
							</button>
						</div>
					</div>
				{:else}
					<div class="ticket-top">
						<h1>{ticket.titulo}</h1>
						<div class="ticket-actions">
							<button class="btn-icon edit" on:click={iniciarEdicion} title="Editar">✏️</button>
							<button class="btn-icon delete" on:click={() => mostrarConfirmacionEliminar = true} title="Eliminar">🗑️</button>
						</div>
					</div>

					<div class="ticket-badges">
						<span class="badge estado" style="background: {getEstadoColor(ticket.estado)}">{ticket.estado}</span>
						<span class="badge categoria">{ticket.categoria}</span>
						<span class="badge paciente">👤 {ticket.nombre_paciente}</span>
					</div>

					<div class="estado-change">
						<label>Cambiar estado:</label>
						<select bind:value={ticket.estado} on:change={(e) => cambiarEstado(e.currentTarget.value as Estado)} disabled={cambiandoEstado}>
							{#each ESTADOS as estado}
								<option value={estado}>{estado}</option>
							{/each}
						</select>
					</div>

					<div class="ticket-desc">
						<p>{ticket.descripcion}</p>
					</div>

					{#if ticket.captura_url}
						<div class="ticket-image">
							<img src={ticket.captura_url} alt="Captura" />
						</div>
					{/if}

					<div class="ticket-date">
						Creado: {formatearFecha(ticket.created_at)}
					</div>
				{/if}
			</section>

			<!-- Comentarios -->
			<section class="comments-section">
				<h2>Comentarios <span class="count">{comentarios.length}</span></h2>

				<div class="comments-list">
					{#each comentarios as comentario}
						{@const parsed = parsearComentario(comentario.contenido)}
						<div class="comment">
							<div class="comment-header">
								{#if parsed.agente}
									<span class="comment-agent">{parsed.agente}</span>
								{:else}
									<span class="comment-agent anonymous">Anonimo</span>
								{/if}
								<span class="comment-date">{formatearFecha(comentario.created_at)}</span>
							</div>
							<div class="comment-body">
								<p>{parsed.texto}</p>
								{#if comentario.captura_url}
									<img src={comentario.captura_url} alt="Adjunto" class="comment-image" />
								{/if}
							</div>
						</div>
					{/each}

					{#if comentarios.length === 0}
						<div class="no-comments">
							<span>💬</span>
							<p>Sin comentarios aun</p>
						</div>
					{/if}
				</div>

				<!-- Nuevo comentario -->
				<div class="new-comment">
					<h3>Agregar comentario</h3>
					{#if !nombreAgente}
						<div class="agent-warning">
							<button on:click={() => mostrarModalAgente = true}>👤 Identificate primero</button>
						</div>
					{:else}
						<form on:submit|preventDefault={enviarComentario}>
							<textarea
								bind:value={nuevoComentario}
								placeholder="Escribe tu comentario..."
								rows="3"
							></textarea>

							<div class="file-input">
								<label for="file-comment">📎 Adjuntar imagen</label>
								<input id="file-comment" type="file" accept="image/*" on:change={manejarArchivoSeleccionado} />
							</div>

							{#if capturaPreview}
								<div class="preview">
									<img src={capturaPreview} alt="Preview" />
									<button type="button" class="remove-btn" on:click={() => { capturaFile = null; capturaPreview = null; }}>✕</button>
								</div>
							{/if}

							{#if errorComentario}
								<div class="error-msg">{errorComentario}</div>
							{/if}

							<button type="submit" class="btn-submit" disabled={enviandoComentario || !nuevoComentario.trim()}>
								{enviandoComentario ? 'Enviando...' : 'Enviar'}
							</button>
						</form>
					{/if}
				</div>
			</section>
		</main>
	{/if}
</div>

<style>
	.page-wrapper {
		min-height: 100vh;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
	}

	/* Loading */
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		color: white;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255,255,255,0.2);
		border-top-color: #3498db;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Error */
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		color: white;
		text-align: center;
		padding: 2rem;
	}

	.error-icon {
		width: 60px;
		height: 60px;
		background: #e74c3c;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 1rem;
	}

	.btn-back {
		margin-top: 1rem;
		padding: 0.75rem 2rem;
		background: #3498db;
		color: white;
		text-decoration: none;
		border-radius: 8px;
		font-weight: 600;
	}

	/* Header */
	.ticket-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: rgba(255,255,255,0.05);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(255,255,255,0.1);
	}

	.back-btn {
		color: rgba(255,255,255,0.8);
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 1rem;
		background: rgba(255,255,255,0.1);
		border-radius: 6px;
		transition: background 0.2s;
	}

	.back-btn:hover {
		background: rgba(255,255,255,0.2);
	}

	.ticket-id {
		font-family: monospace;
		font-size: 1.25rem;
		color: #3498db;
		font-weight: bold;
	}

	.agent-badge {
		margin-left: auto;
		padding: 0.5rem 1rem;
		background: rgba(46, 204, 113, 0.2);
		border: 1px solid rgba(46, 204, 113, 0.4);
		color: #2ecc71;
		border-radius: 20px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.agent-badge:hover {
		background: rgba(46, 204, 113, 0.3);
	}

	.agent-badge.empty {
		background: rgba(231, 76, 60, 0.2);
		border-color: rgba(231, 76, 60, 0.4);
		color: #e74c3c;
	}

	/* Main content */
	.ticket-content {
		max-width: 900px;
		margin: 0 auto;
		padding: 1.5rem;
		display: grid;
		gap: 1.5rem;
	}

	/* Ticket info */
	.ticket-info {
		background: rgba(255,255,255,0.95);
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 4px 20px rgba(0,0,0,0.2);
	}

	.ticket-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.ticket-top h1 {
		font-size: 1.5rem;
		color: #2c3e50;
		margin: 0;
		flex: 1;
	}

	.ticket-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-icon {
		width: 36px;
		height: 36px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		transition: transform 0.2s, background 0.2s;
	}

	.btn-icon.edit {
		background: #ebf5fb;
	}

	.btn-icon.delete {
		background: #fdedec;
	}

	.btn-icon:hover {
		transform: scale(1.1);
	}

	.ticket-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.badge {
		padding: 0.4rem 0.8rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.badge.estado {
		color: white;
	}

	.badge.categoria {
		background: #e8f4fd;
		color: #2980b9;
	}

	.badge.paciente {
		background: #f5eef8;
		color: #8e44ad;
	}

	.estado-change {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.estado-change label {
		font-weight: 600;
		color: #5d6d7e;
		font-size: 0.9rem;
	}

	.estado-change select {
		padding: 0.5rem 1rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-weight: 600;
		background: white;
		cursor: pointer;
	}

	.ticket-desc {
		color: #34495e;
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	.ticket-image {
		border-radius: 8px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.ticket-image img {
		width: 100%;
		display: block;
	}

	.ticket-date {
		font-size: 0.85rem;
		color: #95a5a6;
	}

	/* Edit mode */
	.edit-mode h2 {
		margin: 0 0 1.5rem 0;
		color: #2c3e50;
	}

	.edit-field {
		margin-bottom: 1rem;
	}

	.edit-field label {
		display: block;
		font-weight: 600;
		color: #5d6d7e;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.edit-field input,
	.edit-field select,
	.edit-field textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 1rem;
		box-sizing: border-box;
		transition: border-color 0.2s;
	}

	.edit-field input:focus,
	.edit-field select:focus,
	.edit-field textarea:focus {
		outline: none;
		border-color: #3498db;
	}

	.edit-buttons {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	/* Comments */
	.comments-section {
		background: rgba(255,255,255,0.95);
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 4px 20px rgba(0,0,0,0.2);
	}

	.comments-section h2 {
		margin: 0 0 1rem 0;
		color: #2c3e50;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.count {
		background: #3498db;
		color: white;
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
		font-size: 0.85rem;
	}

	.comments-list {
		margin-bottom: 1.5rem;
	}

	.comment {
		background: #f8f9fa;
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 0.75rem;
		border-left: 4px solid #3498db;
	}

	.comment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.comment-agent {
		font-weight: 700;
		color: #2c3e50;
	}

	.comment-agent.anonymous {
		color: #95a5a6;
		font-style: italic;
	}

	.comment-date {
		font-size: 0.8rem;
		color: #95a5a6;
	}

	.comment-body p {
		margin: 0;
		color: #34495e;
		line-height: 1.5;
	}

	.comment-image {
		margin-top: 0.75rem;
		max-width: 300px;
		border-radius: 8px;
	}

	.no-comments {
		text-align: center;
		padding: 2rem;
		color: #95a5a6;
	}

	.no-comments span {
		font-size: 2rem;
		display: block;
		margin-bottom: 0.5rem;
	}

	/* New comment */
	.new-comment {
		border-top: 2px solid #ecf0f1;
		padding-top: 1.5rem;
	}

	.new-comment h3 {
		margin: 0 0 1rem 0;
		color: #2c3e50;
		font-size: 1.1rem;
	}

	.agent-warning {
		text-align: center;
		padding: 1rem;
	}

	.agent-warning button {
		padding: 0.75rem 1.5rem;
		background: #f39c12;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.agent-warning button:hover {
		background: #e67e22;
	}

	.new-comment textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		resize: vertical;
		box-sizing: border-box;
		margin-bottom: 1rem;
	}

	.new-comment textarea:focus {
		outline: none;
		border-color: #3498db;
	}

	.file-input {
		margin-bottom: 1rem;
	}

	.file-input label {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: #f0f0f0;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s;
	}

	.file-input label:hover {
		background: #e0e0e0;
	}

	.file-input input {
		display: none;
	}

	.preview {
		position: relative;
		display: inline-block;
		margin-bottom: 1rem;
	}

	.preview img {
		max-width: 200px;
		border-radius: 8px;
	}

	.remove-btn {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 24px;
		height: 24px;
		background: #e74c3c;
		color: white;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.error-msg {
		background: #fdedec;
		color: #c0392b;
		padding: 0.75rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.btn-submit {
		width: 100%;
		padding: 0.75rem;
		background: #3498db;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-submit:hover:not(:disabled) {
		background: #2980b9;
	}

	.btn-submit:disabled {
		background: #bdc3c7;
		cursor: not-allowed;
	}

	/* Modals */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-agent, .modal-delete {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		max-width: 360px;
		width: 100%;
		text-align: center;
	}

	.modal-icon {
		width: 60px;
		height: 60px;
		background: #ebf5fb;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		margin: 0 auto 1rem;
	}

	.modal-icon.danger {
		background: #fdedec;
		color: #e74c3c;
		font-weight: bold;
		font-size: 2rem;
	}

	.modal-agent h3, .modal-delete h3 {
		margin: 0 0 0.5rem 0;
		color: #2c3e50;
	}

	.modal-agent p, .modal-delete p {
		color: #7f8c8d;
		margin-bottom: 1.5rem;
	}

	.modal-agent input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 1rem;
		text-align: center;
		margin-bottom: 1rem;
		box-sizing: border-box;
	}

	.modal-agent input:focus {
		outline: none;
		border-color: #3498db;
	}

	.btn-save {
		width: 100%;
		padding: 0.75rem;
		background: #2ecc71;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-save:disabled {
		background: #bdc3c7;
		cursor: not-allowed;
	}

	.modal-buttons {
		display: flex;
		gap: 1rem;
	}

	.btn-cancel, .btn-delete {
		flex: 1;
		padding: 0.75rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-cancel {
		background: #ecf0f1;
		color: #2c3e50;
	}

	.btn-delete {
		background: #e74c3c;
		color: white;
	}

	.btn-delete:disabled {
		opacity: 0.6;
	}

	@media (max-width: 640px) {
		.ticket-header {
			flex-wrap: wrap;
		}

		.agent-badge {
			margin-left: 0;
			flex: 1;
			text-align: center;
		}

		.ticket-top {
			flex-direction: column;
		}

		.ticket-actions {
			width: 100%;
		}

		.ticket-actions .btn-icon {
			flex: 1;
			height: 44px;
		}
	}
</style>
