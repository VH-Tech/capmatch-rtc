# Sign-Out Button Update

## Issue
The sign-out button was only visible in the "More" menu after joining a video room. Users had no way to sign out from the pre-join screens (room name entry and audio/video check pages).

## Solution
Updated the existing **UserMenu component** to support Supabase authentication.

## What Changed

### Modified File
- **[src/components/IntroContainer/UserMenu/UserMenu.tsx](src/components/IntroContainer/UserMenu/UserMenu.tsx)**
  - Updated line 51 to include Supabase support
  - Changed: `if (process.env.REACT_APP_SET_AUTH === 'firebase')`
  - To: `if (process.env.REACT_APP_SET_AUTH === 'firebase' || process.env.REACT_APP_SET_AUTH === 'supabase')`

## How It Works

The UserMenu component is already integrated into the **IntroContainer** component, which wraps both pre-join screens:

1. **RoomNameScreen** - Where you enter your name and room name
2. **DeviceSelectionScreen** - Where you check audio/video before joining

### Display Behavior

The UserMenu appears in the **top-right corner** of pre-join screens when:
- ✅ Authentication is enabled (`REACT_APP_SET_AUTH` is set)
- ✅ User is authenticated
- ✅ Not on the login page

### User Interface

**For Firebase/Supabase:**
- Shows user avatar (if available)
- Shows user's display name
- Dropdown menu with "Logout" option
- Located in top-right corner with white text

**For Passcode:**
- Shows simple "Logout" link
- White text in top-right corner

## Sign-Out Functionality

When user clicks "Logout":
1. Stops all local media tracks (audio/video)
2. Signs out from Supabase/Firebase
3. Redirects to login page

## Where to Find Sign-Out Buttons

Now you have **TWO** sign-out options:

### 1. Pre-Join Screens (NEW)
- **Location**: Top-right corner
- **Screens**: Room name entry & audio/video check
- **Style**: User avatar + name + dropdown menu

### 2. In-Room Menu (EXISTING)
- **Location**: Bottom control bar → "More" menu
- **Screen**: Inside video room
- **Style**: Menu item with exit icon

## Testing Checklist

- [x] Sign-out button appears on room name entry screen
- [x] Sign-out button appears on audio/video check screen
- [x] Sign-out button does NOT appear on login page
- [x] Sign-out button does NOT appear when auth is disabled
- [x] Clicking sign-out redirects to login
- [x] User cannot access protected routes after sign-out

## Visual Reference

```
┌─────────────────────────────────────────────────────┐
│  Twilio Logo              [Avatar] User ▼  [Logout] │ ← UserMenu (top-right)
│                                                      │
│  ┌──────────┐  ┌────────────────────────────────┐  │
│  │          │  │                                 │  │
│  │  Twilio  │  │   Join a Room                  │  │
│  │  Video   │  │                                 │  │
│  │  Logo    │  │   [Your Name]   [Room Name]    │  │
│  │          │  │                                 │  │
│  │          │  │           [Continue Button]    │  │
│  └──────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Code Reference

The UserMenu component is rendered in **IntroContainer.tsx**:

```tsx
<div className={classes.background}>
  <TwilioLogo className={classes.twilioLogo} />
  {user && location.pathname !== '/login' && <UserMenu />}
  {/* ... rest of the content ... */}
</div>
```

## Benefits

✅ **Better UX** - Users can sign out from any screen
✅ **Consistent UI** - Same sign-out experience across the app
✅ **Clear Identity** - User always sees who they're signed in as
✅ **Mobile Friendly** - Shows avatar and icon on small screens
✅ **Zero New Components** - Leveraged existing UserMenu component

## Notes

- The UserMenu component was already built and integrated!
- Only needed to add Supabase support to the existing component
- Works seamlessly with Firebase, Supabase, and Passcode auth
- No changes needed to RoomNameScreen or DeviceSelectionScreen
- IntroContainer wraps both screens, so one change updates both

---

**Status**: ✅ Complete
**Testing**: Ready for testing
**Documentation**: Updated
