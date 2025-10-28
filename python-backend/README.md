# CapMatch RTC - Python FastAPI Backend

This is a minimal FastAPI service to receive Twilio Video webhooks (StatusCallback events) over POST with `application/x-www-form-urlencoded`.

## Features

- POST `/` receives and logs Twilio webhook payloads.
- Validates Twilio signature when `TWILIO_AUTH_TOKEN` is configured.
- Health check at `GET /`.

## Quick start

1. Create and activate a virtual environment (recommended), then install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Configure your environment (optional but recommended for production):

- Copy `.env.example` to `.env` and set `TWILIO_AUTH_TOKEN` to your Twilio account auth token.

3. Run the server:

```bash
uvicorn app.main:app --reload --port 8000
```

4. Expose locally via a tunnel (for Twilio to reach your machine):

- Using ngrok (example):

```bash
ngrok http http://localhost:8000
```

Set your Twilio Video Room Status Callback URL to: `https://<your-ngrok-subdomain>.ngrok.io/twilio/webhook`.

## Endpoint

- `POST /`
  - Content-Type: `application/x-www-form-urlencoded`
  - Validates `X-Twilio-Signature` if `TWILIO_AUTH_TOKEN` is present
  - Responds JSON: `{ "received": true, "event": "participant-connected", ... }`

For quick manual checks: `POST /twilio/webhook/plain` responds with `OK`.

## Example payload

Twilio typically sends form data like:

```
RoomStatus=in-progress&RoomType=group&RoomSid=RM82ef07b8b472c9054ea9588ce83ce7ae&RoomName=kok&ParticipantStatus=connected&ParticipantIdentity=Vatsal%20Hariramani&SequenceNumber=1&StatusCallbackEvent=participant-connected&Timestamp=2025-10-27T18%3A16%3A01.876Z&ParticipantSid=PA2ce0cd0dd9ff455c584940f1e81a66b9&AccountSid=ACc3e9e7ecc6c54a4b387cb177780987d5
```

## Environment

- `TWILIO_AUTH_TOKEN`: If set, webhook requests must have a valid `X-Twilio-Signature`. If not set, signature validation is skipped (useful for local dev or quick testing).

## Setting Secrets with fly.io

```
fly secrets set -a <your_deployment_name> \
  TWILIO_AUTH_TOKEN=XXXX \
  SUPABASE_URL=https://XXXX.supabase.co \
  SUPABASE_KEY=sb_secret_XXXX_XXX \
  GEMINI_API_KEY=XXXXXX
```

