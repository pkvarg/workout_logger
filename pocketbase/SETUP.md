# PocketBase setup

The app needs the built-in `users` collection extended with a few fields, and
one new `sessions` collection. Do this once in the PocketBase Admin UI.

## 1. Deploy PocketBase on Coolify

Add PocketBase as a Coolify service and give it a public HTTPS subdomain, e.g.
`pocketbase.yourdomain.tld`. On first open it asks you to create an admin
account — that is the admin console, separate from app users.

## 2. Extend the `users` collection

Admin UI → Collections → `users` → **Edit** → add these fields:

| Field          | Type   | Notes         |
| -------------- | ------ | ------------- |
| `name`         | Text   |               |
| `default_rate` | Number | default `18`  |
| `currency`     | Text   | default `EUR` |
| `monthly_goal` | Number | default `20`  |

Leave email/password auth enabled. For a one-person app you can turn **off**
"require email verification" (Collections → `users` → Options) so sign-up works
without an email round-trip. Otherwise configure SMTP first (Settings → Mail).

## 3. Create the `sessions` collection

Admin UI → Collections → **New collection** → type **Base**, name `sessions`.
Add fields:

| Field          | Type     | Notes                       |
| -------------- | -------- | --------------------------- |
| `user`         | Relation | → `users`, single, required |
| `activity`     | Text     | required                    |
| `icon`         | Text     |                             |
| `session_date` | Date     | required                    |
| `hours`        | Number   | required                    |
| `rate`         | Number   | required                    |

## 4. Lock the API rules so each user sees only their own data

On the `sessions` collection → **API Rules**, set all five rules to:

```
@request.auth.id != "" && user = @request.auth.id
```

(For the Create rule, PocketBase also enforces the submitted `user` matches, so
the same expression is correct there.)

On the `users` collection → API Rules, the defaults are fine: a user can view
and update their own record.

## 5. Point the app at it

Copy `.env.example` to `.env`:

```
EXPO_PUBLIC_POCKETBASE_URL=https://pocketbase.yourdomain.tld
```

Restart `npm start`. Without this value the app runs in demo mode (local data
only).
