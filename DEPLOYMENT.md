# Deployment Guide

This guide covers deploying your Spotify Authentication Server to Vercel.

## Vercel Deployment

Vercel provides seamless deployment with GitHub integration and automatic HTTPS.

### Quick Deploy

The easiest way to deploy is by connecting your GitHub repository to Vercel:

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. **Click "Add New Project"** and import your repository
3. **Configure environment variables** (see below)
4. **Deploy!** - Vercel will automatically deploy on every push to main

### Manual Deployment via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add CLIENT_ID
vercel env add CLIENT_SECRET
vercel env add REDIRECT_URI
vercel env add ALLOWED_ORIGINS

# Redeploy with environment variables
vercel --prod
```

## Environment Variables Setup

You need to configure these environment variables in your Vercel project settings:

| Variable | Value | Note |
|----------|-------|------|
| `CLIENT_ID` | Your Spotify app's Client ID | From Spotify Developer Dashboard |
| `CLIENT_SECRET` | Your Spotify app's Client Secret | Keep this secret! |
| `REDIRECT_URI` | `https://your-project.vercel.app/callback` | Must match Spotify app settings |
| `ALLOWED_ORIGINS` | `https://app1.com,https://app2.com` | Comma-separated list of allowed redirect origins. Defaults to `http://localhost:8888,http://localhost:3000` if not set |
| `NODE_ENV` | `production` | Optional, for production mode |

### Setting Environment Variables in Vercel Dashboard:

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable with its value
4. Select the environments (Production, Preview, Development)
5. Click **Save**

### Getting Your Redirect URI:

After deploying, your redirect URI will be:
```
https://your-project-name.vercel.app/callback
```

**Important:** Add this exact URL to your Spotify app's "Redirect URIs" in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

## Custom Domain Setup

1. **Add custom domain in Vercel:**
   - Go to **Settings** → **Domains**
   - Add your domain (e.g., `auth.yourdomain.com`)
   - Follow DNS configuration instructions

2. **Update environment variables:**
   - Update `REDIRECT_URI` to `https://auth.yourdomain.com/callback`
   - Update `ALLOWED_ORIGINS` to include your production app URLs

3. **Update Spotify app settings:**
   - Add the new redirect URI to your Spotify app settings

## Automatic Deployments

Vercel automatically deploys your application:

- **Production deployments**: Every push to your `main` branch
- **Preview deployments**: Every push to other branches or pull requests
- **Instant rollbacks**: Easily revert to previous deployments

## Monitoring and Health Checks

Use the built-in health check endpoint:
```bash
curl https://your-project.vercel.app/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Check that your Spotify app settings include the exact redirect URI
   - Ensure you're using `https://` (Vercel provides this automatically)
   - Format should be: `https://your-project.vercel.app/callback`

2. **"Missing environment variables"**
   - Verify all required environment variables are set in Vercel dashboard
   - Check for typos in variable names
   - Redeploy after adding environment variables

3. **"Origin not allowed" (403 error)**
   - Add your app's URL to the `ALLOWED_ORIGINS` environment variable
   - Format: `https://app1.com,https://app2.com` (comma-separated, no spaces)
   - Remember to redeploy after updating environment variables

4. **CORS errors**
   - The server includes CORS headers by default
   - Ensure your app URL is in `ALLOWED_ORIGINS`

### Debugging:

1. **Check Vercel logs**: Go to your project → Deployments → select deployment → Runtime Logs
2. **Test health endpoint**: `curl https://your-project.vercel.app/health`
3. **Verify environment variables**: Check Settings → Environment Variables
4. **Test locally first**: Run with the same environment variables locally

## Security Best Practices

1. **Never commit secrets** to version control (use `.env` locally, never commit `.env` file)
2. **Use Vercel's environment variables** for all sensitive data
3. **Rotate secrets regularly** in both Spotify dashboard and Vercel settings
4. **Limit ALLOWED_ORIGINS** to only your actual app domains
5. **Monitor deployment logs** for suspicious activity
6. **Use different Spotify apps** for development and production

## Performance and Scaling

Vercel automatically handles:

- **Global CDN**: Your auth server is distributed worldwide
- **Auto-scaling**: Handles traffic spikes automatically
- **Edge caching**: Static assets are cached at the edge
- **Serverless architecture**: Pay only for what you use
- **Zero-downtime deployments**: Seamless updates

No additional configuration needed!
````