# 🚀 Guía de Configuración de Supabase

## Paso 1: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Click en "New Project"
4. Completa:
   - **Name**: `sistema-tickets` (o el nombre que prefieras)
   - **Database Password**: Guarda esta contraseña (la necesitarás)
   - **Region**: Elige la más cercana a ti
   - **Pricing Plan**: Free (suficiente para empezar)
5. Click "Create new project" (tarda ~2 minutos)

## Paso 2: Ejecutar el Schema SQL

1. En tu proyecto de Supabase, ve al menú lateral izquierdo
2. Click en **SQL Editor** (icono de base de datos)
3. Click en **New Query**
4. Copia TODO el contenido del archivo `supabase-schema.sql`
5. Pégalo en el editor
6. Click en **RUN** (abajo a la derecha)
7. Deberías ver: ✅ "Success. No rows returned"

**¿Qué acabas de hacer?**
- Creaste 2 tablas: `tickets` y `comentarios`
- Configuraste validaciones automáticas (títulos mínimo 15 chars, etc.)
- Habilitaste acceso público (sin login)
- Creaste índices para búsquedas rápidas

## Paso 3: Configurar Storage para Capturas

1. En el menú lateral, ve a **Storage**
2. Click en **Create a new bucket**
3. Configuración:
   - **Name**: `capturas`
   - **Public bucket**: ✅ **ACTIVADO** (importante!)
   - **File size limit**: 5 MB (suficiente para capturas)
   - **Allowed MIME types**: `image/*`
4. Click **Create bucket**

**Configurar políticas del bucket:**

1. Click en el bucket `capturas` que acabas de crear
2. Ve a la pestaña **Policies**
3. Click **New Policy** → **For full customization**
4. Crea 2 políticas:

### Política 1: Permitir subir archivos (INSERT)
```
Policy name: Permitir subir capturas públicamente
SELECT: (desmarcado)
INSERT: ✅ (marcado)
UPDATE: (desmarcado)
DELETE: (desmarcado)

Policy definition:
true
```

### Política 2: Permitir leer archivos (SELECT)
```
Policy name: Permitir leer capturas públicamente
SELECT: ✅ (marcado)
INSERT: (desmarcado)
UPDATE: (desmarcado)
DELETE: (desmarcado)

Policy definition:
true
```

## Paso 4: Obtener las Credenciales

1. Ve a **Project Settings** (icono de engranaje abajo a la izquierda)
2. Click en **API** en el menú lateral
3. Encontrarás:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Una key larga que empieza con `eyJ...`

**Guarda estos valores** - los necesitarás para conectar la app.

## Paso 5: Verificar que Todo Funciona

Vuelve al **SQL Editor** y ejecuta esta consulta:

```sql
-- Ver todas las tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

Deberías ver:
- ✅ tickets
- ✅ comentarios
- ✅ tickets_con_conteo

¡Listo! Tu base de datos Supabase está configurada.

---

## 📊 Conceptos Importantes de Supabase

### Row Level Security (RLS)
- Supabase bloquea TODO por defecto
- Nosotros lo habilitamos pero con políticas que permiten acceso público (`true`)
- Así cualquiera puede crear y ver tickets sin login

### Storage Buckets
- Son como "carpetas" para archivos
- Public = Las URLs son accesibles sin autenticación
- Perfect para nuestro caso de capturas de pantalla

### Realtime (Bonus!)
- Supabase tiene subscripciones en tiempo real
- Podríamos hacer que los tickets se actualicen automáticamente
- Lo agregamos después si quieres

---

## 🔑 Siguiente Paso

Cuando estés listo, me pasas:
- Tu **Project URL**
- Tu **anon key**

Y crearemos el proyecto Svelte conectado a Supabase.
