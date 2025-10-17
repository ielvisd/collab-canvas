# 🚀 Deployment Guide

This guide covers deploying CollabCanvas to production using Vercel and Supabase.

## 📋 Prerequisites

- [Vercel Account](https://vercel.com)
- [Supabase Project](https://supabase.com)
- [GitHub Repository](https://github.com)
- Domain name (optional)

## 🗄️ Database Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `collab-canvas`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users

### 2. Configure Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create canvas_objects table
CREATE TABLE canvas_objects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_canvas_objects_type ON canvas_objects(type);
CREATE INDEX idx_canvas_objects_created_by ON canvas_objects(created_by);
CREATE INDEX idx_canvas_objects_updated_at ON canvas_objects(updated_at);

-- Enable Row Level Security
ALTER TABLE canvas_objects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all canvas objects" ON canvas_objects
  FOR SELECT USING (true);

CREATE POLICY "Users can insert canvas objects" ON canvas_objects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update canvas objects" ON canvas_objects
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete canvas objects" ON canvas_objects
  FOR DELETE USING (auth.uid() = created_by);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_objects;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_canvas_objects_updated_at
  BEFORE UPDATE ON canvas_objects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Configure Authentication

1. Go to **Authentication** > **Settings**
2. Configure **Site URL**: `https://your-domain.vercel.app`
3. Add **Redirect URLs**:
   - `https://your-domain.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)
4. Configure **Email Templates** (optional)
5. Set up **OAuth Providers** (optional)

### 4. Get API Keys

1. Go to **Settings** > **API**
2. Copy:
   - **Project URL**
   - **Project API Keys** > **anon public**

## 🌐 Vercel Deployment

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Nuxt.js
   - **Root Directory**: `collab-canvas`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.output`

### 2. Environment Variables

Add the following environment variables in Vercel:

```env
# Supabase Configuration
NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Site Configuration (REQUIRED for proper email redirects)
NUXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NUXT_PUBLIC_APP_ENV=production

# Optional: Analytics
NUXT_PUBLIC_GA_ID=your_google_analytics_id

# Optional: Sentry
NUXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 3. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Test the deployment
4. Configure custom domain (optional)

## 🔧 Configuration

### Vercel Configuration

Create `vercel.json` in the project root:

```json
{
  "buildCommand": "cd collab-canvas && pnpm build",
  "outputDirectory": "collab-canvas/.output",
  "framework": "nuxtjs",
  "functions": {
    "collab-canvas/server/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Nuxt Configuration

Ensure `nuxt.config.ts` is configured for production:

```typescript
export default defineNuxtConfig({
  // ... existing config
  
  // Production optimizations
  nitro: {
    compressPublicAssets: true,
    minify: true
  },
  
  // Security headers
  routeRules: {
    '/': { prerender: true },
    '/canvas': { ssr: false }, // SPA mode for canvas
    '/api/**': { cors: true }
  },
  
  // Performance
  experimental: {
    payloadExtraction: false
  }
})
```

## 🔒 Security Configuration

### Supabase Security

1. **Enable RLS**: Ensure Row Level Security is enabled
2. **API Keys**: Use environment variables for API keys
3. **CORS**: Configure allowed origins in Supabase
4. **Rate Limiting**: Enable rate limiting for API endpoints

### Vercel Security

1. **Environment Variables**: Never commit secrets
2. **Headers**: Configure security headers
3. **HTTPS**: Ensure HTTPS is enabled
4. **Domain**: Use custom domain with SSL

## 📊 Monitoring & Analytics

### Vercel Analytics

1. Enable Vercel Analytics in dashboard
2. Monitor performance metrics
3. Set up alerts for errors

### Supabase Monitoring

1. Monitor database performance
2. Set up alerts for high usage
3. Review authentication logs

### Error Tracking

Consider adding error tracking:

```bash
pnpm add @sentry/nuxt
```

Configure in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: [
    '@sentry/nuxt'
  ],
  sentry: {
    dsn: process.env.NUXT_PUBLIC_SENTRY_DSN
  }
})
```

## 🚀 CI/CD Pipeline

The project includes automated deployment:

### GitHub Actions

- **Linting**: Code quality checks
- **Testing**: Unit and E2E tests
- **Building**: Production build
- **Deploying**: Automatic Vercel deployment

### Branch Strategy

- **main**: Production deployments
- **develop**: Staging deployments
- **feature/***: Preview deployments

## 🔄 Updates & Maintenance

### Database Migrations

1. Create migration files
2. Test in development
3. Apply to production
4. Update documentation

### Dependency Updates

1. Dependabot creates PRs automatically
2. Review and test updates
3. Merge when ready
4. Monitor for issues

### Performance Monitoring

1. Monitor Core Web Vitals
2. Track real-time performance
3. Optimize based on metrics
4. Regular performance audits

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
- Check Node.js version (20+)
- Verify all dependencies installed
- Check for TypeScript errors
- Review build logs

#### Database Connection
- Verify Supabase URL and keys
- Check RLS policies
- Test database connectivity
- Review authentication setup

#### Real-time Issues
- Ensure Realtime is enabled
- Check WebSocket connections
- Verify presence configuration
- Test with multiple users

### Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('debug', 'true')
```

### Support

- **Documentation**: Check this guide and README
- **Issues**: Create GitHub issue
- **Community**: Join discussions
- **Professional**: Contact support

## 📈 Scaling

### Performance Optimization

1. **CDN**: Use Vercel's global CDN
2. **Caching**: Implement proper caching strategies
3. **Database**: Optimize queries and indexes
4. **Real-time**: Monitor connection limits

### Cost Management

1. **Vercel**: Monitor bandwidth and function usage
2. **Supabase**: Track database and real-time usage
3. **Optimization**: Implement efficient data structures
4. **Monitoring**: Set up cost alerts

## 🎯 Success Metrics

Track these key metrics:

- **Performance**: Page load time < 2s
- **Real-time**: Cursor latency < 50ms
- **Uptime**: 99.9% availability
- **User Experience**: Low error rates
- **Collaboration**: Concurrent user capacity

---

For more detailed information, see the [main README](README.md) and [API documentation](docs/api.md).

