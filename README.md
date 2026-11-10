# COINER PADEL TOUR

Web (instalable en el celular) para gestionar el torneo de pádel: ranking, fechas, admin y galería de recuerdos.

## Qué incluye

| Sección | Quién | Qué hace |
|---|---|---|
| **Inicio** | Público | Carrusel de fotos, torneo en curso, avance de fechas, Top 5 |
| **Ranking** | Público | Por torneo o histórico, filtro Todos / Mujeres / Hombres, campeona y campeón |
| **Galería** | Público (subir: jugadores) | Fotos por fecha, me gusta y comentarios. Las fotos se comprimen en el celular antes de subirlas |
| **Mi perfil** | Jugador | Posición, puntos, efectividad, historial por fecha, cambiar foto, apodo y clave |
| **Admin** | Admin | Jugadores (crear, editar, resetear clave, dar admin), torneos (10 fechas automáticas), contadores por fecha, auditoría |

**Puntaje:** puntos = games ganados + 3 × partidos ganados. **Desempate:** puntos → games → ganados.
**Estados del torneo:** Próximamente → En curso → Finalizado (al finalizar se declaran campeona y campeón).
Todo cambio en los contadores queda en **Auditoría**, y el ranking se recalcula solo.

## Puesta en marcha (≈20 minutos, costo $0)

### 1. Supabase (base de datos, login y fotos)
1. Crea una cuenta en https://supabase.com y un proyecto nuevo (plan Free).
2. Ve a **SQL Editor → New query**, pega el contenido de `supabase/migrations/001_schema.sql` y presiona **Run**.
3. Repite con `supabase/migrations/002_storage.sql`.
4. En **Authentication → Sign In / Providers**, desactiva **"Allow new users to sign up"**: así solo el admin puede crear cuentas desde la web (no se envían correos; el login es usuario + clave).
5. En **Project Settings → API** copia: `Project URL`, la clave `anon` y la clave `service_role`.

### 2. Configuración local
Crea un archivo `.env.local` copiando `.env.example` y completa los valores. Luego:

```bash
npm install
```

```bash
npm run crear-admin -- tuusuario tuclave Nombre Apellido M
```

```bash
npm run dev
```

Abre http://localhost:3000 e ingresa con ese usuario.

### 3. Publicar en Vercel
1. Sube esta carpeta a un repositorio de GitHub.
2. En https://vercel.com → **Add New Project** → importa el repositorio.
3. En **Environment Variables** agrega las 4 variables de `.env.example`.
4. **Deploy**. Comparte la URL con el grupo: desde el celular, "Agregar a pantalla de inicio" la instala como app.

## Uso del admin en cada fecha
1. **Admin → Torneos → (torneo) → Iniciar torneo** (pasa a *En curso*).
2. En la fecha del día, toca **Cargar**.
3. Después de cada mini partido, por cada uno de los 4 jugadores: **+ Jugados**; a los ganadores **+ Ganados** (si olvidas el jugado se suma solo) y **+ Games** según el resultado (2-0 o 2-1).
4. Ordena por **"Menos jugados"** para decidir quién entra a la siguiente cancha.
5. Si los números no cuadran con partidos a 3 games, la tarjeta muestra un aviso ⚠.

## Notas
- **Plan gratis de Supabase:** 500 MB de base de datos y 1 GB de archivos (≈ 3.000–4.000 fotos comprimidas). Si el proyecto pasa 7 días sin uso se pausa; se reactiva con un clic desde el panel.
- **Logo:** reemplaza `public/logo-mark.svg` por el logo oficial (y los íconos de `public/icons/`).
- **Dominio de login:** internamente cada usuario se guarda como `usuario@padelcoiner.app` (no se envía ningún correo). Se cambia con `NEXT_PUBLIC_LOGIN_DOMAIN` *antes* de crear jugadores.

## Tecnología
Next.js 15 · React 19 · Tailwind CSS · Supabase (Postgres + Auth + Storage). Tipografías Montserrat / Nunito.
