# spanish-tie-monitoring-example
simple test that checking TIE  seats
# Spanish TIE Appointment Monitor

A small Playwright-based monitor for checking TIE appointment availability in Madrid.

The script goes through the official appointment flow, checks the selected procedure, and sends a Telegram notification if the usual "no appointments available" message is not found.

## What it does

- Opens the official Spanish appointment website
- Selects Madrid
- Selects the required office and procedure
- Fills in the applicant details from environment variables
- Checks whether appointments are currently unavailable
- Sends a Telegram notification if a possible appointment slot is detected
- Repeats the check at a defined interval

## Tech stack

- JavaScript
- Playwright
- Node.js
- Telegram Bot API
- dotenv

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

## Environment variables

Create a `.env` file in the project root.

You can use `.env.example` as a template:

```env
TELEGRAM_BOT_TOKEN= your token
TELEGRAM_CHAT_ID= chatID
NIE=NIE
FULL_NAME=NAME SERNAME
```

Fill in your own values.

The `.env` file is ignored by Git and should not be committed to the repository.

## Running the monitor

Run the monitor in visible browser mode:

```bash
npx playwright test tests/tie-monitoring.spec.js --project="Google Chrome" --headed
```

Without `--headed`, the browser runs in the background.

## Telegram notifications

The monitor sends a Telegram notification when it cannot find the usual message:

```text
En este momento no hay citas disponibles
```

This is treated as a possible indication that an appointment slot has appeared.

The notification is intentionally phrased as "possibly available", because changes to the website or unexpected page states may also cause the usual message to be absent.

## Check interval

The monitor waits between checks before trying again.

The interval is configured directly in the test:

```js
setTimeout(resolve, 60 * 60 * 1000);
```

This corresponds to one check per hour.

## Notes

The website may occasionally be unavailable, respond slowly, or block automated browser sessions.

The monitor handles temporary errors and retries after the configured interval.

This project is intended as a personal learning project for practicing Playwright automation.
