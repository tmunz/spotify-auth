# Deployment Guide

This guide covers deploying your Spotify Authentication Server to various cloud platforms.

## Platform-Specific Deployment

### 1. Heroku

**Quick Deploy Button:**
```markdown
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
```

**Manual Deployment:**
```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-spotify-auth-server

# Set environment variables
heroku config:set CLIENT_ID=your_client_id
heroku config:set CLIENT_SECRET=your_client_secret
heroku config:set REDIRECT_URI=https://your-spotify-auth-server.herokuapp.com/callback

# Deploy
git push heroku main
```

### 2. Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard or CLI
railway variables set CLIENT_ID=your_client_id
railway variables set CLIENT_SECRET=your_client_secret
railway variables set REDIRECT_URI=https://your-app.railway.app/callback
```

### 3. GitLab CI/CD + Heroku

Create `.gitlab-ci.yml`:
```yaml
stages:
  - test
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test
  only:
    - merge_requests
    - main

deploy_heroku:
  stage: deploy
  image: ruby:latest
  before_script:
    - apt-get update -qy
    - apt-get install -y ruby-dev
    - gem install dpl
  script:
    - dpl --provider=heroku --app=$HEROKU_APP_NAME --api-key=$HEROKU_API_KEY
  environment:
    name: production
    url: https://$HEROKU_APP_NAME.herokuapp.com
  only:
    - main
```

**GitLab Variables to set:**
- `HEROKU_API_KEY` - Your Heroku API key
- `HEROKU_APP_NAME` - Your Heroku app name
- `SPOTIFY_CLIENT_ID` - Your Spotify client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify client secret
- `SPOTIFY_REDIRECT_URI` - Your production callback URL

### 4. GitLab CI/CD + Railway

Create `.gitlab-ci.yml`:
```yaml
stages:
  - test
  - deploy

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test
  only:
    - merge_requests
    - main

deploy_railway:
  stage: deploy
  image: node:18
  before_script:
    - npm install -g @railway/cli
  script:
    - railway login --token $RAILWAY_TOKEN
    - railway up --service $RAILWAY_SERVICE_ID
  environment:
    name: production
  only:
    - main
```

**GitLab Variables:**
- `RAILWAY_TOKEN` - Railway API token
- `RAILWAY_SERVICE_ID` - Your Railway service ID

### 5. GitLab CI/CD + DigitalOcean App Platform

Create `.gitlab-ci.yml`:
```yaml
stages:
  - test
  - deploy

deploy_digitalocean:
  stage: deploy
  image: digitalocean/doctl:latest
  before_script:
    - doctl auth init --access-token $DO_ACCESS_TOKEN
  script:
    - doctl apps create-deployment $DO_APP_ID
  environment:
    name: production
  only:
    - main
```

### 6. GitLab CI/CD + Custom Server (Docker)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

USER node

CMD ["npm", "start"]
```

Create `.gitlab-ci.yml`:
```yaml
stages:
  - build
  - test
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

services:
  - docker:dind

before_script:
  - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY

build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test

deploy:
  stage: deploy
  script:
    - docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:latest
    # Deploy to your server via SSH
    - 'which ssh-agent || ( apt-get update -y && apt-get install openssh-client -y )'
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan $DEPLOY_HOST >> ~/.ssh/known_hosts
    - chmod 644 ~/.ssh/known_hosts
    - ssh $DEPLOY_USER@$DEPLOY_HOST "docker pull $CI_REGISTRY_IMAGE:latest && docker stop spotify-auth || true && docker rm spotify-auth || true && docker run -d --name spotify-auth -p 5000:5000 -e CLIENT_ID=$SPOTIFY_CLIENT_ID -e CLIENT_SECRET=$SPOTIFY_CLIENT_SECRET -e REDIRECT_URI=$SPOTIFY_REDIRECT_URI $CI_REGISTRY_IMAGE:latest"
  environment:
    name: production
  only:
    - main
```

### 7. Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add CLIENT_ID
vercel env add CLIENT_SECRET
vercel env add REDIRECT_URI

# Redeploy with environment variables
vercel --prod
```

### 8. Netlify

Create `netlify.toml`:
```toml
[build]
  publish = "public"
  command = "npm run build"

[functions]
  node_bundler = "nft"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### 9. DigitalOcean App Platform

Create `app.yaml`:
```yaml
name: spotify-auth-server
services:
- name: web
  source_dir: /
  github:
    repo: your-username/spotify-auth
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: CLIENT_ID
    scope: RUN_TIME
    type: SECRET
  - key: CLIENT_SECRET
    scope: RUN_TIME
    type: SECRET
  - key: REDIRECT_URI
    scope: RUN_TIME
    value: https://your-app.ondigitalocean.app/callback
  routes:
  - path: /
```

## Environment Variables Setup

Regardless of the platform, you'll need these environment variables:

| Variable | Value | Note |
|----------|-------|------|
| `CLIENT_ID` | Your Spotify app's Client ID | From Spotify Developer Dashboard |
| `CLIENT_SECRET` | Your Spotify app's Client Secret | Keep this secret! |
| `REDIRECT_URI` | `https://your-domain.com/callback` | Must match Spotify app settings |
| `NODE_ENV` | `production` | Optional, for production mode |

## Custom Domain Setup

1. **Configure your domain DNS** to point to your hosting platform
2. **Update REDIRECT_URI** to use your custom domain:
   ```
   https://auth.yourdomain.com/callback
   ```
3. **Update Spotify app settings** with the new redirect URI

## SSL/HTTPS Setup

Most platforms provide automatic HTTPS. For custom setups:

1. Obtain SSL certificate (Let's Encrypt, Cloudflare, etc.)
2. Configure your web server to use HTTPS
3. Ensure REDIRECT_URI uses `https://`

## Monitoring and Health Checks

Use the built-in health check endpoint:
```bash
curl https://your-app.com/health
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
   - Check Spotify app settings match your REDIRECT_URI exactly
   - Ensure protocol (http/https) matches

2. **"Missing environment variables"**
   - Verify all required env vars are set on your platform
   - Check for typos in variable names

3. **CORS errors**
   - Server includes CORS headers by default
   - Check if your client domain is causing issues

4. **502/503 errors**
   - Check if the app is properly started
   - Verify PORT environment variable if required

### Debugging:

1. Check platform logs
2. Test health endpoint
3. Verify environment variables
4. Test locally with same settings

## Security Considerations

1. **Never commit secrets** to version control
2. **Use HTTPS** in production
3. **Rotate secrets** regularly
4. **Monitor access logs** for suspicious activity
5. **Use environment-specific configs**

## Scaling

For high-traffic applications:

1. **Enable auto-scaling** on your platform
2. **Use CDN** for static assets
3. **Implement rate limiting**
4. **Add monitoring and alerting**
5. **Consider Redis** for session storage in multi-instance setups
