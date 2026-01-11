# 🎫 Sistema de Tickets

Sistema de gestión de incidencias sin autenticación, diseñado para capturar reportes detallados y evitar mensajes vagos como "no sirve".

## ✨ Características

- ✅ **Sin login**: Acceso público para crear y ver tickets
- ✅ **Validaciones estrictas**: Títulos mínimo 15 caracteres, descripciones mínimo 100 caracteres
- ✅ **Capturas obligatorias**: Todas las incidencias requieren screenshot
- ✅ **Categorización**: 6 categorías predefinidas
- ✅ **Estados**: Nuevo → En Progreso → Resuelto → Cerrado
- ✅ **Comentarios**: Sistema de seguimiento con capturas opcionales
- ✅ **Filtros**: Por categoría y estado
- ✅ **Numeración secuencial**: #00001, #00002, etc.
- ✅ **Responsive**: Funciona en móvil, tablet y desktop

## 🚀 Instalación

### 1. Clonar el proyecto

```bash
cd sistema-tickets
npm install
```

### 2. Configurar Supabase

#### 2.1. Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Click en "New Project"
4. Completa los datos y guarda la contraseña de la base de datos
5. Espera ~2 minutos a que se cree el proyecto

#### 2.2. Ejecutar el schema SQL

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Click en **New Query**
3. Copia TODO el contenido del archivo `supabase-schema.sql` (que está en la raíz del proyecto)
4. Pégalo en el editor
5. Click en **RUN**
6. Deberías ver: ✅ "Success. No rows returned"

#### 2.3. Configurar Storage

1. Ve a **Storage** en el menú lateral
2. Click **Create a new bucket**
3. Configuración:
   - **Name**: `capturas`
   - **Public bucket**: ✅ **ACTIVADO**
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/*`
4. Click **Create bucket**

**Crear políticas del bucket:**

1. Click en el bucket `capturas`
2. Ve a **Policies**
3. Click **New Policy** → **For full customization**

**Política 1: Subir archivos**
```
Policy name: Permitir subir capturas públicamente
INSERT: ✅ (marcado)
Policy definition: true
```

**Política 2: Leer archivos**
```
Policy name: Permitir leer capturas públicamente
SELECT: ✅ (marcado)
Policy definition: true
```

#### 2.4. Obtener credenciales

1. Ve a **Project Settings** → **API**
2. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: La key larga

### 3. Configurar variables de entorno

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` y completa:
```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
NOTIFICATION_EMAIL=tu-email@ejemplo.com
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

## 📁 Estructura del Proyecto

```
sistema-tickets/
├── src/
│   ├── lib/
│   │   ├── supabaseClient.ts    # Cliente de Supabase
│   │   ├── ticketService.ts     # Funciones para interactuar con la BD
│   │   └── types.ts             # Tipos TypeScript
│   └── routes/
│       ├── +page.svelte         # Página principal (crear ticket)
│       ├── tickets/
│       │   └── +page.svelte     # Lista de todos los tickets
│       └── ticket/[numero]/
│           └── +page.svelte     # Detalle de ticket y comentarios
├── supabase-schema.sql          # Schema de la base de datos
├── SUPABASE-SETUP.md            # Guía detallada de Supabase
└── README.md                    # Este archivo
```

## 🎯 Uso

### Crear un ticket

1. Ve a la página principal
2. Selecciona una categoría
3. Escribe un título descriptivo (mín. 15 caracteres)
4. Describe el problema en detalle (mín. 100 caracteres)
5. Adjunta una captura de pantalla
6. Click en "Crear Ticket"
7. Serás redirigido al ticket creado con su número único

### Ver todos los tickets

1. Click en "Ver todos los tickets" desde la página principal
2. Usa los filtros para buscar por categoría o estado
3. Click en cualquier ticket para ver detalles

### Comentar en un ticket

1. Abre un ticket específico
2. Escribe tu comentario en la parte inferior
3. Opcionalmente adjunta una captura
4. Click en "Publicar Comentario"

### Cambiar estado de un ticket

1. Abre un ticket específico
2. Usa el selector de estado en la parte superior
3. El estado se actualiza automáticamente

## 📊 Categorías Disponibles

- **Reporte de Bug**: Errores en el sistema
- **Solicitud de Función**: Nuevas características
- **Problema Técnico**: Dificultades técnicas generales
- **Facturación**: Problemas con pagos o facturas
- **Problema de Cuenta**: Acceso o configuración de cuenta
- **Pregunta General**: Consultas diversas

## 🎨 Personalización

### Cambiar categorías

Edita el archivo `src/lib/types.ts`:

```typescript
export const CATEGORIAS: Categoria[] = [
	'Tu Categoría 1',
	'Tu Categoría 2',
	// ...
];
```

También actualiza el schema SQL con las nuevas categorías.

### Cambiar validaciones

Edita `src/lib/types.ts` y las páginas correspondientes para ajustar:
- Longitud mínima de título/descripción
- Tamaño máximo de archivos
- Estados disponibles

## 🚀 Deployment en Vercel

1. Sube el proyecto a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Selecciona tu repositorio
5. Agrega las variables de entorno:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

¡Listo! Tu sistema de tickets estará en producción.

## 🔧 Próximas Mejoras (Opcionales)

- [ ] Notificaciones por email (Resend + Edge Functions)
- [ ] Búsqueda por texto
- [ ] Exportar tickets a CSV
- [ ] Actualizaciones en tiempo real (Supabase Realtime)
- [ ] Asignación de tickets a usuarios
- [ ] Prioridades (Baja, Media, Alta, Crítica)
- [ ] Etiquetas personalizadas

## 🆘 Solución de Problemas

### Error: "Faltan las credenciales de Supabase"

Asegúrate de haber creado el archivo `.env` con las credenciales correctas.

### Error al subir imágenes

Verifica que:
1. El bucket `capturas` existe en Supabase Storage
2. El bucket es público
3. Las políticas de RLS están configuradas correctamente

### Los tickets no se cargan

Revisa que:
1. El schema SQL se ejecutó correctamente
2. Las políticas de RLS permiten acceso público
3. Las credenciales en `.env` son correctas

## 📝 Licencia

Este proyecto es de código abierto. Úsalo como quieras.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Abre un issue o pull request.

---

**Hecho con ❤️ usando Svelte + Supabase**
