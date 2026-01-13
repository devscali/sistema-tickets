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
	@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');

	:global(body) {
		font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 1.5rem;
		position: relative;
		z-index: 1;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 3rem;
		flex-wrap: wrap;
		gap: 1.5rem;
		animation: fadeInDown 0.8s ease;
	}

	@keyframes fadeInDown {
		from {
			opacity: 0;
			transform: translateY(-30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	header h1 {
		margin: 0;
		font-size: 3rem;
		font-weight: 900;
		background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 30%, #e0f2fe 60%, #ffffff 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.3)) drop-shadow(0 2px 8px rgba(255, 255, 255, 0.5));
		letter-spacing: -0.03em;
	}

	.btn-primary {
		display: inline-block;
		padding: 0.95rem 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
		background-size: 200% 200%;
		color: white;
		text-decoration: none;
		border-radius: 16px;
		font-weight: 800;
		transition: all 0.3s ease;
		box-shadow:
			0 8px 24px rgba(102, 126, 234, 0.5),
			inset 0 2px 0 rgba(255, 255, 255, 0.25);
		letter-spacing: 0.02em;
		animation: buttonGlow 3s ease infinite;
	}

	@keyframes buttonGlow {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}

	.btn-primary:hover {
		transform: translateY(-3px) scale(1.03);
		box-shadow:
			0 10px 32px rgba(102, 126, 234, 0.6),
			inset 0 2px 0 rgba(255, 255, 255, 0.35);
	}

	.filters {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 3rem;
		flex-wrap: wrap;
		animation: fadeInUp 0.8s ease 0.2s both;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.filter-group {
		flex: 1;
		min-width: 240px;
	}

	.filter-group label {
		display: block;
		margin-bottom: 0.75rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.95);
		font-size: 0.95rem;
		letter-spacing: 0.01em;
	}

	.filter-group select {
		width: 100%;
		padding: 1rem 1.25rem;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		font-size: 1rem;
		font-family: inherit;
		color: white;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.filter-group select option {
		background: #203a43;
		color: white;
	}

	.filter-group select:focus {
		outline: none;
		border-color: rgba(60, 186, 146, 0.5);
		background: rgba(255, 255, 255, 0.2);
		box-shadow: 0 0 0 4px rgba(60, 186, 146, 0.15);
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
		gap: 2rem;
		animation: fadeInUp 0.8s ease 0.3s both;
	}

	.ticket-card {
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(30px) saturate(180%);
		-webkit-backdrop-filter: blur(30px) saturate(180%);
		border-radius: 24px;
		padding: 2rem;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.25),
			0 16px 64px rgba(11, 163, 96, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.25);
		border: 1.5px solid rgba(60, 186, 146, 0.25);
		text-decoration: none;
		color: inherit;
		transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		display: block;
		position: relative;
		overflow: hidden;
	}

	.ticket-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(60, 186, 146, 0.08), transparent);
		transition: left 0.6s ease;
	}

	.ticket-card:hover::before {
		left: 100%;
	}

	.ticket-card:hover {
		transform: translateY(-8px) scale(1.02);
		box-shadow:
			0 12px 48px rgba(0, 0, 0, 0.3),
			0 20px 80px rgba(11, 163, 96, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.35);
		border-color: rgba(60, 186, 146, 0.5);
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
		color: rgba(60, 186, 146, 0.9);
		font-size: 0.95rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.badge {
		padding: 0.35rem 0.9rem;
		border-radius: 14px;
		font-size: 0.8rem;
		font-weight: 700;
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	:global(.bg-blue-500) {
		background: linear-gradient(135deg, #3498db, #2980b9);
	}
	:global(.bg-yellow-500) {
		background: linear-gradient(135deg, #f39c12, #e67e22);
	}
	:global(.bg-green-500) {
		background: linear-gradient(135deg, #0ba360, #3cba92);
	}
	:global(.bg-gray-500) {
		background: linear-gradient(135deg, #95a5a6, #7f8c8d);
	}

	.ticket-titulo {
		margin: 0 0 1rem 0;
		color: white;
		font-size: 1.25rem;
		line-height: 1.4;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.ticket-descripcion {
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.6;
		margin: 0 0 1.25rem 0;
		font-size: 0.95rem;
		font-weight: 400;
	}

	.ticket-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(60, 186, 146, 0.2);
	}

	.categoria-badge {
		font-size: 0.85rem;
		color: rgba(60, 186, 146, 1);
		font-weight: 600;
		background: rgba(60, 186, 146, 0.15);
		padding: 0.35rem 0.75rem;
		border-radius: 10px;
		border: 1px solid rgba(60, 186, 146, 0.3);
	}

	.comentarios-count {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}

	.ticket-date {
		margin-top: 1rem;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.5);
		font-weight: 400;
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
