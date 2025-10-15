# 🚀 CollabCanvas MVP - Tasks & PR Checklist

**Solo Developer Workflow** | **Chronological Build Order** | **Each checkbox = 1 PR**


## 🏗️ Phase 1: Foundation & Setup

### PR-01: Project Initialization
- [x] **Setup Nuxt 4 project with TypeScript**
  - [x] Initialize Nuxt 4 with `npx nuxi@latest init collabcanvas`
  - [x] Configure TypeScript support
  - [x] Setup basic folder structure (`/components`, `/composables`, `/pages`, `/utils`)
  - [x] Add `.gitignore` and `.env.example`
  - [x] Create initial README.md with setup instructions

**Dependencies:** None  
**Estimated Time:** 1h

---

### PR-02: Development Tooling & CI/CD Foundation
- [x] **Setup linting, formatting, and testing infrastructure**
  - [x] Install and configure ESLint with Nuxt preset
  - [x] Setup Prettier with `.prettierrc`
  - [x] Install Vitest for unit testing
  - [x] Install Playwright for E2E testing
  - [x] Create basic GitHub Actions workflow file (`.github/workflows/ci.yml`)
  - [x] Add lint and test scripts to `package.json`
  - [x] Setup hosted MCP servers for Nuxt and Nuxt UI documentation
  - [x] Remove Playwright and setup Vitest-based E2E testing
  - [x] Create browser visual testing with Playwright Core
  - [x] Add test results to .gitignore
  - [ ] Configure pre-commit hooks (optional via Husky)

**Dependencies:** PR-01  
**Estimated Time:** 1.5h

---

### PR-03: Nuxt UI Integration
- [x] **Install and configure Nuxt UI component library**
  - [x] Install `@nuxt/ui` module
  - [x] Configure Nuxt UI in `nuxt.config.ts`
  - [x] Setup Tailwind CSS (comes with Nuxt UI)
  - [x] Create basic layout component using Nuxt UI
  - [x] Test a few sample components (Button, Card, Input)
  - [x] Document available components for reference

**Dependencies:** PR-01  
**Estimated Time:** 1h

---

## 🔐 Phase 2: Authentication & User Management

### PR-04: Supabase Project Setup
- [x] **Initialize Supabase and configure database schema**
  - [x] Create Supabase project via dashboard
  - [x] Save Supabase URL and anon key to `.env`
  - [x] Run SQL to create `canvas_objects` table
  - [x] Enable Row Level Security (RLS) policies
  - [x] Enable Realtime for `canvas_objects` table
  - [x] Add Supabase connection documentation

**Dependencies:** PR-01  
**Estimated Time:** 1h

---

### PR-05: Supabase Client Integration
- [x] **Setup Supabase client in Nuxt**
  - [x] Install `@supabase/supabase-js`
  - [x] Create Supabase plugin (`/plugins/supabase.client.ts`)
  - [x] Create `useSupabase` composable
  - [x] Add TypeScript types for Supabase tables
  - [x] Test connection with basic query

**Dependencies:** PR-04  
**Estimated Time:** 1h

---

### PR-06: Authentication UI & Flow
- [x] **Implement email authentication with session persistence**
  - [x] Create login page (`/pages/login.vue`)
  - [x] Create signup page (`/pages/signup.vue`)
  - [x] Build auth forms using Nuxt UI components
  - [x] Implement Supabase email auth (magic link or password)
  - [x] Create `useAuth` composable for auth state management
  - [x] Add session persistence logic
  - [x] Create auth middleware for protected routes
  - [x] Add logout functionality
  - [x] Write unit tests for auth composable

**Dependencies:** PR-05  
**Estimated Time:** 2.5h

---

## 🎨 Phase 3: Canvas Implementation

### PR-07: Konva.js Integration
- [x] **Setup Konva canvas with basic interactions**
  - [x] Install `konva` and `vue-konva`
  - [x] Create canvas page (`/pages/canvas.vue`)
  - [x] Initialize Konva Stage and Layer
  - [x] Implement pan functionality
  - [x] Implement zoom functionality
  - [x] Add canvas bounds/limits
  - [x] Test 60 FPS performance
  - [x] Write unit tests for canvas utilities

**Dependencies:** PR-06  
**Estimated Time:** 3h

---

### PR-08: Shape Creation System
- [x] **Implement shape creation (rect, circle, text)**
  - [x] Create toolbar component with Nuxt UI buttons
  - [x] Build shape factory utilities
  - [x] Implement rectangle creation
  - [x] Implement circle creation
  - [x] Implement text object creation
  - [x] Add color picker for shapes
  - [x] Create `useShapes` composable for shape state
  - [x] Write unit tests for shape creation logic

**Dependencies:** PR-07  
**Estimated Time:** 2.5h

---

### PR-09: Shape Manipulation
- [x] **Add drag, resize, and delete functionality**
  - [x] Implement drag functionality for shapes
  - [x] Add resize handles using Konva Transformer
  - [x] Implement rotation support
  - [x] Add delete functionality (keyboard + UI button)
  - [x] Implement shape selection
  - [x] Add visual feedback for selected shapes
  - [x] Write unit tests for manipulation utilities
  - [x] Write E2E test for basic shape workflow

**Dependencies:** PR-08  
**Estimated Time:** 2.5h

---

## 🔄 Phase 4: Real-Time Collaboration

### PR-10: Canvas State Persistence
- [x] **Save and restore canvas objects from Supabase**
  - [x] Create database service utilities
  - [x] Implement save shape to `canvas_objects` table
  - [x] Implement load all shapes on canvas mount
  - [x] Add auto-save on shape changes
  - [x] Implement delete from database
  - [x] Add loading state during fetch
  - [x] Handle edge cases (network errors, etc.)
  - [x] Write unit tests for database operations

**Dependencies:** PR-09  
**Estimated Time:** 2h

---

### PR-11: Real-Time Shape Sync (postgres_changes)
- [x] **Subscribe to database changes and sync shapes**
  - [x] Setup `postgres_changes` subscription on `canvas_objects`
  - [x] Handle INSERT events (new shapes from other users)
  - [x] Handle UPDATE events (shape modifications)
  - [x] Handle DELETE events (shape removals)
  - [x] Prevent echo (don't apply own changes twice)
  - [x] Add conflict resolution logic
  - [x] Test with 2 browser windows
  - [x] Write E2E test for multi-user shape sync

**Dependencies:** PR-10  
**Estimated Time:** 3h

---

### PR-12: Presence System (Supabase Presence API)
- [x] **Implement user presence and online status**
  - [x] Setup Supabase Presence API channel
  - [x] Track user join/leave events
  - [x] Display list of online users in sidebar
  - [x] Show user avatars/names using Nuxt UI
  - [x] Add presence state to composable
  - [x] Handle reconnection gracefully
  - [x] Write unit tests for presence logic

**Dependencies:** PR-11  
**Estimated Time:** 2h

---

### PR-13: Multiplayer Cursor Tracking
- [x] **Display real-time cursors for all users**
  - [x] Broadcast cursor position via Presence API
  - [x] Create cursor overlay component
  - [x] Render other users' cursors on canvas
  - [x] Add user name labels to cursors
  - [x] Implement cursor color differentiation
  - [x] Optimize cursor update frequency (throttle to 60fps)
  - [x] Test cursor latency (<50ms target)
  - [x] Write E2E test for cursor visibility

**Dependencies:** PR-12  
**Estimated Time:** 2.5h

---

## 🧪 Phase 5: Testing & Polish

### PR-14: Comprehensive Test Coverage
- [x] **Add complete unit and E2E test suite**
  - [x] Write unit tests for all composables
  - [x] Write unit tests for shape utilities
  - [x] Setup Vitest-based E2E testing framework
  - [x] Create browser visual testing with Playwright Core
  - [x] Write E2E test for canvas functionality
  - [x] Add test results to .gitignore
  - [x] Write E2E test for full auth flow
  - [x] Write E2E test for multi-user collaboration scenario
  - [x] Write E2E test for session persistence
  - [x] Achieve >70% test coverage
  - [x] Add test coverage reporting
  - [x] Document testing strategy in README

**Dependencies:** PR-13  
**Estimated Time:** 3h

---

### PR-15: UI Polish & Error Handling
- [x] **Improve user experience and edge cases**
  - [x] Add loading states using Nuxt UI skeletons
  - [x] Add error notifications/toasts
  - [x] Improve toolbar UX with tooltips
  - [x] Add keyboard shortcuts (Delete, Esc, etc.)
  - [x] Handle offline/reconnection states
  - [x] Add empty state for canvas
  - [x] Improve responsive design for mobile
  - [x] Add user feedback animations

**Dependencies:** PR-14  
**Estimated Time:** 2h

---

## 🚀 Phase 6: Deployment

### PR-16: Production CI/CD Pipeline
- [x] **Complete GitHub Actions workflow**
  - [x] Finalize CI workflow (lint → test → build)
  - [x] Add E2E tests to CI pipeline
  - [x] Setup environment variables in GitHub Secrets
  - [x] Add deployment step to Vercel
  - [x] Configure automatic deployments on main branch
  - [x] Add PR preview deployments
  - [x] Document CI/CD process

**Dependencies:** PR-14  
**Estimated Time:** 1.5h

---

### PR-17: Vercel Deployment & Configuration
- [x] **Deploy application to production**
  - [x] Create Vercel project and link repository
  - [x] Configure environment variables in Vercel
  - [x] Setup custom domain (if applicable)
  - [x] Configure Vercel build settings for Nuxt 4
  - [x] Test production build locally
  - [x] Deploy to production
  - [x] Verify all features work in production
  - [x] Add deployment status badge to README

**Dependencies:** PR-16  
**Estimated Time:** 1.5h

---

### PR-18: Documentation & Launch Prep
- [x] **Finalize documentation and prepare for launch**
  - [x] Complete README with setup instructions
  - [x] Add architecture diagram
  - [x] Document API/composable usage
  - [x] Create user guide for canvas features
  - [x] Add contributing guidelines
  - [x] Document known limitations
  - [x] Create demo video/GIFs
  - [x] Update PRD with final status

**Dependencies:** PR-17  
**Estimated Time:** 2h

---

## 📊 Summary

**Total PRs:** 18  
**Estimated Total Time:** ~38 hours (with buffer for debugging)  
**Critical Path:** PR-01 → PR-04 → PR-05 → PR-06 → PR-07 → PR-08 → PR-09 → PR-10 → PR-11 → PR-12 → PR-13 → PR-17

---
