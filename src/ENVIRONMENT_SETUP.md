# 🚀 BusiMap Rwanda - Environment Setup Guide

## Quick Fix for "process is not defined" Error

The error has been fixed! Your API configuration now uses browser-compatible environment variable access.

## 🔧 Environment Configuration

### 1. **Development Setup** (Local)

Create a `.env.local` file in your project root:

```bash
# .env.local
VITE_API_URL=http://127.0.0.1:8000
VITE_ENVIRONMENT=development
VITE_ENABLE_VOICE_FEATURES=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_LOGGING=true
```

### 2. **Production Setup**

For production deployment:

```bash
# .env.production
VITE_API_URL=https://api.busimap.rw
VITE_ENVIRONMENT=production
VITE_ENABLE_VOICE_FEATURES=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_LOGGING=false
```

### 3. **Staging Setup**

For staging environment:

```bash
# .env.staging
VITE_API_URL=https://api-staging.busimap.rw
VITE_ENVIRONMENT=staging
VITE_ENABLE_VOICE_FEATURES=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_LOGGING=true
```

## 🏗️ Build System Compatibility

The new configuration system works with:

- ✅ **Vite** (recommended) - Uses `import.meta.env`
- ✅ **Create React App** - Uses `process.env` (if available)
- ✅ **Any build system** - Falls back to hostname detection
- ✅ **Static hosting** - Works without build-time environment variables

## 🔄 Automatic Environment Detection

If no environment variables are set, the system automatically detects:

- `localhost` or `127.0.0.1` → Development
- `*staging*` domain → Staging  
- `busimap.rw` domain → Production

## 📝 Configuration Features

### Smart API Base URL Detection
```typescript
// Automatically selects the right API URL based on environment
const API_BASE_URL = config.apiBaseUrl;
```

### Environment-Aware Logging
```typescript
// Only logs in development/staging
log('API request successful');
logError('Something went wrong');
```

### Feature Flags
```typescript
// Enable/disable features by environment
if (ENABLE_VOICE_FEATURES) {
  // Voice features code
}
```

## 🚀 Deployment Commands

### Development
```bash
npm run dev
# Uses development configuration automatically
```

### Build for Production
```bash
npm run build
# Make sure .env.production is configured
```

### Preview Production Build
```bash
npm run preview
# Test production build locally
```

## 🔧 Django Backend Configuration

Make sure your Django backend is configured for CORS:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000", 
    "https://busimap.rw",
    "https://app.busimap.rw",
]

CORS_ALLOW_CREDENTIALS = True
```

## 🎯 Testing the Fix

1. **Start your Django backend:**
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```

2. **Start your React frontend:**
   ```bash
   npm run dev
   ```

3. **Check the browser console** - you should see:
   ```
   [BusiMap] Making request to: http://127.0.0.1:8000/api/...
   ```

## 🔍 Troubleshooting

### Still getting "process is not defined"?
- Clear your browser cache
- Restart your development server
- Check that you're not importing old cached versions

### API requests failing?
- Verify Django backend is running on `http://127.0.0.1:8000`
- Check CORS configuration in Django
- Ensure API endpoints are accessible

### Environment variables not working?
- Check file naming: `.env.local` (not `.env`)
- Restart development server after adding env variables
- Variables must start with `VITE_` prefix

## ✅ Success Indicators

You'll know everything is working when:

- ✅ No "process is not defined" errors
- ✅ API requests show in browser console (development)
- ✅ Login/register functionality works
- ✅ Business listings load from Django backend
- ✅ AI chat connects successfully

Your BusiMap Rwanda platform is now fully configured and ready for development! 🇷🇼✨