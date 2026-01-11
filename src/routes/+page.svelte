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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
		background-size: 400% 400%;
		animation: gradientShift 15s ease infinite;
		min-height: 100vh;
		position: relative;
	}

	:global(body::before) {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background:
			radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%),
			radial-gradient(circle at 80% 80%, rgba(72, 219, 251, 0.3), transparent 50%),
			radial-gradient(circle at 40% 20%, rgba(99, 179, 237, 0.2), transparent 50%);
		pointer-events: none;
		z-index: 0;
	}

	@keyframes gradientShift {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
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
		background: linear-gradient(135deg, #ffffff 0%, #e0f7ff 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: 24px;
		padding: 3rem;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.2);
		animation: fadeInUp 0.8s ease;
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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 14px;
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
		letter-spacing: 0.02em;
		text-transform: uppercase;
		font-size: 0.95rem;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
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
