# Deployment Guide

This document covers building, deploying, and hosting the Brainstorm App.

## Building for Production

### Prerequisites

- Node.js 18+ installed
- All dependencies installed (`npm install`)

### Build Command

```bash
npm run build
```

This runs:
1. `tsc -b` - TypeScript compilation and type checking
2. `vite build` - Vite production build

### Build Output

The production build is output to the `dist/` directory:

```
dist/
├── index.html          # Entry HTML
├── assets/
│   ├── index-[hash].js    # Main bundle (minified)
│   └── index-[hash].css   # Styles (minified)
└── vite.svg             # Favicon
```

### Build Analysis

To analyze bundle size:

```bash
# Install the visualizer plugin
npm install -D vite-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'vite-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      filename: 'dist/stats.html',
    }),
  ],
});
```

## Local Preview

After building, preview the production build locally:

```bash
npm run preview
```

This starts a local server (default: `http://localhost:4173`) serving the `dist/` directory.

## Deployment Options

### Static Hosting (Recommended)

Since the app is a single-page application (SPA) with no server-side logic, it can be deployed to any static hosting provider.

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

Or connect your Git repository to Vercel for automatic deployments.

**Vercel Configuration (`vercel.json`):**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --dir=dist --prod
```

Or connect your Git repository to Netlify for automatic deployments.

**Netlify Configuration (`netlify.toml`):**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### GitHub Pages

1. Update `vite.config.ts` with a base path:

```typescript
export default defineConfig({
  base: '/brainstorm-app/',  // Repository name
  plugins: [react()],
});
```

2. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

#### Cloudflare Pages

1. Connect your Git repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output directory: `dist`

#### AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Docker

Create a `Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# SPA routing support
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t brainstorm-app .
docker run -p 8080:80 brainstorm-app
```

### Self-Hosted (Node.js)

For simple self-hosting without Docker:

```bash
# Install serve globally
npm install -g serve

# Serve the dist directory
serve -s dist -l 3000
```

## Environment Considerations

### Data Storage

- The app uses **IndexedDB** for all data persistence
- No server-side storage or API calls required
- Data is stored per-origin (per domain/port)
- Data does NOT sync across different origins or domains

### Multi-Tab Support

- The app supports multiple tabs open simultaneously
- Changes in one tab are reflected in others via `storage` events
- Auto-save is debounced to prevent conflicts

### Browser Requirements

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

### Progressive Web App (PWA)

The app can be enhanced with a service worker for offline support:

1. Add `manifest.json` to `public/`
2. Register a service worker for caching
3. Add meta tags to `index.html`

## Performance Checklist

Before deploying to production:

- [ ] Run `npm run typecheck` - No TypeScript errors
- [ ] Run `npm run lint` - No linting warnings
- [ ] Run `npm run test:run` - All tests pass
- [ ] Run `npm run build` - Successful production build
- [ ] Test on target browsers
- [ ] Verify IndexedDB persistence works
- [ ] Check dark mode toggle functionality
- [ ] Test keyboard shortcuts
- [ ] Verify responsive behavior (sidebar collapse)

## Troubleshooting

### Build Fails with TypeScript Errors

```bash
# Run type-check to see detailed errors
npm run typecheck
```

### IndexedDB Not Working

- Ensure the app is served over HTTPS (required in production)
- Localhost is exempt from HTTPS requirement
- Check browser DevTools → Application → IndexedDB

### CSS Not Loading

- Verify `tailwind.config.js` content paths include your HTML and source files
- Ensure PostCSS is configured (`postcss.config.js`)

### SPA Routing Issues

- Configure your hosting provider to rewrite all routes to `index.html`
- See hosting-specific configuration sections above
