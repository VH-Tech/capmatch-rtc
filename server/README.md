# Server-only API

An Express server that reuses Twilio serverless endpoints from `@twilio-labs/plugin-rtc` 

## Prerequisites
- Node.js 18+ and npm
- Twilio credentials:
  - TWILIO_ACCOUNT_SID
  - TWILIO_API_KEY_SID
  - TWILIO_API_KEY_SECRET
  - TWILIO_CONVERSATIONS_SERVICE_SID (optional unless you use Conversations)
- Optional Firebase service account JSON if you enable Firebase auth

## Setup
1. Install dependencies:
   ```sh
   npm install
   ```
2. Configure environment:
   ```sh
   cp .env.example .env
   # edit .env and add your real values
   ```

## Run
- Development (TypeScript, auto-restart):
  ```sh
  npm run dev
  ```
- Production build then run (outputs to `./dist`):
  ```sh
  npm run build
  npm start
  ```

The server listens on `http://localhost:${PORT}` (default `8081`).

## Endpoints
- `POST /token` – issues a Twilio access token (delegated to `@twilio-labs/plugin-rtc`)
- `POST /recordingrules` – manage recording rules

Example request:
```sh
curl -X POST http://localhost:8081/token \
  -H 'Content-Type: application/json' \
  -d '{"identity":"alice"}'
```

## Static hosting note
This server also serves static files from `../build` relative to the compiled output. If you don't have a frontend build there, root (`/`) will just try to serve `index.html` and may 404. The API endpoints (`/token`, `/recordingrules`) work regardless.

## Troubleshooting
- Module not found `@twilio-labs/plugin-rtc`: run `npm install` again, ensure network access.
- 401 responses when Firebase auth is enabled: ensure the `Authorization` header contains a valid Firebase ID token and that the email domain passes your check in `firebaseAuthMiddleware.ts`.
- Twilio auth errors: verify TWILIO_* values in `.env` and that the API key is enabled.

## CORS
This server enables CORS with sane defaults:
- If `ALLOWED_ORIGINS` is not set, all origins are allowed (the request origin is reflected), with `Authorization` header permitted.
- To restrict, set `ALLOWED_ORIGINS` to a comma-separated list, e.g.:
  ```sh
  # .env
  ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.example.com
  ```
Preflight requests (OPTIONS) are handled automatically.

## Deploying to Fly.io
This app is containerized with a multi-stage Dockerfile and a `fly.toml` that serves HTTP on port `8081`.

1. Set secrets (required at runtime):
  ```sh
  fly secrets set \
    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
    TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
    TWILIO_API_KEY_SECRET=your_api_key_secret \
    REACT_APP_TWILIO_ENVIRONMENT=prod
  ```
  Optional:
  ```sh
  fly secrets set TWILIO_CONVERSATIONS_SERVICE_SID=ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```

2. Deploy:
  ```sh
  fly deploy
  ```

3. Check logs:
  ```sh
  fly logs
  ```

If required secrets are missing, the server will fail fast with a clear error listing the missing variables.
