# Google Profile Picture Display

## Feature
Display the user's Google profile picture in the UserMenu component on pre-join screens.

## Implementation

### What Was Updated

**File**: [src/state/useSupabaseAuth/useSupabaseAuth.ts](src/state/useSupabaseAuth/useSupabaseAuth.ts)

**Lines 113-114**: Enhanced the `photoURL` mapping to check multiple possible fields where Google OAuth might store the profile picture:

```typescript
photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || user.user_metadata?.photo || undefined,
```

### How It Works

1. **Google OAuth Sign-In**
   - User signs in with Google via Supabase
   - Supabase receives user data from Google, including profile picture
   - Profile picture URL is stored in `user_metadata`

2. **Profile Picture Mapping**
   - The `useSupabaseAuth` hook converts Supabase user data to match Firebase User interface
   - Maps Google profile picture from `user_metadata` to `photoURL` field
   - Checks multiple fields to ensure compatibility:
     - `avatar_url` - Supabase standard field
     - `picture` - Google OAuth standard field
     - `photo` - Alternative field name

3. **Display in UserAvatar**
   - The `UserAvatar` component receives the `photoURL`
   - If `photoURL` exists: displays the Google profile picture
   - If `photoURL` is missing: shows user initials in a red circle
   - Fallback: shows generic person icon

### UserMenu Display (Top-Right Corner)

```
┌─────────────────────────────────────────┐
│              [📷] John Doe ▼            │ ← Profile picture + name
│                                         │
│  When clicked:                          │
│  ┌──────────────┐                       │
│  │  Logout      │                       │
│  └──────────────┘                       │
└─────────────────────────────────────────┘
```

### Visual Hierarchy

1. **Profile Picture** - Google profile photo (circular avatar)
2. **Display Name** - From Google account (e.g., "John Doe")
3. **Dropdown Arrow** - Click to show logout option

## Fallback Behavior

If the profile picture is not available:

1. **Has Display Name?** → Shows initials (e.g., "JD" for John Doe)
2. **No Display Name?** → Shows generic person icon
3. **Background Color** → Red (#F22F46)

## Where You'll See It

### Pre-Join Screens
- ✅ Room Name Entry Screen (top-right)
- ✅ Audio/Video Check Screen (top-right)

### In-Room
- ✅ More Menu → Sign Out (bottom control bar)
- Note: In-room doesn't show profile picture, just the menu item

## Code Flow

```
Google OAuth Sign-In
        ↓
Supabase receives user data
        ↓
useSupabaseAuth maps user_metadata
        ↓
compatibleUser object created with photoURL
        ↓
UserMenu renders with user prop
        ↓
UserAvatar displays profile picture
```

## Testing

### Expected Results

1. **Sign in with Google**
   - Your Google profile picture should appear in top-right corner
   - Your name should appear next to the picture
   - Avatar should be circular

2. **No Profile Picture**
   - Shows your initials in a red circle
   - Still shows your name

3. **Click on Avatar/Name**
   - Dropdown menu appears
   - Shows "Logout" option

### Browser Console

To verify the profile picture URL is being received:

```javascript
// After signing in, check in browser console:
console.log(window.supabase?.auth?.user()?.user_metadata)
```

Look for fields like:
- `avatar_url`
- `picture`
- `photo`

## Configuration

### Supabase Google OAuth Settings

Ensure in your Supabase dashboard under **Authentication > Providers > Google**:

1. ✅ "Enable Sign in with Google" is ON
2. ✅ Scopes include profile information
3. ✅ Default scopes should include:
   - `openid`
   - `email`
   - `profile`

### Google Cloud Console

In your Google OAuth 2.0 Client:

1. ✅ Authorized JavaScript origins include your domain
2. ✅ Authorized redirect URIs include Supabase callback URL
3. ✅ Google+ API is enabled (for profile data)

## Troubleshooting

### Profile Picture Not Showing?

1. **Check User Metadata**
   ```javascript
   // In browser console after sign-in:
   const { data: { user } } = await supabase.auth.getUser()
   console.log(user.user_metadata)
   ```

2. **Verify OAuth Scopes**
   - Make sure `profile` scope is included in Google OAuth

3. **Clear Cache**
   - Sign out completely
   - Clear browser cookies/local storage
   - Sign in again

4. **Check Browser Console**
   - Look for any errors loading the image
   - Verify the profile picture URL is valid

### Shows Initials Instead?

This is expected if:
- No profile picture set on Google account
- OAuth scopes don't include profile picture
- Network error loading the image

### Generic Icon Showing?

This means:
- No display name available
- User metadata is missing
- Check Supabase auth configuration

## Benefits

✅ **Personal Touch** - Users see their own profile picture
✅ **Identity Confirmation** - Clear indication of who's signed in
✅ **Professional Look** - Matches modern app standards
✅ **Fallback Handling** - Graceful degradation if picture unavailable
✅ **Google Integration** - Seamless integration with Google OAuth

## Related Files

- **[src/state/useSupabaseAuth/useSupabaseAuth.ts](src/state/useSupabaseAuth/useSupabaseAuth.ts)** - Maps Google profile picture
- **[src/components/IntroContainer/UserMenu/UserAvatar/UserAvatar.tsx](src/components/IntroContainer/UserMenu/UserAvatar/UserAvatar.tsx)** - Displays profile picture
- **[src/components/IntroContainer/UserMenu/UserMenu.tsx](src/components/IntroContainer/UserMenu/UserMenu.tsx)** - Renders avatar and menu
- **[src/components/IntroContainer/IntroContainer.tsx](src/components/IntroContainer/IntroContainer.tsx)** - Container for UserMenu

---

**Status**: ✅ Complete
**Feature**: Google Profile Picture Display
**Component**: UserAvatar
**Fallback**: Initials or Person Icon
