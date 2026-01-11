<script lang="ts">
	import { onMount } from 'svelte';
	import { obtenerTickets } from '$lib/ticketService';
	import { CATEGORIAS, ESTADOS, ESTADO_COLORES, type Categoria, type Estado, type TicketConConteo } from '$lib/types';

	let tickets: TicketConConteo[] = [];
	let cargando = true;
	let error = '';

	// Filtros
	let categoriaFiltro: Categoria | '' = '';
	let estadoFiltro: Estado | '' = '';

	onMount(async () => {
		await cargarTickets();
	});

	async function cargarTickets() {
		try {
			cargando = true;
			error = '';
			tickets = await obtenerTickets(
				categoriaFiltro || undefined,
				estadoFiltro || undefined
			);
		} catch (err) {
			console.error('Error al cargar tickets:', err);
			error = 'No se pudieron cargar los tickets';
		} finally {
			cargando = false;
		}
	}

	// Recargar cuando cambian los filtros
	$: if (categoriaFiltro !== undefined || estadoFiltro !== undefined) {
		cargarTickets();
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

<div class="container">
	<header>
		<h1>📋 Todos los Tickets</h1>
		<a href="/" class="btn-primary">+ Crear Nuevo Ticket</a>
	</header>

	<!-- Filtros -->
	<div class="filters">
		<div class="filter-group">
			<label for="categoria-filter">Filtrar por categoría:</label>
			<select id="categoria-filter" bind:value={categoriaFiltro}>
				<option value="">Todas las categorías</option>
				{#each CATEGORIAS as cat}
					<option value={cat}>{cat}</option>
				{/each}
			</select>
		</div>

		<div class="filter-group">
			<label for="estado-filter">Filtrar por estado:</label>
			<select id="estado-filter" bind:value={estadoFiltro}>
				<option value="">Todos los estados</option>
				{#each ESTADOS as est}
					<option value={est}>{est}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Lista de tickets -->
	{#if cargando}
		<div class="loading">Cargando tickets...</div>
	{:else if error}
		<div class="error-message">{error}</div>
	{:else if tickets.length === 0}
		<div class="empty-state">
			<p>No hay tickets que coincidan con los filtros.</p>
			<a href="/" class="btn-secondary">Crear el primer ticket</a>
		</div>
	{:else}
		<div class="tickets-grid">
			{#each tickets as ticket}
				<a href="/ticket/{ticket.numero}" class="ticket-card">
					<div class="ticket-header">
						<span class="ticket-numero">#{String(ticket.numero).padStart(5, '0')}</span>
						<span class="badge {ESTADO_COLORES[ticket.estado]}">{ticket.estado}</span>
					</div>

					<h3 class="ticket-titulo">{ticket.titulo}</h3>

					<p class="ticket-descripcion">
						{ticket.descripcion.substring(0, 150)}{ticket.descripcion.length > 150 ? '...' : ''}
					</p>

					<div class="ticket-footer">
						<span class="categoria-badge">{ticket.categoria}</span>
						<span class="comentarios-count">💬 {ticket.total_comentarios}</span>
					</div>

					<div class="ticket-date">
						{formatearFecha(ticket.created_at)}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	header h1 {
		margin: 0;
		color: #2c3e50;
	}

	.btn-primary {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: #3498db;
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 600;
		transition: background 0.2s;
	}

	.btn-primary:hover {
		background: #2980b9;
	}

	.filters {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.filter-group {
		flex: 1;
		min-width: 200px;
	}

	.filter-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #2c3e50;
	}

	.filter-group select {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		background: white;
	}

	.loading,
	.empty-state {
		text-align: center;
		padding: 3rem;
		background: white;
		border-radius: 12px;
		color: #7f8c8d;
	}

	.error-message {
		background: #fee;
		border: 2px solid #e74c3c;
		color: #c0392b;
		padding: 1rem;
		border-radius: 6px;
		text-align: center;
	}

	.btn-secondary {
		display: inline-block;
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: white;
		color: #3498db;
		text-decoration: none;
		border-radius: 6px;
		border: 2px solid #3498db;
		font-weight: 600;
	}

	.tickets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.ticket-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-decoration: none;
		color: inherit;
		transition: transform 0.2s, box-shadow 0.2s;
		display: block;
	}

	.ticket-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.ticket-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.ticket-numero {
		font-family: 'Courier New', monospace;
		font-weight: bold;
		color: #7f8c8d;
		font-size: 0.9rem;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 600;
		color: white;
	}

	:global(.bg-blue-500) {
		background: #3498db;
	}
	:global(.bg-yellow-500) {
		background: #f39c12;
	}
	:global(.bg-green-500) {
		background: #27ae60;
	}
	:global(.bg-gray-500) {
		background: #95a5a6;
	}

	.ticket-titulo {
		margin: 0 0 0.75rem 0;
		color: #2c3e50;
		font-size: 1.1rem;
		line-height: 1.4;
	}

	.ticket-descripcion {
		color: #7f8c8d;
		line-height: 1.5;
		margin: 0 0 1rem 0;
		font-size: 0.95rem;
	}

	.ticket-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid #ecf0f1;
	}

	.categoria-badge {
		font-size: 0.85rem;
		color: #3498db;
		font-weight: 500;
	}

	.comentarios-count {
		font-size: 0.9rem;
		color: #7f8c8d;
	}

	.ticket-date {
		margin-top: 0.75rem;
		font-size: 0.8rem;
		color: #95a5a6;
	}

	@media (max-width: 768px) {
		.tickets-grid {
			grid-template-columns: 1fr;
		}

		header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
