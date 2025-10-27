# Quick Start Guide: Supabase Authentication

Get your Twilio Video App running with Supabase authentication in 5 minutes!

## Prerequisites

- Node.js installed
- A Supabase account ([sign up here](https://supabase.com))
- A Google Cloud Console account

## Quick Setup (5 Steps)

### 1. Install Dependencies

```bash
npm install
```

The `@supabase/supabase-js` package is already included in package.json.

### 2. Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details and create

### 3. Get Supabase Credentials

In your Supabase dashboard:
- Go to **Settings** > **API**
- Copy **Project URL** and **anon public** key

### 4. Configure Google OAuth

#### In Google Cloud Console:
1. Create OAuth 2.0 Client ID
2. Add authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
3. Copy Client ID and Secret

#### In Supabase:
1. Go to **Authentication** > **Providers** > **Google**
2. Enable and paste Google Client ID and Secret
3. Save

### 5. Configure Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add:

```env
# Enable Supabase Auth
REACT_APP_SET_AUTH=supabase

# Supabase Config (from Step 3)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Twilio Credentials (keep your existing ones)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_API_KEY_SID=your-api-key-sid
TWILIO_API_KEY_SECRET=your-api-key-secret
```

## Run the App

```bash
npm start
```

Visit `http://localhost:3000` and you'll be redirected to the login page!

## Test Authentication

1. Click "Sign in with Google"
2. Complete Google OAuth
3. You'll be redirected back to the app
4. To sign out, click **More** menu > **Sign Out**

## What You Get

✅ **Secure Authentication** - Only authenticated users can access the app
✅ **Google Sign-In** - Easy login with Google accounts
✅ **Session Management** - Automatic session handling
✅ **Sign Out** - Users can sign out from the menu
✅ **Real-time Transcriptions** - Already enabled! Click "Show Captions" in the bottom bar

## Need More Details?

See [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) for detailed setup instructions.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     User Browser                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  React App (Protected by PrivateRoute)            │  │
│  │  • VideoProvider                                   │  │
│  │  • Room Component (with Transcriptions)           │  │
│  │  • MenuBar (with Sign Out)                        │  │
│  └──────────┬────────────────────────────────────────┘  │
│             │                                            │
│             │ Auth Check                                 │
│             ▼                                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Supabase Auth (useSupabaseAuth)                  │  │
│  │  • Session Management                              │  │
│  │  • Google OAuth Flow                               │  │
│  │  • JWT Token Handling                              │  │
│  └──────────┬────────────────────────────────────────┘  │
└─────────────┼────────────────────────────────────────────┘
              │
              │ OAuth
              ▼
   ┌─────────────────────┐        ┌──────────────────┐
   │   Supabase Auth     │◄──────►│  Google OAuth    │
   │   Backend           │        │                  │
   └─────────────────────┘        └──────────────────┘
              │
              │ Authenticated Token
              ▼
   ┌─────────────────────┐
   │   Twilio Video      │
   │   Token Server      │
   └─────────────────────┘
```

## Key Files

- **[src/state/useSupabaseAuth/useSupabaseAuth.ts](src/state/useSupabaseAuth/useSupabaseAuth.ts)** - Supabase authentication hook
- **[src/state/index.tsx](src/state/index.tsx)** - App state provider with Supabase integration
- **[src/components/LoginPage/LoginPage.tsx](src/components/LoginPage/LoginPage.tsx)** - Login page with Google sign-in
- **[src/components/PrivateRoute/PrivateRoute.tsx](src/components/PrivateRoute/PrivateRoute.tsx)** - Protected route component
- **[src/components/MenuBar/Menu/Menu.tsx](src/components/MenuBar/Menu/Menu.tsx)** - Menu with sign-out button

## Troubleshooting

**"Invalid redirect URL" error?**
- Check that your callback URL is added in both Google Console and Supabase settings

**Can't sign in?**
- Clear browser cookies and try again
- Check browser console for errors
- Verify `.env` variables are set correctly

**Still having issues?**
- Check the detailed guide: [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md)
- Review Supabase logs in the dashboard

## Next Steps

1. **Deploy to Production** - Set environment variables in your hosting platform
2. **Add User Profiles** - Store additional user data in Supabase
3. **Enable RLS** - Add Row Level Security policies in Supabase
4. **Custom Token Endpoint** - Verify Supabase tokens on your server

Happy coding! 🎉
