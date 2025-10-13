# 🧩 CollabCanvas

A real-time collaborative design canvas built with Nuxt 4, Supabase, and Konva.js.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd collab-canvas
   pnpm install
   ```

2. **Setup environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start development server:**

   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
collab-canvas/
├── components/          # Vue components
├── composables/         # Nuxt composables
├── pages/              # Nuxt pages
├── utils/              # Utility functions
├── app/                # App configuration
└── public/             # Static assets
```

## 🛠️ Tech Stack

- **Frontend:** Nuxt 4, Vue 3, TypeScript
- **UI:** Nuxt UI, Tailwind CSS
- **Canvas:** Konva.js, VueKonva
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Testing:** Vitest, Playwright
- **Deployment:** Vercel

## 📋 Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm test` - Run unit tests
- `pnpm test:e2e` - Run E2E tests

## 🔧 Configuration

See `nuxt.config.ts` for Nuxt configuration and `architecture.mermaid` for system architecture.

## 📖 Documentation

- [PRD](./PRD.md) - Product Requirements Document
- [Tasks](./tasks.md) - Development tasks and PR checklist
- [Architecture](./architecture.mermaid) - System architecture diagram
