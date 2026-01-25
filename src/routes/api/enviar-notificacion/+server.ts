import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, numeroTicket, titulo, nombrePaciente } = await request.json();

		if (!email) {
			return json({ error: 'No hay email para notificar' }, { status: 400 });
		}

		if (!RESEND_API_KEY) {
			console.error('RESEND_API_KEY no configurada');
			return json({ error: 'Servicio de email no configurado' }, { status: 500 });
		}

		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${RESEND_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: 'Ciplastic CRM <onboarding@resend.dev>',
				to: [email],
				subject: `Tu ticket #${String(numeroTicket).padStart(5, '0')} ha sido resuelto`,
				html: `
					<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
						<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
							<h1 style="color: white; margin: 0; font-size: 24px;">Ciplastic CRM Care</h1>
						</div>
						<div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 16px 16px;">
							<h2 style="color: #27ae60; margin-top: 0;">Tu ticket ha sido resuelto</h2>
							<p style="color: #2c3e50; font-size: 16px;">Hola <strong>${nombrePaciente}</strong>,</p>
							<p style="color: #2c3e50; font-size: 16px;">Te informamos que tu ticket ha sido atendido y resuelto.</p>
							<div style="background: white; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0; border-radius: 4px;">
								<p style="margin: 0; color: #7f8c8d; font-size: 14px;">Ticket #${String(numeroTicket).padStart(5, '0')}</p>
								<p style="margin: 5px 0 0 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${titulo}</p>
							</div>
							<p style="color: #7f8c8d; font-size: 14px;">Si tienes alguna duda adicional, no dudes en contactarnos.</p>
							<p style="color: #2c3e50; font-size: 16px; margin-top: 30px;">Saludos,<br><strong>Equipo de Soporte</strong></p>
						</div>
					</div>
				`
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('Error de Resend:', errorData);
			return json({ error: 'Error enviando email' }, { status: 500 });
		}

		const data = await response.json();
		return json({ success: true, id: data.id });
	} catch (error) {
		console.error('Error en enviar-notificacion:', error);
		return json({ error: 'Error interno del servidor' }, { status: 500 });
	}
};
