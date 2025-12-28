# Spotify Authentication Server

A Node.js server implementing Spotify's OAuth2 Authorization Code flow for web applications. Optimized for deployment on Vercel with GitHub integration.

## Features

- ✅ Complete Spotify OAuth2 authorization code flow
- ✅ Environment variable configuration
- ✅ Ready for Vercel deployment
- ✅ Health check endpoint
- ✅ CORS enabled for cross-origin requests
- ✅ Error handling and validation

## Quick Start

### Local Development

1. **Clone and setup:**
```bash
git clone https://github.com/munzert/spotify-auth
cd spotify-auth
npm install
```

2. **Environment configuration:**
```bash
cp .env.example .env
# Edit .env with your Spotify app credentials
```

3. **Start the server:**
```bash
npm start
```
Your server will be running at `http://localhost:5000`

### Spotify App Setup

1. Go to the [Spotify for Developers Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Add these redirect URIs in your app settings:
   - For local development: `http://localhost:5000/callback`
   - For production: `https://your-domain.com/callback`

## Deployment to Vercel

Vercel provides the best GitHub integration for hosting Node.js applications with automatic deployments.

### 🚀 Deploy to Vercel

1. **Connect to GitHub:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account
   - Import your repository

2. **Set Environment Variables in Vercel Dashboard:**
   - `CLIENT_ID` - Your Spotify client ID
   - `CLIENT_SECRET` - Your Spotify client secret
   - `REDIRECT_URI` - `https://your-project.vercel.app/callback`

3. **Deploy:** Every push to main automatically deploys!

### GitHub Actions (Optional)

For automated deployment with environment variable management, the included GitHub Actions workflow requires these secrets:

#### GitHub Secrets to Set:
- `SPOTIFY_CLIENT_ID` - Your Spotify app's client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify app's client secret
- `SPOTIFY_REDIRECT_URI` - Your production redirect URI
- `VERCEL_TOKEN` - Your Vercel token
- `VERCEL_ORG_ID` - Your Vercel organization ID  
- `VERCEL_PROJECT_ID` - Your Vercel project ID

#### Setting GitHub Secrets:
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret" for each required secret

## API Endpoints

- `GET /` - Serves the main authentication page
- `GET /login?origin=URL` - Initiates Spotify OAuth flow with optional origin URL
  - `origin` (optional) - The URL to redirect back to after authentication
  - Scopes are hardcoded: `user-read-private user-read-email user-read-playback-state user-modify-playback-state streaming`
- `GET /callback` - Handles OAuth callback from Spotify
- `GET /refresh_token?refresh_token=TOKEN` - Refreshes an access token
- `GET /health` - Health check endpoint

## Usage in Your Web App

After deployment to Vercel, you can use this server from your web application:

### Basic Usage

```javascript
// Redirect user to login
window.location.href = 'https://your-project.vercel.app/login';

// Handle the callback (tokens will be in URL hash)
const urlParams = new URLSearchParams(window.location.hash.substring(1));
const accessToken = urlParams.get('access_token');
const refreshToken = urlParams.get('refresh_token');
```

### With Custom Origin

Redirect back to a specific URL after authentication:

```javascript
// Specify where to redirect after authentication
const origin = 'https://myapp.com';
window.location.href = `https://your-project.vercel.app/login?origin=${encodeURIComponent(origin)}`;

// After authentication, user will be redirected to:
// https://myapp.com/#access_token=...&refresh_token=...
```

### Granted Scopes

The server requests these Spotify permissions:
- `user-read-private` - Read user's subscription details
- `user-read-email` - Read user's email address
- `user-read-playback-state` - Read user's playback state
- `user-modify-playback-state` - Control playback
- `streaming` - Control playback on Spotify clients

**For more scopes:** See [Spotify Authorization Scopes](https://developer.spotify.com/documentation/web-api/concepts/scopes). To change scopes, modify the hardcoded value in `index.js`.

### Security: Allowed Origins

For security, only URLs from allowed origins can be used for redirects. Configure allowed origins in your environment variables:

```bash
ALLOWED_ORIGINS=http://localhost:8888,http://localhost:3000,https://yourdomain.com
```

If not set, defaults to `http://localhost:8888` and `http://localhost:3000`.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CLIENT_ID` | Spotify application client ID | Yes |
| `CLIENT_SECRET` | Spotify application client secret | Yes |
| `REDIRECT_URI` | OAuth callback URL | Yes |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origin URLs for redirects | No |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment mode | No |

## Security Notes

- Never expose your `CLIENT_SECRET` in client-side code
- Use HTTPS in production
- Validate the `state` parameter to prevent CSRF attacks
- Store tokens securely in your client application

## License

MIT License - see LICENSE file for details.
