<script lang="ts">
	import { page } from '$app/stores';

	// Obtener número de ticket de la URL si viene
	$: numeroTicket = $page.url.searchParams.get('ticket');
</script>

<div class="container">
	<div class="card">
		<div class="icon-success">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10"/>
				<path d="M8 12l2.5 2.5L16 9"/>
			</svg>
		</div>

		<h1>Ticket Registrado</h1>

		{#if numeroTicket}
			<p class="ticket-number">Ticket #{numeroTicket.padStart(5, '0')}</p>
		{/if}

		<p class="mensaje">Tu reporte ha sido recibido. Nuestro equipo lo revisara lo antes posible.</p>

		<div class="tips">
			<h2>Mientras tanto...</h2>
			<ul>
				<li>
					<svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"/>
						<path d="M12 6v6l4 2"/>
					</svg>
					<span><strong>Ten paciencia</strong> - Revisamos cada ticket en orden de llegada</span>
				</li>
				<li>
					<svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="2" y="3" width="20" height="14" rx="2"/>
						<path d="M8 21h8M12 17v4"/>
					</svg>
					<span><strong>Reinicia tu equipo</strong> - Muchos problemas se resuelven con un reinicio</span>
				</li>
				<li>
					<svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
					</svg>
					<span><strong>La operacion no puede parar</strong> - Si es urgente, contacta a tu supervisor</span>
				</li>
				<li>
					<svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
						<polyline points="22,6 12,13 2,6"/>
					</svg>
					<span><strong>Revisa tu correo</strong> - Te notificaremos cuando haya actualizaciones</span>
				</li>
			</ul>
		</div>

		<a href="/" class="btn-primary">Crear otro ticket</a>
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 15%, #0f3460 30%, #533483 45%, #2d4263 60%, #1e3a5f 75%, #192a3e 90%, #2c3e50 100%);
		background-size: 400% 400%;
		animation: gradientShift 25s ease infinite;
		min-height: 100vh;
	}

	@keyframes gradientShift {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}

	.container {
		max-width: 600px;
		margin: 0 auto;
		padding: 3rem 1.5rem;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card {
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(30px);
		-webkit-backdrop-filter: blur(30px);
		border-radius: 32px;
		padding: 3rem;
		text-align: center;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
		border: 1.5px solid rgba(60, 186, 146, 0.3);
		animation: fadeIn 0.6s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.icon-success {
		width: 80px;
		height: 80px;
		margin: 0 auto 1.5rem;
		background: linear-gradient(135deg, #3cba92, #0ba360);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.05); }
	}

	.icon-success svg {
		width: 40px;
		height: 40px;
		stroke: white;
	}

	h1 {
		color: white;
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
	}

	.ticket-number {
		color: #3cba92;
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 1rem;
	}

	.mensaje {
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
		margin: 0 0 2rem;
		line-height: 1.6;
	}

	.tips {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 16px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		text-align: left;
	}

	.tips h2 {
		color: white;
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 1rem;
	}

	.tips ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.tips li {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		color: rgba(255, 255, 255, 0.85);
		font-size: 0.9rem;
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	.tips li:last-child {
		margin-bottom: 0;
	}

	.tip-icon {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
		stroke: #3cba92;
	}

	.btn-primary {
		display: inline-block;
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		text-decoration: none;
		border-radius: 12px;
		font-weight: 600;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
	}

	@media (max-width: 768px) {
		.card {
			padding: 2rem 1.5rem;
		}

		h1 {
			font-size: 1.5rem;
		}
	}
</style>
