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
   - `ALLOWED_ORIGINS` - Comma-separated list of allowed domains (e.g., `https://your-project.com`)
   - `NODE_ENV` - Set to `production` for enhanced security

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
- `GET /login` - Initiates Spotify OAuth flow
  - **Security:** Origin is automatically detected from the `Referer` header
  - In production, requests without a valid Referer are rejected
  - Scopes are hardcoded: `user-read-private user-read-email user-read-playback-state user-modify-playback-state streaming`
- `GET /callback` - Handles OAuth callback from Spotify
- `GET /refresh_token?refresh_token=TOKEN` - Refreshes an access token
- `GET /health` - Health check endpoint

## Usage in Your Web App

After deployment to Vercel, you can use this server from your web application:

### Basic Usage

**Important:** Users must initiate login by clicking a button/link on your website. The server automatically detects the origin from the browser's `Referer` header for security.

```html
<!-- In your HTML -->
<button onclick="loginWithSpotify()">Login with Spotify</button>

<script>
function loginWithSpotify() {
  window.location.href = 'https://your-project.vercel.app/login';
}

// Handle the callback (tokens will be in URL hash)
window.addEventListener('load', function() {
  const urlParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = urlParams.get('access_token');
  const refreshToken = urlParams.get('refresh_token');
  const expiresIn = urlParams.get('expires_in');
  
  if (accessToken) {
    // User is authenticated, use the access token
    console.log('Authenticated with Spotify!');
    // Store tokens securely and make Spotify API calls
  }
  
  const error = urlParams.get('error');
  if (error) {
    console.error('Authentication error:', error);
  }
});
</script>
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

**Critical Security Feature:** For security, the server uses the `Referer` header to determine where to redirect tokens. Only domains in your `ALLOWED_ORIGINS` whitelist are accepted.

```bash
ALLOWED_ORIGINS=http://localhost:8888,https://yourdomain.com
```

#### Production Security

When `NODE_ENV=production`:
- ✅ Origin is **only** determined from the `Referer` header (secure)
- ✅ Query parameters are ignored (prevents phishing attacks)
- ✅ Requests without a valid Referer are rejected
- ✅ Only whitelisted domains can receive tokens

**Default (development mode):**
- Query parameters are allowed as fallback for testing
- Default fallback to `localhost:8888`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CLIENT_ID` | Spotify application client ID | Yes |
| `CLIENT_SECRET` | Spotify application client secret | Yes |
| `REDIRECT_URI` | OAuth callback URL (e.g., `https://your-project.vercel.app/callback`) | Yes |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origin URLs for enhanced security (disables fallbacks) | Recommended |
| `PORT` | Server port (default: 5000) | No |
| `HOST` | Server host (default: localhost) | No |

\* *If not set, defaults to `http://localhost:8888,http://localhost:3000`*

## Security Notes

- Never expose your `CLIENT_SECRET` in client-side code
- Always use HTTPS in production
- Store tokens securely (consider using sessionStorage instead of localStorage)
- Set `NODE_ENV=production` in your deployment
- Implement token refresh before expiration (use `expires_in` value)
- Validate tokens on your backend before making sensitive operations

## License

MIT License - see LICENSE file for details.
