-- ============================================
-- SISTEMA DE TICKETS - ESQUEMA DE BASE DE DATOS
-- ============================================
-- Este archivo contiene todas las tablas y configuraciones
-- para tu sistema de tickets en Supabase

-- ============================================
-- TABLA: tickets
-- ============================================
-- Almacena todos los tickets/incidencias creadas
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL UNIQUE NOT NULL, -- #00001, #00002, etc.
  titulo VARCHAR(255) NOT NULL CHECK (char_length(titulo) >= 15),
  descripcion TEXT NOT NULL CHECK (char_length(descripcion) >= 50),
  nombre_paciente VARCHAR(255) NOT NULL CHECK (char_length(nombre_paciente) >= 2),
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
    'WhatsApp',
    'Messenger',
    'Instagram',
    'Entrenamiento de Bot',
    'Problema Técnico',
    'Otro'
  )),
  estado VARCHAR(20) NOT NULL DEFAULT 'Nuevo' CHECK (estado IN (
    'Nuevo',
    'En Progreso',
    'Resuelto',
    'Cerrado'
  )),
  captura_url TEXT NOT NULL, -- URL de la captura en Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_tickets_numero ON tickets(numero);
CREATE INDEX idx_tickets_categoria ON tickets(categoria);
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- ============================================
-- TABLA: comentarios
-- ============================================
-- Almacena los comentarios en cada ticket
CREATE TABLE comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL CHECK (char_length(contenido) >= 1),
  captura_url TEXT, -- Opcional: captura adjunta al comentario
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para obtener comentarios de un ticket rápidamente
CREATE INDEX idx_comentarios_ticket_id ON comentarios(ticket_id);
CREATE INDEX idx_comentarios_created_at ON comentarios(created_at);

-- ============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================
-- Esta función actualiza el campo updated_at cada vez que se modifica un ticket
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función antes de cada UPDATE
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Por defecto Supabase bloquea el acceso. Como queremos acceso público,
-- habilitamos RLS pero permitimos todas las operaciones.

-- Habilitar RLS en las tablas
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas para tickets: permitir todo a todos (acceso público)
CREATE POLICY "Permitir lectura pública de tickets"
  ON tickets FOR SELECT
  USING (true);

CREATE POLICY "Permitir creación pública de tickets"
  ON tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de tickets"
  ON tickets FOR UPDATE
  USING (true);

-- Políticas para comentarios: permitir todo a todos
CREATE POLICY "Permitir lectura pública de comentarios"
  ON comentarios FOR SELECT
  USING (true);

CREATE POLICY "Permitir creación pública de comentarios"
  ON comentarios FOR INSERT
  WITH CHECK (true);

-- ============================================
-- VISTA: tickets_con_conteo
-- ============================================
-- Vista útil que muestra tickets con el número de comentarios
CREATE VIEW tickets_con_conteo AS
SELECT
  t.*,
  COUNT(c.id) as total_comentarios
FROM tickets t
LEFT JOIN comentarios c ON t.id = c.id
GROUP BY t.id
ORDER BY t.created_at DESC;

-- ============================================
-- DATOS DE EJEMPLO (opcional - puedes borrar esto)
-- ============================================
-- Descomenta estas líneas si quieres datos de prueba

-- INSERT INTO tickets (titulo, descripcion, categoria, captura_url) VALUES
-- ('El botón de login no responde al hacer clic', 'Cuando intento hacer clic en el botón de login en la página principal, no pasa nada. He probado en Chrome y Firefox. El problema comenzó desde esta mañana. Adjunto captura de pantalla mostrando el botón.', 'Problema Técnico', 'https://placeholder.com/screenshot1.png'),
-- ('Agregar modo oscuro a la aplicación', 'Me gustaría que agregaran un modo oscuro a la aplicación. Muchos usuarios lo han solicitado y sería genial tenerlo. Debería poder activarse desde la configuración y recordar la preferencia del usuario entre sesiones.', 'Solicitud de Función', 'https://placeholder.com/screenshot2.png');
