# teamcal

This application allows a team to schedule shifts with ease.

In this context, a shift is defined as beginning at a specific time on one day and concluding at a designated time on the final day, allowing for multi-day coverage until the shift officially ends (i.e geriatric healthcare professionals).

<img src="/Team-Scheduler-ScreenShot.png" alt="Screenshot of teamcal" width="100%">

## Getting started

**Features**
1. Add/remove team members.
1. Add/remove/update schedule for selected team member.
1. Distinct colors to ease viewing of schedules.
1. Drag and drop and edit calendar entries.
1. Monthly/Weekly/Day views.
1. Printable calendar (without the heading).
1. languages: English/Portuguese (Portuguese by default).
1. Backend db using sqlite - data is always saved.

## Requirements

- nodejs v 20.18

## Installation

```
git clone the project
cd into the folder
npm install
npm run dev
```
The frontend service will be listening on system IP and port 3004

You can change this port by editing `vite.config.ts` file

## IMPORTANT

If you run this application on a network, make sure that you secure access by adding htaccess or other means.
No security has been implemented, meaning anyone having access to your application will be able to view or update the data!

## Authors and acknowledgment
Developped with AI assistance

## License
No restrictions.  Use and modify as you please.

## Project status
This project was created for to answer a specific need and may be useful for someone else.  Improvements may be added later should it be necessary.

