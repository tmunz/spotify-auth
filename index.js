/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

// Load environment variables from .env file
require('dotenv').config();

var express = require('express');
var axios = require('axios');
var cors = require('cors');
var cookieParser = require('cookie-parser');

const requiredEnvVars = ['CLIENT_ID', 'CLIENT_SECRET', 'REDIRECT_URI'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these environment variables before running the application.');
  process.exit(1);
}

var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = process.env.REDIRECT_URI;

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
  : ['http://localhost:8888', 'http://localhost:3000'];

var isAllowedOrigin = function(url) {
  try {
    const urlObj = new URL(url);
    const incomingUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    const incomingBase = `${urlObj.protocol}//${urlObj.host}`;
    
    return ALLOWED_ORIGINS.some(allowed => {
      const allowedObj = new URL(allowed);
      const allowedBase = `${allowedObj.protocol}//${allowedObj.host}`;
      const allowedPath = allowedObj.pathname;
      
      if (allowedPath && allowedPath !== '/') {
        const allowedFullPath = `${allowedBase}${allowedPath}`;
        const normalizedAllowed = allowedFullPath.replace(/\/$/, '');
        const normalizedIncoming = incomingUrl.replace(/\/$/, '');
        return normalizedIncoming === normalizedAllowed || normalizedIncoming.startsWith(normalizedAllowed + '/');
      }
      
      return incomingBase === allowedBase;
    });
  } catch (e) {
    return false;
  }
};

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var buildRedirectUrl = function(originUrl, params) {
  const cleanOriginUrl = originUrl.replace(/\/$/, '');
  return cleanOriginUrl + '/#' + params.toString();
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/health', function(req, res) {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  
  const originUrl = req.query.origin || 'http://localhost:8888';
  const scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state streaming';

  console.log('Login request - Origin:', originUrl);
  console.log('Login request - Scopes:', scope);

  if (!isAllowedOrigin(originUrl)) {
    console.error('Unauthorized origin URL:', originUrl);
    return res.status(403).json({ 
      error: 'forbidden', 
      message: 'Origin URL is not allowed' 
    });
  }
  
  res.cookie('origin_url', originUrl);
  res.cookie(stateKey, state);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state
  });
  
  const spotifyAuthUrl = 'https://accounts.spotify.com/authorize?' + params.toString();
  console.log('Redirecting to Spotify auth:', spotifyAuthUrl);
  res.redirect(spotifyAuthUrl);
});

app.get('/callback', function(req, res) {

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    const errorParams = new URLSearchParams({ error: 'state_mismatch' });
    const originUrl = req.cookies ? req.cookies['origin_url'] : 'http://localhost:3000';
    res.clearCookie(stateKey);
    res.clearCookie('origin_url');
    
    const redirectUrl = buildRedirectUrl(originUrl, errorParams);
    res.redirect(redirectUrl);
  } else {
    res.clearCookie(stateKey);
    
    const formData = new URLSearchParams({
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    });

    const authHeaders = {
      'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    axios.post('https://accounts.spotify.com/api/token', formData.toString(), {
      headers: authHeaders
    }).then(response => {
      const body = response.data;
      const access_token = body.access_token;
      const refresh_token = body.refresh_token;
      const expires_in = body.expires_in; // Spotify returns this in seconds

      console.log('Token exchange successful');
      console.log('Access token expires in:', expires_in, 'seconds');

      axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': 'Bearer ' + access_token }
      }).then(userResponse => {
        console.log('User authenticated:', userResponse.data.display_name || userResponse.data.id);
      }).catch(err => {
        console.error('Error fetching user data:', err.message);
      });

      const successParams = new URLSearchParams({
        access_token: access_token,
        refresh_token: refresh_token,
        expires_in: expires_in // Include expires_in so client can schedule refresh
      });
      
      const originUrl = req.cookies ? req.cookies['origin_url'] : 'http://localhost:3000';
      res.clearCookie('origin_url');
      
      const redirectUrl = buildRedirectUrl(originUrl, successParams);
      console.log('Redirecting to:', redirectUrl.substring(0, 100) + '...');
      res.redirect(redirectUrl);
    }).catch(error => {
      console.error('Error during token exchange:', error.message);
      const errorParams = new URLSearchParams({ error: 'invalid_token' });
      const originUrl = req.cookies ? req.cookies['origin_url'] : 'http://localhost:3000';
      res.clearCookie('origin_url');
      
      const redirectUrl = buildRedirectUrl(originUrl, errorParams);
      res.redirect(redirectUrl);
    });
  }
});

app.get('/refresh_token', function(req, res) {

  const refresh_token = req.query.refresh_token;
  
  if (!refresh_token) {
    return res.status(400).send({
      error: 'missing_refresh_token',
      message: 'Refresh token is required'
    });
  }

  console.log('Refreshing access token...');
  
  const formData = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh_token
  });

  const authHeaders = {
    'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  axios.post('https://accounts.spotify.com/api/token', formData.toString(), {
    headers: authHeaders
  }).then(response => {
    const body = response.data;
    const access_token = body.access_token;
    const new_refresh_token = body.refresh_token; // Spotify may return a new refresh token
    const expires_in = body.expires_in;

    console.log('Token refresh successful, expires in:', expires_in, 'seconds');

    const responseData = {
      'access_token': access_token,
      'expires_in': expires_in
    };

    if (new_refresh_token) {
      responseData.refresh_token = new_refresh_token;
      console.log('New refresh token provided by Spotify');
    }

    res.send(responseData);
  }).catch(error => {
    console.error('Error refreshing token:', error.response?.data || error.message);
    res.status(400).send({
      error: 'invalid_grant',
      message: 'Failed to refresh token'
    });
  });
});


app.get('/refresh', function(req, res) {
  // Forward to /refresh_token endpoint
  req.url = '/refresh_token';
  return app._router.handle(req, res, () => {});
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, function() {
  console.log(`Spotify Auth Server is running on http://${HOST}:${PORT}`);
  console.log(`Health check available at http://${HOST}:${PORT}/health`);
  console.log(`Login endpoint: http://${HOST}:${PORT}/login`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
