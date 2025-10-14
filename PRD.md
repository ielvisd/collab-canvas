# 🧩 CollabCanvas – Product Requirements Document (MVP)

**Tech Stack:** Nuxt 4 · Supabase · Konva · Nuxt UI  
**Focus:** Real-time collaborative canvas (MVP)

---

## 🎯 Goalc

Build a **real-time collaborative design canvas** where multiple authenticated users can create, move, and edit simple shapes simultaneously with live cursor tracking.

---

## 💡 Core Value Proposition

Enable teams to **collaborate visually in real-time**, similar to Figma, but simplified – laying the groundwork for later AI-assisted design actions.

---

## 🧱 MVP Scope

### Functional Requirements

| Feature | Description | Status |
|----------|--------------|--------|
| **User Authentication** | Users can sign up and log in using Supabase Auth (email) with session persistence. | ✅ Core |
| **Canvas Rendering** | Use Konva.js inside a Nuxt 4 page for smooth pan/zoom and object rendering. | ✅ Core |
| **Shape Creation** | Create rectangles, circles, or text objects via UI buttons or short commands. | ✅ Core |
| **Object Manipulation** | Drag, resize, and delete shapes. | ✅ Core |
| **Real-Time Sync** | Shape changes sync via Supabase `postgres_changes`; cursor/presence via Realtime channels. | ✅ Core |
| **Multiplayer Cursors** | Each user's cursor and name show in real time via Supabase Presence API. | ✅ Core |
| **Presence Awareness** | Show which users are online using Supabase built-in Presence API. | ✅ Core |
| **Persistence** | Canvas state saved in Supabase `canvas_objects` table. Reload restores previous session. | ✅ Core |
| **UI Components** | Use Nuxt UI library for buttons, toolbars, and interface elements. | ✅ Core |
| **Testing & CI/CD** | Automated linting (ESLint + Prettier), unit tests (Vitest), E2E tests (Playwright). | ✅ Core |
| **Deployment** | Frontend on Vercel, backend on Supabase, with GitHub Actions CI/CD pipeline. | ✅ Core |

### Stretch Goals (post-MVP)

- AI canvas agent with natural language commands (via OpenAI function calling)
- Group selection and alignment tools
- Undo/redo stack

---

## ⚙️ Architecture Overview

### Frontend (Nuxt 4)

- **Framework:** Nuxt 4 (Vue 3, Composition API)
- **UI Library:** Nuxt UI (Tailwind-based components)
- **Canvas Layer:** Konva.js + VueKonva
- **State Management:** Nuxt composables for local canvas state
- **Realtime Sync:** 
  - Supabase `postgres_changes` for persistent object updates (create/update/delete shapes)
  - Supabase Realtime channels for ephemeral data (cursor positions, transient updates)
- **Presence:** Supabase built-in Presence API
- **Auth:** Supabase client SDK (`supabase.auth`) with session persistence

### Backend (Supabase)

- **Database:** Postgres
- **Tables:**
  - `users` (default from Supabase Auth)
  - `canvas_objects` → `{ id, user_id, type, x, y, width, height, color, text_content, rotation, created_at, updated_at }`
- **Realtime:** 
  - `postgres_changes` subscription on `canvas_objects` table for shape CRUD
  - Realtime channels for cursor tracking via Presence API
- **Persistence:** Auto-sync state to DB on each object modification

---

## 📡 Realtime Sync Strategy (Hybrid Approach)

### Why Hybrid?

| Approach | Use Case | Latency | Persistence |
|----------|----------|---------|-------------|
| **postgres_changes** | Shape CRUD operations | 50-150ms | ✅ Automatic |
| **Realtime Channels** | Cursor tracking, presence | <50ms | ❌ Ephemeral |

### Channels

- `postgres_changes` subscription on `canvas_objects` – for persistent shape updates
- Supabase Presence API – for user join/leave and cursor position (ephemeral)

### Data Flow

**For Shapes (Persistent):**
1. User creates/moves/deletes an object
2. Change written to `canvas_objects` table
3. `postgres_changes` triggers update to all subscribed clients
4. Other clients receive event → update local Konva stage

**For Cursors (Ephemeral):**
1. User moves cursor
2. Position broadcasted via Presence API
3. Other clients receive event → update cursor overlay
4. No database write (ephemeral only)

---

## 🧰 Data Schema

```sql
create table canvas_objects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  type text check (type in ('rect', 'circle', 'text')),
  x float,
  y float,
  width float,
  height float,
  color text,
  text_content text,
  rotation float default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Enable Realtime for canvas_objects
alter publication supabase_realtime add table canvas_objects;

-- Row Level Security
alter table canvas_objects enable row level security;

create policy "Users can read all canvas objects"
  on canvas_objects for select
  using (true);

create policy "Users can insert their own objects"
  on canvas_objects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own objects"
  on canvas_objects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own objects"
  on canvas_objects for delete
  using (auth.uid() = user_id);
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
- Canvas object creation/manipulation utilities
- Supabase client helpers
- State management composables

### E2E Tests (Playwright)
- User authentication flow
- Shape creation and manipulation
- Multi-user collaboration (two browser instances)
- Cursor presence visibility
- Session persistence on page reload

### Linting & Formatting
- **ESLint** with Nuxt preset
- **Prettier** for code formatting
- Pre-commit hooks via Husky (optional)

### CI/CD Pipeline (GitHub Actions)
```yaml
- Lint check (ESLint + Prettier)
- Unit tests (Vitest)
- E2E tests (Playwright)
- Build verification
- Deploy to Vercel (on main branch)
```

---

## 🧠 AI Agent (Phase 2 Preview)

After MVP stability, integrate an AI layer:

- Natural language → structured function calls
- Example: `createShape("rectangle", 100, 100, 200, 100, "blue")`
- All AI actions broadcast through the same Realtime channel so all users see them
- Support at least 6 command types across creation, manipulation, and layout

---

## 🧪 Testing Scenarios

- Two users editing in separate browsers
- One user refreshes mid-edit → state restored
- Multiple shapes moved quickly → sync under 150 ms
- Cursor updates → sync under 50 ms
- 60 FPS maintained for pan, zoom, and drag
- Authentication session persists across page reloads

---

## 🚀 Performance Targets

| Metric | Target |
|---------|---------|
| **FPS** | 60 FPS during interactions |
| **Sync latency (shapes)** | < 150 ms |
| **Sync latency (cursors)** | < 50 ms |
| **Concurrent users** | 5+ |
| **Persistent reconnects** | Yes |
| **Test coverage** | >70% for core features |

---

## 📦 Deliverables (MVP)

- [ ] Deployed Nuxt 4 app on Vercel
- [ ] Supabase backend (DB + Realtime + Auth)
- [ ] Live demo with 2+ users editing the same canvas
- [ ] Automated testing suite (unit + E2E)
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Basic documentation (setup + schema + architecture diagram)

---

## 🗓️ Build Plan (24-hour MVP Sprint)

| Phase | Task | Duration |
|--------|------|-----------|
| 1 | Setup Nuxt 4 + Supabase Auth + Nuxt UI | 2.5 h |
| 2 | Integrate Konva canvas | 3 h |
| 3 | Implement shape creation/movement | 3 h |
| 4 | Add Supabase postgres_changes sync | 3 h |
| 5 | Add multiplayer cursors + Presence API | 3 h |
| 6 | Persist canvas state to DB | 2 h |
| 7 | Setup testing (Vitest + Playwright) | 2.5 h |
| 8 | Setup CI/CD + deploy to Vercel | 2 h |
| 9 | Testing + bug fixes | 2 h |

**Total:** ~23 hours