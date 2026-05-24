# teamcal

This application allows a team to schedule shifts with ease.

In this context, a shift is defined as beginning at a specific time on one day and concluding at a designated time on the final day, allowing for multi-day coverage until the shift officially ends (i.e. geriatric healthcare professionals).

<img src="/Team-Scheduler-ScreenShot.png" alt="Screenshot of teamcal" width="100%">

## Features

### Scheduling
- Add, remove, and update shifts for selected team members
- Drag-and-drop, resize, and edit calendar entries
- Month, week, and day views
- Distinct member colors to make schedules easy to read
- Printable calendar (without the heading)
- Event descriptions shown via tooltip on the calendar bar

### Team & access
- Login required — session-based authentication with bcrypt password hashing
- **Admin** role: manage members, assign credentials, create/edit/delete shifts
- **Member** role: read-only calendar view of listed team members
- Initial admin account bootstrapped on first startup (credentials printed to the server console)
- Per-member login credentials (username, password, role, listed/hidden flag)
- Members without credentials appear grey until an admin sets access (double-click a member chip)
- Collapsible admin panel (preference saved in the browser)

### Internationalization
- English, Portuguese, and French
- Browser language detected; English fallback
- Language can be switched from the header

### Data
- SQLite backend — schedules and users persist in `src/server/schedule.db`
- Database file is gitignored; each installation keeps its own data

## Architecture

| Layer    | Stack                          | Port  |
|----------|--------------------------------|-------|
| Frontend | React, TypeScript, Vite, Tailwind, FullCalendar | 3004 |
| API      | Express, better-sqlite3        | 3111 |

During development, Vite proxies `/api` requests to the Express server.

## Requirements

- Node.js v20.18+

## Installation

```bash
git clone <repository-url>
cd teamcal
npm install
npm run dev
```

Open http://localhost:3004 in your browser.

On **first startup**, the server creates an admin user and prints the username and password to the console. Save these credentials — they are not shown again.

```
  TeamCal — initial admin account (save these credentials)
  Username │ admin
  Password │ <random password>
```

To change the frontend port, edit `vite.config.ts`. The API port is set in `src/server/index.js`.

## Usage

1. Log in as admin.
2. Add team members from the admin panel.
3. Double-click a member chip to set login credentials (required before they get a calendar color).
4. Select a member, then click or drag on the calendar to create shifts.
5. Share member credentials with team members who need read-only access.

When editing an existing member's credentials, leave the password blank to keep the current password.

## Security notes

Authentication and role checks are enforced on the API. Members cannot modify schedules or manage users.

If you expose this application on a network, use HTTPS and consider placing it behind a reverse proxy or VPN. Session cookies are `httpOnly` with a 7-day expiry.

## Authors and acknowledgment

Developed with AI assistance.

## License

No restrictions. Use and modify as you please.

## Project status

This project was created to answer a specific need and may be useful for someone else. Improvements may be added later as necessary.
