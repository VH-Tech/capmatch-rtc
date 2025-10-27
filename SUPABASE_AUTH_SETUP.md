# Supabase Authentication Setup Guide

This guide will walk you through setting up Supabase authentication with Google OAuth for your Twilio Video App.

## Prerequisites

- A Supabase account (sign up at [https://supabase.com](https://supabase.com))
- A Google Cloud Console account for OAuth credentials

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Choose a name for your project
   - **Database Password**: Create a secure password
   - **Region**: Select the region closest to your users
4. Click "Create new project"

## Step 2: Get Your Supabase Credentials

1. Once your project is created, go to **Settings** (gear icon in the sidebar)
2. Click on **API** in the left menu
3. You'll find two important values:
   - **Project URL**: This is your `REACT_APP_SUPABASE_URL`
   - **anon public**: This is your `REACT_APP_SUPABASE_ANON_KEY`
4. Copy these values for later use

## Step 3: Set Up Google OAuth

### 3.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to **APIs & Services** > **Library**
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth credentials:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth 2.0 Client ID**
   - Configure the consent screen if prompted
   - Application type: **Web application**
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**:
     - Add your Supabase callback URL (see next step)
   - Click **Create**
5. Copy your **Client ID** and **Client Secret**

### 3.2 Configure Google Provider in Supabase

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Find **Google** in the list and click to expand
3. Toggle **Enable Sign in with Google**
4. Fill in the credentials:
   - **Client ID**: Paste your Google OAuth Client ID
   - **Client Secret**: Paste your Google OAuth Client Secret
5. Copy the **Callback URL (for OAuth)** shown (it should look like: `https://your-project.supabase.co/auth/v1/callback`)
6. Click **Save**

### 3.3 Add Callback URL to Google Console

1. Go back to your Google Cloud Console
2. Edit your OAuth 2.0 Client ID
3. Add the Supabase callback URL to **Authorized redirect URIs**
4. Save the changes

## Step 4: Configure Your Application

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit your `.env` file and add the following:
   ```env
   # Enable Supabase authentication
   REACT_APP_SET_AUTH=supabase

   # Supabase configuration
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Make sure your Twilio credentials are also set in the `.env` file

## Step 5: Configure Authentication Redirect URLs

In your Supabase dashboard:

1. Go to **Authentication** > **URL Configuration**
2. Add your redirect URLs:
   - **Site URL**: `http://localhost:3000` (for development) or your production URL
   - **Redirect URLs**: Add both:
     - `http://localhost:3000`
     - Your production domain

## Step 6: Test the Authentication Flow

1. Start your development server:
   ```bash
   npm start
   ```

2. Navigate to `http://localhost:3000`

3. You should be redirected to `/login`

4. Click "Sign in with Google"

5. Complete the Google OAuth flow

6. You should be redirected back to your app and authenticated!

## Step 7: Update Server Token Endpoint (Optional)

If you're using a custom token endpoint, you may want to verify Supabase JWT tokens on your server:

```javascript
// Example server-side verification
const supabase = require('@supabase/supabase-js');

app.post('/token', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // Verify the Supabase token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // User is authenticated, generate Twilio token
    // ... your Twilio token generation logic
  }
});
```

## Features

With Supabase authentication enabled, your app now has:

- ✅ **Google OAuth Sign-In**: Users can sign in with their Google account
- ✅ **Protected Routes**: Unauthenticated users are redirected to `/login`
- ✅ **Session Management**: User sessions are automatically managed
- ✅ **Sign Out**: Users can sign out from the "More" menu
- ✅ **Redirect After Login**: Users are redirected to their intended page after login

## Troubleshooting

### "Invalid redirect URL"
- Make sure your redirect URL is added in both Google Cloud Console and Supabase settings
- Ensure the URL matches exactly (including protocol: http/https)

### "OAuth error: invalid_client"
- Double-check your Google Client ID and Secret in Supabase
- Ensure the Google+ API is enabled in Google Cloud Console

### Infinite redirect loop
- Clear your browser cookies and local storage
- Check that `REACT_APP_SET_AUTH=supabase` is set correctly in your `.env`

### User not authenticated after OAuth
- Check browser console for errors
- Verify the callback URL is correct in both Google and Supabase

## Security Best Practices

1. **Never commit your `.env` file** - It contains sensitive credentials
2. **Use environment variables** for production deployment
3. **Enable Row Level Security (RLS)** in Supabase if storing user data
4. **Rotate your API keys** periodically
5. **Monitor authentication logs** in Supabase dashboard

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

## Support

For issues specific to:
- **Supabase**: [Supabase Discord](https://discord.supabase.com)
- **Twilio Video**: [Twilio Support](https://www.twilio.com/help/contact)
