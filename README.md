# 📖 BookApp

> Red social de lectura — seguimiento de libros, reseñas y comunidad lectora.

**Stack:** Next.js · Supabase · Tailwind CSS · Vercel

---

## 🗺️ Roadmap

### 🚀 Fase 1 — MVP funcional
> Objetivo: tener algo usable y deployable en 1–2 semanas.

---

### 🔐 1. Auth + perfiles

| Área | Detalle |
|---|---|
| Registro / Login | Supabase Auth — email + password, OAuth Google |
| Perfil | Username único, bio, avatar (Supabase Storage) |
| Géneros favoritos | Array en tabla `profiles` |
| Onboarding | Flujo post-registro para completar perfil |
| Middleware | Protección de rutas privadas, redirección si sin perfil |

**Tablas:**
```sql
profiles (id, username, full_name, bio, avatar_url, favorite_genres, created_at, updated_at)
```

**Estado:** ✅ Páginas de auth creadas — login, register, forgot-password, onboarding

---

### 📚 2. Catálogo base

| Campo | Tipo |
|---|---|
| Título | `text` |
| Autor | `text` |
| Género | `text` |
| Portada | `text` (URL — Supabase Storage) |
| ISBN | `varchar` |
| Páginas | `int` |
| Año | `int` |

**Extras opcionales:**
- Búsqueda y filtros por género / autor
- Página de detalle del libro
- Integración con Open Library API para poblar catálogo

---

### 🏠 3. Biblioteca personal

| Campo | Detalle |
|---|---|
| Estado | `want_to_read` · `reading` · `finished` |
| Rating | 1–5 estrellas |
| Progreso | `%` de lectura |
| Fechas | Inicio y finalización |
| Notas | Privadas por usuario |

**Tabla:**
```sql
create table public.user_books (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  book_id     uuid references public.books(id) on delete cascade,
  status      text check (status in ('want_to_read', 'reading', 'finished')),
  rating      int  check (rating between 1 and 5),
  progress    int  default 0,
  started_at  date,
  finished_at date,
  notes       text,
  created_at  timestamptz default now(),
  unique(user_id, book_id)
);
```

> ⚠️ Activar RLS y policy por `user_id` desde el principio.

---

### 🌍 4. Social mínimo

| Feature | Detalle |
|---|---|
| Reseñas | Publicar reseña pública sobre un libro |
| Likes | Like a reseñas de otros usuarios |
| Comentarios | Comentar en reseñas |
| Perfiles públicos | Ver perfil, biblioteca y reseñas de otro usuario |

---

### 🎨 5. UI mínima

| Página | Ruta | Estado |
|---|---|---|
| Login | `/login` | ✅ |
| Registro | `/register` | ✅ |
| Recuperar contraseña | `/forgot-password` | ✅ |
| Onboarding | `/onboarding` | ✅ |
| Home feed | `/` | ⬜ |
| Biblioteca personal | `/library` | ⬜ |
| Perfil | `/profile/[username]` | ⬜ |
| Detalle de libro | `/book/[id]` | ⬜ |

---

## 🛠️ Setup local

```bash
git clone https://github.com/tu-usuario/bookapp.git
cd bookapp
npm install
```

Crea un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── onboarding/
│   ├── auth/
│   │   └── callback/        # Handler OAuth + email confirm
│   ├── library/
│   ├── profile/
│   └── book/
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
└── middleware.ts
```

---

## 🗄️ Supabase

### Storage buckets

| Bucket | Acceso | Uso |
|---|---|---|
| `avatars` | Público | Fotos de perfil |
| `covers` | Público | Portadas de libros |

### RLS activado en todas las tablas

- `profiles` — lectura pública, escritura solo por el propio usuario
- `user_books` — solo el usuario dueño puede leer y escribir
- `reviews` — lectura pública, escritura autenticada

---

## 📌 Meta

Tener la Fase 1 completamente deployada en **Vercel** antes de pasar a la Fase 2.