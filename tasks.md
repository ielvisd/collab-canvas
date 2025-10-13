# 🚀 CollabCanvas MVP - Tasks & PR Checklist

**Solo Developer Workflow** | **Chronological Build Order** | **Each checkbox = 1 PR**

---

## 🏗️ Phase 1: Foundation & Setup

### PR-01: Project Initialization
- [x] **Setup Nuxt 4 project with TypeScript**
  - [ ] [x] Initialize Nuxt 4 with `npx nuxi@latest init collabcanvas`
  - [ ] [x] Configure TypeScript support
  - [ ] [x] Setup basic folder structure (`/components`, `/composables`, `/pages`, `/utils`)
  - [ ] [x] Add `.gitignore` and `.env.example`
  - [ ] [x] Create initial README.md with setup instructions

**Dependencies:** None  
**Estimated Time:** 1h

---

### PR-02: Development Tooling & CI/CD Foundation
- [x] **Setup linting, formatting, and testing infrastructure**
  - [ ] [x] Install and configure ESLint with Nuxt preset
  - [ ] [x] Setup Prettier with `.prettierrc`
  - [ ] [x] Install Vitest for unit testing
  - [ ] [x] Install Playwright for E2E testing
  - [ ] [x] Create basic GitHub Actions workflow file (`.github/workflows/ci.yml`)
  - [ ] [x] Add lint and test scripts to `package.json`
  - [ ] [ ] Configure pre-commit hooks (optional via Husky)

**Dependencies:** PR-01  
**Estimated Time:** 1.5h

---

### PR-03: Nuxt UI Integration
- [x] **Install and configure Nuxt UI component library**
  - [ ] [x] Install `@nuxt/ui` module
  - [ ] [x] Configure Nuxt UI in `nuxt.config.ts`
  - [ ] [x] Setup Tailwind CSS (comes with Nuxt UI)
  - [ ] [x] Create basic layout component using Nuxt UI
  - [ ] [x] Test a few sample components (Button, Card, Input)
  - [ ] [x] Document available components for reference

**Dependencies:** PR-01  
**Estimated Time:** 1h

---

## 🔐 Phase 2: Authentication & User Management

### PR-04: Supabase Project Setup
- [ ] **Initialize Supabase and configure database schema**
  - [ ] [ ] Create Supabase project via dashboard
  - [ ] [ ] Save Supabase URL and anon key to `.env`
  - [ ] [ ] Run SQL to create `canvas_objects` table
  - [ ] [ ] Enable Row Level Security (RLS) policies
  - [ ] [ ] Enable Realtime for `canvas_objects` table
  - [ ] [ ] Add Supabase connection documentation

**Dependencies:** PR-01  
**Estimated Time:** 1h

---

### PR-05: Supabase Client Integration
- [ ] **Setup Supabase client in Nuxt**
  - [ ] Install `@supabase/supabase-js`
  - [ ] Create Supabase plugin (`/plugins/supabase.client.ts`)
  - [ ] Create `useSupabase` composable
  - [ ] Add TypeScript types for Supabase tables
  - [ ] Test connection with basic query

**Dependencies:** PR-04  
**Estimated Time:** 1h

---

### PR-06: Authentication UI & Flow
- [ ] **Implement email authentication with session persistence**
  - [ ] Create login page (`/pages/login.vue`)
  - [ ] Create signup page (`/pages/signup.vue`)
  - [ ] Build auth forms using Nuxt UI components
  - [ ] Implement Supabase email auth (magic link or password)
  - [ ] Create `useAuth` composable for auth state management
  - [ ] Add session persistence logic
  - [ ] Create auth middleware for protected routes
  - [ ] Add logout functionality
  - [ ] Write unit tests for auth composable

**Dependencies:** PR-05  
**Estimated Time:** 2.5h

---

## 🎨 Phase 3: Canvas Implementation

### PR-07: Konva.js Integration
- [ ] **Setup Konva canvas with basic interactions**
  - [ ] Install `konva` and `vue-konva`
  - [ ] Create canvas page (`/pages/canvas.vue`)
  - [ ] Initialize Konva Stage and Layer
  - [ ] Implement pan functionality
  - [ ] Implement zoom functionality
  - [ ] Add canvas bounds/limits
  - [ ] Test 60 FPS performance
  - [ ] Write unit tests for canvas utilities

**Dependencies:** PR-06  
**Estimated Time:** 3h

---

### PR-08: Shape Creation System
- [ ] **Implement shape creation (rect, circle, text)**
  - [ ] Create toolbar component with Nuxt UI buttons
  - [ ] Build shape factory utilities
  - [ ] Implement rectangle creation
  - [ ] Implement circle creation
  - [ ] Implement text object creation
  - [ ] Add color picker for shapes
  - [ ] Create `useShapes` composable for shape state
  - [ ] Write unit tests for shape creation logic

**Dependencies:** PR-07  
**Estimated Time:** 2.5h

---

### PR-09: Shape Manipulation
- [ ] **Add drag, resize, and delete functionality**
  - [ ] Implement drag functionality for shapes
  - [ ] Add resize handles using Konva Transformer
  - [ ] Implement rotation support
  - [ ] Add delete functionality (keyboard + UI button)
  - [ ] Implement shape selection
  - [ ] Add visual feedback for selected shapes
  - [ ] Write unit tests for manipulation utilities
  - [ ] Write E2E test for basic shape workflow

**Dependencies:** PR-08  
**Estimated Time:** 2.5h

---

## 🔄 Phase 4: Real-Time Collaboration

### PR-10: Canvas State Persistence
- [ ] **Save and restore canvas objects from Supabase**
  - [ ] Create database service utilities
  - [ ] Implement save shape to `canvas_objects` table
  - [ ] Implement load all shapes on canvas mount
  - [ ] Add auto-save on shape changes
  - [ ] Implement delete from database
  - [ ] Add loading state during fetch
  - [ ] Handle edge cases (network errors, etc.)
  - [ ] Write unit tests for database operations

**Dependencies:** PR-09  
**Estimated Time:** 2h

---

### PR-11: Real-Time Shape Sync (postgres_changes)
- [ ] **Subscribe to database changes and sync shapes**
  - [ ] Setup `postgres_changes` subscription on `canvas_objects`
  - [ ] Handle INSERT events (new shapes from other users)
  - [ ] Handle UPDATE events (shape modifications)
  - [ ] Handle DELETE events (shape removals)
  - [ ] Prevent echo (don't apply own changes twice)
  - [ ] Add conflict resolution logic
  - [ ] Test with 2 browser windows
  - [ ] Write E2E test for multi-user shape sync

**Dependencies:** PR-10  
**Estimated Time:** 3h

---

### PR-12: Presence System (Supabase Presence API)
- [ ] **Implement user presence and online status**
  - [ ] Setup Supabase Presence API channel
  - [ ] Track user join/leave events
  - [ ] Display list of online users in sidebar
  - [ ] Show user avatars/names using Nuxt UI
  - [ ] Add presence state to composable
  - [ ] Handle reconnection gracefully
  - [ ] Write unit tests for presence logic

**Dependencies:** PR-11  
**Estimated Time:** 2h

---

### PR-13: Multiplayer Cursor Tracking
- [ ] **Display real-time cursors for all users**
  - [ ] Broadcast cursor position via Presence API
  - [ ] Create cursor overlay component
  - [ ] Render other users' cursors on canvas
  - [ ] Add user name labels to cursors
  - [ ] Implement cursor color differentiation
  - [ ] Optimize cursor update frequency (throttle to 60fps)
  - [ ] Test cursor latency (<50ms target)
  - [ ] Write E2E test for cursor visibility

**Dependencies:** PR-12  
**Estimated Time:** 2.5h

---

## 🧪 Phase 5: Testing & Polish

### PR-14: Comprehensive Test Coverage
- [ ] **Add complete unit and E2E test suite**
  - [ ] Write unit tests for all composables
  - [ ] Write unit tests for shape utilities
  - [ ] Write E2E test for full auth flow
  - [ ] Write E2E test for multi-user collaboration scenario
  - [ ] Write E2E test for session persistence
  - [ ] Achieve >70% test coverage
  - [ ] Add test coverage reporting
  - [ ] Document testing strategy in README

**Dependencies:** PR-13  
**Estimated Time:** 3h

---

### PR-15: UI Polish & Error Handling
- [ ] **Improve user experience and edge cases**
  - [ ] Add loading states using Nuxt UI skeletons
  - [ ] Add error notifications/toasts
  - [ ] Improve toolbar UX with tooltips
  - [ ] Add keyboard shortcuts (Delete, Esc, etc.)
  - [ ] Handle offline/reconnection states
  - [ ] Add empty state for canvas
  - [ ] Improve responsive design for mobile
  - [ ] Add user feedback animations

**Dependencies:** PR-14  
**Estimated Time:** 2h

---

## 🚀 Phase 6: Deployment

### PR-16: Production CI/CD Pipeline
- [ ] **Complete GitHub Actions workflow**
  - [ ] Finalize CI workflow (lint → test → build)
  - [ ] Add E2E tests to CI pipeline
  - [ ] Setup environment variables in GitHub Secrets
  - [ ] Add deployment step to Vercel
  - [ ] Configure automatic deployments on main branch
  - [ ] Add PR preview deployments
  - [ ] Document CI/CD process

**Dependencies:** PR-14  
**Estimated Time:** 1.5h

---

### PR-17: Vercel Deployment & Configuration
- [ ] **Deploy application to production**
  - [ ] Create Vercel project and link repository
  - [ ] Configure environment variables in Vercel
  - [ ] Setup custom domain (if applicable)
  - [ ] Configure Vercel build settings for Nuxt 4
  - [ ] Test production build locally
  - [ ] Deploy to production
  - [ ] Verify all features work in production
  - [ ] Add deployment status badge to README

**Dependencies:** PR-16  
**Estimated Time:** 1.5h

---

### PR-18: Documentation & Launch Prep
- [ ] **Finalize documentation and prepare for launch**
  - [ ] Complete README with setup instructions
  - [ ] Add architecture diagram
  - [ ] Document API/composable usage
  - [ ] Create user guide for canvas features
  - [ ] Add contributing guidelines
  - [ ] Document known limitations
  - [ ] Create demo video/GIFs
  - [ ] Update PRD with final status

**Dependencies:** PR-17  
**Estimated Time:** 2h

---

## 📊 Summary

**Total PRs:** 18  
**Estimated Total Time:** ~38 hours (with buffer for debugging)  
**Critical Path:** PR-01 → PR-04 → PR-05 → PR-06 → PR-07 → PR-08 → PR-09 → PR-10 → PR-11 → PR-12 → PR-13 → PR-17

---

## 🎯 Quick Start Guide

1. **Start with Phase 1** (PRs 1-3) to get your foundation solid
2. **Phase 2** (PRs 4-6) establishes your backend and auth
3. **Phase 3** (PRs 7-9) builds the core canvas experience
4. **Phase 4** (PRs 10-13) adds the magic of real-time collaboration
5. **Phase 5** (PRs 14-15) ensures quality and polish
6. **Phase 6** (PRs 16-18) ships it to the world

---

## ⚡ Pro Tips

- **Create a new branch** for each PR from `main`
- **Write descriptive commit messages** following conventional commits
- **Test locally** before pushing each PR
- **Review your own PR** before merging (use GitHub's review features)
- **Keep PRs focused** - if you find additional work, create a new PR
- **Update the checklist** as you complete each PR for motivation! ✅
