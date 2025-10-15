# 🎨 CollabCanvas - Real-Time Collaborative Canvas

A modern, real-time collaborative canvas application built with Nuxt 4, Supabase, and Konva.js. Multiple users can create, edit, and manipulate shapes simultaneously with live cursor tracking and presence indicators.

![CollabCanvas Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=CollabCanvas+Demo)

## ✨ Features

### 🎯 Core Functionality
- **Real-time Collaboration**: Multiple users can work on the same canvas simultaneously
- **Shape Creation**: Create rectangles, circles, and text objects
- **Shape Manipulation**: Drag, resize, rotate, and delete shapes
- **Live Cursor Tracking**: See other users' cursors in real-time
- **Presence System**: View who's currently online
- **Auto-save**: Changes are automatically saved to the database
- **Session Persistence**: Maintains state across browser refreshes

### 🎨 User Experience
- **Modern UI**: Built with Nuxt UI components and Tailwind CSS
- **Keyboard Shortcuts**: Quick access to common actions
- **Tooltips**: Helpful hints for all interface elements
- **Loading States**: Visual feedback during operations
- **Error Handling**: Graceful error recovery and notifications
- **Responsive Design**: Works on desktop and mobile devices

### 🔧 Technical Features
- **TypeScript**: Full type safety throughout the application
- **Real-time Sync**: Powered by Supabase Realtime
- **Authentication**: Secure user authentication with Supabase Auth
- **Performance**: Optimized for 60fps interactions
- **Testing**: Comprehensive unit and E2E test coverage
- **CI/CD**: Automated testing and deployment pipeline

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- pnpm 8+
- Supabase account
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/collab-canvas.git
cd collab-canvas/collab-canvas
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Copy the environment template and fill in your Supabase credentials:

```bash
cp env-template.txt .env
```

Edit `.env` with your Supabase project details:

```env
NUXT_PUBLIC_SUPABASE_URL=your_supabase_url
NUXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

Run the SQL script to create the required tables:

```sql
-- Execute this in your Supabase SQL editor
-- See database-schema-collaborative.sql for the complete schema
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see the application.

## 📚 Documentation

### Architecture

The application follows a modular architecture with clear separation of concerns:

```
collab-canvas/
├── components/          # Vue components
│   ├── AppLayout.vue   # Main layout wrapper
│   ├── CanvasKonva.vue # Konva.js canvas component
│   ├── CursorOverlay.vue # Real-time cursor display
│   └── PresenceSidebar.vue # Online users sidebar
├── composables/        # Vue composables for state management
│   ├── useAuth.ts      # Authentication logic
│   ├── usePresence.ts  # User presence tracking
│   ├── useShapes.ts    # Shape management
│   └── useRealtimeSync.ts # Real-time synchronization
├── pages/              # Nuxt pages
│   ├── canvas.vue      # Main canvas page
│   ├── login.vue       # Authentication pages
│   └── signup.vue
└── tests/              # Test files
    ├── unit/           # Unit tests
    └── e2e/            # End-to-end tests
```

### Key Components

#### Canvas System
- **Konva.js Integration**: High-performance 2D canvas rendering
- **Shape Management**: Create, update, delete shapes with real-time sync
- **Interaction Handling**: Mouse and keyboard event management
- **View Controls**: Pan, zoom, and reset functionality

#### Real-time Collaboration
- **Supabase Realtime**: WebSocket-based real-time updates
- **Presence API**: Track online users and their status
- **Cursor Tracking**: Broadcast and display user cursors
- **Conflict Resolution**: Handle simultaneous edits gracefully

#### Authentication
- **Supabase Auth**: Secure user authentication
- **Session Management**: Persistent login sessions
- **Route Protection**: Middleware for protected routes
- **User Profiles**: Display user information and avatars

### API Reference

#### Composables

##### `useAuth()`
Authentication state and methods.

```typescript
const { user, isAuthenticated, signIn, signOut } = useAuth()
```

##### `useShapes()`
Shape management and manipulation.

```typescript
const { 
  rectangles, 
  circles, 
  texts, 
  addRectangle, 
  updateShape, 
  deleteShape 
} = useShapes()
```

##### `usePresence()`
User presence and online status.

```typescript
const { 
  onlineUsers, 
  isConnected, 
  startPresence, 
  stopPresence 
} = usePresence()
```

##### `useCursorTracking()`
Real-time cursor tracking.

```typescript
const { 
  remoteCursors, 
  startTracking, 
  stopTracking 
} = useCursorTracking()
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `R` | Create rectangle |
| `C` | Create circle |
| `T` | Create text |
| `Delete` | Delete selected shape |
| `Esc` | Deselect shape |
| `Home` | Reset view |
| `Ctrl+S` | Manual save |
| `Ctrl+A` | Select all shapes |

## 🧪 Testing

### Running Tests

```bash
# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# Visual regression tests
pnpm test:visual

# All tests
pnpm test:run
```

### Test Coverage

The project maintains >70% test coverage across:
- Unit tests for composables and utilities
- E2E tests for user workflows
- Visual regression tests for UI components
- Performance tests for real-time features

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Link your GitHub repository to Vercel
   - Configure build settings for Nuxt 4

2. **Environment Variables**
   ```env
   NUXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NUXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Deploy**
   - Automatic deployments on `main` branch
   - Preview deployments for pull requests

### Manual Deployment

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview

# Deploy to Vercel
vercel --prod
```

### CI/CD Pipeline

The project includes a comprehensive GitHub Actions workflow:

- **Linting & Formatting**: ESLint and Prettier checks
- **Type Checking**: TypeScript compilation
- **Unit Tests**: Vitest with coverage reporting
- **E2E Tests**: Playwright browser testing
- **Security Audit**: Dependency vulnerability scanning
- **Performance Tests**: Visual regression testing
- **Automatic Deployment**: Vercel integration

## 🔧 Development

### Project Structure

```
collab-canvas/
├── .github/                 # GitHub Actions workflows
├── collab-canvas/          # Main application
│   ├── components/         # Vue components
│   ├── composables/        # Vue composables
│   ├── pages/             # Nuxt pages
│   ├── tests/             # Test files
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── docs/                  # Documentation
└── README.md              # This file
```

### Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `pnpm test`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Style

- **ESLint**: Enforces code quality rules
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking
- **Conventional Commits**: Standardized commit messages

### Performance Guidelines

- **60fps Target**: All interactions should maintain 60fps
- **Throttled Updates**: Cursor tracking limited to 60fps
- **Efficient Rendering**: Use Konva.js best practices
- **Memory Management**: Proper cleanup of event listeners

## 🐛 Troubleshooting

### Common Issues

#### Canvas Not Loading
- Check Supabase connection
- Verify environment variables
- Check browser console for errors

#### Real-time Not Working
- Ensure Supabase Realtime is enabled
- Check network connectivity
- Verify authentication status

#### Performance Issues
- Reduce number of shapes on canvas
- Check browser performance tools
- Ensure hardware acceleration is enabled

### Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('debug', 'true')
```

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/collab-canvas/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/collab-canvas/discussions)
- **Documentation**: [Project Wiki](https://github.com/yourusername/collab-canvas/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Nuxt Team**: For the amazing framework
- **Supabase Team**: For the real-time infrastructure
- **Konva.js Team**: For the canvas library
- **Vue.js Team**: For the reactive framework
- **Tailwind CSS**: For the utility-first CSS framework

## 📊 Project Status

- ✅ **Phase 1**: Foundation & Setup
- ✅ **Phase 2**: Authentication & User Management  
- ✅ **Phase 3**: Canvas Implementation
- ✅ **Phase 4**: Real-time Collaboration
- ✅ **Phase 5**: Testing & Polish
- ✅ **Phase 6**: Deployment

**Current Version**: 1.0.0  
**Status**: Production Ready 🚀

---

Made with ❤️ by [Your Name](https://github.com/yourusername)
