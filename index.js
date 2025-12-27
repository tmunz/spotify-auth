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

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
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
  res.cookie('origin_url', originUrl);
  res.cookie(stateKey, state);

  var scope = 'user-read-private user-read-email';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state
  });
  res.redirect('https://accounts.spotify.com/authorize?' + params.toString());
});

app.get('/callback', function(req, res) {

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    const errorParams = new URLSearchParams({ error: 'state_mismatch' });
    res.redirect('/#' + errorParams.toString());
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

      axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': 'Bearer ' + access_token }
      }).then(userResponse => {
        console.log(userResponse.data);
      }).catch(err => {
        console.error('Error fetching user data:', err.message);
      });

      const successParams = new URLSearchParams({
        access_token: access_token,
        refresh_token: refresh_token
      });
      
      // Get the origin URL from cookies
      const originUrl = req.cookies ? req.cookies['origin_url'] : 'http://localhost:3000';
      res.clearCookie('origin_url');
      res.redirect(originUrl + '/#' + successParams.toString());
    }).catch(error => {
      console.error('Error during token exchange:', error.message);
      const errorParams = new URLSearchParams({ error: 'invalid_token' });
      const originUrl = req.cookies ? req.cookies['origin_url'] : 'http://localhost:3000';
      res.clearCookie('origin_url');
      res.redirect(originUrl + '/#' + errorParams.toString());
    });
  }
});

app.get('/refresh_token', function(req, res) {

  const refresh_token = req.query.refresh_token;
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
    res.send({
      'access_token': access_token
    });
  }).catch(error => {
    console.error('Error refreshing token:', error.message);
    res.status(400).send({
      error: 'invalid_grant'
    });
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, function() {
  console.log(`Spotify Auth Server is running on http://${HOST}:${PORT}`);
  console.log(`Health check available at http://${HOST}:${PORT}/health`);
  console.log(`Login endpoint: http://${HOST}:${PORT}/login`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
