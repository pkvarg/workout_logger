# Studio Ledger

A small, calm mobile app for tracking what training costs. Log a session
(activity, date, duration, hourly rate) and see totals per month or all-time.
Built with Expo (React Native) and self-hosted PocketBase for login and sync.

## Run it now (demo mode, no backend)

Without a PocketBase URL the app runs in **demo mode**: it uses seeded example
data stored only on the device, and any email/passcode signs you in. This is
enough to try the whole app on a phone today.

```bash
npm install
npm start
```

Then install **Expo Go** on the Android phone and scan the QR code from the
terminal. The app opens inside Expo Go.

## Connect PocketBase (real login + sync)

PocketBase is a single lightweight service (one small container on Coolify) with
built-in email/password auth, an admin UI, and a REST API.

1. **Deploy PocketBase on Coolify** with a public HTTPS subdomain, e.g.
   `pocketbase.yourdomain.tld`, and create its admin account on first open.
2. **Create the collections.** Follow [`pocketbase/SETUP.md`](pocketbase/SETUP.md):
   extend the `users` collection with `name`, `default_rate`, `currency`,
   `monthly_goal`, add a `sessions` collection, and set the API rules so each
   user only ever sees their own sessions.
3. **Point the app at it.** Copy `.env.example` to `.env` and fill in:

   ```
   EXPO_PUBLIC_POCKETBASE_URL=https://pocketbase.yourdomain.tld
   ```

   Restart `npm start` after changing `.env`.

## Build the Android install file (APK)

This produces a single `.apk` you can send her directly — no Google Play.

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

When the cloud build finishes, EAS gives a download link. Send her the `.apk`;
she taps it, allows "install from unknown sources" once, and it installs as a
normal app. Ship an update the same way whenever the app changes.

## Project layout

```
App.tsx              Root: fonts, auth gate, navigation, add modal, detail sheet
src/theme.ts         Dark + light palettes, fonts, radii
src/store.ts         Auth + data (PocketBase, with a local demo fallback)
src/format.ts        Money / date / cost helpers
src/components.tsx   Session row, progress ring, stat card
src/screens/         Login, Home, Sessions, Add, Settings
pocketbase/SETUP.md  How to set up the PocketBase collections + API rules
```
