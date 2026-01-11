<script lang="ts">
	import { goto } from '$app/navigation';
	import { crearTicket, validarImagen } from '$lib/ticketService';
	import { CATEGORIAS, type Categoria } from '$lib/types';

	let titulo = '';
	let descripcion = '';
	let categoria: Categoria = 'Problema Técnico';
	let capturaFile: File | null = null;
	let capturaPreview: string | null = null;

	let cargando = false;
	let error = '';

	// Manejar selección de archivo
	function manejarArchivoSeleccionado(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		// Validar imagen
		const validacion = validarImagen(file);
		if (!validacion.valido) {
			error = validacion.error || 'Archivo inválido';
			capturaFile = null;
			capturaPreview = null;
			return;
		}

		// Guardar archivo y crear preview
		capturaFile = file;
		error = '';

		const reader = new FileReader();
		reader.onload = (e) => {
			capturaPreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	// Enviar formulario
	async function enviarFormulario() {
		error = '';

		// Validaciones
		if (titulo.length < 15) {
			error = 'El título debe tener al menos 15 caracteres';
			return;
		}

		if (descripcion.length < 100) {
			error = 'La descripción debe tener al menos 100 caracteres';
			return;
		}

		if (!capturaFile) {
			error = 'Debes adjuntar una captura de pantalla';
			return;
		}

		try {
			cargando = true;

			// Crear ticket
			const nuevoTicket = await crearTicket(titulo, descripcion, categoria, capturaFile);

			// Redirigir a la página del ticket
			goto(`/ticket/${nuevoTicket.numero}`);
		} catch (err) {
			console.error('Error al crear ticket:', err);
			error = 'Hubo un error al crear el ticket. Intenta de nuevo.';
			cargando = false;
		}
	}
</script>

<div class="container">
	<header>
		<h1>🎫 Sistema de Tickets</h1>
		<p>Reporta incidencias de forma clara y estructurada</p>
		<a href="/tickets" class="btn-secondary">Ver todos los tickets →</a>
	</header>

	<main>
		<div class="form-card">
			<h2>Crear Nuevo Ticket</h2>

			<form on:submit|preventDefault={enviarFormulario}>
				<!-- Categoría -->
				<div class="form-group">
					<label for="categoria">
						Categoría <span class="required">*</span>
					</label>
					<select id="categoria" bind:value={categoria} required>
						{#each CATEGORIAS as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</div>

				<!-- Título -->
				<div class="form-group">
					<label for="titulo">
						Título <span class="required">*</span>
						<span class="hint">(mínimo 15 caracteres)</span>
					</label>
					<input
						id="titulo"
						type="text"
						bind:value={titulo}
						placeholder="Describe brevemente el problema..."
						required
						minlength="15"
					/>
					<span class="char-count">{titulo.length}/15</span>
				</div>

				<!-- Descripción -->
				<div class="form-group">
					<label for="descripcion">
						Descripción Detallada <span class="required">*</span>
						<span class="hint">(mínimo 100 caracteres)</span>
					</label>
					<textarea
						id="descripcion"
						bind:value={descripcion}
						placeholder="Explica en detalle qué sucedió, cuándo ocurrió, qué pasos seguiste, etc. Entre más información proporciones, más rápido podremos ayudarte."
						required
						minlength="100"
						rows="8"
					></textarea>
					<span class="char-count">{descripcion.length}/100</span>
				</div>

				<!-- Captura de pantalla -->
				<div class="form-group">
					<label for="captura">
						Captura de Pantalla <span class="required">*</span>
						<span class="hint">(máx. 5MB)</span>
					</label>
					<input
						id="captura"
						type="file"
						accept="image/*"
						on:change={manejarArchivoSeleccionado}
						required
					/>

					{#if capturaPreview}
						<div class="image-preview">
							<img src={capturaPreview} alt="Preview" />
						</div>
					{/if}
				</div>

				<!-- Error -->
				{#if error}
					<div class="error-message">
						⚠️ {error}
					</div>
				{/if}

				<!-- Botón enviar -->
				<button type="submit" class="btn-primary" disabled={cargando}>
					{cargando ? 'Creando ticket...' : 'Crear Ticket'}
				</button>
			</form>
		</div>
	</main>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		background: linear-gradient(135deg, #0f2027 0%, #203a43 25%, #2c5364 50%, #0ba360 75%, #3cba92 100%);
		background-size: 400% 400%;
		animation: gradientShift 20s ease infinite;
		min-height: 100vh;
		position: relative;
		overflow-x: hidden;
	}

	:global(body::before) {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background:
			radial-gradient(circle at 20% 30%, rgba(11, 163, 96, 0.4), transparent 40%),
			radial-gradient(circle at 80% 70%, rgba(60, 186, 146, 0.35), transparent 45%),
			radial-gradient(circle at 50% 50%, rgba(32, 58, 67, 0.3), transparent 50%),
			radial-gradient(circle at 10% 80%, rgba(15, 32, 39, 0.25), transparent 35%);
		pointer-events: none;
		z-index: 0;
		animation: floatBubbles 25s ease-in-out infinite;
	}

	:global(body::after) {
		content: '';
		position: fixed;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background:
			repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(11, 163, 96, 0.03) 2px, rgba(11, 163, 96, 0.03) 4px),
			repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(60, 186, 146, 0.03) 2px, rgba(60, 186, 146, 0.03) 4px);
		pointer-events: none;
		z-index: 0;
		animation: gridMove 40s linear infinite;
	}

	@keyframes gradientShift {
		0% { background-position: 0% 50%; }
		25% { background-position: 50% 75%; }
		50% { background-position: 100% 50%; }
		75% { background-position: 50% 25%; }
		100% { background-position: 0% 50%; }
	}

	@keyframes floatBubbles {
		0%, 100% { transform: translate(0, 0) scale(1); }
		25% { transform: translate(-20px, -20px) scale(1.05); }
		50% { transform: translate(20px, 20px) scale(0.95); }
		75% { transform: translate(-15px, 15px) scale(1.02); }
	}

	@keyframes gridMove {
		0% { transform: translate(0, 0); }
		100% { transform: translate(50px, 50px); }
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 3rem 1.5rem;
		position: relative;
		z-index: 1;
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
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
		font-size: 3.5rem;
		font-weight: 800;
		margin: 0 0 0.75rem 0;
		background: linear-gradient(135deg, #3cba92 0%, #0ba360 50%, #ffffff 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		filter: drop-shadow(0 4px 12px rgba(60, 186, 146, 0.4));
		letter-spacing: -0.02em;
	}

	header p {
		color: rgba(255, 255, 255, 0.9);
		font-size: 1.2rem;
		margin: 0 0 1.5rem 0;
		font-weight: 500;
	}

	.btn-secondary {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		color: white;
		text-decoration: none;
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		font-weight: 600;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.25);
		border-color: rgba(255, 255, 255, 0.5);
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	}

	.form-card {
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(30px) saturate(180%);
		-webkit-backdrop-filter: blur(30px) saturate(180%);
		border-radius: 32px;
		padding: 3rem;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.25),
			0 16px 64px rgba(11, 163, 96, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.25),
			inset 0 -1px 0 rgba(11, 163, 96, 0.2);
		border: 1.5px solid rgba(60, 186, 146, 0.3);
		animation: fadeInUp 0.8s ease;
		position: relative;
		overflow: hidden;
	}

	.form-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(60, 186, 146, 0.1), transparent);
		animation: shimmer 3s infinite;
	}

	@keyframes shimmer {
		0% { left: -100%; }
		100% { left: 100%; }
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

	.form-card h2 {
		margin: 0 0 2rem 0;
		color: white;
		font-size: 2rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.form-group {
		margin-bottom: 1.75rem;
	}

	label {
		display: block;
		margin-bottom: 0.6rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.95);
		font-size: 0.95rem;
		letter-spacing: 0.01em;
	}

	.required {
		color: #ff6b9d;
	}

	.hint {
		font-weight: 400;
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.85rem;
	}

	input[type='text'],
	select,
	textarea {
		width: 100%;
		padding: 1rem 1.25rem;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		font-size: 1rem;
		font-family: inherit;
		transition: all 0.3s ease;
		box-sizing: border-box;
		color: white;
		font-weight: 500;
	}

	input[type='text']::placeholder,
	textarea::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	select {
		color: white;
		cursor: pointer;
	}

	select option {
		background: #667eea;
		color: white;
	}

	input[type='text']:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.5);
		background: rgba(255, 255, 255, 0.2);
		box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
	}

	textarea {
		resize: vertical;
		min-height: 140px;
	}

	input[type='file'] {
		width: 100%;
		padding: 1.25rem;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 2px dashed rgba(255, 255, 255, 0.3);
		border-radius: 12px;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.9);
		transition: all 0.3s ease;
	}

	input[type='file']:hover {
		border-color: rgba(255, 255, 255, 0.5);
		background: rgba(255, 255, 255, 0.15);
	}

	.char-count {
		display: block;
		text-align: right;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 0.4rem;
		font-weight: 500;
	}

	.image-preview {
		margin-top: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 16px;
		overflow: hidden;
		max-width: 100%;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	}

	.image-preview img {
		width: 100%;
		height: auto;
		display: block;
	}

	.error-message {
		background: rgba(255, 107, 157, 0.2);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 2px solid rgba(255, 107, 157, 0.5);
		color: #ffe0e9;
		padding: 1rem 1.25rem;
		border-radius: 12px;
		margin-bottom: 1rem;
		font-weight: 500;
	}

	.btn-primary {
		width: 100%;
		padding: 1.25rem;
		background: linear-gradient(135deg, #0ba360 0%, #3cba92 50%, #0ba360 100%);
		background-size: 200% 200%;
		color: white;
		border: none;
		border-radius: 16px;
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow:
			0 8px 24px rgba(11, 163, 96, 0.5),
			0 4px 12px rgba(60, 186, 146, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
		letter-spacing: 0.02em;
		text-transform: uppercase;
		font-size: 0.95rem;
		position: relative;
		overflow: hidden;
	}

	.btn-primary::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s ease;
	}

	.btn-primary:hover:not(:disabled)::before {
		left: 100%;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-3px);
		box-shadow:
			0 12px 36px rgba(11, 163, 96, 0.6),
			0 6px 18px rgba(60, 186, 146, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		background-position: 100% 50%;
	}

	.btn-primary:active:not(:disabled) {
		transform: translateY(0);
	}

	.btn-primary:disabled {
		background: rgba(255, 255, 255, 0.2);
		cursor: not-allowed;
		box-shadow: none;
	}

	@media (max-width: 768px) {
		header h1 {
			font-size: 2.5rem;
		}

		.form-card {
			padding: 2rem 1.5rem;
		}
	}
</style>
