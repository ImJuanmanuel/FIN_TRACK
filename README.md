# Finanzas personales

Aplicacion web en React + TypeScript para gestionar ingresos, gastos y presupuesto mensual con login y base de datos en Supabase.

## Funciones

- Login y registro con correo y contrasena.
- Datos aislados por usuario con Row Level Security.
- Registro de ingresos y gastos.
- Categorias de gasto: comida, transporte, vivienda, servicios, entretenimiento, salud y otros.
- Resumen de gastos del dia, semana y mes.
- Saldo disponible calculado automaticamente.
- Presupuesto mensual guardado por usuario y mes.
- Aviso visual al usar 85% o mas del presupuesto.
- Historial de movimientos con filtros por tipo, fecha y categoria.
- Edicion y eliminacion de movimientos.
- Graficas de ingresos/gastos y gastos por categoria.
- Soporte PWA web con manifest y service worker.

## Tecnologias

- React
- TypeScript
- Vite
- Supabase Auth
- Supabase Postgres
- Recharts
- Lucide React

## Configurar Supabase

1. Crea un proyecto en https://supabase.com.
2. En Supabase, abre SQL Editor.
3. Copia y ejecuta el contenido de `supabase/schema.sql`.
4. Ve a Project Settings > API.
5. Copia:
   - Project URL
   - Publishable key
6. Crea un archivo `.env.local` en la raiz del proyecto:

```bash
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY
```

Puedes usar `.env.example` como plantilla.

## Ejecutar en desarrollo

```bash
pnpm install
pnpm dev
```

Si usas npm:

```bash
npm install
npm run dev
```

## Generar version final

```bash
pnpm build
```

La salida queda en la carpeta `dist/`.

## Publicar en Vercel

### Opcion sin repositorio: Vercel CLI

Desde esta carpeta:

```bash
pnpm dlx vercel login
pnpm dlx vercel
```

En la primera ejecucion, Vercel te pedira crear o vincular un proyecto. Puedes responder:

- Set up and deploy: Yes
- Link to existing project: No
- Framework Preset: Vite
- Build Command: `pnpm build`
- Output Directory: `dist`

Luego agrega las variables de entorno en Vercel:

```bash
pnpm dlx vercel env add VITE_SUPABASE_URL production
pnpm dlx vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
```

Finalmente publica a produccion:

```bash
pnpm dlx vercel --prod
```

### Opcion recomendada: GitHub + Vercel

1. Crea un repositorio en GitHub.
2. Sube este proyecto al repositorio.
3. Entra a https://vercel.com e inicia sesion.
4. Haz clic en Add New Project.
5. Importa el repositorio de GitHub.
6. Vercel debe detectar Vite automaticamente.
7. Usa esta configuracion:
   - Framework Preset: Vite
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`
8. En Environment Variables agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
9. Haz clic en Deploy.

### Configurar URLs de autenticacion

En Supabase, ve a Authentication > URL Configuration.

Agrega tu URL de Vercel, por ejemplo:

```txt
https://tu-proyecto.vercel.app
```

Si usas confirmacion por correo, agrega tambien esa URL en Redirect URLs.

## Base de datos

Supabase Auth maneja los usuarios. La app usa estas tablas:

- `movements`: ingresos y gastos del usuario.
- `monthly_budgets`: presupuesto mensual del usuario.

Ambas tablas tienen `user_id` y politicas RLS para que cada usuario solo pueda leer, crear, editar y eliminar sus propios datos.

La app ya no guarda movimientos ni presupuestos en `localStorage`. Supabase puede guardar la sesion del usuario en el navegador para mantenerlo conectado.
